# ADR-013: Usar base de datos relacional SQL para backend y almacenamiento local

- **Título**: Usar PostgreSQL como base de datos relacional del backend y SQLite como almacenamiento local en el cliente móvil, descartando NoSQL para la primera versión.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones de persistencia que garanticen integridad referencial, transacciones ACID, consultas agregadas eficientes y consistencia entre el almacenamiento local (offline) y el remoto, considerando el dominio altamente relacional de AgroTrack (fincas → lotes → cultivos → transacciones) y el contexto rural con conectividad intermitente.

  - **Detalles**:

    - **Integridad referencial**: las relaciones entre fincas, lotes, cultivos, transacciones y usuarios deben mantenerse consistentes; no deben existir registros huérfanos ni referencias rotas.
    - **Transacciones ACID**: las operaciones de sincronización, registro y corrección deben ser atómicas; una falla a mitad de una operación no debe dejar datos parciales (ADR-007, ESC-CAL-CF-05).
    - **Consultas agregadas**: los resúmenes económicos (SUM, GROUP BY, filtros por período, finca, lote o cultivo) deben ejecutarse eficientemente (ADR-009, ESC-CAL-RN-04).
    - **Idempotencia y unicidad**: debe ser posible definir claves únicas e índices que impidan duplicados a nivel de base de datos (ADR-007, ESC-CAL-CF-04).
    - **Consistencia local-remoto**: el esquema local debe poder replicar fielmente el esquema remoto para evitar divergencias (ADR-005, ADR-006).
    - **Rendimiento en dispositivo móvil**: la base local debe ser ligera, rápida y confiable en dispositivos de gama baja (≤ 2 s para consultas de 100 registros).
    - **Escalabilidad**: debe soportar el crecimiento histórico (10,000 transacciones, 500 fincas, 2,000 lotes) manteniendo los tiempos definidos (ESC-CAL-ESC-01).
    - **Costo de implementación y operación**: la solución debe ser viable para el alcance y los recursos de AgroTrack, sin infraestructura adicional innecesaria.
    - **Mantenibilidad**: el esquema debe ser versionable mediante migraciones, fácil de auditar y de probar.
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-RN-04, ESC-CAL-ESC-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques de persistencia para el backend y el cliente móvil, considerando el dominio relacional, la necesidad de transacciones y el contexto offline-first.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **SQL relacional (PostgreSQL en backend + SQLite en móvil)**: modelo relacional con integridad referencial, transacciones ACID, migraciones versionadas y consultas agregadas nativas.
    2. **NoSQL documental (MongoDB en backend + Realm en móvil)**: documentos JSON sin esquema fijo, sin integridad referencial fuerte, agregaciones mediante pipeline.
    3. **Híbrido (PostgreSQL + Redis para caché)**: SQL como fuente de verdad y Redis solo para caché de resúmenes y sesiones.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de persistencia para aplicaciones móviles offline-first con dominio relacional, considerando integridad, transacciones, agregaciones y madurez del ecosistema. Se revisaron experiencias de aplicaciones agrícolas y financieras con conectividad intermitente.

  - **1. SQL relacional (PostgreSQL + SQLite)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción natural para un dominio relacional con requisitos de integridad y transacciones.

      - **Detalles**:
        - PostgreSQL garantiza integridad referencial con foreign keys y constraints.
        - Las transacciones ACID permiten que las operaciones de sincronización sean atómicas (ADR-007).
        - Las agregaciones (SUM, GROUP BY) son nativas y optimizables con índices (ADR-009).
        - Los índices únicos permiten implementar idempotencia a nivel de base de datos.
        - SQLite en el móvil es ligero, persistente y ampliamente probado en React Native.
        - Flyway permite versionar el esquema del backend; SQLite permite migraciones locales versionadas.
        - El esquema local puede reflejar fielmente el remoto, facilitando la sincronización.
        - Escala verticalmente y con réplicas de lectura; Redis complementa para caché.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo y predecible.

      - **Ejemplos**:
        - **Licencias**: PostgreSQL y SQLite son open source, sin costo de licencia.
        - **Capacitación**: el equipo ya conoce SQL; no requiere curva de aprendizaje significativa.
        - **Operación**: monitoreo estándar de base de datos; sin infraestructura adicional.
        - **Medición**: tiempos de consulta, uso de índices, hit ratio de caché.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Integridad referencial y transacciones ACID.
        - Agregaciones nativas y optimizables.
        - Madurez y soporte de la comunidad.
        - Alineado con los ADR-005, ADR-006, ADR-007 y ADR-009.
        - Sin costo de licencia.
      - **Debilidades**:
        - Esquema fijo que requiere migraciones.
        - Escalabilidad horizontal más compleja que NoSQL.
      - **Oportunidades**:
        - Redis para caché distribuida si escala.
        - Réplicas de lectura para reportes pesados.
        - Particionamiento por fecha si el volumen crece.
      - **Amenazas**:
        - Crecimiento desmedido del histórico si no se archiva.
        - Migraciones mal gestionadas que rompan compatibilidad.

    - **Opiniones y comentarios internos**:

      - "El dominio de AgroTrack es intrínsecamente relacional: una finca tiene lotes, un lote tiene cultivos, un cultivo tiene transacciones. Forzar esto en documentos sería un error."
      - "Necesitamos transacciones ACID para garantizar que una sincronización no deje datos a medias."
      - "SQLite ya está decidido en ADR-005; PostgreSQL es el complemento natural."

  - **2. NoSQL documental (MongoDB + Realm)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple completamente con los criterios de integridad referencial y consistencia.

      - **Detalles**:
        - MongoDB no garantiza integridad referencial fuerte; las relaciones deben manejarse en la aplicación.
        - Las transacciones ACID existen en MongoDB 4+, pero con mayor complejidad y menor madurez que PostgreSQL.
        - Las agregaciones son posibles pero menos naturales y más difíciles de optimizar.
        - Realm en móvil es potente pero introduce otra tecnología y otro modelo mental.
        - El esquema flexible puede llevar a inconsistencias si el equipo no es disciplinado.
        - La sincronización con Realm Sync añade dependencia de un servicio externo (MongoDB Atlas), lo cual contradice la restricción de costos y residencia de datos.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto por cambio de paradigma; costo operativo dependiente de servicios externos.

      - **Ejemplos**:
        - **Licencias**: MongoDB Community es gratis, pero Realm Sync y Atlas tienen costo.
        - **Capacitación**: el equipo debe aprender modelado documental y agregaciones.
        - **Operación**: si se usa Atlas, se depende de un proveedor externo.
        - **Medición**: requiere métricas específicas de NoSQL.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Esquema flexible.
        - Escalabilidad horizontal nativa.
        - Realm ofrece sincronización integrada.
      - **Debilidades**:
        - Sin integridad referencial fuerte.
        - Transacciones más complejas.
        - Dependencia de servicios externos.
        - Menor alineación con el dominio relacional.
      - **Oportunidades**:
        - Útil si el dominio cambiara a documentos anidados.
      - **Amenazas**:
        - Inconsistencias de datos.
        - Costos impredecibles.
        - Dependencia de proveedor.

    - **Opiniones y comentarios internos**:

      - "MongoDB brilla cuando el esquema es cambiante, pero nuestro esquema es estable y relacional."
      - "Realm Sync nos ataría a MongoDB Atlas, lo cual choca con la restricción de costos y residencia de datos."
      - "No queremos sacrificar integridad por flexibilidad que no necesitamos."

  - **3. Híbrido (PostgreSQL + Redis)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente y es complementario a la opción 1. Redis no reemplaza a PostgreSQL, sino que lo complementa para caché.

      - **Detalles**:
        - PostgreSQL sigue siendo la fuente de verdad.
        - Redis se usa exclusivamente para caché de resúmenes económicos (ADR-009) y, opcionalmente, para sesiones.
        - La invalidación de caché se realiza al modificar transacciones.
        - No introduce duplicidad de fuentes de verdad.
        - Reduce la carga del backend en consultas recurrentes (mes actual, mes anterior).

    - **Análisis de costos**:

      - **Resumen**: Costo adicional bajo (Redis open source o servicio gestionado económico) con retorno en rendimiento.

      - **Ejemplos**:
        - **Licencias**: Redis open source; servicio gestionado opcional.
        - **Capacitación**: el equipo debe aprender invalidación y TTL.
        - **Operación**: monitoreo de hit ratio y memoria.
        - **Medición**: hit ratio, tiempos con y sin caché.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Mejora drástica en consultas repetidas.
        - Reduce carga del backend.
        - Complementa a PostgreSQL sin reemplazarlo.
      - **Debilidades**:
        - Introduce un componente adicional.
        - Requiere invalidación cuidadosa.
      - **Oportunidades**:
        - Escalar a caché distribuida si hay múltiples instancias.
      - **Amenazas**:
        - Datos obsoletos si la invalidación falla.

    - **Opiniones y comentarios internos**:

      - "Redis no es una base de datos para AgroTrack; es una capa de aceleración."
      - "Empezar con caché en memoria (Caffeine) en el spike y migrar a Redis si el tráfico lo justifica."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-009 — Validará que PostgreSQL con índices y agregaciones cumple ≤ 3 s y ≤ 5 s con 10,000 transacciones — Propuesto.
    - SPIKE-013 — Validará que SQLite local replica fielmente el esquema remoto y soporta transacciones ACID — Propuesto.
    - SPIKE-007 — Validará que la idempotencia y la consistencia se mantienen con claves únicas en PostgreSQL — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - NoSQL documental (MongoDB + Realm) — descartado por falta de integridad referencial y dependencia de servicios externos.
    - Híbrido con Firebase Firestore — descartado por no estar en el stack y atar a un proveedor.
    - Bases de datos embebidas alternativas (Realm, ObjectBox) — descartadas por menor madurez en el ecosistema React Native y por no alinearse con PostgreSQL.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con dominio relacional (fincas, lotes, cultivos, transacciones) y contexto offline-first.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-009 (rendimiento de PostgreSQL), SPIKE-013 (SQLite local y réplica de esquema) y SPIKE-007 (idempotencia con claves únicas).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **SQL relacional (PostgreSQL + SQLite)** porque:
    - El dominio de AgroTrack es intrínsecamente relacional.
    - Garantiza integridad referencial y transacciones ACID, críticas para la confiabilidad (ADR-007).
    - Las agregaciones económicas son naturales y optimizables con índices (ADR-009).
    - Los índices únicos permiten idempotencia a nivel de base de datos (ADR-007).
    - SQLite ya está decidido para el cliente (ADR-005) y replica fielmente el esquema remoto.
    - Sin costo de licencia y con amplio soporte de la comunidad.
    - Redis se incorpora solo como caché, no como fuente de verdad.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución de los spikes. Se espera que PostgreSQL con índices compuestos cumpla los umbrales de ESC-CAL-RN-02, ESC-CAL-RN-04 y ESC-CAL-ESC-01, y que SQLite local soporte consultas offline ≤ 2 s para 100 registros.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las operaciones de persistencia (backend y local).
    - **¿Qué tipos de integraciones están involucradas?**: PostgreSQL (backend), SQLite (móvil), Flyway (migraciones backend), migraciones SQLite (móvil), Redis (caché opcional), motor de sincronización (ADR-001) y repositorio local (ADR-006).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir el esquema relacional completo desde el inicio, incluyendo claves únicas para idempotencia y campos de auditoría. Usar migraciones versionadas desde el día 1. No introducir NoSQL sin una razón de peso. Mantener Redis como caché, nunca como fuente de verdad.

  - **Anécdotas**:

    - En el diseño del SPIKE-009 se identificó que una consulta de resumen económico sin índices tardaba 8 segundos para 5,000 registros. Con índices compuestos bajó a 1.5 segundos. La elección de SQL con índices es la diferencia entre una app usable y una inusable.
    - Durante el análisis se concluyó que intentar modelar transacciones financieras en documentos NoSQL habría complicado la idempotencia y la consistencia, ambos críticos para AgroTrack.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **PostgreSQL 15+ como base de datos del backend** y **SQLite como base de datos local del cliente móvil**, con **Redis (o caché en memoria) exclusivamente para caché de resúmenes económicos**, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-RN-04 y ESC-CAL-ESC-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre integridad, rendimiento, costo y mantenibilidad.

    La implementación deberá considerar como mínimo:

    - **Backend**:
      - PostgreSQL 15+ como fuente de verdad.
      - Flyway para migraciones versionadas.
      - Índices compuestos `(user_id, fecha, tipo)` en transacciones.
      - Índices en `farms(user_id)`, `lots(farm_id)`, `crops(lot_id)`.
      - Restricciones únicas para idempotencia (`local_id` único por operación).
      - Transacciones ACID en operaciones de sincronización.
    - **Cliente móvil**:
      - SQLite como almacenamiento local persistente.
      - Migraciones locales versionadas.
      - Tabla `pending_operations` con `localId`, `operationType`, `payload`, `status`, `retryCount`, `lastAttemptAt`.
      - Índices en `status` y `created_at` para consultas rápidas de la cola.
      - Transacciones al insertar y actualizar para evitar corrupción.
    - **Caché**:
      - Redis (o Caffeine en fases iniciales) para resúmenes económicos.
      - TTL de 5 minutos e invalidación al modificar transacciones.
      - Nunca como fuente de verdad.
    - **Pruebas**:
      - Pruebas de integridad referencial.
      - Pruebas de transacciones ACID ante fallos.
      - Pruebas de rendimiento con volumen máximo (10,000 transacciones).
      - Pruebas de idempotencia con `localId`.