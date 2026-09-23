# ADR-021: Implementar monitoreo y observabilidad en backend y frontend

- **Título**: Implementar una estrategia de monitoreo y observabilidad con Spring Boot Actuator + Micrometer + Prometheus + Grafana en el backend, y Firebase Crashlytics + Analytics + Flipper en el frontend móvil, descartando monitoreo manual y herramientas propietarias costosas.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de monitoreo y observabilidad que mejor equilibre visibilidad del sistema, detección temprana de errores, costo, facilidad de integración con el stack actual, y capacidad de diagnosticar problemas de sincronización, rendimiento y autenticación, considerando el contexto offline-first y la fragmentación de dispositivos Android.

  - **Detalles**:

    - **Visibilidad del backend**: deben existir métricas de endpoints, transacciones, uso de base de datos, caché y errores (ESC-CAL-RN-02, ESC-CAL-RN-04).
    - **Visibilidad del frontend**: deben registrarse crashes, errores no controlados, tiempos de renderizado y eventos clave de usuario (ESC-CAL-US-01, ESC-CAL-US-06).
    - **Detección temprana de errores**: los errores críticos (fallos de sincronización, pérdida de datos, problemas de autenticación) deben alertar al equipo antes de que el usuario reporte (ESC-CAL-CF-05, ESC-CAL-SEG-01).
    - **Diagnóstico de sincronización**: debe ser posible rastrear una operación desde que se registra offline hasta que se sincroniza, incluyendo reintentos y errores (ESC-CAL-DP-01, ESC-CAL-INT-03).
    - **Trazabilidad**: debe existir un identificador de correlación entre backend y frontend para rastrear flujos completos.
    - **Rendimiento**: el monitoreo no debe degradar el rendimiento de la aplicación ni del backend.
    - **Costo de implementación y operación**: la solución debe ser viable con el presupuesto y el equipo de AgroTrack.
    - **Mantenibilidad**: la solución debe ser fácil de configurar, mantener y evolucionar.
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-01, ESC-CAL-DP-03, ESC-CAL-CF-05, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-SEG-01, ESC-CAL-ESC-01, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de monitoreo y observabilidad para backend y frontend móvil.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Monitoreo manual (logs locales sin centralización)**: cada componente registra logs en archivos locales sin agregación ni visualización.
    2. **Monitoreo con herramientas propietarias (Datadog, New Relic)**: plataformas SaaS de observabilidad con agentes en backend y frontend.
    3. **Monitoreo con stack open source + Firebase (Spring Boot Actuator + Micrometer + Prometheus + Grafana en backend; Firebase Crashlytics + Analytics + Flipper en frontend)**: combinación de herramientas open source y servicios gratuitos de Firebase.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de observabilidad en aplicaciones móviles con backend, considerando la necesidad de rastrear flujos offline-first, detectar errores en producción y medir rendimiento. Se revisaron experiencias de equipos que adoptaron Datadog/New Relic y su impacto en costos.

  - **1. Monitoreo manual (logs locales sin centralización)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de visibilidad, detección temprana ni trazabilidad.

      - **Detalles**:
        - Los logs locales no se agregan ni se visualizan centralizadamente.
        - No hay detección temprana de errores; el equipo se entera cuando el usuario reporta.
        - No hay trazabilidad entre backend y frontend.
        - Difícil de diagnosticar problemas de sincronización.
        - No hay métricas de rendimiento.
        - En producción es inviable.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero costo de operación altísimo por falta de visibilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: alto tiempo de diagnóstico manual.
        - **Medición**: no hay métricas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin inversión inicial.
      - **Debilidades**:
        - Sin visibilidad centralizada.
        - Sin detección temprana.
        - Sin trazabilidad.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Errores en producción no detectados.
        - Pérdida de confianza del usuario.

    - **Opiniones y comentarios internos**:

      - "Sin monitoreo, estamos ciegos en producción."
      - "No podemos depender de que el usuario reporte los errores."

  - **2. Monitoreo con herramientas propietarias (Datadog, New Relic)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con los criterios técnicos, pero no con los de costo.

      - **Detalles**:
        - Datadog y New Relic ofrecen observabilidad completa: métricas, logs, trazas, alertas.
        - Integración con Spring Boot y React Native.
        - Detección temprana de errores.
        - Trazabilidad distribuida.
        - Sin embargo, el costo es elevado: se cobra por host, por GB de logs, por usuario.
        - Para un proyecto B2C con presupuesto limitado, el costo puede ser prohibitivo.
        - Dependencia de un proveedor externo.
        - Posibles problemas de residencia de datos (restricción legal).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, costo operativo alto y creciente con el uso.

      - **Ejemplos**:
        - **Licencias**: Datadog cobra ~$15-23 por host/mes + $0.10 por GB de logs. New Relic cobra ~$25-99 por usuario/mes.
        - **Capacitación**: el equipo debe aprender las herramientas.
        - **Operación**: monitoreo de costos para evitar sorpresas.
        - **Medición**: métricas completas pero costosas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Observabilidad completa.
        - Integración con el stack.
        - Detección temprana.
        - Trazabilidad distribuida.
      - **Debilidades**:
        - Costo elevado.
        - Dependencia de proveedor.
        - Problemas de residencia de datos.
      - **Oportunidades**:
        - Útil si el proyecto escala mucho.
      - **Amenazas**:
        - Costos imprevistos.
        - Bloqueo de proveedor.

    - **Opiniones y comentarios internos**:

      - "Datadog es excelente, pero no podemos pagar $500/mes por un proyecto que aún no genera ingresos."
      - "No queremos atarnos a un proveedor propietario."

  - **3. Monitoreo con stack open source + Firebase**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción que mejor equilibra visibilidad, costo y facilidad de integración.

      - **Detalles**:
        - **Backend (Spring Boot)**:
          - Spring Boot Actuator expone endpoints de salud y métricas.
          - Micrometer recolecta métricas y las exporta a Prometheus.
          - Prometheus almacena las métricas y las consulta.
          - Grafana visualiza las métricas en dashboards.
          - Loki (opcional) para agregación de logs.
          - Alertmanager para alertas.
        - **Frontend (React Native)**:
          - Firebase Crashlytics registra crashes y errores no controlados.
          - Firebase Analytics registra eventos clave de usuario.
          - Flipper para debugging en desarrollo.
          - Sentry (opcional) para errores más detallados.
        - **Trazabilidad**:
          - Identificador de correlación (`traceId`) inyectado en las solicitudes HTTP y propagado en logs.
          - Posibilidad de rastrear una operación desde el frontend hasta el backend.
        - **Costo**:
          - Stack open source: sin costo de licencias.
          - Firebase: plan gratuito generoso (Crashlytics ilimitado, Analytics hasta 500 eventos).
          - Hosting de Prometheus/Grafana: contenedores en el mismo servidor del backend.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo, retorno alto en visibilidad.

      - **Ejemplos**:
        - **Licencias**: todas open source excepto Firebase (gratuito en el plan básico).
        - **Capacitación**: el equipo debe aprender Prometheus, Grafana y Crashlytics.
        - **Operación**: monitoreo de dashboards y alertas.
        - **Medición**: métricas completas sin costo por uso.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin costo de licencias.
        - Observabilidad completa.
        - Detección temprana de errores.
        - Trazabilidad con `traceId`.
        - Integración natural con Spring Boot y React Native.
        - Firebase Crashlytics es el estándar para apps móviles.
      - **Debilidades**:
        - Requiere configurar Prometheus y Grafana.
        - Mayor esfuerzo inicial que Datadog.
        - Firebase depende de Google (aunque es gratuito).
      - **Oportunidades**:
        - Escalar a Loki para logs y Tempo para trazas si crece.
        - Migrar a Grafana Cloud si el equipo crece.
      - **Amenazas**:
        - Configuración incorrecta de alertas que genere ruido.
        - Firebase puede cambiar sus planes gratuitos.

    - **Opiniones y comentarios internos**:

      - "Prometheus + Grafana es el estándar open source para observabilidad."
      - "Firebase Crashlytics es obligatorio en cualquier app Android."
      - "El `traceId` nos permite rastrear una operación desde el móvil hasta la base de datos."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-021 — Validará que Spring Boot Actuator + Micrometer + Prometheus + Grafana y Firebase Crashlytics + Analytics cubren las necesidades de observabilidad — Propuesto.
    - SPIKE-001 — Validará que la sincronización offline puede rastrearse con `traceId` — Propuesto.
    - SPIKE-007 — Validará que la idempotencia y la consistencia se pueden monitorear — Propuesto.
    - SPIKE-016 — Validará que Spring Boot Actuator se integra correctamente — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Monitoreo manual — descartado por falta de visibilidad.
    - Datadog/New Relic — descartados por costo y dependencia de proveedor.
    - ELK Stack (Elasticsearch + Logstash + Kibana) — considerado para logs, pero se prefirió Loki por menor consumo de recursos.
    - Sentry — considerado como complemento para errores en frontend, pero Crashlytics es suficiente.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-021 (observabilidad completa), SPIKE-001 (trazabilidad de sincronización), SPIKE-007 (monitoreo de idempotencia) y SPIKE-016 (Actuator).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **stack open source + Firebase** porque:
    - Ofrece observabilidad completa sin costo de licencias.
    - Se integra naturalmente con Spring Boot (Actuator + Micrometer) y React Native (Crashlytics).
    - Permite detección temprana de errores.
    - Permite trazabilidad con `traceId`.
    - Firebase Crashlytics es el estándar para apps móviles.
    - Prometheus + Grafana es el estándar open source para métricas.
    - Es viable con el presupuesto y el equipo de AgroTrack.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que Spring Boot Actuator + Micrometer + Prometheus + Grafana y Firebase Crashlytics + Analytics cubran las necesidades de observabilidad sin degradar el rendimiento.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las métricas, logs y errores.
    - **¿Qué tipos de integraciones están involucradas?**: Spring Boot Actuator, Micrometer, Prometheus, Grafana, Alertmanager, Firebase Crashlytics, Firebase Analytics, Flipper y el sistema de logging del backend.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Configurar Actuator y Micrometer desde el día 1. Inyectar `traceId` en todas las solicitudes. Configurar alertas para errores críticos (fallos de sincronización, pérdida de datos, 500). Usar Crashlytics desde la primera versión. No esperar a tener problemas para instrumentar.

  - **Anécdotas**:

    - En el diseño del SPIKE-016 se confirmó que Spring Boot Actuator expone métricas de endpoints, JVM y base de datos con solo añadir la dependencia.
    - Durante el análisis se concluyó que sin `traceId` sería imposible rastrear una operación desde el móvil hasta el backend.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **Spring Boot Actuator + Micrometer + Prometheus + Grafana + Alertmanager** en el backend, y **Firebase Crashlytics + Firebase Analytics + Flipper** en el frontend móvil, con **`traceId` propagado en todas las solicitudes**, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-03, ESC-CAL-CF-05, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-SEG-01, ESC-CAL-ESC-01 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre visibilidad, costo y facilidad de integración.

    La implementación deberá considerar como mínimo:

    - **Backend (Spring Boot)**:
      - Añadir `spring-boot-starter-actuator` y `micrometer-registry-prometheus`.
      - Exponer endpoints `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`.
      - Configurar Prometheus para hacer scraping de las métricas.
      - Configurar Grafana con dashboards para:
        - Endpoints (latencia, tasa de errores, throughput).
        - JVM (memoria, GC, threads).
        - Base de datos (conexiones, consultas lentas).
        - Caché (hit ratio, uso de memoria).
        - Sincronización (operaciones pendientes, reintentos, idempotencia).
      - Configurar Alertmanager para alertas:
        - Errores 500 > 1 % en 5 minutos.
        - Latencia p95 > 3 s en consultas productivas.
        - Latencia p95 > 5 s en resúmenes.
        - Fallos de sincronización > 5 % en 10 minutos.
        - Uso de CPU > 80 % por 10 minutos.
      - Inyectar `traceId` en logs y respuestas HTTP.
    - **Frontend (React Native)**:
      - Integrar Firebase Crashlytics para crashes y errores no controlados.
      - Integrar Firebase Analytics para eventos clave:
        - Login exitoso/fallido.
        - Registro offline.
        - Sincronización exitosa/fallida.
        - Consulta de resumen.
      - Usar Flipper para debugging en desarrollo.
      - Capturar errores no controlados y enviarlos a Crashlytics.
    - **Trazabilidad**:
      - Generar `traceId` en el frontend y enviarlo en el header `X-Trace-Id`.
      - Propagar el `traceId` en logs del backend.
      - Incluir `traceId` en las respuestas de error.
    - **Documentación**:
      - Guía de uso de dashboards.
      - Guía de interpretación de alertas.
      - Convención de logs y métricas.
    - **Pruebas**:
      - Verificar que las métricas se exponen correctamente.
      - Verificar que las alertas se disparan correctamente.
      - Verificar que el `traceId` se propaga correctamente.

    Se descarta el monitoreo manual por falta de visibilidad y Datadog/New Relic por costo y dependencia de proveedor. El stack open source + Firebase es la opción que garantiza observabilidad, detección temprana y trazabilidad en AgroTrack.