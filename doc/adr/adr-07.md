# ADR-007: Garantizar idempotencia y consistencia en sync

- **Título**: Garantizar idempotencia, consistencia de cálculos y conservación ante interrupción.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones que aseguren que los cálculos dependientes de datos modificados se actualizan correctamente, que las operaciones de sincronización son idempotentes (evitando duplicados), y que los registros no confirmados se conservan si la sincronización se interrumpe.

  - **Detalles**:

    - **Consistencia de cálculos**: en el 100 % de las modificaciones evaluadas, los cálculos posteriores deben utilizar el valor actualizado.
    - **Sincronización idempotente**: después de N reintentos sobre el mismo registro, debe existir exactamente 1 registro correspondiente en el almacenamiento remoto.
    - **Conservación ante interrupción**: el 100 % de los registros no confirmados debe permanecer almacenado localmente y marcado como pendiente.
    - **Reintento confiable**: el sistema debe identificar registros pendientes, conservar sus identificadores originales, evitar duplicados y actualizar el estado local solo después de recibir confirmación.
    - **Costo de implementación**: la solución debe ser viable con el stack actual y no requerir infraestructura adicional.
    - **Escenarios de calidad relacionados**: ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cuatro enfoques combinando estrategias de cálculo, idempotencia y conservación ante interrupción. Los candidatos se agrupan en dos dimensiones: cómo se manejan los cálculos tras modificaciones, y cómo se maneja la sincronización ante reintentos e interrupciones.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Cálculos bajo demanda sin invalidación de caché**: los resultados se calculan solo al consultar, sin invalidar resultados previos. Riesgo de mostrar datos antiguos.
    2. **Cálculos con invalidación de caché y recálculo automático**: al modificar un dato, se invalidan los resultados dependientes y se recalculan al consultar, mediante servicios centralizados que siempre leen de la fuente actualizada.
    3. **Sincronización sin idempotencia**: cada reintento envía el registro como nuevo, generando duplicados en el backend.
    4. **Sincronización idempotente con identificadores únicos**: el backend usa una clave de idempotencia (ej. `localId`) para reconocer solicitudes previamente procesadas y rechazar duplicados. La cola persistente conserva los registros no confirmados en estado `PENDING`.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de idempotencia en APIs, manejo de colas persistentes con confirmación explícita, y estrategias de invalidación de caché. Se identificó que la idempotencia y la conservación ante interrupción son los dos puntos críticos para evitar pérdida y duplicación de datos.

  - **1. Cálculos bajo demanda sin invalidación de caché**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con el criterio de consistencia de cálculos.

      - **Detalles**:
        - Si un cálculo se cachea y luego se modifica el dato subyacente, el resultado cacheado queda obsoleto.
        - El usuario puede ver un resultado que no refleja los cambios recientes.
        - No hay invalidación automática, por lo que el problema se acumula con el tiempo.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero alto riesgo de datos incorrectos.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: bajo costo técnico, pero alto riesgo de reclamos.
        - **Medición**: se requiere monitoreo de resultados obsoletos.

    - **Análisis FODA**:

      - **Fortalezas**: implementación trivial.
      - **Debilidades**: muestra datos obsoletos, no cumple consistencia.
      - **Oportunidades**: ninguna.
      - **Amenazas**: decisiones erróneas del usuario basadas en datos viejos.

    - **Opiniones y comentarios internos**:

      - "No podemos mostrar un resultado que no refleje los últimos cambios. El campesino tomaría decisiones equivocadas".

  - **2. Cálculos con invalidación de caché y recálculo automático**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con el criterio de consistencia de cálculos.

      - **Detalles**:
        - Al modificar un gasto o ingreso, se invalidan los resultados dependientes.
        - El siguiente cálculo se hace leyendo la fuente de datos actualizada.
        - Se implementa mediante servicios centralizados que agrupan la lógica de negocio.
        - Las funciones de cálculo siempre leen de la fuente de datos actualizada.
        - No se cachean resultados que dependan de datos que cambian con frecuencia, o se invalidan explícitamente.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, con alto retorno en confiabilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe centralizar la lógica de cálculo.
        - **Operación**: requiere monitoreo de invalidaciones de caché.
        - **Medición**: se puede medir la frecuencia de recálculos.

    - **Análisis FODA**:

      - **Fortalezas**: datos siempre frescos, lógica centralizada, fácil de probar.
      - **Debilidades**: requiere disciplina para invalidar caché correctamente.
      - **Oportunidades**: la lógica centralizada puede reutilizarse en otros módulos.
      - **Amenazas**: si se olvida invalidar, se muestran datos obsoletos.

    - **Opiniones y comentarios internos**:

      - "Los servicios de cálculo centralizados son la base para que todo sea consistente".
      - "Es más fácil invalidar caché explícitamente que calcular todo en tiempo real".

  - **3. Sincronización sin idempotencia**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con el criterio de sincronización idempotente.

      - **Detalles**:
        - Cada reintento envía el registro como si fuera nuevo.
        - Si el backend no reconoce duplicados, se crean múltiples registros idénticos.
        - Esto es especialmente peligroso con retry y backoff (ADR-001), porque los reintentos son parte del diseño.
        - Genera datos inconsistentes y confunde al usuario.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero altísimo costo de corrección de datos duplicados.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: requiere limpieza manual de duplicados.
        - **Medición**: se puede medir la cantidad de duplicados generados.

    - **Análisis FODA**:

      - **Fortalezas**: implementación trivial.
      - **Debilidades**: genera duplicados, corrompe datos, contradice ADR-001.
      - **Oportunidades**: ninguna.
      - **Amenazas**: pérdida de confianza del usuario al ver registros duplicados.

    - **Opiniones y comentarios internos**:

      - "Sin idempotencia, los reintentos son un peligro. No podemos implementar retry y backoff sin idempotencia".

  - **4. Sincronización idempotente con identificadores únicos**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con los criterios de idempotencia, conservación y reintento confiable.

      - **Detalles**:
        - Cada registro local tiene un `localId` único (UUID).
        - El cliente envía siempre el mismo `localId` en cada reintento.
        - El backend almacena el `localId` como clave de idempotencia.
        - Si recibe un `localId` que ya procesó, devuelve la misma respuesta sin crear un nuevo registro.
        - La cola persistente conserva los registros en estado `PENDING` hasta recibir confirmación explícita del backend.
        - Solo después de la confirmación, el registro pasa a `SYNCED`.
        - Si la conexión se interrumpe antes de la confirmación, el registro permanece en `PENDING` y se reintenta.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, con el mayor retorno en confiabilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe implementar la verificación de `localId` en el backend.
        - **Operación**: requiere monitoreo de registros en `PENDING` y de reintentos.
        - **Medición**: se puede medir la cantidad de duplicados evitados y el tiempo promedio de sincronización.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Elimina duplicados por reintentos.
        - Conserva registros no confirmados.
        - Se integra naturalmente con el retry y backoff de ADR-001.
        - Confiable y auditable.
      - **Debilidades**:
        - Requiere que el backend soporte la clave de idempotencia.
        - Requiere una cola persistente bien diseñada (ADR-005).
      - **Oportunidades**:
        - El mismo mecanismo puede aplicarse a otros tipos de operaciones.
        - Se puede extender con versionado de registros en el futuro.
      - **Amenazas**:
        - Si el backend no verifica correctamente el `localId`, se pierde la idempotencia.
        - Si la cola persistente se corrompe, se pierden registros no confirmados.

    - **Opiniones y comentarios internos**:

      - "La idempotencia es obligatoria. Sin ella, los reintentos son un peligro".
      - "El `localId` es la clave. El backend debe reconocerlo y no crear duplicados".
      - "Los registros no confirmados deben quedarse en PENDING hasta que el servidor diga 'recibido'. No antes".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-007 — Validará que los cálculos se actualizan tras modificar un dato, que 5 reintentos con el mismo `localId` generan 1 solo registro, y que los registros no confirmados permanecen en `PENDING` tras una interrupción — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Cálculos sin invalidación de caché (descartado por mostrar datos obsoletos).
    - Sincronización sin idempotencia (descartado por generar duplicados).
    - Bloqueo pesimista y versionado optimista (descartados por complejidad innecesaria para el alcance actual).

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, offline-first, con sincronización automática.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-007, que probará la consistencia de cálculos, la idempotencia con `localId` y la conservación ante interrupción.

  - **¿Por qué elegiste al ganador?**:

    - Porque la combinación de servicios de cálculo centralizados + `localId` como clave de idempotencia + cola persistente con confirmación explícita cumple los cuatro escenarios (CF-03, CF-04, CF-05, INT-03).
    - Porque se integra naturalmente con el retry y backoff definidos en ADR-001.
    - Porque evita duplicados y pérdida de datos sin requerir infraestructura adicional.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Se implementarán servicios de cálculo centralizados, `localId` en el backend como clave de idempotencia, y una cola persistente con confirmación explícita. Pendiente de ejecución del spike.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las operaciones de sincronización y de los cálculos económicos.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con ADR-001 (retry y backoff), ADR-005 (cola persistente), ADR-006 (repositorio local) y el backend de AgroTrack.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Implementar idempotencia desde el día 1; no es opcional cuando hay reintentos. Definir el `localId` como UUID generado en el cliente y nunca reutilizado.

  - **Anécdotas**:

    - En el diseño del SPIKE-007 se identificó que sin idempotencia un reintento puede crear múltiples registros idénticos, corrompiendo los cálculos económicos y confundiendo al usuario.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **servicios de cálculo centralizados con invalidación de caché**, **identificadores únicos locales (`localId`) como clave de idempotencia en el backend**, y una **cola persistente con confirmación explícita** que solo marca los registros como `SYNCED` tras recibir confirmación del servidor, cumpliendo con los escenarios ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre consistencia, confiabilidad y costo.

    La implementación deberá considerar como mínimo:

    - Servicios de cálculo centralizados que siempre lean de la fuente de datos actualizada.
    - Invalidación de caché al modificar datos que afectan cálculos.
    - `localId` (UUID) generado en el cliente para cada operación.
    - Backend con verificación de `localId` como clave de idempotencia.
    - Cola persistente que conserva registros en `PENDING` hasta confirmación.
    - Transición de `PENDING` a `SYNCED` solo tras recibir confirmación del servidor.
    - Backoff exponencial y Circuit Breaker (ADR-001) para manejar interrupciones.
    - Pruebas de consistencia de cálculos, idempotencia y conservación ante interrupción.

    Se descartan los cálculos sin invalidación de caché por mostrar datos obsoletos, y la sincronización sin idempotencia por generar duplicados. La combinación de servicios centralizados, `localId` y cola persistente es la opción que garantiza consistencia y confiabilidad en AgroTrack.