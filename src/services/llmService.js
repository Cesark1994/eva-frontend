import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.manifest.extra.API_URL;

export const generateResponse = async (text) => {
  const res = await axios.post(`${API_URL}/chat`, { text });
  return res.data; // { answer, audio }
};