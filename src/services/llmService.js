import api from './api';

export const generateResponse = async (text) => {
  if (!text) throw new Error('No se proporcionó texto para generar respuesta');
  const res = await api.post('/chat', { text });
  return res.data; // { answer, audio }
};
