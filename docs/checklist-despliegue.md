# Checklist para desplegar y publicar Eva

## Hallazgos del estado actual
- **Configuración Expo incompleta.** `expo.config.js` solo declara `extra.API_URL` y no define los metadatos mínimos (name, slug, iconos, IDs de paquete, permisos).【F:expo.config.js†L1-L7】
- **Backend no apuntado a producción.** El cliente Axios usa `extra.API_URL` y si está vacío cae a `http://localhost:3000`, insuficiente para builds móviles.【F:src/services/api.js†L4-L13】
- **Permiso de micrófono solicitado en código.** Android pide `RECORD_AUDIO` en tiempo de ejecución, así que se debe declarar la justificación en la configuración para iOS y Android antes de subir a tienda.【F:src/services/sttService.js†L1-L40】
- **Servicios orquestados siguen en modo stub.** El resumen de arquitectura confirma que STT/LLM/TTS usan stubs salvo que se active `USE_OPENAI` y se conecte un TTS real.【F:docs/resumen-desarrollo-eva.md†L5-L52】

## Acciones imprescindibles para una build de tienda
1. **Completar la configuración de Expo** (app.json/app.config.js/expo.config.js):
   - Definir `name`, `slug`, `version`, `orientation` y assets (icon, splash) válidos.
   - Establecer `ios.bundleIdentifier` y `android.package` finales.
   - Declarar permisos y textos de privacidad: `NSMicrophoneUsageDescription` y `android.permissions: ["RECORD_AUDIO"]`, además de cualquier otro permiso usado.
   - Incluir `privacy`, `primaryColor`, `scheme` y enlaces de deep linking si aplican.

2. **Configurar el endpoint de orquestador accesible públicamente**:
   - Asignar `extra.API_URL` a la URL HTTPS del orquestador en producción.
   - Separar entornos (dev/stage/prod) con variables o `app.config.js` para evitar que builds de tienda apunten a `localhost`.

3. **Conectar servicios reales antes de publicar**:
   - Levantar backend con `USE_OPENAI=true` y `OPENAI_API_KEY` para que el switch "LLM real" funcione.
   - Sustituir el stub de TTS por un motor real o ajustar la UI para no ofrecer el modo "TTS real" si no hay backend.

4. **Validar dependencias nativas y permisos**:
   - Ejecutar `expo prebuild` y generar builds de distribución (`expo run:android --variant release` / `expo run:ios --configuration Release`) para verificar `@react-native-voice/voice` y el audio.
   - Probar la solicitud de micrófono y la reproducción de audio en dispositivos reales (TestFlight / Internal Testing).

5. **Preparar assets y textos para revisión de tiendas**:
   - Proveer iconos y splash en las rutas referenciadas en la configuración.
   - Añadir descripciones de uso de datos/voz y política de privacidad en los metadatos de App Store/Play Store.

6. **Automatizar builds**:
   - Configurar EAS (o CI equivalente) con keystore/certificados, perfiles de build y variables `API_URL` seguras.
   - Añadir un smoke test que verifique `/converse` desde la app contra el endpoint de producción.

## Resultado esperado
Con estos pasos la app quedará lista para generar builds firmadas que pasen la validación de permisos de audio, apunten al backend correcto y ofrezcan funcionalidad real (LLM/TTS) en las tiendas.
