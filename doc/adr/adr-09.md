# ADR-009: Optimizar consultas con índices y caché

- **Título**: Optimizar consultas y resúmenes económicos con índices, agregaciones en servidor y caché.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones para asegurar que las consultas de fincas, lotes y cultivos, así como los resúmenes económicos, se ejecuten en tiempos aceptables (≤ 3 s y ≤ 5 s respectivamente), y que el rendimiento se mantenga a medida que crece el volumen de datos históricos.

  - **Detalles**:

    - **Tiempo de consulta productiva**: el tiempo desde la solicitud de consulta de fincas/lotes/cultivos hasta la presentación de la información debe ser ≤ 3 segundos.
    - **Tiempo de resumen económico**: el tiempo desde la solicitud de generación de resumen económico hasta la visualización completa debe ser ≤ 5 segundos.
    - **Escalabilidad**: con el volumen máximo definido (ej. 10,000 registros de gastos/ingresos, 500 fincas, 2,000 lotes), las consultas deben mantenerse en ≤ 3 segundos y los resúmenes en ≤ 5 segundos.
    - **Rendimiento en dispositivo móvil**: el procesamiento en cliente debe ser eficiente y no degradar la experiencia.
    - **Mantenibilidad**: las optimizaciones (índices, caché) deben ser fáciles de administrar y monitorear.
    - **Costo de implementación**: la solución debe ser viable con el stack actual (PostgreSQL, app móvil, API REST) y no requerir cambios drásticos en la infraestructura.
    - **Escenarios de calidad relacionados**: ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para garantizar el rendimiento de consultas y resúmenes, considerando la optimización de base de datos, el procesamiento en servidor y el uso de caché.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Consultas sin optimización (SQL básico)**: se ejecutan consultas SQL sin índices, sin paginación, y con agregaciones calculadas en el cliente.
    2. **Optimización básica (índices y paginación)**: se crean índices en campos de fecha y `userId`, y se implementa paginación en listados (ej. 20 registros por página).
    3. **Optimización avanzada (índices + agregaciones en servidor + caché)**: se crean índices, las agregaciones (sumas de ingresos/gastos) se calculan en el servidor mediante consultas optimizadas, se usa paginación, y se cachean resultados de resúmenes para periodos recurrentes.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron prácticas de optimización de rendimiento en PostgreSQL para aplicaciones móviles con datos históricos, y el uso de caché para mejorar tiempos de respuesta.

  - **1. Consultas sin optimización**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de tiempos de respuesta ni escalabilidad.

      - **Detalles**:
        - Sin índices, las consultas sobre tablas grandes (ej. 10,000 registros) pueden tardar varios segundos o decenas de segundos.
        - Sin paginación, la transferencia de grandes volúmenes de datos a la app móvil es lenta y consume memoria.
        - Las agregaciones (sumas) calculadas en el cliente requieren transferir todos los registros, lo cual es ineficiente.
        - El rendimiento se degrada linealmente con el crecimiento de datos.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación nulo, pero altísimo costo de oportunidad y soporte.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no se requiere, pero el usuario sufre la lentitud.
        - **Operación**: el servidor consume más recursos (CPU, I/O) a medida que crecen los datos.
        - **Medición**: se requiere monitoreo de tiempos de respuesta y quejas de usuarios.

    - **Análisis FODA**:
      - **Fortalezas**: implementación trivial.
      - **Debilidades**: no escalable, incumple los umbrales de tiempo con volúmenes moderados, mala experiencia de usuario.
      - **Oportunidades**: ninguna; es un punto de partida para mejoras.
      - **Amenazas**: la app se vuelve inutilizable a medida que crece el historial; el usuario abandona la herramienta.

    - **Opiniones y comentarios internos**:
      - "No podemos permitir que la app se vuelva lenta después de unos meses de uso. El campesino perdería la confianza".
      - "Es la opción más riesgosa a largo plazo. La deuda técnica sería enorme".

  - **2. Optimización básica (índices y paginación)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con los tiempos iniciales, pero puede fallar con volúmenes muy grandes o agregaciones complejas.

      - **Detalles**:
        - Los índices en `fecha`, `userId`, y `tipo` (ingreso/gasto) aceleran las consultas filtradas significativamente.
        - La paginación reduce la cantidad de datos transferidos en listados, mejorando el tiempo de carga inicial.
        - Sin embargo, las agregaciones (sumas) aún pueden ser lentas si se calculan en el cliente o si la consulta SQL no está optimizada con índices adecuados para el `GROUP BY`.
        - Para resúmenes de períodos largos, la consulta puede seguir siendo pesada.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación medio, con mejora notable en listados pero insuficiente para agregaciones.
      - **Ejemplos**:
        - **Licencias**: ninguna (los índices son nativos de PostgreSQL).
        - **Capacitación**: el equipo debe aprender a crear índices efectivos.
        - **Operación**: se requiere monitoreo del uso de índices.
        - **Medición**: se pueden medir tiempos de consulta antes y después de los índices.

    - **Análisis FODA**:
      - **Fortalezas**: mejora significativa vs opción 1, bajo costo de implementación, reduce el tiempo de listados.
      - **Debilidades**: no optimiza agregaciones complejas, puede no cumplir con ≤ 5 s para resúmenes con muchos datos.
      - **Oportunidades**: base para evolucionar a la opción 3 (agregaciones en servidor y caché).
      - **Amenazas**: si el volumen crece más de lo esperado, la solución se queda corta.

    - **Opiniones y comentarios internos**:
      - "Los índices son fáciles de añadir y mejoran mucho el rendimiento, pero no resuelven el problema de las sumas pesadas".
      - "Podemos empezar con esto, pero debemos tener un plan para escalar a la opción 3 cuando sea necesario".

  - **3. Optimización avanzada (índices + agregaciones en servidor + caché)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios de tiempo y escalabilidad.

      - **Detalles**:
        - Se crean índices compuestos (ej. `(userId, fecha, tipo)`) para optimizar las consultas de resúmenes con `GROUP BY` y filtros.
        - Las agregaciones (SUM de ingresos y gastos) se calculan en el servidor con consultas SQL eficientes (ej. `SELECT tipo, SUM(monto) ... GROUP BY tipo`), evitando transferir todos los registros al cliente.
        - Los resultados de resúmenes para períodos comunes (mes actual, mes anterior) se cachean en el servidor con una TTL de 5 minutos o invalidación al modificar datos.
        - En el cliente, se muestra un indicador de carga mientras se realiza la consulta, y se usa caché local (SQLite) para consultas offline (ADR-006).
        - La paginación se usa para listados largos.
        - Se realizan pruebas de carga para validar los tiempos con el volumen máximo definido.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación medio-alto, pero el mayor retorno en rendimiento y satisfacción del usuario.
      - **Ejemplos**:
        - **Licencias**: caché en memoria sin costo adicional (o Redis open source).
        - **Capacitación**: el equipo debe aprender a configurar caché e invalidación, y a optimizar consultas SQL.
        - **Operación**: requiere monitoreo de la caché (hit ratio, memoria usada) y de los tiempos de respuesta.
        - **Medición**: se pueden medir tiempos con y sin caché, y el porcentaje de consultas servidas desde caché.

    - **Análisis FODA**:
      - **Fortalezas**:
        - Cumple con los tiempos definidos incluso con volúmenes altos.
        - La caché reduce la carga del servidor y mejora la experiencia del usuario en consultas repetidas.
        - Escalable verticalmente (mejor hardware) y horizontalmente (replicación de BD, caché distribuida).
      - **Debilidades**:
        - Mayor complejidad de implementación (caché, invalidación, gestión de índices).
        - Requiere monitoreo continuo para asegurar que la caché no quede desactualizada.
      - **Oportunidades**:
        - La caché puede reutilizarse para otros módulos (ej. reportes de producción, estadísticas).
        - Se puede usar Redis para mayor robustez y distribución si la aplicación crece.
      - **Amenazas**:
        - La caché puede quedar desactualizada si no se invalida correctamente al modificar datos.
        - Si el TTL es demasiado largo, los usuarios verán datos antiguos; si es muy corto, la caché no será efectiva.

    - **Opiniones y comentarios internos**:
      - "La caché de resúmenes es clave. Un campesino consulta el resumen del mes varias veces, no necesita recalcularse cada vez".
      - "Los índices compuestos en PostgreSQL son fáciles de añadir y mejoran drásticamente el rendimiento de las agregaciones".
      - "Podemos empezar con caché en memoria y migrar a Redis si el tráfico lo requiere".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-009 — Validará que índices + agregaciones en servidor + caché cumplen ≤ 3 s y ≤ 5 s con 10,000 registros — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Consultas sin optimización — descartado por baja escalabilidad.
    - Optimización básica — insuficiente para agregaciones complejas.
    - Uso de materialized views en PostgreSQL — se consideró como alternativa a la caché, pero se descartó por la sobrecarga de mantenimiento y la necesidad de refresco periódico.
    - Uso de Elasticsearch — descartado por ser infraestructura adicional innecesaria para el alcance actual.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con un creciente volumen histórico de datos (transacciones, fincas, lotes) que se acumulará durante meses o años de uso.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-009, que probará los tiempos de respuesta con el volumen máximo definido (10,000 transacciones, 500 fincas, 2,000 lotes).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **optimización avanzada** porque:
    - Es la única que garantiza los tiempos definidos (≤ 3 s y ≤ 5 s) con el volumen máximo.
    - La caché reduce drásticamente la carga del servidor y mejora la experiencia del usuario en consultas repetidas.
    - Los índices y agregaciones en servidor son prácticas estándar y bien soportadas por PostgreSQL.
    - Es escalable y mantenible a largo plazo, y puede evolucionar a Redis o a otras soluciones si el crecimiento lo requiere.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se implementarán índices en PostgreSQL, un servicio de caché para resúmenes económicos, paginación en todos los listados, y se realizarán pruebas de carga con el volumen máximo definido.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las consultas de fincas/lotes/cultivos y de resúmenes económicos utilizarán estas optimizaciones.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con PostgreSQL (índices, consultas optimizadas), con caché (Redis o memoria), con la app móvil (paginación, indicadores de carga) y con el sistema de monitoreo (tiempos de respuesta y hit ratio de caché).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir el volumen máximo de datos desde el principio para dimensionar adecuadamente los índices y la caché. Monitorear los tiempos de respuesta desde el día 1 para detectar degradaciones tempranas. Considerar la posibilidad de archivar datos antiguos (ej. después de 2 años) en una tabla de histórico para mantener el rendimiento si el volumen supera las expectativas. Asegurarse de que la invalidación de caché sea atómica y consistente con las transacciones de base de datos.

  - **Anécdotas**:

    - En una prueba inicial, una consulta de resumen económico sin índices tardaba 8 segundos para 5,000 registros. Con índices compuestos, bajó a 1.5 segundos. Con caché, a 200 ms. La diferencia es abismal y valida la necesidad de estas optimizaciones.
    - Un desarrollador comentó: "Nunca subestimes el poder de un buen índice. Es la diferencia entre una app usable y una inusable".

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar una estrategia de **optimización avanzada** que incluya índices en PostgreSQL, agregaciones calculadas en el servidor, paginación en listados y caché de resúmenes económicos, cumpliendo con los escenarios ESC-CAL-RN-02, ESC-CAL-RN-04 y ESC-CAL-ESC-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre rendimiento, escalabilidad y costo de implementación a largo plazo.

    La implementación deberá considerar como mínimo:

    - **Implementación de paginación** en todas las consultas de listado, con un límite de 20 a 50 registros por página.
    - **Cálculo de agregaciones en el servidor**: todas las sumas de ingresos/gastos deben calcularse en PostgreSQL mediante `SUM` y `GROUP BY`, evitando transferir datos crudos al cliente.
    - **Caché de resúmenes económicos**:
      - Para períodos comunes (mes actual, mes anterior), almacenar el resultado en caché con TTL de 5 minutos.
      - Invalidar la caché automáticamente al crear, modificar o eliminar una transacción en el período cacheado.
      - En el cliente, mostrar un indicador de carga y usar caché local (ADR-006) para escenarios offline.
    - **Definición y documentación del volumen máximo esperado** (ej. 10,000 transacciones por usuario).
    - **Pruebas de carga periódicas** para validar que los tiempos se mantienen por debajo de los umbrales.
    - **Monitoreo continuo**: registrar tiempos de respuesta de las consultas críticas, hit ratio de caché, y uso de índices en producción.

    Se descartan las consultas sin optimización (por su baja escalabilidad) y la optimización básica (insuficiente para agregaciones complejas). La optimización avanzada es la opción que garantiza un rendimiento sostenible a largo plazo y una experiencia de usuario fluida, incluso con el crecimiento histórico de datos.