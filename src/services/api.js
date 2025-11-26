import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants?.expoConfig?.extra?.API_URL || Constants?.manifest?.extra?.API_URL;

if (!API_URL) {
  console.warn('API_URL no está configurado en extra.API_URL. Define la variable en expo.config.js o app.json.');
}

const api = axios.create({
  baseURL: API_URL || 'http://localhost:3000',
  timeout: 15000,
});

export default api;
