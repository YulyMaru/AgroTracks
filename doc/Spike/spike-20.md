# SPIKE-020: Validar estrategia de pruebas en capas e integración con CI/CD

## Información general

- **ID:** SPIKE-020
- **Nombre:** Validar estrategia de pruebas en capas e integración con CI/CD
- **ADR relacionado:** ADR-020 — Definir la estrategia de pruebas en capas para backend y frontend
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-009 (Optimizar consultas con índices y caché), ADR-011 (Bloquear acceso no autenticado con middleware), ADR-012 (Validar app en dispositivos Android soportados), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil), ADR-018 (Usar monolito modular por capas con arquitectura offline-first y patrón Repository), ADR-019 (Versionar el esquema de base de datos con migraciones automáticas)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 4 días hábiles

## 1. Objetivo

Validar técnicamente que la estrategia de pruebas en capas (unitarias, integración, E2E, rendimiento, seguridad) es viable con el stack de AgroTrack, que se integra correctamente en CI/CD, y que permite detectar regresiones de forma temprana sin ralentizar el desarrollo.

El Spike busca comprobar que la estrategia seleccionada en ADR-020 es aplicable en backend (Spring Boot) y frontend (React Native), y que las pruebas críticas (sincronización offline, idempotencia, autenticación, cálculos económicos) están cubiertas de forma automatizada.

## 2. Problema que se busca validar

AgroTrack requiere una estrategia de pruebas que garantice la calidad de funcionalidades críticas sin ralentizar el desarrollo. Existen riesgos de que:

- Las pruebas unitarias no cubran el dominio y dejen pasar bugs.
- Las pruebas de integración sean lentas o frágiles.
- Las pruebas E2E sean difíciles de mantener.
- La cobertura no sea medible ni mejorable.
- Las pruebas no se integren en CI/CD y se ejecuten manualmente.
- Las pruebas de sincronización offline no simulen condiciones reales.
- Las pruebas de rendimiento no validen los umbrales definidos.
- Las pruebas de seguridad no detecten vulnerabilidades en JWT.
- Las pruebas de usabilidad no se realicen con usuarios reales.
- La estrategia no escale con el crecimiento del proyecto.

Por esta razón, se necesita un prototipo que implemente pruebas en cada capa, las integre en CI/CD y mida su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿La estrategia de pruebas en capas (unitarias, integración, E2E, rendimiento, seguridad) cubre las funcionalidades críticas de AgroTrack, se integra en CI/CD sin ralentizar el desarrollo, y permite detectar regresiones de forma temprana en backend y frontend?

## 4. Hipótesis

Si implementamos:

- **Backend**:
  - Pruebas unitarias con JUnit 5 + Mockito para dominio y servicios.
  - Pruebas de integración con Spring Boot Test + Testcontainers para repositorios y controladores.
  - Pruebas de rendimiento con k6 para endpoints críticos.
  - Pruebas de seguridad con OWASP ZAP para JWT.
- **Frontend**:
  - Pruebas unitarias con Jest + React Native Testing Library para dominio y hooks.
  - Pruebas de integración con Jest y SQLite en memoria.
  - Pruebas E2E con Detox o Maestro para flujos críticos.
  - Pruebas de rendimiento con React DevTools Profiler.
- **CI/CD**:
  - GitHub Actions ejecutando unitarias e integración en cada PR.
  - E2E en releases.
  - Cobertura con JaCoCo (backend) y Jest Coverage (frontend).

Entonces:

- Las pruebas unitarias se ejecutarán en segundos.
- Las pruebas de integración se ejecutarán en minutos.
- Las E2E cubrirán los flujos críticos sin ser frágiles.
- La cobertura en dominio y aplicación será ≥ 70 %.
- CI/CD ejecutará las pruebas automáticamente.
- Las regresiones se detectarán antes de fusionar.
- Las pruebas de sincronización offline simularán pérdida y recuperación de conexión.
- Las pruebas de rendimiento validarán los umbrales definidos.
- Las pruebas de seguridad detectarán vulnerabilidades en JWT.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot)**:
  - Pruebas unitarias del dominio: entidades, reglas de negocio, cálculo económico.
  - Pruebas unitarias de servicios de aplicación con repositorios mockeados.
  - Pruebas de integración de repositorios JPA con Testcontainers (PostgreSQL real).
  - Pruebas de integración de controladores REST con MockMvc.
  - Pruebas de idempotencia: 5 reintentos con el mismo `idLocal` → 1 registro.
  - Pruebas de migraciones Flyway (ADR-019).
  - Pruebas de rendimiento con k6 para endpoints críticos.
  - Pruebas de seguridad con OWASP ZAP para validar JWT.
  - Medición de cobertura con JaCoCo.
- **Frontend (React Native)**:
  - Pruebas unitarias de dominio y hooks con Jest.
  - Pruebas de componentes con React Native Testing Library.
  - Pruebas de integración de repositorios con SQLite en memoria.
  - Pruebas E2E con Detox o Maestro para flujos críticos (login, registro offline, sincronización, resumen).
  - Pruebas de rendimiento con React DevTools Profiler.
  - Medición de cobertura con Jest Coverage.
- **CI/CD**:
  - Pipeline en GitHub Actions ejecutando unitarias e integración en cada PR.
  - Pipeline ejecutando E2E en releases.
  - Reporte de cobertura en cada PR.
  - Bloqueo de merge si las pruebas fallan o la cobertura baja del umbral.
- **Transversal**:
  - Pruebas de usabilidad con al menos 3 participantes para funcionalidades críticas.
  - Pruebas de compatibilidad en 3 dispositivos físicos + Firebase Test Lab (ADR-012).
  - Documentación de la estrategia de pruebas.

### 5.2 No incluye

El Spike no implementará:

- Pruebas de todas las funcionalidades de AgroTrack (solo las críticas).
- Pruebas de mutación (consideradas como complemento futuro).
- Pruebas en iOS (solo Android).
- Pruebas de accesibilidad avanzadas (solo validación básica de tamaños táctiles).
- Pruebas de internacionalización.
- Pruebas de carga con más de 10,000 transacciones.
- Pruebas de penetración completas (solo OWASP ZAP básico).
- Publicación en Google Play ni despliegue en producción.

## 6. Caso de prueba principal

**Funcionalidades críticas a cubrir:**

1. **Autenticación**: login, refresco de token, bloqueo de acceso sin token.
2. **Registro offline**: guardar gasto sin conexión, confirmación, persistencia.
3. **Sincronización**: envío automático al recuperar conexión, idempotencia.
4. **Cálculos económicos**: ingresos, gastos, resultado, consistencia tras modificación.
5. **Migraciones**: Flyway en backend y `PRAGMA user_version` en SQLite.
6. **Rendimiento**: consultas ≤ 3 s, resumen ≤ 5 s con 10,000 transacciones.

**Datos de prueba:**

- 20 fincas.
- 100 transacciones (50 ingresos, 50 gastos).
- 5 operaciones pendientes.
- Usuario mock autenticado.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Pruebas unitarias de dominio (backend)

**Objetivo:** Validar que las reglas de negocio del dominio están cubiertas por pruebas unitarias.

#### Procedimiento
1. Escribir pruebas unitarias para el cálculo económico (ingresos, gastos, resultado).
2. Escribir pruebas para la consistencia tras modificación de un registro.
3. Escribir pruebas para la idempotencia (verificación de `idLocal`).
4. Ejecutar las pruebas y medir cobertura con JaCoCo.
5. Verificar que las pruebas no dependen de frameworks ni bases de datos.

#### Resultado esperado
- Las pruebas unitarias se ejecutan en < 5 s.
- La cobertura del dominio es ≥ 80 %.
- Las pruebas no dependen de Spring ni PostgreSQL.
- Los casos límite están cubiertos (valores negativos, cero, nulos).

---

### 7.2 Prueba 2 — Pruebas unitarias de servicios de aplicación (backend)

**Objetivo:** Validar que los servicios de aplicación están cubiertos con repositorios mockeados.

#### Procedimiento
1. Escribir pruebas para los servicios de caso de uso con repositorios mockeados.
2. Verificar que se invocan los repositorios correctamente.
3. Verificar que se manejan los errores correctamente.
4. Ejecutar las pruebas y medir cobertura.

#### Resultado esperado
- Las pruebas se ejecutan en < 10 s.
- La cobertura de servicios es ≥ 70 %.
- Los repositorios están mockeados (no se usa PostgreSQL).
- Los errores se manejan correctamente.

---

### 7.3 Prueba 3 — Pruebas de integración de repositorios (backend)

**Objetivo:** Validar que los repositorios JPA funcionan correctamente con PostgreSQL real.

#### Procedimiento
1. Configurar Testcontainers con PostgreSQL 15+.
2. Escribir pruebas de integración para los repositorios de `fincas` y `transacciones`.
3. Verificar que las consultas paginadas y filtradas funcionan.
4. Verificar que las agregaciones (SUM, GROUP BY) funcionan.
5. Verificar que las restricciones únicas se respetan.
6. Medir el tiempo de ejecución de la suite.

#### Resultado esperado
- Las pruebas se ejecutan en < 2 min.
- Los repositorios funcionan correctamente con PostgreSQL real.
- Las consultas paginadas y agregadas devuelven resultados correctos.
- Las restricciones únicas impiden duplicados.

---

### 7.4 Prueba 4 — Pruebas de integración de controladores (backend)

**Objetivo:** Validar que los controladores REST funcionan correctamente.

#### Procedimiento
1. Escribir pruebas con MockMvc para los endpoints de `fincas` y `transacciones`.
2. Verificar que la autenticación JWT funciona.
3. Verificar que los errores se manejan correctamente (400, 401, 404, 500).
4. Verificar que la paginación y los filtros funcionan.
5. Medir el tiempo de ejecución de la suite.

#### Resultado esperado
- Las pruebas se ejecutan en < 1 min.
- Los endpoints responden correctamente.
- La autenticación JWT bloquea accesos no autorizados.
- Los errores se manejan con códigos HTTP correctos.

---

### 7.5 Prueba 5 — Pruebas de idempotencia (backend)

**Objetivo:** Validar que la sincronización idempotente funciona.

#### Procedimiento
1. Escribir una prueba que envíe 5 veces la misma transacción con el mismo `idLocal`.
2. Verificar que solo se crea 1 registro en la base.
3. Verificar que las respuestas son idénticas en los 5 reintentos.
4. Verificar que la restricción única en `idLocal` se respeta.

#### Resultado esperado
- Solo se crea 1 registro.
- Las respuestas son idénticas.
- La restricción única funciona.
- La prueba se ejecuta en < 30 s.

---

### 7.6 Prueba 6 — Pruebas unitarias de dominio y hooks (frontend)

**Objetivo:** Validar que el dominio y los hooks del frontend están cubiertos.

#### Procedimiento
1. Escribir pruebas unitarias para las entidades de dominio (fincas, transacciones).
2. Escribir pruebas para los hooks de casos de uso.
3. Escribir pruebas para las funciones de cálculo económico.
4. Ejecutar las pruebas con Jest y medir cobertura.

#### Resultado esperado
- Las pruebas se ejecutan en < 10 s.
- La cobertura del dominio es ≥ 70 %.
- Los hooks se prueban con mocks de repositorios.
- Los casos límite están cubiertos.

---

### 7.7 Prueba 7 — Pruebas de componentes (frontend)

**Objetivo:** Validar que los componentes principales se renderizan correctamente.

#### Procedimiento
1. Escribir pruebas con React Native Testing Library para:
   - Pantalla de login.
   - Pantalla de lista de transacciones.
   - Pantalla de resumen económico.
   - Formulario de gasto.
2. Verificar que los componentes se renderizan.
3. Verificar que las interacciones funcionan.
4. Verificar que los mensajes de error se muestran.

#### Resultado esperado
- Las pruebas se ejecutan en < 20 s.
- Los componentes se renderizan correctamente.
- Las interacciones funcionan.
- Los mensajes de error se muestran.

---

### 7.8 Prueba 8 — Pruebas E2E de flujos críticos (frontend)

**Objetivo:** Validar que los flujos críticos funcionan de extremo a extremo.

#### Procedimiento
1. Configurar Detox o Maestro.
2. Escribir pruebas E2E para:
   - Login → dashboard.
   - Registro de gasto sin conexión → confirmación → persistencia.
   - Recuperación de conexión → sincronización automática.
   - Consulta de resumen económico.
   - Cierre de sesión.
3. Ejecutar las pruebas en los 3 dispositivos.
4. Medir el tiempo de ejecución.

#### Resultado esperado
- Las pruebas E2E pasan en los 3 dispositivos.
- El tiempo de ejecución es < 5 min por dispositivo.
- Los flujos críticos funcionan de extremo a extremo.
- No hay falsos positivos/negativos.

---

### 7.9 Prueba 9 — Pruebas de rendimiento (backend y frontend)

**Objetivo:** Validar que los umbrales de rendimiento se cumplen.

#### Procedimiento
1. Backend: ejecutar k6 con 100 usuarios concurrentes contra endpoints críticos.
2. Verificar que las consultas productivas cumplen ≤ 3 s.
3. Verificar que el resumen económico cumple ≤ 5 s con 10,000 transacciones.
4. Frontend: medir con React DevTools Profiler el renderizado de listas con 500 ítems.
5. Verificar que el renderizado cumple ≤ 300 ms.

#### Resultado esperado
- Las consultas cumplen los umbrales.
- El resumen cumple el umbral.
- El renderizado del frontend cumple el umbral.
- No hay degradación con la concurrencia.

---

### 7.10 Prueba 10 — Pruebas de seguridad (backend)

**Objetivo:** Validar que la autenticación JWT es segura.

#### Procedimiento
1. Configurar OWASP ZAP.
2. Ejecutar un escaneo contra los endpoints.
3. Verificar que no hay vulnerabilidades críticas.
4. Verificar que JWT no se puede falsificar.
5. Verificar que los endpoints protegidos rechazan tokens inválidos.

#### Resultado esperado
- No hay vulnerabilidades críticas.
- JWT no se puede falsificar.
- Los endpoints protegidos rechazan tokens inválidos.
- Los endpoints públicos (login, refresh) son accesibles.

---

### 7.11 Prueba 11 — Integración en CI/CD

**Objetivo:** Validar que las pruebas se ejecutan automáticamente en CI/CD.

#### Procedimiento
1. Configurar GitHub Actions.
2. Definir pipeline que ejecute:
   - Pruebas unitarias en cada PR.
   - Pruebas de integración en cada PR.
   - Pruebas E2E en releases.
   - Reporte de cobertura en cada PR.
3. Verificar que el pipeline bloquea merge si las pruebas fallan.
4. Verificar que el pipeline bloquea merge si la cobertura baja del umbral.
5. Medir el tiempo total del pipeline.

#### Resultado esperado
- El pipeline se ejecuta en < 15 min.
- Las pruebas unitarias e integración se ejecutan en cada PR.
- Las E2E se ejecutan en releases.
- El merge se bloquea si las pruebas fallan.
- El merge se bloquea si la cobertura baja.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Unitarias backend**: Cobertura ≥ 80 % en dominio y ≥ 70 % en servicios.
2. **Integración backend**: Repositorios y controladores cubiertos con Testcontainers y MockMvc.
3. **Idempotencia**: 5 reintentos generan 1 registro.
4. **Unitarias frontend**: Cobertura ≥ 70 % en dominio y hooks.
5. **Componentes frontend**: Componentes principales cubiertos.
6. **E2E**: Flujos críticos cubiertos y pasando en los 3 dispositivos.
7. **Rendimiento**: Umbrales cumplidos (≤ 3 s, ≤ 5 s, ≤ 300 ms).
8. **Seguridad**: Sin vulnerabilidades críticas en JWT.
9. **CI/CD**: Pipeline ejecuta pruebas y bloquea merge si fallan o baja cobertura.

El Spike se considerará **RECHAZADO** si:

- La cobertura del dominio es < 70 %.
- Alguna prueba de integración falla.
- La idempotencia no se cumple.
- Las E2E son frágiles o no pasan en algún dispositivo.
- Los umbrales de rendimiento no se cumplen.
- Hay vulnerabilidades críticas en JWT.
- El pipeline no bloquea merge ante fallos.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Base de datos backend**: PostgreSQL 15+ con Testcontainers.
- **Pruebas backend**: JUnit 5, Mockito, Spring Boot Test, MockMvc, Testcontainers, JaCoCo.
- **Rendimiento backend**: k6.
- **Seguridad backend**: OWASP ZAP.
- **Frontend**: React Native + TypeScript.
- **Pruebas frontend**: Jest, React Native Testing Library, Detox o Maestro.
- **Rendimiento frontend**: React DevTools Profiler, React Native DevTools.
- **Cobertura frontend**: Jest Coverage.
- **CI/CD**: GitHub Actions.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Datos de prueba**: script de generación de 20 fincas, 100 transacciones, 5 pendientes.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Las pruebas E2E pueden ser frágiles y fallar por cambios en la UI.
  - **Mitigación**: Usar selectores por accesibilidad (`testID`) en lugar de por texto. Mantener las E2E mínimas y estables.

- **Riesgo**: Testcontainers puede ser lento en CI/CD.
  - **Mitigación**: Usar H2 en memoria para pruebas rápidas y Testcontainers solo para integración real.

- **Riesgo**: La cobertura puede ser baja en algunas capas.
  - **Mitigación**: Definir umbrales realistas (70-80 %) y priorizar dominio y aplicación.

- **Riesgo**: k6 puede no simular correctamente la carga real.
  - **Mitigación**: Usar escenarios realistas basados en patrones de uso.

- **Riesgo**: OWASP ZAP puede generar falsos positivos.
  - **Mitigación**: Revisar los hallazgos manualmente y documentar los aceptados.

- **Riesgo**: El pipeline de CI/CD puede ser lento.
  - **Mitigación**: Ejecutar unitarias en cada PR y E2E solo en releases. Usar caché de dependencias.

- **Riesgo**: El timebox de 4 días puede ser insuficiente para las 11 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 5, 6 y 11. Si el tiempo no alcanza, documentar 4, 7, 8, 9 y 10 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Pruebas unitarias backend (dominio y servicios).
   - Pruebas de integración backend (repositorios y controladores).
   - Pruebas de idempotencia.
   - Pruebas unitarias frontend (dominio y hooks).
   - Pruebas de componentes frontend.
   - Pruebas E2E de flujos críticos.
   - Pipeline de CI/CD configurado.
   - Documentación de la estrategia de pruebas.
2. **Reporte de métricas**:
   - Cobertura por capa (backend y frontend).
   - Tiempo de ejecución de cada suite.
   - Resultado de pruebas de rendimiento.
   - Resultado de pruebas de seguridad.
   - Tiempo total del pipeline de CI/CD.
3. **Evidencia**:
   - Capturas de reportes de cobertura.
   - Capturas de pruebas ejecutándose.
   - Capturas del pipeline en GitHub Actions.
   - Capturas de pruebas E2E en los 3 dispositivos.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿La cobertura del dominio backend fue ≥ 80 %?
  - ✅ / ❌ ¿La cobertura de servicios backend fue ≥ 70 %?
  - ✅ / ❌ ¿Las pruebas de integración backend pasaron?
  - ✅ / ❌ ¿La idempotencia se cumplió (5 reintentos → 1 registro)?
  - ✅ / ❌ ¿La cobertura del dominio frontend fue ≥ 70 %?
  - ✅ / ❌ ¿Los componentes frontend se cubrieron?
  - ✅ / ❌ ¿Las E2E pasaron en los 3 dispositivos?
  - ✅ / ❌ ¿Los umbrales de rendimiento se cumplieron?
  - ✅ / ❌ ¿No hubo vulnerabilidades críticas en JWT?
  - ✅ / ❌ ¿El pipeline de CI/CD bloqueó merge ante fallos?

- **Lecciones aprendidas**:
  - (Ejemplo: "Usar `testID` en lugar de texto en E2E reduce la fragilidad.")
  - (Ejemplo: "Testcontainers es lento pero indispensable para validar PostgreSQL real.")
  - (Ejemplo: "La cobertura del dominio es más importante que la cobertura total.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Escribir pruebas desde el día 1, no al final.")
  - (Ejemplo: "Mantener la pirámide: muchas unitarias, algunas integración, pocas E2E.")
  - (Ejemplo: "Medir cobertura pero no obsesionarse con el 100 %.")
  - (Ejemplo: "Probar la sincronización offline con escenarios realistas.")
  - (Ejemplo: "Incluir pruebas de usabilidad con usuarios reales desde las primeras iteraciones.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)