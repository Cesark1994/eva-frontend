# Resumen del desarrollo de Eva

Este documento resume el estado actual del proyecto Eva, integrando la arquitectura del frontend y el backend, el flujo de trabajo con los stubs y los próximos pasos sugeridos.

## 1. Arquitectura general
### Frontend (Expo/React Native)
- Estructura principal: `services/`, `components/`, `screens/`.
- Comunicación a través de un único endpoint orquestador: `/converse`.

### Backend (microservicios dockerizados)
- **stt-service** (`/transcribe`): FastAPI + Uvicorn con stub.
- **llm-service** (`/generate`): FastAPI + Uvicorn. Incluye modo stub y modo API real mediante la variable `USE_OPENAI`.
- **tts-service** (`/synthesize`): FastAPI + Uvicorn con stub de URL de audio.
- **orchestrator** (`/converse`): FastAPI + Uvicorn que llama secuencialmente a STT → LLM → TTS.
- `docker-compose.yml` unifica los servicios en los puertos 8001–8004 y el orquestador en el 8000.

## 2. Flujo con stubs
1. Levantar todos los microservicios stub: `docker compose up --build`.
2. Probar `/converse`: `curl -X POST http://localhost:8000/converse -H "Content-Type: application/json" -d '{"text":"Hola, Eva"}'`.
3. Validar el frontend enviando texto a `/converse` y reproduciendo el audio placeholder devuelto por el stub.

## 3. Integración con OpenAI sin recodificar
- El flag `USE_OPENAI` en `llm-service/main.py` alterna entre el stub y la llamada real.
- Variables de entorno necesarias:
  - `USE_OPENAI=true`
  - `OPENAI_API_KEY=sk-...`
- Docker Compose pasa estas variables al contenedor.

## 4. Herramientas y entorno
- Docker Desktop + WSL2 configurado y actualizado.
- Se puede usar `Invoke-RestMethod` (PowerShell) o `curl` desde WSL para probar los endpoints.

## 5. Gestión de cuota de OpenAI
- Desarrollo con stubs: consumo de 0 tokens.
- Modo real: pay-as-you-go con crédito inicial de 20 USD y control de límites desde la consola.

## Próximos pasos sugeridos
1. Pulir el frontend y probar la UX.
2. Integrar servicios adicionales (emociones, coaching, nutrición, GPS, etc.) con stubs.
3. Activar `USE_OPENAI=true` para pruebas con respuestas reales.
4. Sustituir el stub de TTS por un motor real.
5. Monitorizar el consumo y ajustar el presupuesto.
