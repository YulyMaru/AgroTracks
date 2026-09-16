# SPIKE-011: Validar autenticación y control de acceso en la app móvil

## Información general

- **ID:** SPIKE-011
- **Nombre:** Validar bloqueo de acceso no autenticado
- **ADR relacionado:** ADR-011 — Bloquear acceso no autenticado con middleware
- **ADR complementarios:** ADR-001 (Implementar sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 2 días hábiles (16 horas hombre)

## 1. Objetivo

Validar que el sistema bloquea el acceso a pantallas protegidas cuando no hay una sesión válida, redirige al login, y protege los datos locales de usuarios no autenticados, cumpliendo con el escenario de calidad **ESC-CAL-SEG-01**.

El Spike busca comprobar que el middleware de navegación, el almacenamiento seguro y el manejo de expiración funcionan correctamente en conjunto.

## 2. Problema que se busca validar

AgroTrack debe proteger la información del campesino (económica, productiva, personal) de accesos no autorizados. Existen riesgos de que:

- Un usuario no autenticado pueda acceder a pantallas protegidas (mostrando títulos, estructura o metadata).
- El token de autenticación almacenado sea vulnerable (si no se usa almacenamiento seguro).
- La app no maneje correctamente la expiración del token, mostrando errores confusos al usuario.
- Los datos locales (SQLite) puedan ser accedidos sin autenticación (si el repositorio no verifica el token).
- El flujo de inicio de sesión sea frágil y el usuario tenga que iniciar sesión con demasiada frecuencia.
- Se disparen múltiples solicitudes de refresco simultáneas, causando errores.

Por esta razón, se necesita un prototipo que implemente el middleware y los servicios de autenticación para validar el comportamiento en escenarios reales.

## 3. Pregunta principal del Spike

¿Un middleware de navegación que verifica el token de autenticación (almacenado de forma segura), combinado con un manejo de expiración (refresco silencioso o redirección a login), bloquea el 100 % de los accesos no autorizados a pantallas y protege los datos locales, mientras proporciona una experiencia de usuario fluida?

## 4. Hipótesis

Si implementamos:

- Almacenamiento seguro del token (`SecureStore` / `Keychain`).
- Middleware de navegación que verifica el token antes de mostrar rutas protegidas.
- Manejo de expiración: interceptación de 401, refresco silencioso y redirección a login si falla.
- Repositorio local que verifica autenticación antes de consultar datos.

Entonces:

- El 100 % de los intentos de acceso sin token o con token inválido serán bloqueados a nivel de navegación.
- El usuario será redirigido al login en todos los casos.
- Los datos locales no serán accesibles sin autenticación.
- El refresco silencioso evitará que el usuario tenga que iniciar sesión más de 1 vez al día con token válido.
- El repositorio local (SQLite) rechazará consultas si no hay usuario autenticado.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Servicio de autenticación**:
  - `login(username, password)` → guarda token en SecureStore.
  - `logout()` → elimina token.
  - `isAuthenticated()` → verifica existencia y validez local del token.
  - `refreshToken()` → intenta obtener un nuevo token (mock).
  - `getToken()` → recupera token del almacenamiento seguro.
- **Middleware de navegación**:
  - En React Navigation: `useEffect` en el punto de entrada que verifica autenticación y redirige a login si no está autenticado.
  - En Flutter: `NavigatorObserver` o `RouterDelegate`.
- **Pantalla de login** (mock) y pantalla de resumen (protegida).
- **Interceptor HTTP** (mock) que detecta 401 y dispara el refresco.
- **Repositorio local mock** que verifica autenticación antes de cualquier consulta.
- **Pruebas**:
  - Acceso sin token (redirige a login).
  - Acceso con token expirado (redirige a login o refresca).
  - Acceso con token válido (permite navegación).
  - Persistencia de sesión al cerrar y reabrir la app.
  - Protección de datos locales (SQLite) sin autenticación.

### 5.2 No incluye

El Spike no implementará:

- Autenticación biométrica (huella, Face ID).
- Sistema completo de autorización por roles (ej. admin vs usuario).
- Autenticación social (Google, Facebook).
- Servidor de autenticación real (se usará un mock con respuestas predefinidas).
- UI definitiva de login (solo funcionalidad, no diseño final).
- Pruebas en más de 2 dispositivos (se documentará como limitación del spike).

## 6. Caso de prueba principal

**Escenario base:** La app tiene una pantalla de login (pública) y una pantalla de resumen económico (protegida). El usuario debe estar autenticado para ver el resumen.

**Usuario mock:** `test@agrotrack.com` / `password123`.

**Flujos a probar:**

1. Usuario no autenticado intenta acceder a resumen → redirigido a login.
2. Usuario autenticado con token expirado intenta acceder a resumen → se refresca el token silenciosamente (éxito) o se redirige a login (fracaso).
3. Usuario autenticado con token válido accede a resumen → la pantalla se muestra correctamente.
4. Usuario cierra la app y la abre nuevamente → la sesión persiste (no pide login nuevamente) si el token es válido.
5. Usuario no autenticado intenta consultar el repositorio local (SQLite) → se rechaza la consulta.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Acceso sin token (no autenticado)

**Objetivo:** Validar que la app bloquea el acceso y redirige al login cuando no hay token.

#### Procedimiento
1. Limpiar el almacenamiento de la app (eliminar token manualmente en el spike).
2. Cerrar y reabrir la app (o navegar directamente a la pantalla de resumen mediante un botón en el login).
3. Intentar navegar a la pantalla de "Resumen económico" (protegida).
4. Observar el comportamiento.

#### Resultado esperado
- La app redirige automáticamente a la pantalla de login.
- No se muestra la pantalla de resumen ni ningún dato.
- No hay errores ni pantallas en blanco intermedios.
- El usuario ve la pantalla de login lista para ingresar credenciales.

---

### 7.2 Prueba 2 — Acceso con token expirado (simulación de 401)

**Objetivo:** Validar que la app detecta token expirado en el interceptor HTTP y maneja el refresco correctamente.

#### Procedimiento
1. Iniciar sesión correctamente (guardar token mock).
2. Simular que el token ha expirado (configurar el mock para que devuelva 401 en la siguiente solicitud al backend).
3. Intentar cargar el resumen económico (que hace una solicitud HTTP).
4. Observar el comportamiento del interceptor:
   - Debe detectar el 401.
   - Debe intentar refrescar el token (llamar a `refreshToken`).
5. Escenario A (refresco exitoso): el mock devuelve un nuevo token.
6. Escenario B (refresco fallido): el mock devuelve error.

#### Resultado esperado
- **Escenario A (éxito)**:
  - El refresco se realiza en segundo plano (sin mostrar nada al usuario).
  - La solicitud original se reenvía con el nuevo token y se completa exitosamente.
  - El usuario ve el resumen sin interrupciones.
- **Escenario B (fracaso)**:
  - Se cierra la sesión automáticamente.
  - Se redirige al login.
  - Se muestra un mensaje: "Tu sesión ha expirado, inicia sesión nuevamente".

---

### 7.3 Prueba 3 — Acceso con token válido (autenticado)

**Objetivo:** Validar que el acceso se permite correctamente.

#### Procedimiento
1. Iniciar sesión correctamente (guardar token válido).
2. Navegar a la pantalla de resumen económico.
3. Observar que la pantalla se carga con los datos (mock).

#### Resultado esperado
- La pantalla de resumen se muestra sin problemas.
- Los datos se cargan correctamente desde el backend mock.
- El usuario puede interactuar con la pantalla sin restricciones.

---

### 7.4 Prueba 4 — Persistencia de sesión al cerrar y abrir la app

**Objetivo:** Validar que la sesión persiste entre reinicios de la aplicación si el token es válido.

#### Procedimiento
1. Iniciar sesión correctamente (guardar token válido).
2. Cerrar completamente la aplicación (forzar cierre o swipar del task manager).
3. Volver a abrir la aplicación.
4. Observar si la app redirige automáticamente a la pantalla de resumen (o a la pantalla principal) sin pasar por login.

#### Resultado esperado
- La app verifica el token en SecureStore al iniciar.
- Si el token existe y es válido (según la lógica local, ej. no ha expirado), la app navega directamente al resumen o al dashboard principal.
- El usuario no ve la pantalla de login.
- La experiencia es fluida y continua.

---

### 7.5 Prueba 5 — Protección de datos locales (SQLite)

**Objetivo:** Validar que el repositorio local no permite consultas sin autenticación.

#### Procedimiento
1. Sin autenticación, intentar consultar el repositorio local (SQLite) desde una pantalla de prueba.
2. Observar el comportamiento.
3. Autenticarse y repetir la consulta.
4. Comparar los resultados.

#### Resultado esperado
- Sin autenticación, la consulta es rechazada (no se ejecuta).
- Se muestra un mensaje o se redirige al login.
- Con autenticación, la consulta se ejecuta correctamente.
- Los datos locales están asociados al `userId` del usuario autenticado.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Bloqueo de acceso sin token**: El 100 % de los intentos de navegación a rutas protegidas sin token son bloqueados y redirigen al login.
2. **Bloqueo con token inválido/expirado**: El 100 % de los intentos con token inválido (401) son manejados correctamente (refresco o redirección a login).
3. **Almacenamiento seguro**: El token se almacena exclusivamente en SecureStore / Keychain (no en AsyncStorage).
4. **Persistencia de sesión**: Al cerrar y reabrir la app con token válido, el usuario permanece autenticado (no se muestra login).
5. **Protección de datos locales**: El repositorio local no ejecuta consultas si no hay un usuario autenticado.
6. **Refresco silencioso**: El refresco de token no interrumpe la experiencia del usuario (se hace en segundo plano).

El Spike se considerará **RECHAZADO** si:

- Algún intento de acceso sin token logra mostrar una pantalla protegida.
- El refresco de token falla y no redirige al login.
- El token se almacena en un medio no seguro.
- La sesión se pierde al cerrar y reabrir la app con token válido.
- El repositorio local ejecuta consultas sin autenticación.
- Se disparan múltiples solicitudes de refresco simultáneas que causan errores.

## 9. Entorno técnico del spike

- **Cliente móvil**: React Native o Flutter (según el stack de AgroTrack).
- **Almacenamiento seguro**: `SecureStore` (React Native) o `flutter_secure_storage`.
- **Manejo de navegación**: React Navigation o Flutter Router (según el stack de AgroTrack).
- **HTTP Interceptor**: `axios` con interceptors para manejar 401 y refresh token.
- **Mock de autenticación**: Servicio mock que simula login, refresh y validación de token.
- **Middleware**: `useEffect` en el punto de entrada que verifica autenticación y condiciona el `NavigationContainer` (en React Navigation).
- **Repositorio local**: SQLite mock con verificación de autenticación antes de cualquier consulta.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El middleware puede tener problemas de "flash" (mostrar brevemente la pantalla protegida antes de redirigir).
  - **Mitigación**: Usar un estado de carga (`isLoading`) que se active al iniciar la app y solo renderizar la navegación después de verificar el token.

- **Riesgo**: El refresco de token puede fallar en medio de una operación crítica.
  - **Mitigación**: En el interceptor, si el refresco falla, cerrar sesión y mostrar un mensaje claro al usuario.

- **Riesgo**: El almacenamiento seguro puede no estar disponible en todos los dispositivos (ej. versiones muy antiguas de Android).
  - **Mitigación**: Definir una versión mínima de SO que soporte SecureStore (Android 6.0+ / iOS 10+). En dispositivos más antiguos, documentar la limitación.

- **Riesgo**: Múltiples solicitudes simultáneas pueden disparar múltiples refrescos de token.
  - **Mitigación**: Implementar una cola de solicitudes durante el refresco para que solo una solicitud de refresco se ejecute a la vez.

- **Riesgo**: El usuario puede perder la sesión si el SecureStore se limpia (ej. desinstalación de la app).
  - **Mitigación**: Documentar el comportamiento. En producción, el usuario tendrá que iniciar sesión nuevamente si los datos seguros se pierden.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Código** de:
   - `AuthService` (login, logout, refresh, isAuthenticated, secure storage).
   - Middleware de navegación (verificación centralizada).
   - Interceptor HTTP con manejo de 401 y refresh.
   - Pantalla de login mock y pantalla de resumen protegida.
   - Repositorio local con verificación de autenticación.
2. **Reporte de pruebas**:
   - Resultados de las 5 pruebas (acceso sin token, acceso con token expirado, acceso con token válido, persistencia, protección de datos locales).
   - Capturas de pantalla o video de cada flujo.
3. **Logs** que demuestren el almacenamiento seguro y el flujo de refresco.
4. **Recomendaciones finales** para:
   - Configuración del TTL de tokens en el backend.
   - Manejo de cierre de sesión en toda la app (limpiar repositorio local).
   - Estrategia de autorización por roles (si se necesita en el futuro).
5. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El middleware bloquea el 100 % de accesos sin token?
  - ✅ / ❌ ¿El manejo de 401 y refresco funciona correctamente?
  - ✅ / ❌ ¿El token se almacena de forma segura?
  - ✅ / ❌ ¿La sesión persiste al cerrar y reabrir la app?
  - ✅ / ❌ ¿El repositorio local está protegido?
  - ✅ / ❌ ¿Se evitan múltiples refrescos simultáneos?

- **Lecciones aprendidas**:
  - (Ejemplo: "El interceptor de axios debe manejar el refresco de forma atómica para evitar múltiples solicitudes de refresco simultáneas.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Implementar un sistema de cola de solicitudes durante el refresco para no perder peticiones.")
  - (Ejemplo: "Agregar un temporizador para refrescar el token antes de que expire (refresco proactivo).")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)