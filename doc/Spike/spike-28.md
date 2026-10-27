# SPIKE-028: Validar notificaciones locales y push con Firebase Cloud Messaging

## Información general

- **ID:** SPIKE-028
- **Nombre:** Validar notificaciones locales y push con Firebase Cloud Messaging
- **ADR relacionado:** ADR-028 — Implementar notificaciones locales y push para eventos clave
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-006 (Consultar datos offline y detectar conectividad), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil), ADR-021 (Implementar monitoreo y observabilidad en backend y frontend), ADR-024 (Estandarizar manejo de errores y recuperación en backend y frontend)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media-Alta
- **Timebox estimado:** 3 días hábiles 

## 1. Objetivo

Validar técnicamente que las notificaciones locales y push con Firebase Cloud Messaging (plan gratuito) permiten informar al usuario sobre sincronización, confirmaciones y eventos clave, sin ser intrusivas, respetando la autonomía del campesino y sin exponer datos sensibles, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-03 y ESC-CAL-US-13.

El Spike busca comprobar que la estrategia de notificaciones seleccionada en ADR-028 es viable antes de implementarla en la primera versión de AgroTrack.

## 2. Problema que se busca validar

AgroTrack necesita notificar al usuario sobre eventos clave, pero existen riesgos de que:

- Las notificaciones sean intrusivas y molesten al campesino.
- Se envíen alertas automáticas no solicitadas, violando la restricción de autonomía.
- Las notificaciones expongan datos sensibles.
- Las notificaciones locales no funcionen sin conexión.
- Las notificaciones push no lleguen a los dispositivos.
- El usuario rechace los permisos de notificación.
- FCM no se integre correctamente con React Native o Spring Boot.
- Las notificaciones consuman batería o datos.
- Las notificaciones no se muestren correctamente en dispositivos de gama baja.

Por esta razón, se necesita un prototipo que configure notificaciones locales y push, simule eventos, y valide su comportamiento en condiciones reales.

## 3. Pregunta principal del Spike

¿Las notificaciones locales y push con Firebase Cloud Messaging permiten informar al usuario sobre sincronización, confirmaciones y eventos clave, sin ser intrusivas, respetando la autonomía del campesino, sin exponer datos sensibles, y funcionando correctamente en los 3 dispositivos Android representativos?

## 4. Hipótesis

Si configuramos:

- **Notificaciones locales** (React Native) para eventos sin conexión:
  - Registro guardado.
  - Registros pendientes.
  - Sin conexión.
- **Notificaciones push** (Firebase Cloud Messaging) para eventos que requieren conexión:
  - Sincronización completada.
  - Nuevos datos disponibles.
- **Configuración de Firebase** en el proyecto.
- **Backend** (Spring Boot) que envía notificaciones push.
- **Privacidad**: no exponer datos sensibles.
- **Autonomía**: no enviar alertas automáticas no solicitadas.
- **Permisos**: solicitar con contexto.

Entonces:

- Las notificaciones locales funcionarán sin conexión.
- Las notificaciones push llegarán a los dispositivos con conexión.
- Las notificaciones no serán intrusivas.
- No se enviarán alertas automáticas no solicitadas.
- No se expondrán datos sensibles.
- El usuario podrá desactivar las notificaciones.
- Las notificaciones funcionarán correctamente en los 3 dispositivos.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Configuración de Firebase**:
  - Crear proyecto en Firebase Console.
  - Registrar la app Android.
  - Descargar el archivo `google-services.json`.
  - Configurar FCM en el backend.
- **Notificaciones locales (React Native)**:
  - Instalar y configurar `@notifee/react-native` o `react-native-push-notification`.
  - Implementar notificaciones para:
    - Registro guardado localmente.
    - Registros pendientes de sincronizar.
    - Sin conexión.
    - Error de sincronización.
- **Notificaciones push (Firebase Cloud Messaging)**:
  - Integrar `@react-native-firebase/messaging` en el frontend.
  - Configurar el backend (Spring Boot) para enviar notificaciones push.
  - Implementar notificaciones para:
    - Sincronización completada desde background.
    - Nuevos datos disponibles.
- **Privacidad**:
  - Verificar que las notificaciones no exponen datos sensibles.
- **Autonomía**:
  - Verificar que no se envían alertas automáticas no solicitadas.
- **Permisos**:
  - Solicitar permisos con contexto.
  - Verificar que se respeta la decisión del usuario.
- **Pruebas**:
  - Verificar notificaciones locales sin conexión.
  - Verificar notificaciones push con conexión.
  - Verificar no intrusividad.
  - Verificar privacidad.
  - Verificar en los 3 dispositivos Android.
- **Métricas**:
  - Tasa de entrega de notificaciones push.
  - Tiempo de entrega.
  - Consumo de batería.
  - Tasa de aceptación de permisos.

### 5.2 No incluye

El Spike no implementará:

- Notificaciones multicanal (email, SMS, WhatsApp).
- Notificaciones segmentadas por usuario.
- Notificaciones programadas o recurrentes.
- Recordatorios automáticos no solicitados.
- Notificaciones en iOS (solo Android).
- Notificaciones en background con lógica compleja.
- Integración con Firebase Analytics más allá de lo básico.
- Publicación en Google Play ni despliegue en producción.
- Pruebas con más de 5 usuarios.

## 6. Caso de prueba principal

**Notificaciones locales a implementar:**

| Evento | Mensaje | Cuándo |
|--------|---------|--------|
| Registro guardado | "¡Guardado localmente! Se sincronizará automáticamente." | Al registrar sin conexión |
| Registros pendientes | "Tienes N registros pendientes de sincronizar." | Al abrir la app con pendientes |
| Sin conexión | "Sin conexión. Los datos se guardarán localmente." | Al perder conexión |
| Error de sincronización | "No se pudieron sincronizar N registros. Se reintentará." | Al fallar la sincronización |

**Notificaciones push a implementar:**

| Evento | Mensaje | Cuándo |
|--------|---------|--------|
| Sincronización completada | "Tus datos se sincronizaron correctamente." | Al completar sync en background |
| Nuevos datos disponibles | "Hay nuevos datos disponibles. Abre la app para verlos." | Cuando el backend tiene datos nuevos |

**Datos de prueba:**

- Usuario mock autenticado.
- 20 fincas.
- 100 transacciones.
- 5 operaciones pendientes.

**Dispositivos de prueba:**

- Samsung Galaxy A12 (Android 11, RAM 4 GB).
- Xiaomi Redmi Note 10 (Android 12, RAM 6 GB).
- Samsung Galaxy S22 (Android 13, RAM 8 GB).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración de Firebase y FCM

**Objetivo:** Validar que Firebase y FCM están configurados correctamente.

#### Procedimiento
1. Crear un proyecto en Firebase Console.
2. Registrar la app Android.
3. Descargar `google-services.json` y colocarlo en el proyecto.
4. Configurar `@react-native-firebase/messaging` en el frontend.
5. Configurar FCM en el backend (Spring Boot).
6. Obtener el token FCM del dispositivo.
7. Enviar una notificación de prueba desde Firebase Console.
8. Verificar que la notificación llega al dispositivo.

#### Resultado esperado
- Firebase está configurado.
- El token FCM se obtiene correctamente.
- La notificación de prueba llega al dispositivo.
- No hay errores de configuración.

---

### 7.2 Prueba 2 — Notificaciones locales sin conexión

**Objetivo:** Validar que las notificaciones locales funcionan sin conexión.

#### Procedimiento
1. Desactivar la conexión a Internet.
2. Registrar un gasto.
3. Verificar que se muestra la notificación local "¡Guardado localmente!".
4. Registrar 5 gastos más.
5. Verificar que se muestra "Tienes 5 registros pendientes de sincronizar".
6. Cerrar la app y reabrirla.
7. Verificar que la notificación de pendientes se muestra nuevamente.

#### Resultado esperado
- Las notificaciones locales se muestran sin conexión.
- Los mensajes son claros y no exponen datos sensibles.
- Las notificaciones aparecen en el momento correcto.
- No hay errores.

---

### 7.3 Prueba 3 — Notificaciones push con conexión

**Objetivo:** Validar que las notificaciones push llegan al dispositivo.

#### Procedimiento
1. Activar la conexión a Internet.
2. Simular la sincronización completada desde el backend.
3. Verificar que la notificación push llega al dispositivo.
4. Verificar que el mensaje es "Tus datos se sincronizaron correctamente".
5. Simular nuevos datos disponibles desde el backend.
6. Verificar que la notificación push llega.
7. Verificar que el mensaje es "Hay nuevos datos disponibles".

#### Resultado esperado
- Las notificaciones push llegan al dispositivo.
- Los mensajes son claros.
- No exponen datos sensibles.
- El tiempo de entrega es aceptable (< 10 s).

---

### 7.4 Prueba 4 — No intrusividad

**Objetivo:** Validar que las notificaciones no son intrusivas.

#### Procedimiento
1. Usar la app durante 30 minutos con actividad normal.
2. Verificar que no se envían notificaciones no solicitadas.
3. Verificar que no se envían alertas automáticas (ej. "Es hora de regar").
4. Verificar que las notificaciones solo se envían para eventos relevantes.
5. Preguntar al usuario si las notificaciones le parecen útiles o molestas.

#### Resultado esperado
- No se envían notificaciones no solicitadas.
- No se envían alertas automáticas.
- Las notificaciones solo se envían para eventos relevantes.
- El usuario no se siente molestado.

---

### 7.5 Prueba 5 — Privacidad de datos

**Objetivo:** Validar que las notificaciones no exponen datos sensibles.

#### Procedimiento
1. Revisar todas las notificaciones implementadas.
2. Verificar que no incluyen montos, nombres de fincas, ni datos personales.
3. Verificar que los mensajes son genéricos pero útiles.
4. Verificar que si el dispositivo está bloqueado, la notificación no muestra datos sensibles.

#### Resultado esperado
- Las notificaciones no exponen datos sensibles.
- Los mensajes son genéricos pero útiles.
- La privacidad se respeta.

---

### 7.6 Prueba 6 — Permisos de notificación

**Objetivo:** Validar que los permisos se solicitan correctamente.

#### Procedimiento
1. Instalar la app en un dispositivo limpio.
2. Verificar que se solicita permiso de notificación con contexto.
3. Aceptar el permiso y verificar que las notificaciones llegan.
4. Reinstalar la app y rechazar el permiso.
5. Verificar que la app respeta la decisión.
6. Verificar que la app sigue funcionando sin notificaciones.

#### Resultado esperado
- El permiso se solicita con contexto.
- Al aceptar, las notificaciones llegan.
- Al rechazar, la app respeta la decisión.
- La app sigue funcionando sin notificaciones.

---

### 7.7 Prueba 7 — Comportamiento en los 3 dispositivos

**Objetivo:** Validar que las notificaciones funcionan consistentemente en los 3 dispositivos.

#### Procedimiento
1. Repetir las pruebas 2, 3 y 6 en los 3 dispositivos.
2. Verificar que las notificaciones se muestran correctamente.
3. Verificar que no hay diferencias significativas entre dispositivos.
4. Medir el consumo de batería y datos.

#### Resultado esperado
- Las notificaciones funcionan en los 3 dispositivos.
- No hay diferencias significativas.
- El consumo de batería es aceptable.
- El consumo de datos es mínimo.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Configuración**: Firebase y FCM están configurados correctamente.
2. **Notificaciones locales**: Funcionan sin conexión.
3. **Notificaciones push**: Llegan al dispositivo con conexión.
4. **No intrusividad**: No se envían notificaciones no solicitadas.
5. **Privacidad**: No se exponen datos sensibles.
6. **Permisos**: Se solicitan con contexto y se respeta la decisión.
7. **Consistencia**: Funcionan en los 3 dispositivos.
8. **Consumo**: El consumo de batería y datos es aceptable.

El Spike se considerará **RECHAZADO** si:

- Firebase o FCM no se configuran correctamente.
- Las notificaciones locales no funcionan sin conexión.
- Las notificaciones push no llegan al dispositivo.
- Se envían notificaciones no solicitadas.
- Se exponen datos sensibles.
- No se respeta la decisión del usuario sobre permisos.
- Hay diferencias importantes entre dispositivos.
- El consumo de batería o datos es excesivo.

## 9. Entorno técnico del spike

- **Frontend**: React Native + TypeScript.
- **Notificaciones locales**: `@notifee/react-native` o `react-native-push-notification`.
- **Notificaciones push**: `@react-native-firebase/messaging`.
- **Backend**: Spring Boot 3 + Java 17.
- **Envío de push**: Firebase Admin SDK en el backend.
- **Firebase Console**: proyecto configurado.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: Firebase Console, Android Studio Profiler, `adb logcat`.
- **Datos de prueba**: 20 fincas, 100 transacciones, 5 pendientes.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: FCM puede no funcionar en dispositivos con servicios de Google deshabilitados.
  - **Mitigación**: Verificar que los dispositivos tienen Google Play Services. Documentar limitaciones.

- **Riesgo**: Las notificaciones pueden consumir mucha batería.
  - **Mitigación**: Usar notificaciones locales para eventos sin conexión. Evitar notificaciones frecuentes.

- **Riesgo**: El usuario puede rechazar los permisos.
  - **Mitigación**: Solicitar permisos con contexto. Respetar la decisión.

- **Riesgo**: Las notificaciones pueden exponer datos sensibles si no se configuran bien.
  - **Mitigación**: Revisar cada mensaje. No incluir montos, nombres ni datos personales.

- **Riesgo**: Las notificaciones push pueden no llegar si el backend no está configurado correctamente.
  - **Mitigación**: Configurar Firebase Admin SDK correctamente. Probar con Firebase Console primero.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 7 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3 y 5. Si el tiempo no alcanza, documentar 4, 6 y 7 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Configuración de Firebase.
   - Notificaciones locales implementadas.
   - Notificaciones push implementadas.
   - Backend configurado para enviar push.
2. **Reporte de métricas**:
   - Tasa de entrega de notificaciones push.
   - Tiempo de entrega.
   - Consumo de batería.
   - Tasa de aceptación de permisos.
   - Resultados de las pruebas en los 3 dispositivos.
3. **Evidencia**:
   - Capturas de las notificaciones locales.
   - Capturas de las notificaciones push.
   - Capturas de la solicitud de permisos.
   - Capturas de Firebase Console.
   - Video del flujo completo.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Firebase y FCM se configuraron correctamente?
  - ✅ / ❌ ¿Las notificaciones locales funcionaron sin conexión?
  - ✅ / ❌ ¿Las notificaciones push llegaron al dispositivo?
  - ✅ / ❌ ¿Las notificaciones fueron no intrusivas?
  - ✅ / ❌ ¿Las notificaciones no expusieron datos sensibles?
  - ✅ / ❌ ¿Se solicitaron permisos con contexto?
  - ✅ / ❌ ¿Las notificaciones funcionaron en los 3 dispositivos?
  - ✅ / ❌ ¿El consumo de batería y datos fue aceptable?

- **Lecciones aprendidas**:
  - (Ejemplo: "Las notificaciones locales son ideales para eventos sin conexión.")
  - (Ejemplo: "No se deben incluir montos ni datos personales en las notificaciones.")
  - (Ejemplo: "Solicitar permisos con contexto aumenta la tasa de aceptación.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar notificaciones locales para eventos sin conexión y push para eventos que requieren conexión.")
  - (Ejemplo: "No exponer datos sensibles en la notificación.")
  - (Ejemplo: "Respetar la autonomía del campesino (no alertas automáticas no solicitadas).")
  - (Ejemplo: "Permitir al usuario desactivar las notificaciones desde la configuración de la app.")
  - (Ejemplo: "Medir la tasa de aceptación de permisos y ajustar el mensaje si es bajo.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)