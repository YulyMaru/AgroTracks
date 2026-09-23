# SPIKE-025: Validar pipeline de CI/CD con GitHub Actions y Firebase App Distribution

## Información general

- **ID:** SPIKE-025
- **Nombre:** Validar pipeline de CI/CD con GitHub Actions y distribución de APK con Firebase App Distribution
- **ADR relacionado:** ADR-025 — Automatizar integración continua y despliegue con GitHub Actions
- **ADR complementarios:** ADR-012 (Validar app en dispositivos Android soportados), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil), ADR-020 (Definir la estrategia de pruebas en capas para backend y frontend), ADR-024 (Estandarizar manejo de errores y recuperación en backend y frontend)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles 

## 1. Objetivo

Validar técnicamente que GitHub Actions puede ejecutar un pipeline completo de CI/CD para AgroTrack que incluya linting, pruebas unitarias, pruebas de integración, cobertura, compilación de backend y frontend, distribución de APK con Firebase App Distribution y despliegue del backend a staging, en menos de 15 minutos y sin costo de licencias.

El Spike busca comprobar que la estrategia de CI/CD seleccionada en ADR-025 es viable antes de implementarla completamente en AgroTrack.

## 2. Problema que se busca validar

AgroTrack requiere automatización de builds y despliegues para no depender de procesos manuales. Existen riesgos de que:

- Los builds manuales sean lentos y propensos a errores.
- No haya validación automática en cada PR.
- Los bugs lleguen a producción sin detección temprana.
- Los APK no se distribuyan rápidamente a testers.
- El backend no se despliegue automáticamente.
- Los secretos se filtren por mal manejo.
- El pipeline sea demasiado lento y ralentice el desarrollo.
- La cobertura no se mida ni se bloquee merge si baja.
- No haya trazabilidad entre build y commit.
- El costo del CI sea alto.

Por esta razón, se necesita un prototipo que configure el pipeline completo, lo ejecute y mida su comportamiento.

## 3. Pregunta principal del Spike

¿GitHub Actions puede ejecutar un pipeline completo de CI/CD (linting, pruebas unitarias, integración, cobertura, compilación, distribución de APK con Firebase App Distribution y despliegue del backend a staging) en menos de 15 minutos, sin costo de licencias y con trazabilidad completa?

## 4. Hipótesis

Si configuramos:

- Workflow de GitHub Actions que se dispara en cada PR a `main`.
- Linting con ESLint (frontend) y Checkstyle (backend).
- Pruebas unitarias con Jest y JUnit.
- Pruebas de integración con Testcontainers y MockMvc.
- Cobertura con JaCoCo y Jest Coverage.
- Bloqueo de merge si las pruebas fallan o la cobertura baja del umbral.
- Compilación del JAR del backend y del APK del frontend.
- Distribución del APK con Firebase App Distribution.
- Despliegue del backend a staging.
- Gestión de secretos con GitHub Secrets.

Entonces:

- El pipeline se ejecutará en menos de 15 minutos.
- Las pruebas se ejecutarán automáticamente en cada PR.
- El merge se bloqueará si las pruebas fallan o la cobertura baja.
- Los APK se distribuirán a testers con Firebase App Distribution.
- El backend se desplegará a staging tras merge a `main`.
- Los secretos estarán seguros.
- Habrá trazabilidad completa entre build, commit y autor.
- No habrá costo de licencias.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Configuración del repositorio**:
  - Estructura de carpetas con backend y frontend.
  - Ramas `main`, `develop` y `feature/*`.
  - Convención de commits.
- **Workflow de PR**:
  - Disparador en PR a `main`.
  - Linting (ESLint, Checkstyle).
  - Pruebas unitarias (Jest, JUnit).
  - Pruebas de integración (Testcontainers, MockMvc).
  - Cobertura (JaCoCo, Jest Coverage).
  - Bloqueo de merge si falla.
- **Workflow de merge a `main`**:
  - Compilación del JAR del backend.
  - Compilación del APK del frontend.
  - Publicación de artefactos.
  - Despliegue del backend a staging.
  - Distribución del APK con Firebase App Distribution.
- **Gestión de secretos**:
  - GitHub Secrets para credenciales de Firebase, JWT, base de datos, etc.
- **Trazabilidad**:
  - Cada build asociado a commit, rama, autor.
- **Métricas**:
  - Tiempo del pipeline.
  - Tasa de éxito.
  - Cobertura.
  - Tiempo de distribución del APK.

### 5.2 No incluye

El Spike no implementará:

- Pipeline de release a producción (solo staging).
- Publicación en Google Play.
- Análisis de seguridad SAST.
- Notificaciones a Slack o email.
- Despliegue del backend en Kubernetes.
- Configuración de alta disponibilidad.
- Pruebas E2E completas en el pipeline (solo unitarias e integración).
- Pruebas en iOS.
- Monitorización post-despliegue.

## 6. Caso de prueba principal

**Estructura del repositorio:**

- `backend/` con Spring Boot y Maven.
- `frontend/` con React Native y TypeScript.
- `.github/workflows/` con los workflows.

**Workflows a configurar:**

1. **`pr.yml`**: se dispara en PR a `main`.
   - Linting backend y frontend.
   - Pruebas unitarias backend y frontend.
   - Pruebas de integración backend.
   - Cobertura.
   - Bloqueo de merge si falla.
2. **`main.yml`**: se dispara en merge a `main`.
   - Compilación del JAR del backend.
   - Compilación del APK del frontend.
   - Publicación de artefactos.
   - Despliegue del backend a staging.
   - Distribución del APK con Firebase App Distribution.

**Datos de prueba:**

- 20 fincas.
- 100 transacciones.
- 5 operaciones pendientes.

**Dispositivos de prueba para distribución:**

- Samsung Galaxy A12.
- Xiaomi Redmi Note 10.
- Samsung Galaxy S22.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración del repositorio y workflows

**Objetivo:** Validar que el repositorio está configurado y los workflows se crean correctamente.

#### Procedimiento
1. Crear la estructura de carpetas con backend y frontend.
2. Configurar las ramas `main`, `develop` y `feature/*`.
3. Crear el workflow `pr.yml`.
4. Crear el workflow `main.yml`.
5. Configurar los secretos en GitHub Secrets.
6. Hacer un PR de prueba y verificar que el workflow se dispara.

#### Resultado esperado
- Los workflows se crean correctamente.
- El PR dispara el workflow.
- Los secretos están disponibles.
- No hay errores de configuración.

---

### 7.2 Prueba 2 — Linting en el pipeline

**Objetivo:** Validar que el linting se ejecuta correctamente.

#### Procedimiento
1. Ejecutar ESLint en el frontend.
2. Ejecutar Checkstyle en el backend.
3. Verificar que los errores de linting bloquean el pipeline.
4. Corregir los errores y verificar que el pipeline pasa.

#### Resultado esperado
- El linting se ejecuta correctamente.
- Los errores bloquean el pipeline.
- Los cambios sin errores pasan.

---

### 7.3 Prueba 3 — Pruebas unitarias en el pipeline

**Objetivo:** Validar que las pruebas unitarias se ejecutan correctamente.

#### Procedimiento
1. Ejecutar las pruebas unitarias del backend (JUnit).
2. Ejecutar las pruebas unitarias del frontend (Jest).
3. Verificar que las pruebas fallidas bloquean el pipeline.
4. Verificar que las pruebas exitosas permiten continuar.

#### Resultado esperado
- Las pruebas unitarias se ejecutan correctamente.
- Las pruebas fallidas bloquean el pipeline.
- Las pruebas exitosas permiten continuar.

---

### 7.4 Prueba 4 — Pruebas de integración en el pipeline

**Objetivo:** Validar que las pruebas de integración se ejecutan correctamente con Testcontainers.

#### Procedimiento
1. Configurar Testcontainers en el pipeline.
2. Ejecutar las pruebas de integración del backend.
3. Verificar que las pruebas fallidas bloquean el pipeline.
4. Medir el tiempo de ejecución.

#### Resultado esperado
- Las pruebas de integración se ejecutan correctamente.
- Testcontainers funciona en el pipeline.
- Las pruebas fallidas bloquean el pipeline.
- El tiempo es razonable (≤ 5 minutos).

---

### 7.5 Prueba 5 — Cobertura y bloqueo de merge

**Objetivo:** Validar que la cobertura se mide y bloquea el merge si baja del umbral.

#### Procedimiento
1. Configurar JaCoCo y Jest Coverage.
2. Ejecutar las pruebas y publicar cobertura.
3. Verificar que la cobertura se muestra en el PR.
4. Bajar artificialmente la cobertura y verificar que el merge se bloquea.
5. Restaurar la cobertura y verificar que el merge se permite.

#### Resultado esperado
- La cobertura se mide correctamente.
- La cobertura se muestra en el PR.
- El merge se bloquea si baja del 70 %.
- El merge se permite si cumple el umbral.

---

### 7.6 Prueba 6 — Compilación del backend y frontend

**Objetivo:** Validar que el backend y el frontend se compilan correctamente.

#### Procedimiento
1. Compilar el JAR del backend con Maven.
2. Compilar el APK del frontend con Gradle.
3. Verificar que los artefactos se generan.
4. Verificar que los artefactos se publican en GitHub Releases.

#### Resultado esperado
- El JAR se compila correctamente.
- El APK se compila correctamente.
- Los artefactos se publican.
- No hay errores de compilación.

---

### 7.7 Prueba 7 — Distribución de APK con Firebase App Distribution

**Objetivo:** Validar que el APK se distribuye a testers con Firebase App Distribution.

#### Procedimiento
1. Configurar Firebase App Distribution.
2. Subir el APK con el workflow.
3. Verificar que los testers reciben el APK.
4. Instalar el APK en los tres dispositivos.
5. Verificar que la app funciona correctamente.

#### Resultado esperado
- El APK se sube correctamente.
- Los testers reciben la notificación.
- El APK se instala y funciona en los tres dispositivos.
- No hay errores de distribución.

---

### 7.8 Prueba 8 — Despliegue del backend a staging

**Objetivo:** Validar que el backend se despliega automáticamente a staging.

#### Procedimiento
1. Configurar el despliegue del backend a staging (Docker + docker-compose o servicio gestionado).
2. Hacer merge a `main`.
3. Verificar que el workflow compila y despliega.
4. Consumir un endpoint del backend en staging.
5. Verificar que el backend está corriendo.

#### Resultado esperado
- El backend se despliega correctamente.
- Los endpoints responden en staging.
- No hay errores de despliegue.

---

### 7.9 Prueba 9 — Gestión de secretos

**Objetivo:** Validar que los secretos se gestionan correctamente.

#### Procedimiento
1. Configurar los secretos en GitHub Secrets.
2. Usar los secretos en el pipeline.
3. Verificar que los secretos no aparecen en los logs.
4. Rotar un secreto y verificar que el pipeline sigue funcionando.

#### Resultado esperado
- Los secretos se usan correctamente.
- No aparecen en los logs.
- La rotación funciona.
- No hay fugas de secretos.

---

### 7.10 Prueba 10 — Trazabilidad

**Objetivo:** Validar que cada build tiene trazabilidad completa.

#### Procedimiento
1. Verificar que cada build está asociado a un commit.
2. Verificar que cada build está asociado a una rama.
3. Verificar que cada build está asociado a un autor.
4. Verificar que los artefactos están etiquetados con la versión y el commit.

#### Resultado esperado
- Cada build tiene commit, rama y autor.
- Los artefactos están etiquetados.
- No hay builds sin trazabilidad.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Workflows**: Los workflows se crean y disparan correctamente.
2. **Linting**: El linting se ejecuta y bloquea el pipeline si hay errores.
3. **Pruebas unitarias**: Se ejecutan y bloquean el pipeline si fallan.
4. **Pruebas de integración**: Se ejecutan con Testcontainers en ≤ 5 minutos.
5. **Cobertura**: Se mide y bloquea el merge si baja del umbral.
6. **Compilación**: El JAR y el APK se compilan sin errores.
7. **Firebase App Distribution**: El APK se distribuye a los testers.
8. **Despliegue del backend**: El backend se despliega a staging correctamente.
9. **Secretos**: Los secretos se gestionan sin fugas.
10. **Trazabilidad**: Cada build tiene commit, rama y autor.

El Spike se considerará **RECHAZADO** si:

- Los workflows no se disparan.
- El linting no bloquea el pipeline.
- Las pruebas no se ejecutan o no bloquean el merge.
- La cobertura no se mide.
- Los artefactos no se generan.
- El APK no se distribuye a testers.
- El backend no se despliega a staging.
- Los secretos se filtran.
- No hay trazabilidad.

## 9. Entorno técnico del spike

- **Repositorio**: GitHub.
- **CI/CD**: GitHub Actions.
- **Backend**: Spring Boot 3 + Java 17 + Maven.
- **Frontend**: React Native + TypeScript + Gradle.
- **Pruebas backend**: JUnit, Mockito, Testcontainers.
- **Pruebas frontend**: Jest, React Native Testing Library.
- **Cobertura**: JaCoCo, Jest Coverage.
- **Distribución APK**: Firebase App Distribution.
- **Despliegue backend**: Docker + docker-compose o servicio gestionado.
- **Gestión de secretos**: GitHub Secrets.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: GitHub Actions UI, tiempo de pipeline.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El pipeline puede ser lento por Testcontainers.
  - **Mitigación**: Usar caché de dependencias Maven y npm. Ejecutar pruebas de integración solo cuando sea necesario.

- **Riesgo**: Firebase App Distribution puede no configurarse correctamente.
  - **Mitigación**: Seguir la documentación oficial. Probar con un APK pequeño antes de integrar en el pipeline.

- **Riesgo**: Los secretos pueden filtrarse en los logs.
  - **Mitigación**: Usar GitHub Secrets y evitar imprimir variables sensibles. Revisar los logs del pipeline.

- **Riesgo**: El despliegue del backend a staging puede fallar.
  - **Mitigación**: Probar el despliegue manualmente antes de automatizarlo. Usar docker-compose para simplificar.

- **Riesgo**: El pipeline puede bloquear el merge por cobertura.
  - **Mitigación**: Definir un umbral realista (70 % en dominio). Documentar excepciones.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 10 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4, 6 y 7. Si el tiempo no alcanza, documentar 5, 8, 9 y 10 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio configurado** con:
   - Workflows `pr.yml` y `main.yml`.
   - Configuración de GitHub Secrets.
   - Scripts de compilación y despliegue.
   - Documentación del pipeline.
2. **Reporte de métricas**:
   - Tiempo del pipeline.
   - Tasa de éxito.
   - Cobertura por capa.
   - Tiempo de distribución del APK.
   - Resultado del despliegue del backend.
3. **Evidencia**:
   - Capturas del workflow ejecutándose en GitHub Actions.
   - Capturas de la cobertura en el PR.
   - Capturas de Firebase App Distribution.
   - Capturas del backend en staging.
   - Capturas de la trazabilidad (commit, rama, autor).
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Los workflows se crearon y dispararon correctamente?
  - ✅ / ❌ ¿El linting bloqueó el pipeline si había errores?
  - ✅ / ❌ ¿Las pruebas unitarias se ejecutaron y bloquearon el pipeline?
  - ✅ / ❌ ¿Las pruebas de integración se ejecutaron con Testcontainers?
  - ✅ / ❌ ¿La cobertura se midió y bloqueó el merge si bajaba del umbral?
  - ✅ / ❌ ¿El JAR y el APK se compilaron sin errores?
  - ✅ / ❌ ¿El APK se distribuyó a los testers con Firebase App Distribution?
  - ✅ / ❌ ¿El backend se desplegó a staging correctamente?
  - ✅ / ❌ ¿Los secretos se gestionaron sin fugas?
  - ✅ / ❌ ¿Cada build tuvo commit, rama y autor?

- **Lecciones aprendidas**:
  - (Ejemplo: "El caché de dependencias reduce el tiempo del pipeline significativamente.")
  - (Ejemplo: "Ejecutar pruebas de integración solo en PRs a `main` ahorra minutos de CI.")
  - (Ejemplo: "Firebase App Distribution es muy simple de integrar con GitHub Actions.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir el pipeline desde el día 1.")
  - (Ejemplo: "Usar GitHub Secrets desde el inicio.")
  - (Ejemplo: "Ejecutar pruebas unitarias e integración en cada PR y E2E solo en releases.")
  - (Ejemplo: "Bloquear el merge si las pruebas fallan.")
  - (Ejemplo: "Distribuir APK a testers con Firebase App Distribution desde la primera versión.")
  - (Ejemplo: "Añadir notificaciones a Slack o email para builds fallidos.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)