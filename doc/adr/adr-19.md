# ADR-019: Versionar el esquema de base de datos con migraciones automáticas

- **Título**: Usar Flyway en el backend y un mecanismo de migraciones versionadas en SQLite local para evolucionar el esquema de base de datos de forma controlada, reproducible y sin pérdida de datos, descartando migraciones manuales y esquemas sin versionado.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de evolución del esquema de base de datos que garantice que los cambios en el modelo de datos (nuevas tablas, columnas, índices o restricciones) se apliquen de forma controlada, reproducible y sin pérdida de datos, tanto en el backend (PostgreSQL) como en el cliente móvil (SQLite), considerando el contexto offline-first y la necesidad de mantener consistencia entre ambos esquemas.

  - **Detalles**:

    - **Reproducibilidad**: cada cambio en el esquema debe poder aplicarse de forma idéntica en cualquier entorno (desarrollo, pruebas, producción).
    - **Trazabilidad**: debe existir un historial de versiones aplicadas, con fecha, autor y descripción del cambio.
    - **Sin pérdida de datos**: las migraciones no deben eliminar ni corromper datos existentes.
    - **Atomicidad**: cada migración debe aplicarse dentro de una transacción; si falla, debe revertirse completamente.
    - **Consistencia local-remoto**: el esquema local (SQLite) debe evolucionar de forma paralela al remoto (PostgreSQL), manteniendo compatibilidad.
    - **Compatibilidad con offline-first**: las migraciones locales deben ejecutarse sin conexión y sin bloquear el uso de la aplicación (ESC-CAL-DP-01, ESC-CAL-DP-06).
    - **Mantenibilidad**: las migraciones deben ser fáciles de crear, revisar y probar.
    - **Costo de implementación y operación**: la solución debe ser viable con el stack actual (Spring Boot + React Native + PostgreSQL + SQLite).
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-01, ESC-CAL-DP-06, ESC-CAL-CF-03, ESC-CAL-CF-05, ESC-CAL-ESC-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias para gestionar la evolución del esquema de base de datos en backend y cliente móvil.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Migraciones manuales**: los cambios de esquema se aplican manualmente con scripts SQL ejecutados por el equipo, sin versionado ni control de orden.
    2. **Esquema sin versionado (Hibernate `ddl-auto=update`)**: Hibernate/JPA genera y actualiza el esquema automáticamente a partir de las entidades, sin control de versiones ni historial.
    3. **Migraciones versionadas automáticas (Flyway en backend + mecanismo versionado en SQLite local)**: cada cambio de esquema se define en un archivo de migración numerado, se aplica automáticamente al arrancar la aplicación y se registra en una tabla de historial.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de evolución de esquema en aplicaciones con backend relacional y cliente móvil offline-first, considerando la necesidad de mantener consistencia entre ambos esquemas y de aplicar cambios sin pérdida de datos. Se revisaron experiencias de equipos que usaron `ddl-auto=update` y sufrieron pérdidas de datos o inconsistencias.

  - **1. Migraciones manuales**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de reproducibilidad, trazabilidad ni atomicidad.

      - **Detalles**:
        - Depende de que alguien recuerde ejecutar el script correcto en el entorno correcto.
        - No hay historial de qué cambios se aplicaron ni cuándo.
        - Propenso a errores humanos: scripts olvidados, ejecutados dos veces o en orden incorrecto.
        - Difícil de reproducir en un entorno nuevo.
        - No hay garantía de atomicidad; un script puede dejar la base a medias.
        - En el cliente móvil es inviable: no se puede pedir al usuario que ejecute scripts.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero costo de operación altísimo por errores humanos y pérdida de datos.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere, pero el equipo debe ser disciplinado.
        - **Operación**: alto riesgo de inconsistencias entre entornos.
        - **Medición**: no hay métricas de migraciones aplicadas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Control total sobre cada cambio.
      - **Debilidades**:
        - Sin versionado ni trazabilidad.
        - Propenso a errores humanos.
        - Inviable en cliente móvil.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Pérdida de datos en producción.
        - Inconsistencias entre entornos.

    - **Opiniones y comentarios internos**:

      - "Ejecutar scripts a mano es una receta para el desastre."
      - "En el móvil no podemos pedirle al usuario que ejecute SQL."

  - **2. Esquema sin versionado (Hibernate `ddl-auto=update`)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de control, trazabilidad ni seguridad de datos.

      - **Detalles**:
        - Hibernate genera el esquema a partir de las entidades, pero no controla el orden ni la evolución.
        - Puede eliminar columnas o tablas si detecta que ya no están en las entidades, causando pérdida de datos.
        - No hay historial de cambios.
        - No es reproducible: el esquema generado puede variar entre versiones de Hibernate.
        - En el cliente móvil no aplica (SQLite no tiene `ddl-auto`).
        - Es una práctica desaconsejada en producción.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero costo de operación alto por pérdida de datos e inconsistencias.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: alto riesgo de pérdida de datos.
        - **Medición**: no hay control sobre los cambios.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Automatización total.
      - **Debilidades**:
        - Sin control ni trazabilidad.
        - Riesgo de pérdida de datos.
        - No reproducible.
        - Inviable en cliente móvil.
      - **Oportunidades**:
        - Útil solo en prototipos o entornos de desarrollo.
      - **Amenazas**:
        - Pérdida de datos en producción.
        - Inconsistencias entre entornos.

    - **Opiniones y comentarios internos**:

      - "`ddl-auto=update` es una bomba de tiempo en producción."
      - "No queremos que Hibernate decida qué columnas eliminar."

  - **3. Migraciones versionadas automáticas (Flyway + mecanismo en SQLite)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción estándar en aplicaciones empresariales y offline-first.

      - **Detalles**:
        - **Backend (Flyway)**:
          - Cada migración se define en un archivo numerado (`V1__init.sql`, `V2__add_notes.sql`, etc.).
          - Flyway aplica las migraciones en orden y registra el historial en `flyway_schema_history`.
          - Cada migración se ejecuta dentro de una transacción (en PostgreSQL, DDL es transaccional).
          - Si una migración falla, Flyway detiene el arranque y deja la base en el último estado consistente.
          - Reproducible en cualquier entorno.
        - **Cliente móvil (mecanismo versionado en SQLite)**:
          - Se usa `PRAGMA user_version` para rastrear la versión del esquema.
          - Cada migración se define como una función que se ejecuta si la versión actual es menor.
          - Las migraciones se ejecutan al arrancar la app, dentro de una transacción.
          - Si una migración falla, se revierte y se notifica al usuario.
          - No requiere conexión; se ejecuta localmente.
        - **Consistencia local-remoto**:
          - Los cambios de esquema se planifican en conjunto para mantener compatibilidad.
          - Las migraciones locales se empaquetan en la app; las remotas se aplican al desplegar.
        - **Trazabilidad**:
          - Historial en `flyway_schema_history` (backend) y `PRAGMA user_version` (móvil).
        - **Atomicidad**:
          - Transacciones en ambos lados.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo, retorno alto en confiabilidad.

      - **Ejemplos**:
        - **Licencias**: Flyway Community es open source; SQLite es open source.
        - **Capacitación**: el equipo debe aprender a crear migraciones y a versionarlas.
        - **Operación**: monitoreo de migraciones aplicadas.
        - **Medición**: número de migraciones aplicadas, tiempo de ejecución.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Reproducible, trazable y atómico.
        - Sin pérdida de datos.
        - Funciona sin conexión en el móvil.
        - Estándar en la industria.
        - Integración nativa con Spring Boot (Flyway) y SQLite (`user_version`).
      - **Debilidades**:
        - Requiere disciplina para crear migraciones correctamente.
        - Las migraciones mal escritas pueden causar problemas.
        - Requiere coordinación entre backend y frontend para mantener consistencia.
      - **Oportunidades**:
        - Automatizar la generación de migraciones a partir de diferencias de esquema.
        - Usar herramientas de comparación de esquemas.
        - Documentar el historial de cambios.
      - **Amenazas**:
        - Migraciones conflictivas entre entornos.
        - Falta de pruebas de migración que cause fallos en producción.

    - **Opiniones y comentarios internos**:

      - "Flyway es el estándar en Spring Boot. No hay razón para no usarlo."
      - "En el móvil, `PRAGMA user_version` es simple y efectivo."
      - "La clave es planificar las migraciones en conjunto para mantener consistencia."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-019 — Validará que Flyway en backend y `PRAGMA user_version` en SQLite aplican migraciones sin pérdida de datos y con atomicidad — Propuesto.
    - SPIKE-013 — Validará que SQLite local soporta migraciones versionadas y transacciones ACID — Propuesto.
    - SPIKE-016 — Validará que Flyway se integra correctamente con Spring Boot — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Migraciones manuales — descartadas por falta de reproducibilidad y trazabilidad.
    - `ddl-auto=update` de Hibernate — descartado por riesgo de pérdida de datos.
    - Liquibase — considerado como alternativa a Flyway, pero se prefirió Flyway por simplicidad y mejor integración con Spring Boot.
    - Room (Android nativo) — descartado por no aplicar a React Native.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-019 (migraciones versionadas), SPIKE-013 (SQLite local) y SPIKE-016 (Flyway con Spring Boot).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **migraciones versionadas automáticas (Flyway + `PRAGMA user_version`)** porque:
    - Es reproducible, trazable y atómico.
    - No pierde datos.
    - Funciona sin conexión en el móvil.
    - Es el estándar en la industria.
    - Se integra naturalmente con Spring Boot (Flyway) y SQLite (`user_version`).
    - Permite mantener consistencia entre esquema local y remoto.
    - Facilita la evolución del esquema a medida que AgroTrack crece.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que Flyway aplique migraciones sin pérdida de datos y que SQLite local evolucione con `PRAGMA user_version` sin corromper la base.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las operaciones de evolución de esquema.
    - **¿Qué tipos de integraciones están involucradas?**: Flyway (backend), Spring Boot (ADR-016), PostgreSQL (ADR-013), SQLite (ADR-005, ADR-013), React Native (ADR-017) y el motor de sincronización (ADR-001).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir la estrategia de migraciones desde el día 1. Planificar las migraciones locales y remotas en conjunto. Probar cada migración en un entorno limpio y en uno con datos. Documentar el historial de cambios. No usar `ddl-auto=update` en producción. Mantener las migraciones pequeñas y atómicas.

  - **Anécdotas**:

    - En el diseño del SPIKE-016 se confirmó que Flyway se integra con Spring Boot con solo añadir la dependencia y configurar la URL de la base.
    - Durante el análisis se concluyó que intentar migrar SQLite manualmente habría sido inviable en el móvil; `PRAGMA user_version` es simple y efectivo.
    - En el diseño del SPIKE-013 se confirmó que las migraciones en SQLite deben ejecutarse dentro de una transacción para evitar estados inconsistentes.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **migraciones versionadas automáticas** usando **Flyway en el backend** y un **mecanismo versionado con `PRAGMA user_version` en SQLite local**, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-06, ESC-CAL-CF-03, ESC-CAL-CF-05 y ESC-CAL-ESC-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre reproducibilidad, trazabilidad, atomicidad y costo.

    La implementación deberá considerar como mínimo:

    - **Backend (Flyway)**:
      - Añadir la dependencia `flyway-core` y `flyway-database-postgresql`.
      - Configurar la URL, usuario y contraseña de PostgreSQL en `application.yml`.
      - Crear migraciones en `src/main/resources/db/migration/` con nombres `V1__descripcion.sql`, `V2__descripcion.sql`, etc.
      - Habilitar `flyway.baseline-on-migrate=true` si la base ya existe.
      - No usar `ddl-auto=update` en Hibernate; usar `ddl-auto=validate`.
      - Registrar el historial en `flyway_schema_history`.
    - **Cliente móvil (SQLite)**:
      - Usar `PRAGMA user_version` para rastrear la versión del esquema.
      - Definir migraciones como funciones que se ejecutan si la versión actual es menor que la versión objetivo.
      - Ejecutar cada migración dentro de una transacción.
      - Si una migración falla, revertir y notificar al usuario.
      - Empaquetar las migraciones en la app; no requieren conexión.
      - Documentar cada migración con su versión y descripción.
    - **Consistencia local-remoto**:
      - Planificar las migraciones locales y remotas en conjunto.
      - Mantener compatibilidad de esquemas entre backend y frontend.
      - Documentar los cambios en un changelog compartido.
    - **Pruebas**:
      - Probar cada migración en un entorno limpio y en uno con datos.
      - Verificar atomicidad: si falla, la base queda en el estado anterior.
      - Verificar que no hay pérdida de datos.
      - Probar migraciones en los tres dispositivos Android.
    - **Documentación**:
      - Mantener un changelog de migraciones.
      - Documentar el procedimiento para crear una nueva migración.

    Se descartan las migraciones manuales por falta de reproducibilidad y trazabilidad, y `ddl-auto=update` por riesgo de pérdida de datos. Las migraciones versionadas automáticas son la opción que garantiza evolución controlada y confiable en AgroTrack.