import React, { useEffect, useState } from 'react';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Asistente de voz</Text>
        <Text style={styles.title}>Habla con Eva</Text>
        <Text style={styles.subtitle}>
          Presiona el botón para grabar, suelta para que Eva transcriba y responda tu pregunta.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Transcripción</Text>
        <ScrollView style={styles.box}>
          {transcript ? <Text style={styles.text}>{transcript}</Text> : <Text style={styles.placeholder}>Aún no hay texto</Text>}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Respuesta de Eva</Text>
        <ScrollView style={styles.box}>
          {loading ? (
            <View style={styles.inline}>
              <ActivityIndicator color="#66E3FF" />
              <Text style={styles.text}>Pensando...</Text>
            </View>
          ) : response ? (
            <Text style={styles.text}>{response}</Text>
          ) : (
            <Text style={styles.placeholder}>Aún no hay respuesta</Text>
          )}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.status}>{status}</Text>}

      <VoiceButton
        isRecording={isRecording}
        onPress={handlePress}
        disabled={loading}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1221',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 16,
  },
  header: {
    gap: 6,
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
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA6C0',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#111A2D',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: {
    color: '#66E3FF',
    fontSize: 13,
    letterSpacing: 0.5,
    fontWeight: '700',
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
  error: {
    color: '#FF9F66',
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    color: '#9CA6C0',
    textAlign: 'center',
  },
});
