# SPIKE-022: Validar seguridad en tránsito y en reposo

## Información general

- **ID:** SPIKE-022
- **Nombre:** Validar TLS, SecureStore y SQLCipher para seguridad en tránsito y en reposo
- **ADR relacionado:** ADR-022 — Garantizar seguridad en tránsito y en reposo
- **ADR complementarios:** ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-011 (Bloquear acceso no autenticado con middleware), ADR-013 (Base de datos relacional SQL), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles

## 1. Objetivo

Validar técnicamente que TLS 1.2+ en las comunicaciones, SecureStore para el token JWT, y SQLCipher para cifrar la base de datos local SQLite, protegen los datos sensibles de AgroTrack en tránsito y en reposo, cumpliendo con la Ley 1581 de 2012, sin degradar el rendimiento en dispositivos de gama baja más del 10 %.

El Spike busca comprobar que la estrategia de seguridad seleccionada en ADR-022 es viable antes de implementarla completamente en AgroTrack.

## 2. Problema que se busca validar

AgroTrack maneja información económica, productiva y personal sensible. Existen riesgos de que:

- Las comunicaciones HTTP sin TLS sean interceptadas.
- El token JWT almacenado en AsyncStorage sea vulnerable en dispositivos rooteados.
- La base de datos SQLite en texto plano sea leída por otras apps o por un atacante con acceso físico.
- SQLCipher no funcione correctamente en React Native.
- El overhead de SQLCipher degrade el rendimiento en gama baja.
- La clave de cifrado se pierda y los datos queden inaccesibles.
- La configuración de TLS en Spring Boot sea compleja.
- Certificate pinning cause problemas con proxies o certificados corporativos.
- No se cumpla con la Ley 1581 de 2012.

Por esta razón, se necesita un prototipo que implemente TLS, SecureStore y SQLCipher, y mida su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿TLS 1.2+, SecureStore y SQLCipher protegen los datos en tránsito y en reposo, cumplen con la Ley 1581 de 2012, y mantienen el overhead de rendimiento por debajo del 10 % en dispositivos Android de gama baja, media y alta?

## 4. Hipótesis

Si implementamos:

- **Backend (Spring Boot)**:
  - TLS 1.2+ con certificado SSL/TLS.
  - Redirección de HTTP a HTTPS.
  - Configuración de seguridad para rechazar tráfico no cifrado.
- **Frontend (React Native)**:
  - Axios configurado para HTTPS exclusivamente.
  - `android:usesCleartextTraffic="false"` en el manifest.
  - SecureStore para el token JWT.
  - SQLCipher para la base de datos local.
  - Clave maestra generada aleatoriamente y almacenada en SecureStore.

Entonces:

- Las comunicaciones viajarán cifradas con TLS 1.2+.
- El token JWT estará seguro en SecureStore.
- La base de datos local estará cifrada con AES-256.
- Los datos no serán legibles sin la clave.
- El overhead de SQLCipher será < 10 % en lectura/escritura.
- La app funcionará correctamente en los tres dispositivos.
- Se cumplirá con la Ley 1581 de 2012.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot)**:
  - Configurar TLS 1.2+ con certificado autofirmado para pruebas.
  - Redirigir HTTP a HTTPS.
  - Verificar que las solicitudes sin TLS son rechazadas.
  - Configurar headers de seguridad (HSTS, X-Content-Type-Options, etc.).
- **Frontend (React Native)**:
  - Configurar Axios para HTTPS exclusivamente.
  - Deshabilitar tráfico en texto plano en Android.
  - Integrar SecureStore para el token JWT.
  - Integrar SQLCipher para cifrar SQLite.
  - Generar clave maestra aleatoria y almacenarla en SecureStore.
  - Probar lectura/escritura con SQLCipher.
- **Pruebas**:
  - Verificar que TLS está configurado correctamente.
  - Verificar que SecureStore almacena y recupera el token.
  - Verificar que SQLCipher cifra la base.
  - Medir el overhead de SQLCipher en los tres dispositivos.
  - Verificar que los datos no son legibles sin la clave.
  - Simular pérdida de la clave y verificar comportamiento.
- **Métricas**:
  - Overhead de SQLCipher en lectura/escritura.
  - Tiempo de configuración de TLS.
  - Tamaño del APK con SQLCipher.
  - Compatibilidad con los tres dispositivos.

### 5.2 No incluye

El Spike no implementará:

- Certificate pinning (se deja como opcional para futuro).
- Rotación automática de claves.
- Cifrado de campos específicos (solo base completa).
- Auditoría de seguridad completa (OWASP ZAP se hace en SPIKE-020).
- Pruebas en iOS (solo Android).
- Pruebas de penetración.
- Configuración de TLS en producción con certificados reales (solo autofirmados).
- Cifrado de la base de datos del backend (PostgreSQL TDE).
- Gestión de secretos con Vault o similar.

## 6. Caso de prueba principal

**Backend (Spring Boot):**

- Endpoint: `GET /api/v1/fincas` protegido con JWT.
- Configuración TLS: certificado autofirmado en `keystore.p12`.
- Redirección: `http://localhost:8080` → `https://localhost:8443`.

**Frontend (React Native):**

- Axios configurado con `baseURL: 'https://...'`.
- SecureStore para token.
- SQLCipher para base local.

**Datos de prueba:**

- 20 fincas.
- 100 transacciones.
- Token JWT mock.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración de TLS en backend

**Objetivo:** Validar que TLS 1.2+ está configurado correctamente.

#### Procedimiento
1. Generar certificado autofirmado.
2. Configurar Spring Boot con TLS en `application.yml`.
3. Arrancar el backend.
4. Consumir `https://localhost:8443/api/v1/fincas` con `curl -k` y verificar que responde.
5. Consumir `http://localhost:8080/api/v1/fincas` y verificar que redirige a HTTPS o rechaza.
6. Verificar que TLS 1.2+ está habilitado (usar `openssl s_client`).
7. Verificar headers de seguridad (HSTS, etc.).

#### Resultado esperado
- TLS 1.2+ está configurado.
- HTTPS responde correctamente.
- HTTP redirige o rechaza.
- Headers de seguridad presentes.
- No hay errores de configuración.

---

### 7.2 Prueba 2 — SecureStore para token JWT

**Objetivo:** Validar que SecureStore almacena y recupera el token de forma segura.

#### Procedimiento
1. Integrar SecureStore en el frontend.
2. Guardar un token JWT.
3. Recuperar el token y verificar que coincide.
4. Cerrar la app y reabrirla.
5. Verificar que el token persiste.
6. Eliminar el token y verificar que ya no está.
7. Verificar que SecureStore está disponible en los tres dispositivos.

#### Resultado esperado
- El token se almacena y recupera correctamente.
- Persiste tras cerrar y reabrir la app.
- Se elimina correctamente.
- SecureStore funciona en los tres dispositivos.

---

### 7.3 Prueba 3 — SQLCipher para base de datos local

**Objetivo:** Validar que SQLCipher cifra la base de datos SQLite.

#### Procedimiento
1. Integrar SQLCipher en React Native.
2. Generar clave maestra aleatoria y almacenarla en SecureStore.
3. Abrir la base de datos con SQLCipher usando la clave.
4. Insertar 20 fincas y 100 transacciones.
5. Cerrar la base y reabrirla con la misma clave.
6. Verificar que los datos se recuperan correctamente.
7. Intentar abrir la base sin la clave y verificar que falla.
8. Inspeccionar el archivo de base de datos con un editor hexadecimal y verificar que está cifrado.

#### Resultado esperado
- SQLCipher cifra la base correctamente.
- Los datos se recuperan con la clave.
- Sin la clave, la base no se puede abrir.
- El archivo está cifrado (no legible en hexadecimal).
- No hay corrupción de datos.

---

### 7.4 Prueba 4 — Overhead de SQLCipher

**Objetivo:** Medir el overhead de SQLCipher en lectura/escritura.

#### Procedimiento
1. Medir el tiempo de inserción de 100 transacciones sin cifrado.
2. Medir el tiempo de inserción de 100 transacciones con SQLCipher.
3. Medir el tiempo de consulta de 100 transacciones sin cifrado.
4. Medir el tiempo de consulta de 100 transacciones con SQLCipher.
5. Repetir 3 veces y promediar.
6. Repetir en los tres dispositivos.

#### Resultado esperado
- Overhead de escritura < 10 %.
- Overhead de lectura < 10 %.
- Los tiempos se mantienen dentro de los umbrales (≤ 2 s para 100 registros).
- SQLCipher no degrada la experiencia del usuario.

---

### 7.5 Prueba 5 — Persistencia y recuperación con SQLCipher

**Objetivo:** Validar que los datos persisten y se recuperan correctamente tras cerrar la app.

#### Procedimiento
1. Insertar 100 transacciones con SQLCipher.
2. Cerrar completamente la app.
3. Reabrir la app.
4. Verificar que los datos persisten.
5. Verificar que la clave se recupera de SecureStore.
6. Verificar que no hay corrupción.

#### Resultado esperado
- Los datos persisten.
- La clave se recupera correctamente.
- No hay corrupción.
- La app funciona sin intervención del usuario.

---

### 7.6 Prueba 6 — Pérdida de clave de cifrado

**Objetivo:** Validar el comportamiento si la clave de cifrado se pierde.

#### Procedimiento
1. Insertar 100 transacciones con SQLCipher.
2. Simular la pérdida de la clave (eliminarla de SecureStore).
3. Intentar abrir la base de datos.
4. Verificar que falla correctamente.
5. Verificar que la app muestra un mensaje claro al usuario.
6. Verificar que la app no se bloquea.

#### Resultado esperado
- La base no se puede abrir sin la clave.
- La app muestra un mensaje claro ("No se pudo acceder a los datos locales").
- La app no se bloquea.
- El usuario puede reiniciar la app (perdiendo datos locales, pero sin crash).

---

### 7.7 Prueba 7 — Tamaño del APK con SQLCipher

**Objetivo:** Medir el impacto de SQLCipher en el tamaño del APK.

#### Procedimiento
1. Generar APK sin SQLCipher.
2. Medir el tamaño.
3. Generar APK con SQLCipher.
4. Medir el tamaño.
5. Comparar.

#### Resultado esperado
- El incremento de tamaño es < 5 MB.
- El APK sigue siendo viable para dispositivos con almacenamiento limitado.

---

### 7.8 Prueba 8 — Cumplimiento de Ley 1581 de 2012

**Objetivo:** Validar que la app cumple con los requisitos de Habeas Data.

#### Procedimiento
1. Verificar que la app solicita consentimiento explícito al usuario.
2. Verificar que muestra la política de privacidad.
3. Verificar que los datos se almacenan cifrados.
4. Verificar que las comunicaciones son cifradas.
5. Documentar el cumplimiento.

#### Resultado esperado
- La app solicita consentimiento explícito.
- Muestra política de privacidad.
- Los datos están cifrados en tránsito y en reposo.
- Se cumple con la Ley 1581 de 2012.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **TLS**: TLS 1.2+ configurado, HTTPS responde, HTTP redirige o rechaza.
2. **SecureStore**: El token se almacena y recupera correctamente en los tres dispositivos.
3. **SQLCipher**: La base de datos se cifra correctamente; sin la clave no se puede abrir.
4. **Overhead**: El overhead de SQLCipher es < 10 % en lectura/escritura.
5. **Persistencia**: Los datos persisten tras cerrar y reabrir la app.
6. **Pérdida de clave**: La app maneja correctamente la pérdida de clave sin bloquearse.
7. **Tamaño del APK**: El incremento es < 5 MB.
8. **Cumplimiento**: La app cumple con los requisitos de la Ley 1581 de 2012.

El Spike se considerará **RECHAZADO** si:

- TLS no está configurado correctamente.
- SecureStore no funciona en algún dispositivo.
- SQLCipher no cifra la base o los datos no se recuperan.
- El overhead de SQLCipher supera el 10 %.
- Los datos no persisten tras cerrar la app.
- La app se bloquea al perder la clave.
- El APK supera los 5 MB adicionales.
- No se cumple con la Ley 1581 de 2012.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **TLS**: Certificado autofirmado con `keytool`.
- **Frontend**: React Native + TypeScript.
- **SecureStore**: `react-native-secure-storage`.
- **SQLCipher**: `@op-engineering/op-sqlite` con SQLCipher (ADR-017).
- **HTTP**: Axios con HTTPS.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: `console.time`, `openssl s_client`, inspección hexadecimal.
- **Datos de prueba**: 20 fincas, 100 transacciones.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: SQLCipher puede no ser compatible con React Native.
  - **Mitigación**: Probar con `@op-engineering/op-sqlite`. Si falla, evaluar `react-native-sqlcipher-storage` y registrar el cambio en ADR-017.

- **Riesgo**: El overhead de SQLCipher puede ser mayor al esperado en gama baja.
  - **Mitigación**: Medir en los tres dispositivos. Si supera el 10 %, optimizar consultas o considerar cifrado a nivel de campos.

- **Riesgo**: La clave de SQLCipher puede perderse si SecureStore falla.
  - **Mitigación**: Documentar el comportamiento. En producción, considerar respaldo de la clave (con cuidado).

- **Riesgo**: TLS con certificado autofirmado puede causar problemas con Axios.
  - **Mitigación**: Configurar Axios para aceptar el certificado en desarrollo. En producción, usar certificado real.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 8 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6, 7 y 8 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Backend Spring Boot con TLS configurado.
   - Frontend React Native con SecureStore y SQLCipher.
   - Script de generación de certificado autofirmado.
   - Pruebas de persistencia y pérdida de clave.
2. **Reporte de métricas**:
   - Overhead de SQLCipher en los tres dispositivos.
   - Tiempo de configuración de TLS.
   - Tamaño del APK con y sin SQLCipher.
   - Resultados de las pruebas de seguridad.
3. **Evidencia**:
   - Capturas de `openssl s_client` mostrando TLS 1.2+.
   - Capturas de la base de datos cifrada (hexadecimal).
   - Capturas de SecureStore almacenando el token.
   - Capturas de la app manejando la pérdida de clave.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿TLS 1.2+ se configuró correctamente?
  - ✅ / ❌ ¿SecureStore almacenó y recuperó el token?
  - ✅ / ❌ ¿SQLCipher cifró la base correctamente?
  - ✅ / ❌ ¿El overhead de SQLCipher fue < 10 %?
  - ✅ / ❌ ¿Los datos persistieron tras cerrar la app?
  - ✅ / ❌ ¿La app manejó la pérdida de clave sin bloquearse?
  - ✅ / ❌ ¿El APK incrementó < 5 MB?
  - ✅ / ❌ ¿Se cumplió con la Ley 1581 de 2012?

- **Lecciones aprendidas**:
  - (Ejemplo: "SQLCipher añade un overhead aceptable en gama baja.")
  - (Ejemplo: "La clave de SQLCipher debe almacenarse en SecureStore, nunca en el código.")
  - (Ejemplo: "TLS con certificado autofirmado requiere configuración adicional en Axios.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Configurar TLS desde el día 1.")
  - (Ejemplo: "Nunca almacenar tokens en AsyncStorage.")
  - (Ejemplo: "Usar SQLCipher desde el inicio; migrar después es costoso.")
  - (Ejemplo: "Gestionar la clave de SQLCipher en SecureStore.")
  - (Ejemplo: "Considerar certificate pinning si el presupuesto lo permite.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)