import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Linking } from 'react-native';
import * as Speech from 'expo-speech';
import VoiceButton from '../components/VoiceButton';
import { initVoiceHandlers, startRecording, stopRecording, destroyVoice } from '../services/sttService';
import { generateResponse } from '../services/llmService';

const polishTranscript = (text) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  const withSentence = trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  return withSentence.charAt(0).toUpperCase() + withSentence.slice(1);
};

export default function HomeScreen() {
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Toca el botón y habla con Eva');
  const [history, setHistory] = useState([]);
  const [persona, setPersona] = useState('estratega');
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('Inglés');
  const [sourceLanguage, setSourceLanguage] = useState('Español');
  const [liveCue, setLiveCue] = useState('Traducción y asesoría listas.');
  const [serviceToggles, setServiceToggles] = useState({
    emotions: true,
    coaching: true,
    nutrition: false,
    gps: false,
  });
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [ttsMode, setTtsMode] = useState('service'); // service | device
  const [audioUrl, setAudioUrl] = useState('');
  const [audioState, setAudioState] = useState('idle');
  const [audioError, setAudioError] = useState('');
  const [budgetCap, setBudgetCap] = useState('10');
  const lastResponseRef = useRef('');
  const settingsRef = useRef({ autoEnhance, sourceLanguage, targetLanguage });

  useEffect(() => {
    settingsRef.current = { autoEnhance, sourceLanguage, targetLanguage };
  }, [autoEnhance, sourceLanguage, targetLanguage]);

  const quickPrompts = useMemo(
    () => [
      'Dame una idea de negocio en 30 segundos',
      'Resume las noticias tecnológicas de hoy',
      'Explícame la física cuántica como si fuera niño',
      'Sugiere hábitos para ser más productivo',
      'Tradúceme este texto al inglés con tono ejecutivo',
      '¿Qué derechos tengo en un contrato de alquiler?',
    ],
    []
  );

  const personaProfiles = useMemo(
    () => [
      {
        id: 'estratega',
        title: 'Asistente total',
        description: 'Creativo, directo y enfocado en darte ideas accionables.',
        accent: '#66E3FF',
      },
      {
        id: 'juridico',
        title: 'Asesor jurídico',
        description: 'Habla como abogado global. Cita leyes y pasos claros.',
        accent: '#FF9F66',
      },
      {
        id: 'traduccion',
        title: 'Traducción viva',
        description: 'Convierte tu voz en textos pulidos y traducidos al instante.',
        accent: '#2FE7A2',
      },
    ],
    []
  );

  const serviceCatalog = useMemo(
    () => [
      { key: 'emotions', label: 'Emociones', helper: 'Analiza tono y energía (stub).', accent: '#7AD7F0' },
      { key: 'coaching', label: 'Coaching', helper: 'Orientación motivacional con stub.', accent: '#9FF4C4' },
      { key: 'nutrition', label: 'Nutrición', helper: 'Consejos saludables simulados.', accent: '#FFDC7A' },
      { key: 'gps', label: 'GPS', helper: 'Ubicación aproximada con datos ficticios.', accent: '#C9B5FF' },
    ],
    []
  );

  const moodLabel = useMemo(() => {
    if (isRecording) return 'Capturando tu voz en tiempo real';
    if (loading) return 'Eva está pensando la mejor respuesta';
    return 'Listo para inspirarte con nuevas ideas';
  }, [isRecording, loading]);

  const statusTone = useMemo(() => {
    if (isRecording) return '#FF9F66';
    if (loading) return '#66E3FF';
    return '#2FE7A2';
  }, [isRecording, loading]);

  const buildServicesPayload = () =>
    Object.fromEntries(
      Object.entries(serviceToggles).map(([key, enabled]) => [
        key,
        {
          enabled,
          mode: 'stub',
          status: enabled ? 'on' : 'off',
        },
      ])
    );

  const speakResponse = (text) => {
    if (!text) return;
    setAudioState('speaking');
    setAudioError('');
    Speech.stop();
    Speech.speak(text, {
      language: targetLanguage === 'Inglés' ? 'en-US' : 'es-ES',
      onDone: () => setAudioState('ready'),
      onStopped: () => setAudioState('ready'),
      onError: () => {
        setAudioState('error');
        setAudioError('No se pudo reproducir el audio local.');
      },
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setAudioState('idle');
  };

  useEffect(() => {
    if (ttsMode !== 'device' || !response) return;
    if (lastResponseRef.current === response) return;
    lastResponseRef.current = response;
    speakResponse(response);
  }, [response, ttsMode]);

  const handleAudioLink = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      setAudioError('No se pudo abrir el audio devuelto por TTS.');
    }
  };

  useEffect(() => {
    initVoiceHandlers(
      () => {
        setStatus('Escuchando...');
        setError('');
      },
      (event) => {
        const text = event?.value?.join(' ') || '';
        const { autoEnhance: enhance, sourceLanguage: origin, targetLanguage: target } = settingsRef.current;
        const refined = enhance ? polishTranscript(text) : text;
        setTranscript(refined);
        setLiveCue(`Transcribiendo desde ${origin} con traducción a ${target}.`);
      },
      (event) => {
        const text = event?.value?.[0] || '';
        if (text) {
          const { autoEnhance: enhance } = settingsRef.current;
          const refined = enhance ? polishTranscript(text) : text;
          setTranscript(refined);
          sendToEva(refined);
        }
      },
      () => setIsRecording(false),
      (e) => {
        setError(e.error?.message || 'Ocurrió un problema con el reconocimiento de voz.');
        setIsRecording(false);
      }
    );

    return () => {
      destroyVoice();
    };
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const sendToEva = async (text) => {
    setLoading(true);
    setStatus('Generando respuesta multicapas...');
    setResponse('');
    setAudioUrl('');
    setAudioError('');
    setAudioState('idle');
    const personaPrompt =
      persona === 'juridico'
        ? 'Actúa como un asesor jurídico global. Responde con precisión, menciona normas aplicables y advierte cuando haga falta consultar a un profesional local.'
        : persona === 'traduccion'
        ? 'Mejora el texto, elimina muletillas y tradúcelo en tiempo real, ofreciendo versión en el idioma objetivo.'
        : 'Ofrece respuestas estratégicas, creativas y listas para ejecutar.';

    const translationPrompt = `Idioma origen: ${sourceLanguage}. Idioma destino: ${targetLanguage}. Si procede, ofrece traducción y versión mejorada.`;
    const composedPrompt = `${personaPrompt}\n\n${translationPrompt}\n\nTexto del usuario: ${text}`;

    try {
      const payload = {
        text: composedPrompt,
        services: buildServicesPayload(),
        tts: {
          mode: ttsMode,
          preferRealEngine: ttsMode === 'service',
        },
        useOpenAI,
        metadata: {
          persona,
          sourceLanguage,
          targetLanguage,
          budgetLimit: Number(budgetCap) || 0,
        },
      };

      const { answer, audio } = await generateResponse(payload);
      setResponse(answer);
      setAudioUrl(audio || '');
      setHistory((prev) => [
        {
          prompt: text,
          answer,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 4));
      setStatus('');
    } catch (err) {
      setError(err.message || 'No se pudo obtener respuesta. Verifica tu conexión y API_URL.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }

    setResponse('');
    setTranscript('');
    setError('');
    try {
      setIsRecording(true);
      setStatus('Preparando el micrófono y la traducción...');
      await startRecording();
    } catch (err) {
      setIsRecording(false);
      setError(err.message);
      setStatus('');
    }
  };

  const handleQuickPrompt = (prompt) => {
    setTranscript(prompt);
    setError('');
    setResponse('');
    setAudioUrl('');
    sendToEva(prompt);
  };

  const handleRetry = () => {
    if (transcript) {
      sendToEva(transcript);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setResponse('');
    setError('');
    setStatus('Listo para inspirarte con nuevas ideas');
    setLiveCue('Traducción y asesoría listas.');
    setAudioUrl('');
    setAudioState('idle');
    setAudioError('');
    lastResponseRef.current = '';
    Speech.stop();
  };

  return (
    <View style={styles.page}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Nuevo look</Text>
            </View>
            <View style={[styles.badge, styles.accentBadge]}>
              <View style={[styles.dot, { backgroundColor: statusTone }]} />
              <Text style={styles.badgeText}>{loading ? 'Procesando' : isRecording ? 'Grabando' : 'Disponible'}</Text>
            </View>
          </View>
          <Text style={styles.kicker}>Asistente de voz inteligente</Text>
          <Text style={styles.title}>Habla con Eva</Text>
          <Text style={styles.subtitle}>{moodLabel}</Text>
          <View style={styles.signalRow}>
            <View style={styles.signalCard}>
              <Text style={styles.signalLabel}>Legal</Text>
              <Text style={styles.signalValue}>On-demand</Text>
            </View>
            <View style={styles.signalCard}>
              <Text style={styles.signalLabel}>Traducción</Text>
              <Text style={styles.signalValue}>{targetLanguage}</Text>
            </View>
            <View style={styles.signalCard}>
              <Text style={styles.signalLabel}>Edición</Text>
              <Text style={styles.signalValue}>{autoEnhance ? 'Pulido activo' : 'Original'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} onPress={handleRetry} disabled={!transcript || loading}>
            <Text style={styles.actionLabel}>Reintentar</Text>
            <Text style={styles.actionHelper}>Usa la última transcripción</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionGhost]} onPress={handleClear} disabled={loading}>
            <Text style={styles.actionLabel}>Limpiar</Text>
            <Text style={styles.actionHelper}>Reinicia la sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.highlights}>
          {['Consultas creativas', 'Respuestas naturales', 'Contexto inmediato', 'Modo siempre listo', 'Traducción en vivo', 'Voz a texto pulido'].map((item) => (
            <View key={item} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.modeCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Modos de Eva</Text>
            <Text style={styles.microCopy}>Selecciona el enfoque</Text>
          </View>
          <View style={styles.modeGrid}>
            {personaProfiles.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modePill, persona === item.id && { borderColor: item.accent, backgroundColor: `${item.accent}22` }]}
                onPress={() => setPersona(item.id)}
                disabled={loading}
              >
                <View style={[styles.modeDot, { backgroundColor: item.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{item.title}</Text>
                  <Text style={styles.modeDescription}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.togglesRow}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>Pulir transcripción</Text>
              <Switch value={autoEnhance} onValueChange={setAutoEnhance} trackColor={{ true: '#66E3FF' }} />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>Idioma de origen</Text>
              <View style={styles.languageRow}>
                {['Español', 'Inglés', 'Portugués'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.languagePill, sourceLanguage === lang && styles.languagePillActive]}
                    onPress={() => setSourceLanguage(lang)}
                    disabled={loading}
                  >
                    <Text style={styles.languageText}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>Idioma destino</Text>
              <View style={styles.languageRow}>
                {['Inglés', 'Español', 'Francés'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.languagePill, targetLanguage === lang && styles.languagePillActive]}
                    onPress={() => setTargetLanguage(lang)}
                    disabled={loading}
                  >
                    <Text style={styles.languageText}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.integrationsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Servicios conectados</Text>
            <Text style={styles.microCopy}>Activa stubs antes de los servicios reales</Text>
          </View>
          <View style={styles.serviceGrid}>
            {serviceCatalog.map((item) => (
              <View key={item.key} style={styles.serviceItem}>
                <View style={[styles.modeDot, styles.serviceDot, { backgroundColor: item.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{item.label}</Text>
                  <Text style={styles.serviceHelper}>{item.helper}</Text>
                </View>
                <Switch
                  value={serviceToggles[item.key]}
                  onValueChange={() =>
                    setServiceToggles((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  trackColor={{ true: item.accent }}
                />
              </View>
            ))}
          </View>

          <View style={styles.serviceRow}>
            <View style={[styles.toggleItem, styles.budgetItem]}>
              <Text style={styles.toggleLabel}>LLM real (OpenAI)</Text>
              <Switch value={useOpenAI} onValueChange={setUseOpenAI} trackColor={{ true: '#66E3FF' }} />
              <Text style={styles.toggleHint}>Requiere USE_OPENAI=true y OPENAI_API_KEY.</Text>
            </View>
            <View style={[styles.toggleItem, styles.budgetItem]}>
              <Text style={styles.toggleLabel}>Límite diario estimado (USD)</Text>
              <TextInput
                style={styles.budgetInput}
                keyboardType="decimal-pad"
                value={budgetCap}
                onChangeText={(val) => setBudgetCap(val.replace(/[^0-9.]/g, ''))}
                placeholder="10"
                placeholderTextColor="#5D6B88"
              />
              <Text style={styles.toggleHint}>Monitorea consumo al activar OpenAI.</Text>
            </View>
          </View>

          <View style={styles.serviceRow}>
            <View style={[styles.toggleItem, styles.budgetItem]}>
              <Text style={styles.toggleLabel}>Entrega de audio</Text>
              <View style={styles.languageRow}>
                {['service', 'device'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.languagePill, ttsMode === mode && styles.languagePillActive]}
                    onPress={() => setTtsMode(mode)}
                    disabled={loading}
                  >
                    <Text style={styles.languageText}>
                      {mode === 'service' ? 'Desde TTS real' : 'Narrar en dispositivo'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.toggleHint}>
                Usa "TTS real" cuando reemplaces el stub con tu motor de síntesis.
              </Text>
            </View>
            <View style={[styles.toggleItem, styles.budgetItem]}>
              <Text style={styles.toggleLabel}>Estado de audio</Text>
              <Text style={styles.toggleHint}>
                {ttsMode === 'service'
                  ? audioUrl
                    ? 'Audio listo desde el orquestador.'
                    : 'Esperando la URL de TTS.'
                  : 'El dispositivo leerá la respuesta con voz real.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Inspiraciones rápidas</Text>
            <Text style={styles.microCopy}>Toca para enviar sin grabar</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickPrompts.map((prompt) => (
              <TouchableOpacity key={prompt} style={styles.quickPill} onPress={() => handleQuickPrompt(prompt)} disabled={loading}>
                <Text style={styles.quickText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Transcripción</Text>
            <Text style={styles.microCopy}>{transcript ? liveCue : 'Aún no has hablado'}</Text>
          </View>
          <ScrollView style={styles.box}>
            {transcript ? (
              <Text style={styles.text}>{transcript}</Text>
            ) : (
              <Text style={styles.placeholder}>Pulsa el botón para comenzar y verás aquí lo que digas.</Text>
            )}
          </ScrollView>
        </View>

        <View style={[styles.card, styles.responseCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Respuesta de Eva</Text>
            <Text style={styles.microCopy}>{status}</Text>
          </View>
          <ScrollView style={styles.box}>
            {loading ? (
              <View style={styles.inline}>
                <ActivityIndicator color="#66E3FF" />
                <Text style={styles.text}>Pensando...</Text>
              </View>
            ) : response ? (
              <Text style={styles.text}>{response}</Text>
            ) : (
              <Text style={styles.placeholder}>Aquí verás las ideas y respuestas personalizadas de Eva.</Text>
            )}
          </ScrollView>
          <View style={styles.audioRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.microCopy}>
                {audioError
                  ? audioError
                  : ttsMode === 'service'
                  ? audioUrl
                    ? 'Audio real generado, toca para abrirlo.'
                    : 'El stub de TTS será sustituido por el motor real en cuanto esté listo.'
                  : 'TTS local: reproducirá la respuesta directamente en el dispositivo.'}
              </Text>
            </View>
            {ttsMode === 'device' ? (
              <TouchableOpacity
                style={styles.audioButton}
                onPress={audioState === 'speaking' ? stopSpeaking : () => speakResponse(response)}
                disabled={!response}
              >
                <Text style={styles.audioButtonText}>{audioState === 'speaking' ? 'Detener TTS' : 'Reproducir TTS'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.audioButton, !audioUrl && styles.buttonDisabled]}
                onPress={() => handleAudioLink(audioUrl)}
                disabled={!audioUrl}
              >
                <Text style={styles.audioButtonText}>{audioUrl ? 'Abrir audio' : 'Audio pendiente'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.card, styles.historyCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Sesiones recientes</Text>
            <Text style={styles.microCopy}>{history.length ? 'Últimas interacciones' : 'Comienza una conversación'}</Text>
          </View>
          {history.length ? (
            history.map((item) => (
              <View key={item.timestamp} style={styles.historyItem}>
                <View style={styles.historyRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.historyPrompt}>{item.prompt}</Text>
                </View>
                <Text style={styles.historyAnswer}>{item.answer}</Text>
                <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>Aquí aparecerán tus últimas preguntas y respuestas.</Text>
          )}
        </View>

        <View style={styles.footerRow}>
          {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.status}>{status}</Text>}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Tip rápido</Text>
            <Text style={styles.tipText}>Pídele a Eva ejemplos, resúmenes o ideas para proyectos. Entre más contexto le des, más única será su respuesta.</Text>
          </View>
        </View>

        <VoiceButton
          isRecording={isRecording}
          onPress={handlePress}
          disabled={loading}
          loading={loading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#070F1E',
  },
  glowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#102038',
    opacity: 0.55,
    top: -60,
    left: -40,
    transform: [{ rotate: '8deg' }],
  },
  glowTwo: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#0C1B33',
    opacity: 0.4,
    bottom: -120,
    right: -80,
    transform: [{ rotate: '-12deg' }],
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
    gap: 18,
  },
  header: {
    gap: 8,
    backgroundColor: '#0F1A30',
    borderRadius: 20,
    padding: 18,
    borderColor: '#1C2A44',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kicker: {
    color: '#66E3FF',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#C1C8DD',
    fontSize: 16,
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1C2A44',
    backgroundColor: '#0D182D',
    gap: 4,
  },
  actionPrimary: {
    borderColor: '#66E3FF33',
    backgroundColor: '#122542',
  },
  actionGhost: {
    backgroundColor: 'rgba(15, 30, 56, 0.6)',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionHelper: {
    color: '#96A4C2',
    fontSize: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 227, 255, 0.1)',
    borderColor: 'rgba(102, 227, 255, 0.25)',
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  accentBadge: {
    backgroundColor: 'rgba(47, 231, 162, 0.12)',
    borderColor: 'rgba(47, 231, 162, 0.25)',
  },
  badgeText: {
    color: '#E6EEFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#0F1E38',
    borderWidth: 1,
    borderColor: '#1C2F4B',
  },
  pillText: {
    color: '#9FC8FF',
    fontWeight: '600',
  },
  quickCard: {
    backgroundColor: '#0D182D',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1C2A44',
  },
  signalRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  signalCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: '#1C2A44',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  signalLabel: {
    color: '#7E8BA8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  signalValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modeCard: {
    backgroundColor: '#0D182D',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#1F2F4A',
  },
  modeGrid: {
    gap: 10,
  },
  modePill: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(102, 227, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#1C2F4B',
    borderRadius: 14,
    padding: 12,
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  modeTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modeDescription: {
    color: '#A8B3CA',
    fontSize: 12,
    lineHeight: 18,
  },
  togglesRow: {
    gap: 14,
  },
  toggleItem: {
    backgroundColor: 'rgba(15, 26, 48, 0.75)',
    borderRadius: 12,
    padding: 12,
    borderColor: '#1F2F4A',
    borderWidth: 1,
    gap: 8,
  },
  integrationsCard: {
    backgroundColor: '#0D182D',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E2F4F',
  },
  serviceGrid: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 30, 56, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1C2F4B',
  },
  serviceDot: {
    marginTop: 0,
  },
  serviceTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  serviceHelper: {
    color: '#7E8BA8',
    fontSize: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  budgetInput: {
    backgroundColor: '#0F1E38',
    borderWidth: 1,
    borderColor: '#1C2F4B',
    borderRadius: 10,
    padding: 10,
    color: '#FFFFFF',
    marginTop: 6,
  },
  budgetItem: {
    flex: 1,
  },
  toggleHint: {
    color: '#5D6B88',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  toggleLabel: {
    color: '#E6EEFF',
    fontWeight: '700',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  languagePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2F4A',
    backgroundColor: '#0F1E38',
  },
  languagePillActive: {
    borderColor: '#66E3FF',
    backgroundColor: 'rgba(102, 227, 255, 0.12)',
  },
  languageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickPill: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#122542',
    borderRadius: 14,
    borderColor: '#1F3653',
    borderWidth: 1,
    width: '48%',
  },
  quickText: {
    color: '#E8F1FF',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#0D182D',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1C2A44',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  responseCard: {
    borderColor: '#25406B',
  },
  historyCard: {
    borderColor: '#1E2F4F',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#66E3FF',
    fontSize: 13,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  microCopy: {
    color: '#7E8BA8',
    fontSize: 12,
  },
  box: {
    maxHeight: 140,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  audioButton: {
    backgroundColor: '#66E3FF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  audioButtonText: {
    color: '#0B1221',
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  placeholder: {
    color: '#5D6B88',
    fontSize: 15,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyItem: {
    backgroundColor: '#0F1E38',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1C2F4B',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#66E3FF',
  },
  historyPrompt: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyAnswer: {
    color: '#C5CEE0',
    lineHeight: 20,
  },
  historyTime: {
    color: '#7E8BA8',
    fontSize: 12,
  },
  footerRow: {
    gap: 10,
  },
  error: {
    color: '#FF9F66',
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    color: '#A8B3CA',
    textAlign: 'left',
    fontSize: 13,
  },
  tipCard: {
    backgroundColor: '#0F1E38',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2F4B',
    gap: 6,
  },
  tipTitle: {
    color: '#66E3FF',
    fontWeight: '700',
    fontSize: 13,
  },
  tipText: {
    color: '#C5CEE0',
    fontSize: 14,
    lineHeight: 20,
  },
});
