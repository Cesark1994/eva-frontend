// eva/frontend/src/services/sttService.js
import Voice from '@react-native-voice/voice';
import axios from 'axios';
import { Platform, PermissionsAndroid } from 'react-native';

async function requestAndroidPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permiso de micrófono',
        message: 'Eva necesita acceder al micrófono para transcribir tu voz.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

export function initVoiceHandlers(onSpeechStart, onSpeechPartial, onSpeechEnd, onError) {
  Voice.onSpeechStart = onSpeechStart;
  Voice.onSpeechPartialResults = onSpeechPartial;
  Voice.onSpeechEnd = onSpeechEnd;
  Voice.onSpeechError = onError;
}

export async function startRecording() {
  const hasPerm = await requestAndroidPermission();
  if (!hasPerm) throw new Error('Permiso de micrófono denegado');
  await Voice.start('es-AR'); // puedes usar otro locale
}

export async function stopRecording() {
  return Voice.stop();
}

export async function transcribeAudio(uri) {
  // Si procesas audio en el backend, envía la URI o el blob aquí
  const { data } = await axios.post('http://<TU_BACKEND>/transcribe', { uri });
  return data.text;
}
