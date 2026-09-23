# SPIKE-027: Validar protección perimetral con Cloudflare plan gratuito

## Información general

- **ID:** SPIKE-027
- **Nombre:** Validar protección perimetral con Cloudflare plan gratuito y Spring Security
- **ADR relacionado:** ADR-027 — Proteger el backend con WAF y defensas perimetrales
- **ADR complementarios:** ADR-011 (Bloquear acceso no autenticado con middleware), ADR-015 (Usar REST como estilo de comunicación), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-024 (Estandarizar manejo de errores y recuperación en backend y frontend), ADR-025 (Automatizar integración continua y despliegue con GitHub Actions)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 2 días hábiles

## 1. Objetivo

Validar técnicamente que Cloudflare en su plan gratuito protege el backend de AgroTrack contra ataques comunes (SQL injection, XSS, DDoS básico, bots maliciosos), gestiona TLS automáticamente, aplica rate limiting y no degrada el rendimiento, cumpliendo con los escenarios ESC-CAL-SEG-01, ESC-CAL-ESC-01 y ESC-CAL-RN-02.

El Spike busca comprobar que la estrategia de protección perimetral seleccionada en ADR-027 es viable antes de implementarla en la primera versión de AgroTrack.

## 2. Problema que se busca validar

AgroTrack necesita proteger su backend expuesto a Internet, pero existen riesgos de que:

- Un ataque DDoS sature el backend y deje la app inutilizable.
- Un ataque de SQL injection o XSS comprometa los datos.
- La IP del backend quede expuesta.
- El TLS no esté configurado correctamente.
- El rate limiting no funcione.
- Cloudflare degrade el rendimiento del backend.
- La integración con Spring Boot cause problemas de CORS o headers.
- La configuración de Cloudflare sea compleja.
- El plan gratuito no sea suficiente para el volumen de AgroTrack.

Por esta razón, se necesita un prototipo que configure Cloudflare, exponga el backend a través de él, simule ataques y valide su comportamiento.

## 3. Pregunta principal del Spike

¿Cloudflare plan gratuito protege el backend contra ataques comunes (SQL injection, XSS, DDoS básico, bots), gestiona TLS automáticamente, aplica rate limiting, oculta la IP del backend y no degrada el rendimiento, integrándose sin problemas con Spring Boot y el pipeline de CI/CD?

## 4. Hipótesis

Si configuramos:

- **Cloudflare**:
  - DNS con proxy habilitado.
  - TLS estricto (Full Strict).
  - WAF con reglas gestionadas (OWASP Top 10).
  - Rate limiting básico.
  - Mitigación DDoS.
  - Protección contra bots.
- **Backend (Spring Boot)**:
  - Spring Security con JWT.
  - CORS restrictivo.
  - Headers de seguridad.
  - Validación de entradas.

Entonces:

- Cloudflare bloqueará ataques de SQL injection y XSS.
- Cloudflare mitigará ataques DDoS básicos.
- El TLS funcionará automáticamente.
- El rate limiting limitará solicitudes abusivas.
- La IP del backend quedará oculta.
- El rendimiento no se degradará significativamente (< 10 %).
- La integración con Spring Boot funcionará sin problemas.
- La configuración será sencilla y sin costo.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Configuración de Cloudflare**:
  - Registro del dominio en Cloudflare.
  - Configuración de DNS con proxy habilitado.
  - Configuración de TLS estricto (Full Strict).
  - Habilitación de WAF con reglas gestionadas.
  - Configuración de rate limiting básico.
  - Habilitación de mitigación DDoS.
  - Habilitación de protección contra bots.
- **Backend (Spring Boot)**:
  - Configuración de Spring Security con JWT.
  - Configuración de CORS restrictivo.
  - Configuración de headers de seguridad.
  - Validación de entradas.
- **Simulación de ataques**:
  - SQL injection.
  - XSS.
  - DDoS básico (con herramienta como `hey` o `ab`).
  - Bots maliciosos.
- **Medición de rendimiento**:
  - Tiempo de respuesta con y sin Cloudflare.
  - Latencia desde diferentes ubicaciones.
- **Verificación de IP**:
  - Confirmar que la IP del backend no es visible.
- **Integración con CI/CD**:
  - Configurar invalidación de caché de Cloudflare tras despliegues.
- **Monitoreo**:
  - Configurar alertas de ataques DDoS o picos anómalos.

### 5.2 No incluye

El Spike no implementará:

- Planes de pago de Cloudflare (solo el plan gratuito).
- Reglas WAF personalizadas avanzadas.
- Cloudflare Workers.
- Integración con Cloudflare Access (autenticación).
- WAFs alternativos (AWS, Azure, ModSecurity).
- Pruebas de penetración completas.
- Pruebas en más de un dominio.
- Publicación en producción.
- Configuración de alta disponibilidad.

## 6. Caso de prueba principal

**Configuración de Cloudflare:**

| Configuración | Valor |
|---------------|-------|
| Proxy | Habilitado (naranja) |
| TLS | Full Strict |
| WAF | Reglas gestionadas OWASP Top 10 |
| Rate limiting | 100 solicitudes/minuto por IP |
| DDoS | Automático |
| Bots | Protección básica |

**Ataques a simular:**

| Ataque | Herramienta | Objetivo |
|--------|-------------|----------|
| SQL Injection | `sqlmap` o manual | `GET /api/v1/transactions?id=1' OR '1'='1` |
| XSS | Manual | `POST /api/v1/transactions` con `<script>alert(1)</script>` |
| DDoS básico | `hey` o `ab` | 10,000 solicitudes en 10 segundos |
| Bots maliciosos | `curl` con User-Agent falso | Múltiples solicitudes con UA sospechoso |

**Dispositivos/entornos de prueba:**

- Backend en un servidor (VPS o local con túnel).
- Cloudflare configurado sobre el dominio.
- Cliente móvil (React Native) consumiendo el backend a través de Cloudflare.

**Datos de prueba:**

- 20 fincas.
- 100 transacciones.
- Usuario mock autenticado.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración de Cloudflare y DNS

**Objetivo:** Validar que Cloudflare está configurado correctamente.

#### Procedimiento
1. Registrar el dominio en Cloudflare.
2. Configurar DNS con proxy habilitado (naranja).
3. Verificar que el dominio resuelve a Cloudflare.
4. Verificar que la IP del backend no es visible (`dig` o `nslookup`).
5. Verificar que TLS estricto está habilitado.
6. Verificar que el certificado SSL es válido.

#### Resultado esperado
- El dominio resuelve a Cloudflare.
- La IP del backend no es visible.
- TLS estricto funciona.
- El certificado SSL es válido.
- No hay errores de configuración.

---

### 7.2 Prueba 2 — Protección contra SQL Injection

**Objetivo:** Validar que Cloudflare bloquea intentos de SQL injection.

#### Procedimiento
1. Enviar una solicitud con payload de SQL injection:
   - `GET /api/v1/transactions?id=1' OR '1'='1`
2. Observar la respuesta de Cloudflare.
3. Verificar que la solicitud es bloqueada antes de llegar al backend.
4. Repetir con diferentes payloads (`UNION SELECT`, `DROP TABLE`, etc.).
5. Verificar que no hay impacto en el backend.

#### Resultado esperado
- Cloudflare bloquea los intentos de SQL injection.
- El backend no recibe la solicitud maliciosa.
- Se registra el intento en el panel de Cloudflare.
- No hay impacto en el rendimiento del backend.

---

### 7.3 Prueba 3 — Protección contra XSS

**Objetivo:** Validar que Cloudflare bloquea intentos de XSS.

#### Procedimiento
1. Enviar una solicitud con payload de XSS:
   - `POST /api/v1/transactions` con `<script>alert(1)</script>` en el body.
2. Observar la respuesta de Cloudflare.
3. Verificar que la solicitud es bloqueada o sanitizada.
4. Repetir con diferentes payloads (`<img src=x onerror=alert(1)>`, etc.).

#### Resultado esperado
- Cloudflare bloquea o sanitiza los intentos de XSS.
- El backend no recibe el payload malicioso.
- Se registra el intento en el panel de Cloudflare.

---

### 7.4 Prueba 4 — Mitigación DDoS básico

**Objetivo:** Validar que Cloudflare mitiga ataques DDoS básicos.

#### Procedimiento
1. Ejecutar `hey` o `ab` con 10,000 solicitudes en 10 segundos.
2. Observar el comportamiento de Cloudflare.
3. Verificar que Cloudflare mitiga el ataque.
4. Verificar que el backend sigue respondiendo a solicitudes legítimas.
5. Medir el tiempo de respuesta durante el ataque.

#### Resultado esperado
- Cloudflare mitiga el ataque DDoS.
- El backend sigue respondiendo a solicitudes legítimas.
- El tiempo de respuesta no se degrada significativamente.
- Se registra el ataque en el panel de Cloudflare.

---

### 7.5 Prueba 5 — Rate limiting

**Objetivo:** Validar que Cloudflare aplica rate limiting.

#### Procedimiento
1. Configurar rate limiting: 100 solicitudes/minuto por IP.
2. Enviar 150 solicitudes en 1 minuto desde la misma IP.
3. Observar el comportamiento de Cloudflare.
4. Verificar que las solicitudes 101 en adelante son bloqueadas.
5. Verificar que las solicitudes legítimas no se ven afectadas.

#### Resultado esperado
- Cloudflare bloquea las solicitudes que exceden el límite.
- Las solicitudes legítimas no se ven afectadas.
- Se registra el abuso en el panel de Cloudflare.

---

### 7.6 Prueba 6 — Rendimiento con y sin Cloudflare

**Objetivo:** Medir el impacto de Cloudflare en el rendimiento.

#### Procedimiento
1. Medir el tiempo de respuesta de `GET /api/v1/farms` sin Cloudflare.
2. Medir el tiempo de respuesta con Cloudflare.
3. Repetir 10 veces y promediar.
4. Medir la latencia desde diferentes ubicaciones (si es posible).
5. Verificar que la CDN mejora la latencia para usuarios rurales.

#### Resultado esperado
- El rendimiento no se degrada más del 10 % con Cloudflare.
- La CDN mejora la latencia para usuarios rurales.
- No hay errores de conexión.
- El tiempo de respuesta es consistente.

---

### 7.7 Prueba 7 — Integración con Spring Security

**Objetivo:** Validar que Cloudflare no interfiere con la autenticación JWT.

#### Procedimiento
1. Iniciar sesión y obtener un token JWT.
2. Consumir un endpoint protegido con el token a través de Cloudflare.
3. Verificar que la autenticación funciona correctamente.
4. Verificar que los headers de seguridad se preservan.
5. Verificar que CORS funciona correctamente.
6. Verificar que los errores 401/403 se manejan correctamente.

#### Resultado esperado
- La autenticación JWT funciona a través de Cloudflare.
- Los headers de seguridad se preservan.
- CORS funciona correctamente.
- Los errores 401/403 se manejan correctamente.
- No hay errores de integración.

---

### 7.8 Prueba 8 — Integración con CI/CD

**Objetivo:** Validar que Cloudflare se integra con el pipeline de CI/CD.

#### Procedimiento
1. Configurar el pipeline de GitHub Actions (ADR-025) para invalidar la caché de Cloudflare tras despliegues.
2. Hacer merge a `main`.
3. Verificar que el pipeline invalida la caché.
4. Verificar que el backend desplegado es accesible a través de Cloudflare.
5. Verificar que no hay errores de autenticación con la API de Cloudflare.

#### Resultado esperado
- El pipeline invalida la caché de Cloudflare.
- El backend desplegado es accesible a través de Cloudflare.
- No hay errores de autenticación.
- La integración es automática.

---

### 7.9 Prueba 9 — Monitoreo y alertas

**Objetivo:** Validar que el panel de Cloudflare muestra métricas y que las alertas funcionan.

#### Procedimiento
1. Acceder al panel de Cloudflare.
2. Verificar que se muestran las métricas de tráfico.
3. Verificar que se muestran los ataques bloqueados.
4. Configurar una alerta para picos de tráfico anómalos.
5. Simular un ataque DDoS y verificar que la alerta se dispara.

#### Resultado esperado
- El panel de Cloudflare muestra métricas.
- Los ataques bloqueados se registran.
- La alerta se dispara ante un ataque.
- No hay errores de configuración.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **DNS y TLS**: Cloudflare resuelve el dominio y TLS estricto funciona.
2. **SQL Injection**: Cloudflare bloquea los intentos.
3. **XSS**: Cloudflare bloquea o sanitiza los intentos.
4. **DDoS básico**: Cloudflare mitiga el ataque sin degradar el servicio.
5. **Rate limiting**: Cloudflare bloquea solicitudes abusivas.
6. **Rendimiento**: El rendimiento no se degrada más del 10 %.
7. **Integración con Spring Security**: JWT, CORS y headers funcionan.
8. **Integración con CI/CD**: El pipeline invalida la caché automáticamente.
9. **Monitoreo**: El panel de Cloudflare muestra métricas y alertas.

El Spike se considerará **RECHAZADO** si:

- El DNS o TLS no funciona.
- Cloudflare no bloquea SQL injection o XSS.
- Cloudflare no mitiga DDoS básico.
- El rate limiting no funciona.
- El rendimiento se degrada más del 10 %.
- Hay errores de integración con Spring Security.
- El pipeline de CI/CD no puede invalidar la caché.
- El panel de Cloudflare no muestra métricas.

## 9. Entorno técnico del spike

- **Cloudflare**: plan gratuito.
- **Dominio**: registrado y configurado en Cloudflare.
- **Backend**: Spring Boot 3 + Java 17.
- **Seguridad backend**: Spring Security + JWT (ADR-011).
- **Frontend**: React Native + TypeScript (para pruebas de integración).
- **CI/CD**: GitHub Actions (ADR-025).
- **Herramientas de ataque**: `sqlmap`, `hey`, `ab`, `curl`.
- **Medición**: panel de Cloudflare, `curl -w`, Postman.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Cloudflare puede no bloquear todos los payloads de SQL injection o XSS.
  - **Mitigación**: Complementar con validación de entradas en Spring Boot. Documentar los payloads que pasan.

- **Riesgo**: El rate limiting del plan gratuito puede ser insuficiente.
  - **Mitigación**: Configurar límites razonables. Monitorear el uso. Evaluar plan de pago si es necesario.

- **Riesgo**: Cloudflare puede interferir con CORS o headers.
  - **Mitigación**: Configurar CORS y headers correctamente en Spring Boot. Probar con el frontend.

- **Riesgo**: El rendimiento puede degradarse por la CDN.
  - **Mitigación**: Medir con y sin Cloudflare. Ajustar configuración si es necesario.

- **Riesgo**: El pipeline de CI/CD puede no autenticarse con la API de Cloudflare.
  - **Mitigación**: Configurar el API Token de Cloudflare en GitHub Secrets.

- **Riesgo**: El timebox de 2 días puede ser insuficiente para las 9 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6, 7, 8 y 9 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Configuración de Cloudflare**:
   - Dominio registrado.
   - DNS con proxy habilitado.
   - TLS estricto.
   - WAF con reglas gestionadas.
   - Rate limiting.
   - Mitigación DDoS.
   - Protección contra bots.
2. **Backend configurado**:
   - Spring Security con JWT.
   - CORS restrictivo.
   - Headers de seguridad.
3. **Reporte de métricas**:
   - Ataques bloqueados por tipo.
   - Tiempo de respuesta con y sin Cloudflare.
   - Latencia desde diferentes ubicaciones.
   - Resultados del rate limiting.
4. **Evidencia**:
   - Capturas del panel de Cloudflare mostrando ataques bloqueados.
   - Capturas del DNS y TLS configurados.
   - Capturas de la IP del backend oculta.
   - Capturas de las métricas de rendimiento.
   - Capturas de las alertas configuradas.
5. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Cloudflare resolvió el dominio y TLS estricto funcionó?
  - ✅ / ❌ ¿Cloudflare bloqueó los intentos de SQL injection?
  - ✅ / ❌ ¿Cloudflare bloqueó o sanitizó los intentos de XSS?
  - ✅ / ❌ ¿Cloudflare mitigó el ataque DDoS básico?
  - ✅ / ❌ ¿El rate limiting funcionó?
  - ✅ / ❌ ¿El rendimiento no se degradó más del 10 %?
  - ✅ / ❌ ¿La integración con Spring Security funcionó?
  - ✅ / ❌ ¿El pipeline de CI/CD invalidó la caché?
  - ✅ / ❌ ¿El panel de Cloudflare mostró métricas y alertas?

- **Lecciones aprendidas**:
  - (Ejemplo: "Cloudflare plan gratuito bloquea la mayoría de payloads de SQL injection y XSS.")
  - (Ejemplo: "La CDN de Cloudflare mejora la latencia para usuarios rurales.")
  - (Ejemplo: "El rate limiting del plan gratuito es suficiente para el volumen de AgroTrack en piloto.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Configurar Cloudflare desde el día 1.")
  - (Ejemplo: "No exponer la IP del backend directamente.")
  - (Ejemplo: "Usar TLS estricto.")
  - (Ejemplo: "Configurar reglas WAF básicas.")
  - (Ejemplo: "Monitorear el panel de Cloudflare semanalmente.")
  - (Ejemplo: "Considerar un plan de pago si el tráfico crece mucho.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)