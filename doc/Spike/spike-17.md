# SPIKE-017: Validar stack React Native + TypeScript para AgroTrack

## Información general

- **ID:** SPIKE-017
- **Nombre:** Validar stack React Native + TypeScript con librerías offline-first
- **ADR relacionado:** ADR-017 — Usar React Native con TypeScript como stack del frontend móvil
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-002 (Validar formularios con reglas centralizadas), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad), ADR-010 (Estandarizar táctil y valores con unidades), ADR-011 (Bloquear acceso no autenticado con middleware), ADR-013 (Base de datos relacional SQL), ADR-014 (Aplicación móvil reactiva basada en componentes), ADR-015 (Usar REST como estilo de comunicación)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 4 días hábiles
## 1. Objetivo

Validar técnicamente que React Native con TypeScript y el conjunto de librerías seleccionadas (React Navigation, Axios, SQLite, NetInfo, SecureStore, UUID, Vector Icons) cubre todos los requisitos funcionales y no funcionales del frontend móvil de AgroTrack, incluyendo navegación, HTTP con interceptores, almacenamiento local persistente, detección de conectividad, almacenamiento seguro de tokens, generación de identificadores únicos, tipificación estricta y compilación sin errores.

El Spike busca comprobar que el stack seleccionado en ADR-017 es viable antes de implementar el frontend completo de AgroTrack.

## 2. Problema que se busca validar

AgroTrack requiere una aplicación móvil Android-first, offline-first, con UI sencilla y clara para campesinos. Existen riesgos de que:

- React Native no se integre correctamente con SQLite en dispositivos de gama baja.
- NetInfo no detecte cambios de conectividad en redes rurales inestables.
- SecureStore no esté disponible en versiones antiguas de Android.
- Axios con interceptores no maneje correctamente el refresco de JWT.
- TypeScript estricto genere errores de compilación que ralenticen el desarrollo.
- La combinación de librerías genere conflictos de versiones o dependencias.
- El tamaño del bundle sea excesivo para dispositivos con almacenamiento limitado.
- La navegación con React Navigation no se integre con el middleware de autenticación.
- La generación de UUID no sea confiable en el cliente.
- Los iconos vectoriales no se rendericen correctamente en gama baja.

Por esta razón, se necesita un prototipo que integre todas las librerías del stack, configure TypeScript estricto, implemente un flujo mínimo funcional y mida su comportamiento en dispositivos reales.

## 3. Pregunta principal del Spike

¿React Native con TypeScript y las librerías React Navigation, Axios, SQLite, NetInfo, SecureStore, UUID y Vector Icons se integran sin conflictos, compilan sin errores con TypeScript estricto, y permiten implementar navegación, HTTP con refresco de JWT, almacenamiento local, detección de conectividad y generación de UUID en dispositivos Android de gama baja, media y alta?

## 4. Hipótesis

Si configuramos un proyecto React Native con:

- TypeScript en modo estricto.
- React Navigation con native-stack y bottom-tabs.
- Axios con interceptores para JWT y refresco.
- SQLite para almacenamiento local.
- NetInfo para detección de conectividad.
- SecureStore para almacenamiento seguro de tokens.
- UUID para generación de identificadores únicos.
- Vector Icons para iconografía.

Entonces:

- El proyecto compilará sin errores de TypeScript en modo estricto.
- Todas las librerías se instalarán sin conflictos de versiones.
- La navegación funcionará correctamente entre pantallas públicas y protegidas.
- Axios inyectará el token y manejará el 401 con refresco silencioso.
- SQLite almacenará y recuperará datos localmente.
- NetInfo detectará cambios de conectividad en < 5 s.
- SecureStore almacenará el token de forma segura.
- UUID generará identificadores únicos sin colisiones.
- Los iconos se renderizarán correctamente en los tres dispositivos.
- El tamaño del bundle será aceptable para dispositivos con almacenamiento limitado.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Configuración inicial del proyecto React Native con TypeScript estricto.
- Instalación y configuración de las librerías:
  - `@react-navigation/native` con `native-stack` y `bottom-tabs`.
  - `axios` con interceptores para JWT.
  - `@op-engineering/op-sqlite` (con SQLCipher).
  - `@react-native-community/netinfo`.
  - `react-native-secure-storage`.
  - `react-native-uuid`.
  - `react-native-vector-icons`.
- Implementación de un flujo mínimo funcional:
  - Pantalla de login (pública).
  - Pantalla de dashboard (protegida).
  - Pantalla de lista de transacciones (con datos mock).
  - Pantalla de detalle de transacción (con datos mock).
- Navegación con React Navigation entre pantallas.
- Middleware de autenticación que bloquea rutas protegidas si no hay token.
- Cliente HTTP con Axios e interceptores para inyectar token y manejar 401.
- Almacenamiento seguro del token con SecureStore.
- Almacenamiento local de transacciones mock con SQLite.
- Detección de conectividad con NetInfo.
- Generación de UUID para transacciones mock.
- Uso de iconos vectoriales en la navegación.
- Compilación con TypeScript en modo estricto.
- Medición del tamaño del bundle.
- Pruebas en tres dispositivos Android (gama baja, media, alta).

### 5.2 No incluye

El Spike no implementará:

- La interfaz definitiva de la aplicación (solo pantallas mínimas).
- El modelo de datos completo de AgroTrack (solo transacciones mock).
- La lógica completa de sincronización (solo simulación con logs).
- El backend real (se usará un mock o datos locales).
- Autenticación real (se usará un mock de login).
- Validación de formularios (ADR-002) más allá de lo mínimo.
- Optimización avanzada de rendimiento (solo mediciones básicas).
- Pruebas en iOS (solo Android).
- Publicación en Google Play (solo build de prueba).
- Internacionalización ni accesibilidad avanzada.
- Pruebas de carga con más de 100 transacciones.

## 6. Caso de prueba principal

**Flujo funcional a validar:**

1. Usuario abre la app por primera vez.
2. Se muestra pantalla de login (pública).
3. Usuario ingresa credenciales mock.
4. App guarda token en SecureStore.
5. App navega a dashboard (protegida).
6. Usuario accede a lista de transacciones (con datos mock en SQLite).
7. App genera UUID para cada transacción mock.
8. Usuario desconecta la red.
9. NetInfo detecta la desconexión y muestra indicador.
10. Usuario reconecta la red.
11. NetInfo detecta la reconexión en < 5 s.
12. Axios simula refresco de token tras un 401.
13. Usuario cierra sesión y el token se elimina de SecureStore.
14. Usuario intenta acceder a dashboard y es redirigido a login.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

**Datos de prueba:**

- 20 transacciones mock (10 ingresos, 10 gastos).
- Usuario mock autenticado.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración inicial y compilación con TypeScript estricto

**Objetivo:** Validar que el proyecto se configura correctamente y compila sin errores con TypeScript estricto.

#### Procedimiento
1. Crear el proyecto React Native con TypeScript.
2. Configurar `tsconfig.json` con `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
3. Instalar todas las librerías del stack.
4. Verificar que no hay conflictos de dependencias (`npm ls` o `yarn why`).
5. Ejecutar `tsc --noEmit` y verificar que no hay errores.
6. Compilar la app para Android (`./gradlew assembleDebug`).
7. Verificar que el APK se genera correctamente.

#### Resultado esperado
- El proyecto se configura sin errores.
- Las librerías se instalan sin conflictos.
- TypeScript compila sin errores en modo estricto.
- El APK se genera correctamente.
- No hay advertencias críticas de dependencias.

---

### 7.2 Prueba 2 — Navegación y middleware de autenticación

**Objetivo:** Validar que la navegación funciona y que el middleware bloquea rutas protegidas sin token.

#### Procedimiento
1. Abrir la app sin token en SecureStore.
2. Verificar que se muestra la pantalla de login.
3. Intentar navegar manualmente a dashboard (mediante deep link o botón de prueba).
4. Verificar que se redirige a login.
5. Iniciar sesión con credenciales mock.
6. Verificar que se navega a dashboard.
7. Navegar a lista de transacciones y detalle.
8. Cerrar sesión.
9. Verificar que se redirige a login y que el token se elimina.

#### Resultado esperado
- La navegación funciona correctamente.
- Las rutas protegidas bloquean el acceso sin token.
- El login redirige al dashboard.
- El logout redirige a login y elimina el token.
- No hay pantallas en blanco ni errores de navegación.

---

### 7.3 Prueba 3 — Axios con interceptores y refresco de JWT

**Objetivo:** Validar que Axios inyecta el token y maneja el 401 con refresco silencioso.

#### Procedimiento
1. Configurar Axios con un interceptor de request que inyecte el token desde SecureStore.
2. Configurar un interceptor de response que detecte 401 y llame a refresh.
3. Simular una llamada HTTP con token válido y verificar que se inyecta.
4. Simular una llamada HTTP con token expirado (401) y verificar que se refresca.
5. Verificar que la solicitud original se reintenta con el nuevo token.
6. Simular fallo en el refresco y verificar que se cierra sesión y redirige a login.

#### Resultado esperado
- El token se inyecta correctamente en cada solicitud.
- El 401 dispara el refresco silencioso.
- La solicitud original se reintenta con el nuevo token.
- Si el refresco falla, se cierra sesión y se redirige a login.
- No hay múltiples refrescos simultáneos.

---

### 7.4 Prueba 4 — SQLite local con transacciones mock

**Objetivo:** Validar que SQLite almacena y recupera datos localmente.

#### Procedimiento
1. Inicializar SQLite local.
2. Insertar 20 transacciones mock con UUID generado por `react-native-uuid`.
3. Consultar las transacciones y verificar que se recuperan correctamente.
4. Cerrar la app y reabrirla.
5. Verificar que las transacciones persisten.
6. Eliminar una transacción y verificar que se elimina correctamente.

#### Resultado esperado
- SQLite almacena y recupera datos correctamente.
- Los datos persisten tras cerrar y reabrir la app.
- Las transacciones se eliminan correctamente.
- No hay corrupción de la base.

---

### 7.5 Prueba 5 — NetInfo y detección de conectividad

**Objetivo:** Validar que NetInfo detecta cambios de conectividad en < 5 s.

#### Procedimiento
1. Con la app abierta, desactivar la conexión a Internet.
2. Medir el tiempo desde la desconexión hasta que NetInfo lo detecta.
3. Verificar que la app muestra un indicador de "Sin conexión".
4. Reactivar la conexión.
5. Medir el tiempo desde la reconexión hasta que NetInfo lo detecta.
6. Verificar que la app muestra un indicador de "Conectado".
7. Repetir 5 veces para validar la tolerancia a red intermitente.

#### Resultado esperado
- NetInfo detecta la desconexión en < 5 s.
- NetInfo detecta la reconexión en < 5 s.
- El indicador visual refleja el estado real.
- La app tolera cambios frecuentes de red sin errores.

---

### 7.6 Prueba 6 — SecureStore para almacenamiento seguro

**Objetivo:** Validar que SecureStore almacena y recupera el token de forma segura.

#### Procedimiento
1. Guardar un token en SecureStore.
2. Recuperar el token y verificar que coincide.
3. Cerrar la app y reabrirla.
4. Verificar que el token persiste.
5. Eliminar el token y verificar que ya no está disponible.
6. Verificar que SecureStore está disponible en los tres dispositivos.

#### Resultado esperado
- El token se almacena y recupera correctamente.
- El token persiste tras cerrar y reabrir la app.
- El token se elimina correctamente.
- SecureStore funciona en los tres dispositivos.

---

### 7.7 Prueba 7 — Generación de UUID

**Objetivo:** Validar que `react-native-uuid` genera identificadores únicos sin colisiones.

#### Procedimiento
1. Generar 10,000 UUID en el cliente.
2. Verificar que no hay colisiones.
3. Verificar que el formato es UUID v4 válido.
4. Medir el tiempo de generación de 10,000 UUID.

#### Resultado esperado
- No hay colisiones en 10,000 UUID.
- El formato es UUID v4 válido.
- El tiempo de generación es < 1 s para 10,000 UUID.

---

### 7.8 Prueba 8 — Iconos vectoriales y UI

**Objetivo:** Validar que los iconos vectoriales se renderizan correctamente en los tres dispositivos.

#### Procedimiento
1. Usar `react-native-vector-icons` en la navegación y en botones.
2. Verificar que los iconos se renderizan correctamente en gama baja, media y alta.
3. Verificar que el tamaño y color son configurables.
4. Verificar que no hay iconos rotos o faltantes.

#### Resultado esperado
- Los iconos se renderizan correctamente en los tres dispositivos.
- El tamaño y color son configurables.
- No hay iconos rotos o faltantes.

---

### 7.9 Prueba 9 — Tamaño del bundle

**Objetivo:** Medir el tamaño del APK generado y evaluar su viabilidad para dispositivos con almacenamiento limitado.

#### Procedimiento
1. Generar el APK de release.
2. Medir el tamaño del APK.
3. Comparar con el tamaño de una app React Native básica.
4. Evaluar si el tamaño es aceptable para dispositivos con 32 MB libres.

#### Resultado esperado
- El APK tiene un tamaño aceptable (≤ 50 MB).
- El tamaño es viable para dispositivos con almacenamiento limitado.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Compilación**: El proyecto compila sin errores con TypeScript estricto.
2. **Librerías**: Todas las librerías se instalan sin conflictos de versiones.
3. **Navegación**: La navegación funciona y el middleware bloquea rutas protegidas.
4. **Axios**: El interceptor inyecta el token y maneja el 401 con refresco silencioso.
5. **SQLite**: Almacena y recupera datos localmente con persistencia.
6. **NetInfo**: Detecta cambios de conectividad en < 5 s.
7. **SecureStore**: Almacena y recupera el token de forma segura.
8. **UUID**: Genera 10,000 UUID sin colisiones.
9. **Iconos**: Se renderizan correctamente en los tres dispositivos.
10. **Bundle**: El APK tiene un tamaño aceptable (≤ 50 MB).

El Spike se considerará **RECHAZADO** si:

- TypeScript estricto genera errores irresolubles.
- Alguna librería genera conflictos de dependencias.
- La navegación no funciona o el middleware no bloquea rutas.
- Axios no maneja correctamente el 401 o el refresco.
- SQLite no persiste los datos al cerrar y reabrir la app.
- NetInfo tarda más de 5 s en detectar cambios.
- SecureStore no está disponible en algún dispositivo.
- Hay colisiones en la generación de UUID.
- Los iconos no se renderizan correctamente.
- El APK supera los 50 MB.

## 9. Entorno técnico del spike

- **Framework**: React Native con TypeScript.
- **Navegación**: `@react-navigation/native` con `native-stack` y `bottom-tabs`.
- **HTTP**: Axios con interceptores.
- **Base de datos local**: `@op-engineering/op-sqlite` (con SQLCipher).
- **Conectividad**: `@react-native-community/netinfo`.
- **Almacenamiento seguro**: `react-native-secure-storage`.
- **UUID**: `react-native-uuid`.
- **Iconos**: `react-native-vector-icons`.
- **Estado**: `useState`, `useReducer`, `useContext` (ADR-014).
- **Compilación**: Metro bundler, Gradle para Android.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: React Native Debugger, React Native DevTools, `console.time` / `console.timeEnd`.
- **Backend mock**: no se usa backend real; las llamadas HTTP se simulan con un mock local.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Algunas librerías pueden tener conflictos de versiones con React Native.
  - **Mitigación**: Usar versiones compatibles documentadas. Ejecutar `npm ls` o `yarn why` para detectar conflictos.

- **Riesgo**: TypeScript estricto puede generar muchos errores iniciales.
  - **Mitigación**: Configurar gradualmente. Empezar con `strict: false` y activar reglas una por una.

- **Riesgo**: SecureStore puede no estar disponible en Android 8.0.
  - **Mitigación**: Verificar la versión mínima. Si no está disponible, usar `react-native-keychain` como alternativa.

- **Riesgo**: NetInfo puede no detectar cambios en algunos dispositivos.
  - **Mitigación**: Probar en los tres dispositivos. Si falla, implementar polling adicional.

- **Riesgo**: El tamaño del APK puede superar los 50 MB.
  - **Mitigación**: Habilitar Hermes, ProGuard y R8. Evaluar dividir el APK por arquitectura.

- **Riesgo**: El timebox de 4 días puede ser insuficiente para las 9 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6, 7, 8 y 9 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Proyecto React Native + TypeScript configurado.
   - Todas las librerías instaladas y configuradas.
   - Flujo mínimo funcional (login → dashboard → lista → detalle).
   - Middleware de autenticación.
   - Axios con interceptores.
   - SQLite local con datos mock.
   - NetInfo configurado.
   - SecureStore configurado.
   - Generación de UUID.
   - Iconos vectoriales.
2. **Reporte de métricas**:
   - Resultado de `tsc --noEmit`.
   - Tamaño del APK.
   - Tiempo de detección de conectividad con NetInfo.
   - Tiempo de generación de 10,000 UUID.
   - Resultados de las pruebas en los tres dispositivos.
3. **Evidencia**:
   - Capturas o video del flujo completo.
   - Capturas de la navegación y el middleware.
   - Capturas del indicador de conectividad.
   - Capturas de los iconos en los tres dispositivos.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El proyecto compiló sin errores con TypeScript estricto?
  - ✅ / ❌ ¿Todas las librerías se instalaron sin conflictos?
  - ✅ / ❌ ¿La navegación y el middleware funcionaron?
  - ✅ / ❌ ¿Axios manejó el token y el refresco de JWT?
  - ✅ / ❌ ¿SQLite almacenó y recuperó datos con persistencia?
  - ✅ / ❌ ¿NetInfo detectó cambios de conectividad en < 5 s?
  - ✅ / ❌ ¿SecureStore almacenó el token de forma segura?
  - ✅ / ❌ ¿Se generaron 10,000 UUID sin colisiones?
  - ✅ / ❌ ¿Los iconos se renderizaron correctamente?
  - ✅ / ❌ ¿El APK tuvo un tamaño aceptable?

- **Lecciones aprendidas**:
  - (Ejemplo: "TypeScript estricto desde el inicio evita errores en tiempo de ejecución.")
  - (Ejemplo: "Hermes reduce significativamente el tamaño del APK y mejora el rendimiento.")
  - (Ejemplo: "NetInfo requiere configuración adicional para detectar cambios rápidos en redes rurales.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Mantener @op-engineering/op-sqlite por su compatibilidad con SQLCipher.")
  - (Ejemplo: "Configurar ESLint y Prettier desde el día 1.")
  - (Ejemplo: "Habilitar Hermes, ProGuard y R8 para reducir el tamaño del APK.")
  - (Ejemplo: "Usar Firebase App Distribution para pruebas tempranas.")
  - (Ejemplo: "Documentar las versiones de las librerías para evitar conflictos futuros.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)