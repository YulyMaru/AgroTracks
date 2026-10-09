# ADR-020: Definir la estrategia de pruebas en capas para backend y frontend

- **Título**: Adoptar una estrategia de pruebas en capas (unitarias, integración, E2E, usabilidad, compatibilidad, rendimiento) con herramientas específicas para backend y frontend, descartando pruebas manuales exclusivas y cobertura no medible.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de pruebas que mejor equilibre cobertura, confiabilidad, costo, velocidad de ejecución y mantenibilidad, considerando el contexto offline-first de AgroTrack, la sincronización idempotente, la usabilidad para campesinos y la fragmentación de dispositivos Android.

  - **Detalles**:

    - **Cobertura funcional**: las funcionalidades críticas (registro offline, sincronización, cálculos económicos, autenticación) deben estar cubiertas por pruebas automatizadas.
    - **Cobertura por capa**: dominio, aplicación, infraestructura y presentación deben tener pruebas adecuadas a su naturaleza.
    - **Velocidad de ejecución**: las pruebas unitarias deben ejecutarse en segundos; las de integración en minutos.
    - **Confiabilidad**: las pruebas no deben ser frágiles ni generar falsos positivos/negativos.
    - **Automatización**: las pruebas críticas deben ejecutarse en CI/CD en cada PR a la rama principal.
    - **Usabilidad**: las pruebas de usabilidad con usuarios reales deben validar comprensión, no solo funcionamiento.
    - **Compatibilidad**: las pruebas en 3 dispositivos físicos propios deben cubrir la fragmentación de Android (ESC-CAL-POR-01, ADR-012).
    - **Rendimiento**: deben existir pruebas de carga que validen los umbrales definidos (ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01).
    - **Costo de implementación y operación**: la estrategia debe ser viable con el equipo y el presupuesto de AgroTrack.
    - **Escenarios de calidad relacionados**: ESC-CAL-US-01, ESC-CAL-US-03, ESC-CAL-US-06, ESC-CAL-US-13, ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-DP-03, ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-CF-08, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ACC-02, ESC-CAL-ACC-06, ESC-CAL-SEG-01, ESC-CAL-POR-01, ESC-CAL-ESC-01, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de pruebas comunes en proyectos móviles con backend.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Pruebas manuales exclusivas**: el equipo prueba manualmente cada funcionalidad antes de cada release, sin automatización.
    2. **Automatización total sin capas**: todas las pruebas se escriben como E2E (end-to-end), sin distinguir por capa.
    3. **Estrategia de pruebas en capas (pirámide de pruebas adaptada)**: combinación de pruebas unitarias (base), integración (medio), E2E (cima), complementadas con pruebas de usabilidad, compatibilidad, rendimiento y seguridad.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron estrategias de pruebas en proyectos móviles offline-first con backend, considerando la pirámide de pruebas de Mike Cohn, el modelo de trofeo de pruebas de Kent C. Dodds, y prácticas de equipos que adoptaron E2E como única estrategia. Se revisaron las ventajas de cada capa.

  - **1. Pruebas manuales exclusivas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de cobertura, velocidad, confiabilidad ni automatización.

      - **Detalles**:
        - No es escalable: cada release requiere horas de pruebas manuales.
        - Propenso a errores humanos: se olvidan casos, se saltan pasos.
        - No hay cobertura medible.
        - No se puede ejecutar en CI/CD.
        - Las regresiones no se detectan automáticamente.
        - En el contexto de AgroTrack, con sincronización offline compleja, las pruebas manuales no son suficientes.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo al inicio, pero costo de operación altísimo y creciente.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere, pero el equipo sufre.
        - **Operación**: cada release requiere días de pruebas manuales.
        - **Medición**: no hay métricas objetivas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - No requiere inversión inicial.
      - **Debilidades**:
        - No escalable.
        - Propenso a errores.
        - Sin cobertura medible.
        - No se integra con CI/CD.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Bugs en producción.
        - Regresiones no detectadas.
        - Frustración del equipo.

    - **Opiniones y comentarios internos**:

      - "Probar a mano la sincronización offline es imposible; necesitamos automatización."
      - "No podemos permitirnos días de pruebas manuales por release."

  - **2. Automatización total sin capas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de velocidad, confiabilidad ni costo.

      - **Detalles**:
        - Las pruebas E2E son lentas (minutos por prueba).
        - Son frágiles: cualquier cambio en la UI las rompe.
        - Difíciles de depurar: cuando fallan, no se sabe si el problema está en el dominio, la infraestructura o la UI.
        - No permiten aislar fallos.
        - Requieren dispositivos o emuladores, lo que aumenta el costo.
        - No se pueden ejecutar en cada PR sin ralentizar el desarrollo.
        - La cobertura de casos límite es costosa.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto, costo operativo alto por lentitud y fragilidad.

      - **Ejemplos**:
        - **Licencias**: herramientas E2E como Detox o Maestro.
        - **Capacitación**: el equipo debe aprender a escribir E2E robustos.
        - **Operación**: cada PR tarda más en validarse.
        - **Medición**: cobertura E2E, pero no cobertura unitaria.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Prueban el sistema completo.
        - Detectan problemas de integración.
      - **Debilidades**:
        - Lentas y frágiles.
        - Difíciles de depurar.
        - Costosas de mantener.
        - No permiten aislar fallos.
      - **Oportunidades**:
        - Útiles para flujos críticos de negocio.
      - **Amenazas**:
        - Ralentización del desarrollo.
        - Falsos positivos/negativos.
        - Abandono de las pruebas por frustración.

    - **Opiniones y comentarios internos**:

      - "Las E2E son necesarias, pero no pueden ser la única estrategia."
      - "Si todas las pruebas son E2E, cada cambio en la UI rompe la suite."

  - **3. Estrategia de pruebas en capas (pirámide adaptada)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción que mejor equilibra cobertura, velocidad, confiabilidad y costo.

      - **Detalles**:
        - **Pruebas unitarias (base)**: dominio y aplicación. Rápidas (segundos), aisladas, con mocks.
        - **Pruebas de integración (medio)**: repositorios, controladores REST, migraciones, SQLite local. Con Testcontainers o H2.
        - **Pruebas E2E (cima)**: flujos críticos de negocio (login, registro offline, sincronización, consulta de resumen) con Detox o Maestro.
        - **Pruebas de usabilidad**: con usuarios reales para validar comprensión (ESC-CAL-US-01, ESC-CAL-US-06, ESC-CAL-US-13).
        - **Pruebas de compatibilidad**: en 3 dispositivos físicos propios (ADR-012), complementadas con Crashlytics para producción (ESC-CAL-POR-01).
        - **Pruebas de rendimiento**: JMeter o k6 para backend, React DevTools Profiler para frontend (ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01).
        - **Pruebas de seguridad**: OWASP ZAP o similar para endpoints, validación de JWT (ESC-CAL-SEG-01).
        - **Pruebas de accesibilidad**: validación de tamaños táctiles, contraste y respeto por `fontScale` (ESC-CAL-ACC-02, ESC-CAL-ACC-06, ADR-023).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, costo operativo bajo, retorno alto en confiabilidad y velocidad.

      - **Ejemplos**:
        - **Licencias**: todas las herramientas son open source (JUnit, Jest, Detox, k6, OWASP ZAP). Crashlytics es gratuito.
        - **Capacitación**: el equipo debe aprender a escribir pruebas por capa.
        - **Operación**: monitoreo de cobertura y resultados en CI/CD.
        - **Medición**: cobertura por capa, tiempo de ejecución, tasa de fallos.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Rápida ejecución de pruebas unitarias.
        - Confiabilidad de pruebas de integración.
        - Cobertura de flujos críticos con E2E.
        - Validación con usuarios reales.
        - Cobertura de fragmentación Android con dispositivos físicos.
        - Validación de rendimiento y seguridad.
      - **Debilidades**:
        - Requiere disciplina para mantener la pirámide.
        - Mayor inversión inicial.
        - Necesita CI/CD configurado.
      - **Oportunidades**:
        - Cobertura medible y mejorable.
        - Detección temprana de regresiones.
        - Confianza para refactorizar.
      - **Amenazas**:
        - Si se descuida, la pirámide se invierte (muchas E2E, pocas unitarias).
        - Pruebas frágiles si no se escriben bien.

    - **Opiniones y comentarios internos**:

      - "La pirámide de pruebas es el estándar por una razón: equilibra velocidad y cobertura."
      - "Necesitamos pruebas de usabilidad porque el usuario es el centro de AgroTrack."
      - "Las pruebas de compatibilidad en 3 dispositivos físicos cubren la fragmentación de Android sin costo recurrente."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-020 — Validará que la estrategia de pruebas en capas es viable con el stack de AgroTrack y que se integra en CI/CD — Propuesto.
    - SPIKE-001 — Validará pruebas de sincronización offline con retry y backoff — Propuesto.
    - SPIKE-007 — Validará pruebas de idempotencia y consistencia — Propuesto.
    - SPIKE-009 — Validará pruebas de rendimiento con 10,000 transacciones — Propuesto.
    - SPIKE-012 — Validará pruebas de compatibilidad en 3 dispositivos Android físicos — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Pruebas manuales exclusivas — descartadas por no escalables.
    - Automatización total sin capas — descartada por lentitud y fragilidad.
    - Modelo de trofeo (más integración, menos unitarias) — considerado, pero se prefirió la pirámide adaptada por simplicidad y equilibrio.
    - Pruebas de mutación — consideradas como complemento futuro, no como estrategia principal.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-020 (estrategia completa), SPIKE-001 (sincronización), SPIKE-007 (idempotencia), SPIKE-009 (rendimiento) y SPIKE-012 (compatibilidad).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **estrategia de pruebas en capas (pirámide adaptada)** porque:
    - Equilibra cobertura, velocidad, confiabilidad y costo.
    - Permite aislar fallos por capa.
    - Se integra en CI/CD sin ralentizar el desarrollo.
    - Cubre flujos críticos con E2E.
    - Valida comprensión con usuarios reales.
    - Cubre la fragmentación de Android con 3 dispositivos físicos.
    - Valida rendimiento, seguridad y accesibilidad.
    - Es el estándar en la industria.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que la estrategia de pruebas en capas cubra las funcionalidades críticas con pruebas unitarias, de integración y E2E, y que se integre en CI/CD.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las funcionalidades críticas estarán cubiertas por pruebas.
    - **¿Qué tipos de integraciones están involucradas?**: JUnit, Mockito, Spring Boot Test, Testcontainers (backend); Jest, React Native Testing Library, Detox o Maestro (frontend); Crashlytics (compatibilidad en producción); k6 o JMeter (rendimiento); OWASP ZAP (seguridad); CI/CD (GitHub Actions).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Escribir pruebas desde el día 1, no al final. Mantener la pirámide: muchas unitarias, algunas de integración, pocas E2E. Medir cobertura pero no obsesionarse con el 100 %. Probar la sincronización offline con escenarios realistas. Incluir pruebas de usabilidad con usuarios reales desde las primeras iteraciones.

  - **Anécdotas**:

    - En el diseño del SPIKE-001 se identificó que probar la sincronización offline requiere simular pérdida y recuperación de conexión, lo cual solo es viable con automatización.
    - En el diseño del SPIKE-012 se planteó como hipótesis que las pruebas en 3 dispositivos físicos propios detectan bugs que no aparecen en emuladores, sin necesidad de servicios de pago.

- **Recomendación**:

  - **Resumen**:

    Se recomienda adoptar una **estrategia de pruebas en capas (pirámide adaptada)** que combine pruebas unitarias, de integración, E2E, usabilidad, compatibilidad, rendimiento y seguridad, cumpliendo con todos los escenarios de calidad definidos en AgroTrack.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre cobertura, velocidad, confiabilidad y costo.

    La implementación deberá considerar como mínimo:

    - **Backend (Spring Boot)**:
      - **Unitarias**: JUnit 5 + Mockito para dominio y servicios de aplicación.
      - **Integración**: Spring Boot Test + Testcontainers (PostgreSQL real) para repositorios y controladores.
      - **Contrato**: validación de OpenAPI.
      - **Rendimiento**: JMeter o k6 para endpoints críticos.
      - **Seguridad**: OWASP ZAP para validar JWT y endpoints.
    - **Frontend (React Native)**:
      - **Unitarias**: Jest + React Native Testing Library para dominio, hooks y componentes.
      - **Integración**: Jest con repositorios mockeados y SQLite en memoria.
      - **E2E**: Detox o Maestro para flujos críticos (login, registro offline, sincronización, resumen).
      - **Rendimiento**: React DevTools Profiler y React Native DevTools para medir renderizado.
      - **Accesibilidad**: validación de tamaños táctiles, contraste y `fontScale`.
    - **Transversal**:
      - **Usabilidad**: pruebas con al menos 3 usuarios reales por funcionalidad crítica.
      - **Compatibilidad**: 3 dispositivos físicos propios + Crashlytics en producción (ADR-012).
      - **CI/CD**: GitHub Actions ejecutando pruebas unitarias e integración en cada PR; E2E en releases.
      - **Cobertura**: medir con JaCoCo (backend) y Jest Coverage (frontend); objetivo ≥ 70 % en dominio y aplicación.
    - **Métricas**:
      - Cobertura por capa.
      - Tiempo de ejecución de cada suite.
      - Tasa de fallos en CI/CD.
      - Defectos escapados a producción.
    - **Documentación**:
      - Guía de estilo para escribir pruebas.
      - Convención de nombres.
      - Estrategia de mocks y datos de prueba.

    Se descartan las pruebas manuales exclusivas por no escalables y la automatización total sin capas por lentitud y fragilidad. La estrategia de pruebas en capas es la opción que garantiza calidad, confiabilidad y velocidad en AgroTrack.