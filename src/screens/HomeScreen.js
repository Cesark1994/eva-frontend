import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import VoiceButton from '../components/VoiceButton';
import { initVoiceHandlers, startRecording, stopRecording, destroyVoice } from '../services/sttService';
import { generateResponse } from '../services/llmService';

export default function HomeScreen() {
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Toca el botón y habla con Eva');

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

  useEffect(() => {
    initVoiceHandlers(
      () => {
        setStatus('Escuchando...');
        setError('');
      },
      (event) => {
        const text = event?.value?.join(' ') || '';
        setTranscript(text);
      },
      (event) => {
        const text = event?.value?.[0] || '';
        if (text) {
          setTranscript(text);
          sendToEva(text);
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

  const sendToEva = async (text) => {
    setLoading(true);
    setStatus('Generando respuesta...');
    setResponse('');
    try {
      const { answer } = await generateResponse(text);
      setResponse(answer);
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
      setStatus('Preparando el micrófono...');
      await startRecording();
    } catch (err) {
      setIsRecording(false);
      setError(err.message);
      setStatus('');
    }
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
        </View>

        <View style={styles.highlights}>
          {["Consultas creativas", "Respuestas naturales", "Contexto inmediato"].map((item) => (
            <View key={item} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>Transcripción</Text>
            <Text style={styles.microCopy}>{transcript ? 'Última captura' : 'Aún no has hablado'}</Text>
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
