# ADR-024: Estandarizar manejo de errores y recuperación en backend y frontend

- **Título**: Definir un esquema único de errores con códigos estructurados, mensajes claros y estrategias de recuperación (reintentos, idempotencia, conservación de datos) en backend y frontend.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Garantizar que todos los errores (de red, validación, servidor, autenticación, sincronización) se manejen de forma consistente, que el usuario reciba mensajes claros y accionables, y que los datos no se pierdan ante interrupciones, cumpliendo con los escenarios ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-SEG-01 y ESC-CAL-US-03.

  - **Detalles**:

    - **Consistencia**: todos los errores del backend deben devolver una estructura única (`codigo`, `mensaje`, `detalles`, `fechaHora`, `idTraza`).
    - **Claridad**: los mensajes de error deben estar en español colombiano, ser accionables y evitar tecnicismos (ESC-CAL-US-03).
    - **Recuperación automática**: los errores transitorios (500, 503, timeout, red) deben reintentarse con backoff exponencial (ADR-001).
    - **Conservación de datos**: los registros no confirmados deben permanecer en `PENDIENTE` hasta recibir confirmación del servidor (ESC-CAL-CF-05).
    - **Idempotencia**: los reintentos no deben generar duplicados (ESC-CAL-INT-03, ADR-007).
    - **Autenticación**: los errores 401 deben disparar refresco silencioso o redirección a login (ESC-CAL-SEG-01, ADR-011).
    - **Trazabilidad**: cada error debe incluir un `idTraza` para rastrearlo en logs (ADR-021).
    - **Costo de implementación**: viable con el stack actual (Spring Boot + React Native).
    - **Escenarios de calidad relacionados**: ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-SEG-01, ESC-CAL-US-03, ESC-CAL-DP-01.
    - **Funcionalidades significativas relacionadas**: HU-44 (evitar pérdida de información durante la sincronización).

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para el manejo de errores y recuperación.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Manejo ad-hoc por componente**: cada endpoint y pantalla maneja errores a su manera, con mensajes y estructuras diferentes.
    2. **Manejo centralizado con estructura estándar**: el backend devuelve una estructura única de error; el frontend la interpreta con un manejador global que decide si reintentar, refrescar token, mostrar mensaje o redirigir.
    3. **Manejo distribuido con circuit breaker y sagas**: se introducen patrones avanzados como Circuit Breaker y Sagas para coordinar recuperación entre módulos.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de manejo de errores en aplicaciones offline-first con sincronización diferida. Se revisaron las recomendaciones de RFC 7807 (Problem Details for HTTP APIs) y las prácticas de Spring Boot con `@ControllerAdvice` y de React Native con interceptores de Axios.

  - **1. Manejo ad-hoc por componente**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple. Genera inconsistencias, mensajes duplicados y dificulta el mantenimiento.

      - **Detalles**:
        - Cada endpoint decide cómo devolver el error; el frontend no puede interpretarlo de forma genérica.
        - Los mensajes son diferentes para el mismo error.
        - Difícil de mantener y auditar.
        - Propenso a que se olvide manejar algún error.
        - No hay trazabilidad.
        - El usuario ve mensajes confusos.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo al inicio, pero costo de mantenimiento altísimo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: alto tiempo de debugging.
        - **Medición**: no hay métricas de errores.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Rápido de implementar al inicio.
      - **Debilidades**:
        - Inconsistente.
        - Difícil de mantener.
        - Sin trazabilidad.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Errores en producción no detectados.
        - Frustración del usuario.

    - **Opiniones y comentarios internos**:

      - "Cada endpoint con su propio formato de error es un caos."
      - "Necesitamos que el frontend sepa qué hacer con cada error."

  - **2. Manejo centralizado con estructura estándar**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios.

      - **Detalles**:
        - Backend con `@ControllerAdvice` que captura todas las excepciones y devuelve una estructura única: `{ codigo, mensaje, detalles, fechaHora, idTraza }`.
        - Códigos de error estandarizados: `ERROR_VALIDACION`, `AUTENTICACION_REQUERIDA`, `ACCESO_DENEGADO`, `NO_ENCONTRADO`, `CONFLICTO`, `OPERACION_YA_REGISTRADA`, `ERROR_INTERNO`, `SERVICIO_NO_DISPONIBLE`.
        - Frontend con interceptor de Axios que interpreta cada `codigo` y el estado HTTP y decide:
          - 400/422 → mostrar mensaje de validación (ADR-002).
          - 401 → refrescar token (ADR-011); si falla, redirigir a login.
          - 404 → mostrar estado vacío (ADR-004).
          - 409 → tratar como idempotencia (registro ya procesado).
          - 500/503/timeout/red → reintentar con backoff exponencial (ADR-001).
        - Conservación de registros en `PENDIENTE` hasta confirmación (ADR-007).
        - Mensajes claros y accionables en español.
        - `idTraza` propagado en cada error.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo, retorno alto en confiabilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe respetar la estructura.
        - **Operación**: monitoreo de errores por código.
        - **Medición**: cantidad de errores por código, tasa de recuperación.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Consistencia total.
        - Mantenibilidad.
        - Mensajes claros.
        - Recuperación automática.
        - Conservación de datos.
        - Trazabilidad con `idTraza`.
      - **Debilidades**:
        - Requiere disciplina del equipo.
        - Configuración inicial de `@ControllerAdvice`.
      - **Oportunidades**:
        - Evolucionar a Circuit Breaker si el backend se sobrecarga.
        - Métricas de errores por código.
      - **Amenazas**:
        - Si no se mantiene, los errores vuelven a ser ad-hoc.
        - Códigos nuevos sin documentar.

    - **Opiniones y comentarios internos**:

      - "La estructura única es clave para que el frontend sepa qué hacer."
      - "El `idTraza` nos permite rastrear cada error de extremo a extremo."
      - "La idempotencia con `idLocal` evita duplicados en los reintentos."

  - **3. Manejo distribuido con circuit breaker y sagas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero es sobre-ingeniería para el alcance actual.

      - **Detalles**:
        - Circuit Breaker y Sagas son útiles en arquitecturas de microservicios para coordinar recuperación entre múltiples servicios.
        - AgroTrack es un monolito modular (ADR-018), no microservicios.
        - Introducir Circuit Breaker y Sagas añadiría complejidad innecesaria.
        - No hay múltiples servicios que coordinar.
        - El equipo tendría que aprender patrones avanzados.
        - El timebox no lo justifica.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto, retorno bajo para el alcance actual.

      - **Ejemplos**:
        - **Licencias**: Resilience4j es open source.
        - **Capacitación**: el equipo debe aprender Circuit Breaker y Sagas.
        - **Operación**: mayor complejidad de monitoreo.
        - **Medición**: métricas de circuitos y sagas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Robustez en sistemas distribuidos.
        - Aislamiento de fallos.
      - **Debilidades**:
        - Sobre-ingeniería para monolito.
        - Mayor complejidad.
        - Mayor tiempo de implementación.
      - **Oportunidades**:
        - Útil si AgroTrack migra a microservicios.
      - **Amenazas**:
        - Retraso en el desarrollo.
        - Complejidad innecesaria.

    - **Opiniones y comentarios internos**:

      - "Circuit Breaker y Sagas son para microservicios; nosotros no estamos ahí."
      - "El manejo centralizado es suficiente para nuestro alcance."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-024 — Validará que el manejo centralizado de errores funciona en backend y frontend, que los datos se conservan ante interrupciones y que los reintentos no generan duplicados — Propuesto.
    - SPIKE-001 — Validará retry y backoff en sincronización — Propuesto.
    - SPIKE-007 — Validará idempotencia y conservación ante interrupción — Propuesto.
    - SPIKE-011 — Validará refresco de token ante 401 — Propuesto.
    - SPIKE-021 — Validará que el `idTraza` se propaga en errores — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Manejo ad-hoc — descartado por inconsistencia.
    - Circuit Breaker y Sagas — descartados por sobre-ingeniería para monolito.
    - RFC 7807 (Problem Details) — considerado como formato estándar, pero se prefirió una estructura propia más simple y alineada con el dominio.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-024 (manejo centralizado), SPIKE-001 (retry y backoff), SPIKE-007 (idempotencia), SPIKE-011 (refresco de token) y SPIKE-021 (idTraza).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **manejo centralizado con estructura estándar** porque:
    - Garantiza consistencia en todos los errores.
    - Permite que el frontend interprete cada error de forma genérica.
    - Facilita la recuperación automática (reintentos, refresco de token).
    - Conserva los datos ante interrupciones.
    - Evita duplicados con idempotencia.
    - Proporciona trazabilidad con `idTraza`.
    - Es viable con el stack actual sin complejidad adicional.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el 100 % de los errores tenga estructura única, que el frontend interprete correctamente cada `codigo`, que los datos se conserven ante interrupciones y que los reintentos no generen duplicados.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las operaciones (errores y éxitos).
    - **¿Qué tipos de integraciones están involucradas?**: Spring Boot (`@ControllerAdvice`), Axios (interceptor), SQLite local (tabla `operaciones_pendientes`), motor de sincronización (ADR-001), idempotencia (ADR-007), refresco de token (ADR-011) y monitoreo (ADR-021).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Estandarizar la estructura de error desde el día 1. Documentar los códigos de error y sus estrategias. Incluir `idTraza` en todas las respuestas. Tratar `OPERACION_YA_REGISTRADA` como éxito. Probar cada tipo de error en los tres dispositivos.

  - **Anécdotas**:

    - En el diseño del SPIKE-001 se identificó que sin una estructura única de error, el frontend no podía distinguir entre un error transitorio y uno permanente.
    - En el diseño del SPIKE-011 se planteó como hipótesis que el refresco de token debe ser atómico para evitar múltiples solicitudes simultáneas.
    - En el diseño del SPIKE-007 se planteó como hipótesis que tratar `OPERACION_YA_REGISTRADA` como éxito evita confusión en el frontend.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **manejo centralizado de errores con estructura única y estrategias de recuperación** en backend y frontend, cumpliendo con los escenarios ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-SEG-01, ESC-CAL-US-03 y ESC-CAL-DP-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre consistencia, recuperación automática y conservación de datos.

    La implementación deberá considerar como mínimo:

    - **Backend (Spring Boot)**:
      - `@ControllerAdvice` global que captura excepciones.
      - Estructura de error única: `{ codigo, mensaje, detalles, fechaHora, idTraza }`.
      - Códigos estandarizados:
        - `ERROR_VALIDACION` (400/422).
        - `AUTENTICACION_REQUERIDA` (401).
        - `ACCESO_DENEGADO` (403).
        - `NO_ENCONTRADO` (404).
        - `CONFLICTO` (409).
        - `OPERACION_YA_REGISTRADA` (409, tratado como éxito).
        - `ERROR_INTERNO` (500).
        - `SERVICIO_NO_DISPONIBLE` (503).
      - Mensajes en español colombiano, claros y accionables.
      - `idTraza` propagado en cada respuesta de error.
    - **Frontend (React Native)**:
      - Interceptor de Axios que captura errores y decide según `codigo` y el estado HTTP:
        - 400/422 → mostrar mensaje de validación (ADR-002).
        - 401 → refrescar token (ADR-011); si falla, redirigir a login.
        - 403 → mostrar mensaje de permiso.
        - 404 → mostrar estado vacío (ADR-004).
        - 409 (`OPERACION_YA_REGISTRADA`) → tratar como éxito.
        - 500/503/timeout/red → reintentar con backoff exponencial (ADR-001).
      - Conservar registros en `PENDIENTE` hasta recibir confirmación (ADR-007).
      - Mostrar mensajes claros y accionables.
    - **Trazabilidad**:
      - Generar `idTraza` en el frontend y enviarlo en el header `X-Trace-Id`.
      - Registrar `idTraza` en logs del backend (ADR-021).
      - Incluir `idTraza` en cada respuesta de error.
    - **Pruebas**:
      - Simular errores 400, 401, 403, 404, 409, 500, 503 y timeout.
      - Verificar que cada uno se maneja correctamente.
      - Verificar que los datos no se pierden ante interrupciones.
      - Verificar que los reintentos no generan duplicados.
      - Verificar que los mensajes son claros y accionables.
      - Verificar que `idTraza` aparece en logs y respuestas.
    - **Documentación**:
      - Catálogo de códigos de error y sus estrategias.
      - Guía de mensajes para el equipo.

    Se descarta el manejo ad-hoc por inconsistencia y el manejo distribuido con Circuit Breaker y Sagas por sobre-ingeniería para el monolito modular. El manejo centralizado es la opción que garantiza consistencia, recuperación y trazabilidad en AgroTrack.