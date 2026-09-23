# SPIKE-030: Validar gestión de secretos con GitHub Secrets y variables de entorno

## Información general

- **ID:** SPIKE-030
- **Nombre:** Validar gestión de secretos con GitHub Secrets y variables de entorno del servidor
- **ADR relacionado:** ADR-030 — Gestionar secretos de forma segura en backend y CI/CD
- **ADR complementarios:** ADR-011 (Bloquear acceso no autenticado con middleware), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-021 (Implementar monitoreo y observabilidad en backend y frontend), ADR-025 (Automatizar integración continua y despliegue con GitHub Actions), ADR-027 (Proteger el backend con WAF y defensas perimetrales), ADR-028 (Implementar notificaciones locales y push para eventos clave)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 2 días hábiles 
## 1. Objetivo

Validar técnicamente que GitHub Secrets y las variables de entorno del servidor permiten gestionar los secretos del backend y del pipeline de CI/CD de forma segura, sin exponerlos en el código, en los logs ni en archivos versionados, cumpliendo con los escenarios ESC-CAL-SEG-01 y ESC-CAL-ESC-01.

El Spike busca comprobar que la estrategia de gestión de secretos seleccionada en ADR-030 es viable antes de implementarla en la primera versión de AgroTrack.

## 2. Problema que se busca validar

AgroTrack necesita gestionar secretos (contraseñas, claves, tokens) de forma segura, pero existen riesgos de que:

- Los secretos estén hardcodeados en el código.
- Los archivos `.env` se suban al repositorio.
- Los secretos se impriman en los logs del pipeline.
- La rotación de un secreto afecte el servicio.
- Los secretos de dev, staging y prod estén mezclados.
- El backend no lea correctamente las variables de entorno.
- Un desarrollador sin permisos pueda ver los secretos.
- No haya trazabilidad de cambios en los secretos.
- No haya procedimiento de recuperación ante fuga.

Por esta razón, se necesita un prototipo que configure GitHub Secrets, inyecte variables de entorno en el backend, y valide su comportamiento en condiciones reales.

## 3. Pregunta principal del Spike

¿GitHub Secrets y las variables de entorno del servidor permiten gestionar los secretos del backend y del pipeline de CI/CD de forma segura, sin exponerlos en el código, en los logs ni en archivos versionados, con trazabilidad de cambios y procedimiento de rotación?

## 4. Hipótesis

Si configuramos:

- **GitHub Secrets**:
  - Secretos cifrados en la configuración del repositorio.
  - Environments para separar dev, staging y prod.
  - Referencias en los workflows con `${{ secrets.NOMBRE }}`.
  - Enmascaramiento automático en logs.
- **Variables de entorno del servidor**:
  - Archivo `.env` no versionado en el servidor.
  - Inclusión en `.gitignore`.
  - Spring Boot lee las variables de entorno.
- **Procedimiento de rotación**:
  - Documentado por secreto.
  - Rotación periódica.
  - Rotación inmediata ante sospecha.

Entonces:

- Los secretos no estarán en el código.
- Los secretos no estarán en archivos versionados.
- Los secretos se enmascararán en los logs del pipeline.
- El backend leerá correctamente las variables de entorno.
- La rotación de un secreto no afectará el servicio.
- Habrá trazabilidad de cambios.
- Habrá procedimiento de recuperación ante fuga.
- Solo los administradores podrán ver los secretos.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Configuración de GitHub Secrets**:
  - Crear secretos en la configuración del repositorio.
  - Configurar environments para dev, staging y prod.
  - Referenciar los secretos en los workflows.
  - Verificar el enmascaramiento en los logs.
- **Configuración de variables de entorno del servidor**:
  - Crear archivo `.env` no versionado en el servidor.
  - Incluirlo en `.gitignore`.
  - Configurar Spring Boot para leer las variables.
  - Verificar que el backend arranca correctamente.
- **Secretos a gestionar**:
  - `DB_PASSWORD`: contraseña de PostgreSQL.
  - `JWT_SECRET`: clave para firmar tokens JWT.
  - `JWT_REFRESH_SECRET`: clave para refresh tokens.
  - `FIREBASE_SERVER_KEY`: clave del servidor de FCM.
  - `CLOUDFLARE_API_TOKEN`: token de API de Cloudflare.
- **Procedimiento de rotación**:
  - Documentar el procedimiento por secreto.
  - Probar la rotación de al menos un secreto.
- **Pruebas**:
  - Verificar que no hay secretos en el código.
  - Verificar que no hay secretos en archivos versionados.
  - Verificar el enmascaramiento en logs.
  - Verificar que el backend lee las variables de entorno.
  - Verificar la rotación.
  - Verificar la trazabilidad.
- **Métricas**:
  - Número de secretos gestionados.
  - Tiempo de rotación.
  - Incidentes de fuga (debe ser 0).

### 5.2 No incluye

El Spike no implementará:

- Key Vault gestionado (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).
- Rotación automática.
- Auditoría avanzada.
- Cifrado de secretos en reposo más allá de lo que ofrece GitHub.
- Integración con múltiples proveedores de secretos.
- Pruebas de penetración.
- Publicación en producción.

## 6. Caso de prueba principal

**Secretos a gestionar:**

| Secreto | Uso | Entorno |
|---------|-----|---------|
| `DB_PASSWORD` | Contraseña de PostgreSQL | Todos |
| `JWT_SECRET` | Firma de access tokens | Todos |
| `JWT_REFRESH_SECRET` | Firma de refresh tokens | Todos |
| `FIREBASE_SERVER_KEY` | Envío de notificaciones push | Todos |
| `CLOUDFLARE_API_TOKEN` | Invalidación de caché | Staging, Prod |

**Environments de GitHub a configurar:**

| Environment | Uso |
|-------------|-----|
| `development` | Desarrollo local y PRs |
| `staging` | Despliegue a staging |
| `production` | Despliegue a producción (futuro) |

**Archivos involucrados:**

- `.gitignore`: debe incluir `.env`, `*.env`, `secrets/`.
- `.env.example`: plantilla con nombres de variables, sin valores reales.
- `.env`: archivo local no versionado con valores reales.
- `application.yml`: referencia variables de entorno con `${DB_PASSWORD}`.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración de GitHub Secrets

**Objetivo:** Validar que GitHub Secrets se configuran correctamente.

#### Procedimiento
1. Acceder a la configuración del repositorio en GitHub.
2. Crear los secretos en `Settings > Secrets and variables > Actions`.
3. Configurar environments `development`, `staging` y `production`.
4. Asignar secretos a cada environment.
5. Verificar que los secretos están cifrados.
6. Verificar que solo los administradores pueden ver/gestionar los secretos.

#### Resultado esperado
- Los secretos se crean correctamente.
- Los environments se configuran.
- Los secretos están cifrados.
- Solo administradores pueden gestionarlos.

---

### 7.2 Prueba 2 — Referencia de secretos en workflows

**Objetivo:** Validar que los workflows referencian los secretos correctamente.

#### Procedimiento
1. Configurar un workflow que use `${{ secrets.DB_PASSWORD }}`.
2. Ejecutar el workflow.
3. Verificar que el secreto se lee correctamente.
4. Verificar que el secreto no aparece en los logs.
5. Verificar que el enmascaramiento funciona (aparece `***`).

#### Resultado esperado
- El workflow lee el secreto.
- El secreto no aparece en los logs.
- El enmascaramiento funciona.
- No hay errores de configuración.

---

### 7.3 Prueba 3 — Variables de entorno del servidor

**Objetivo:** Validar que el backend lee las variables de entorno correctamente.

#### Procedimiento
1. Crear archivo `.env` en el servidor con los secretos.
2. Incluir `.env` en `.gitignore`.
3. Configurar Spring Boot para leer `${DB_PASSWORD}` en `application.yml`.
4. Arrancar el backend.
5. Verificar que el backend se conecta a PostgreSQL correctamente.
6. Verificar que el backend firma JWTs correctamente.
7. Verificar que el backend no expone los secretos en logs.

#### Resultado esperado
- El backend arranca correctamente.
- Se conecta a PostgreSQL.
- Firma JWTs correctamente.
- No expone secretos en logs.

---

### 7.4 Prueba 4 — Verificación de que no hay secretos en el código

**Objetivo:** Validar que no hay secretos en el código ni en archivos versionados.

#### Procedimiento
1. Buscar en el repositorio por patrones comunes de secretos:
   - `password=`
   - `secret=`
   - `api_key=`
   - `token=`
   - Cadenas largas aleatorias.
2. Verificar que `.env` está en `.gitignore`.
3. Verificar que no hay archivos `.env` versionados.
4. Verificar que `.env.example` no contiene valores reales.
5. Ejecutar una herramienta de escaneo (ej. `git-secrets`, `trufflehog`).

#### Resultado esperado
- No hay secretos en el código.
- No hay archivos `.env` versionados.
- `.env.example` no contiene valores reales.
- El escaneo no encuentra secretos.

---

### 7.5 Prueba 5 — Rotación de secretos

**Objetivo:** Validar que la rotación de un secreto no afecta el servicio.

#### Procedimiento
1. Documentar el procedimiento de rotación para `JWT_SECRET`.
2. Generar un nuevo valor para `JWT_SECRET`.
3. Actualizar el secreto en GitHub Secrets.
4. Actualizar la variable de entorno en el servidor.
5. Reiniciar el backend.
6. Verificar que el backend sigue funcionando.
7. Verificar que los tokens antiguos siguen siendo válidos (hasta expirar).
8. Verificar que los tokens nuevos se firman con el nuevo secreto.

#### Resultado esperado
- El procedimiento de rotación funciona.
- El servicio sigue funcionando.
- Los tokens antiguos expiran correctamente.
- Los tokens nuevos se firman con el nuevo secreto.

---

### 7.6 Prueba 6 — Trazabilidad de cambios

**Objetivo:** Validar que hay trazabilidad de cambios en los secretos.

#### Procedimiento
1. Cambiar un secreto en GitHub Secrets.
2. Verificar que GitHub registra el cambio (quién y cuándo).
3. Verificar el historial de cambios en el repositorio.
4. Documentar el procedimiento de auditoría.

#### Resultado esperado
- GitHub registra los cambios en secretos.
- Hay historial de quién y cuándo.
- El procedimiento de auditoría está documentado.

---

### 7.7 Prueba 7 — Recuperación ante fuga

**Objetivo:** Validar el procedimiento de recuperación ante fuga de un secreto.

#### Procedimiento
1. Simular la fuga de `DB_PASSWORD`.
2. Ejecutar el procedimiento de recuperación:
   - Rotar la contraseña en PostgreSQL.
   - Actualizar el secreto en GitHub Secrets.
   - Actualizar la variable de entorno en el servidor.
   - Reiniciar el backend.
3. Verificar que el servicio sigue funcionando.
4. Documentar el incidente.

#### Resultado esperado
- El procedimiento de recuperación funciona.
- El servicio sigue funcionando.
- El incidente se documenta.
- No hay pérdida de datos.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **GitHub Secrets**: Los secretos se configuran correctamente.
2. **Workflows**: Los workflows referencian los secretos sin exponerlos.
3. **Enmascaramiento**: Los secretos se enmascaran en los logs.
4. **Variables de entorno**: El backend lee las variables correctamente.
5. **Sin secretos en código**: No hay secretos en el código ni en archivos versionados.
6. **Rotación**: La rotación de un secreto no afecta el servicio.
7. **Trazabilidad**: Hay registro de cambios en secretos.
8. **Recuperación**: El procedimiento de recuperación ante fuga funciona.

El Spike se considerará **RECHAZADO** si:

- Los secretos se exponen en los logs.
- Hay secretos en el código o en archivos versionados.
- El backend no lee las variables de entorno.
- La rotación afecta el servicio.
- No hay trazabilidad de cambios.
- El procedimiento de recuperación no funciona.

## 9. Entorno técnico del spike

- **Repositorio**: GitHub.
- **CI/CD**: GitHub Actions (ADR-025).
- **GitHub Secrets**: para el pipeline.
- **Variables de entorno**: para el backend en producción.
- **Backend**: Spring Boot 3 + Java 17.
- **Base de datos**: PostgreSQL 15+.
- **Herramientas de escaneo**: `git-secrets`, `trufflehog`.
- **Dispositivos**: no aplica (pruebas de backend y CI/CD).

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Los secretos pueden quedar expuestos en los logs si no se configuran bien.
  - **Mitigación**: Verificar el enmascaramiento de GitHub Actions. No imprimir secretos explícitamente.

- **Riesgo**: Un desarrollador puede commitear un archivo `.env` por error.
  - **Mitigación**: Incluir `.env` en `.gitignore`. Usar `git-secrets` para prevenir commits con secretos.

- **Riesgo**: La rotación de un secreto puede afectar el servicio si no se coordina.
  - **Mitigación**: Documentar el procedimiento. Probar la rotación en staging antes de prod.

- **Riesgo**: El backend puede no leer las variables de entorno correctamente.
  - **Mitigación**: Probar con Spring Boot Test. Verificar que las variables están disponibles.

- **Riesgo**: El timebox de 2 días puede ser insuficiente para las 7 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6 y 7 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio configurado** con:
   - Secretos en GitHub Secrets.
   - Environments configurados.
   - `.gitignore` con `.env`.
   - `.env.example` sin valores reales.
   - `application.yml` con referencias a variables de entorno.
2. **Reporte de métricas**:
   - Número de secretos gestionados.
   - Resultados del escaneo de secretos.
   - Resultados de la rotación.
   - Resultados del enmascaramiento en logs.
3. **Evidencia**:
   - Capturas de GitHub Secrets.
   - Capturas de los workflows con secretos enmascarados.
   - Capturas del backend leyendo variables de entorno.
   - Capturas del escaneo de secretos.
   - Capturas del procedimiento de rotación.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Los secretos se configuraron correctamente en GitHub Secrets?
  - ✅ / ❌ ¿Los workflows referenciaron los secretos sin exponerlos?
  - ✅ / ❌ ¿Los secretos se enmascararon en los logs?
  - ✅ / ❌ ¿El backend leyó las variables de entorno?
  - ✅ / ❌ ¿No hubo secretos en el código ni en archivos versionados?
  - ✅ / ❌ ¿La rotación de un secreto no afectó el servicio?
  - ✅ / ❌ ¿Hubo trazabilidad de cambios en secretos?
  - ✅ / ❌ ¿El procedimiento de recuperación ante fuga funcionó?

- **Lecciones aprendidas**:
  - (Ejemplo: "GitHub Actions enmascara automáticamente los secretos en los logs.")
  - (Ejemplo: "Incluir `.env` en `.gitignore` desde el día 1 previene fugas accidentales.")
  - (Ejemplo: "Documentar el procedimiento de rotación facilita la respuesta ante incidentes.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Nunca hardcodear secretos.")
  - (Ejemplo: "Configurar GitHub Secrets desde el día 1.")
  - (Ejemplo: "Separar secretos por entorno (dev, staging, prod).")
  - (Ejemplo: "Documentar el procedimiento de rotación.")
  - (Ejemplo: "Nunca imprimir secretos en logs.")
  - (Ejemplo: "Migrar a un Key Vault si el proyecto crece mucho.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)