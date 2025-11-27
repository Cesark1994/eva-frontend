import api from './api';

export const generateResponse = async ({ text, services = {}, tts = {}, useOpenAI = false, metadata = {} }) => {
  if (!text) throw new Error('No se proporcionó texto para generar respuesta');

  const payload = {
    text,
    services,
    tts,
    useOpenAI,
    metadata,
  };

  try {
    const res = await api.post('/converse', payload);
    return res.data; // { answer, audio, services }
  } catch (error) {
    // Fallback para entornos que aún exponen /chat
    if (error?.response?.status === 404) {
      const res = await api.post('/chat', { text });
      return res.data;
    }

    const message =
      error?.response?.data?.message || error?.message || 'No se pudo obtener respuesta del orquestador /converse.';
    throw new Error(message);
  }
};
