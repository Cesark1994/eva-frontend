// eva/frontend/src/services/sttService.js
import Voice from '@react-native-voice/voice';
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

export function initVoiceHandlers(onSpeechStart, onSpeechPartial, onSpeechResults, onSpeechEnd, onError) {
  Voice.onSpeechStart = onSpeechStart;
  Voice.onSpeechPartialResults = onSpeechPartial;
  Voice.onSpeechResults = onSpeechResults;
  Voice.onSpeechEnd = onSpeechEnd;
  Voice.onSpeechError = onError;
}

export async function startRecording() {
  const hasPerm = await requestAndroidPermission();
  if (!hasPerm) throw new Error('Permiso de micrófono denegado');
  await Voice.start('es-ES');
}

export async function stopRecording() {
  return Voice.stop();
}

export function destroyVoice() {
  Voice.destroy().then(Voice.removeAllListeners);
}
