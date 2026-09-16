# ADR-005: Registrar offline con SQLite y cola de pendientes

- **Título**: Registrar información básica sin conexión con almacenamiento local persistente y cola de pendientes, para cumplir con el escenario de calidad ESC-CAL-DP-01.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones que permitan al usuario registrar información básica (ej. gastos, ingresos, seguimientos) cuando el dispositivo no tiene conexión a Internet, garantizando que los datos se almacenen localmente, se marquen como pendientes de sincronización y se comunique claramente al usuario su estado.

  - **Detalles**:

    - **Disponibilidad offline**: el sistema debe permitir el registro completo de información sin conexión a Internet, incluyendo validaciones de formulario.
    - **Persistencia local**: el 100 % de los registros confirmados correctamente debe almacenarse en el dispositivo local.
    - **Feedback al usuario**: el usuario debe recibir una confirmación clara de que el registro fue guardado localmente y quedará sincronizado automáticamente cuando haya conexión.
    - **Estado de pendiente**: el registro debe marcarse como "pendiente de sincronización" y estar visible en la cola de operaciones locales.
    - **Integridad de datos**: no debe haber pérdida de información incluso si la aplicación se cierra o el dispositivo se apaga antes de sincronizar.
    - **Consistencia con validaciones**: las validaciones de formulario (ADR-002) deben funcionar sin conexión utilizando reglas centralizadas.
    - **Experiencia de usuario**: el flujo de registro sin conexión debe ser idéntico al flujo con conexión, excepto por el mensaje de confirmación de almacenamiento local.
    - **Costo de implementación**: la solución debe ser viable con el stack actual y aprovechar el motor de sincronización offline definido en el ADR-001.
    - **Escenario de calidad relacionado**: ESC-CAL-DP-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para manejar el registro de información cuando el dispositivo está sin conexión, considerando la experiencia de usuario y la confiabilidad de los datos.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Bloquear el registro sin conexión**: el sistema impide registrar información si no hay conexión, mostrando un mensaje de error.
    2. **Registro offline con almacenamiento temporal (no confirmado)**: el sistema permite registrar pero no confirma al usuario que el dato está seguro; solo se almacena en un buffer temporal y se pierde si la app se cierra.
    3. **Registro offline-first completo**: el sistema permite el registro sin conexión, almacena el dato en una base de datos local (ej. SQLite, Room), lo marca como pendiente, muestra una confirmación explícita ("Guardado localmente, se sincronizará automáticamente"), y lo agrega a la cola de sincronización definida en ADR-001.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de aplicaciones offline-first, la importancia de la retroalimentación inmediata al usuario, y el rol de la cola de operaciones pendientes en la sincronización confiable.

  - **1. Bloquear el registro sin conexión**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de disponibilidad, que es el requisito principal del escenario.

      - **Detalles**:
        - Impide completamente al usuario registrar información en zonas sin cobertura, lo cual es el principal problema que AgroTrack debe resolver.
        - El usuario queda frustrado y puede abandonar la aplicación.
        - No aprovecha la arquitectura offline-first que ya se decidió en ADR-001.
        - El mensaje de error ("No hay conexión, intente más tarde") no resuelve el problema.

    - **Análisis de costos**:
      - **Resumen**: Bajo costo de implementación, pero alto costo de oportunidad y pérdida de usuarios.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: se requiere explicar al usuario por qué no puede registrar en ciertos lugares.
        - **Operación**: baja complejidad técnica, pero alta insatisfacción.
        - **Medición**: cantidad de usuarios que abandonan la pantalla al ver el error de conexión.

    - **Análisis FODA**:
      - **Fortalezas**: implementación trivial, no requiere almacenamiento local.
      - **Debilidades**: inutiliza la aplicación en el contexto rural, contradice el objetivo de AgroTrack.
      - **Oportunidades**: ninguna.
      - **Amenazas**: abandono masivo de la aplicación.

    - **Opiniones y comentarios internos**:
      - "Esto es exactamente lo que no queremos. AgroTrack debe funcionar donde el campesino necesita, no donde hay señal".

  - **2. Registro offline con almacenamiento temporal (no confirmado)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con la disponibilidad, pero falla en la integridad de datos y el feedback al usuario.

      - **Detalles**:
        - Permite al usuario escribir información, pero no se confirma explícitamente que está guardada de forma segura.
        - Los datos pueden perderse si la aplicación se cierra inesperadamente (crash, cierre manual, batería baja).
        - El usuario no sabe si su registro quedó guardado o no, lo que genera incertidumbre.
        - No se integra con la cola de sincronización definida en ADR-001.

    - **Análisis de costos**:
      - **Resumen**: Costo medio, pero alto riesgo de pérdida de datos y desconfianza.
      - **Ejemplos**:
        - **Licencias**: puede usar almacenamiento en memoria o AsyncStorage simple.
        - **Capacitación**: el usuario debe confiar en que el dato se guardó, sin evidencia clara.
        - **Operación**: riesgoso, los datos pueden perderse.
        - **Medición**: tasa de pérdida de datos reportada por usuarios.

    - **Análisis FODA**:
      - **Fortalezas**: permite registro offline básico.
      - **Debilidades**: no garantiza la persistencia, no da feedback claro, no se integra con la sincronización.
      - **Oportunidades**: podría evolucionar a la opción 3.
      - **Amenazas**: pérdida de datos, frustración del usuario, soporte adicional.

    - **Opiniones y comentarios internos**:
      - "No podemos dejar al usuario en un limbo de 'no sé si se guardó'. Eso es casi peor que bloquearlo".

  - **3. Registro offline-first completo**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios de disponibilidad, integridad, feedback y consistencia.

      - **Detalles**:
        - Permite el registro sin conexión utilizando el mismo flujo que cuando hay conexión.
        - Los datos se almacenan inmediatamente en una base de datos local persistente (ej. SQLite, Room).
        - El sistema asigna un identificador único local al registro.
        - El registro se añade a la cola de operaciones pendientes (definida en ADR-001).
        - Se muestra un mensaje de confirmación claro al usuario: "¡Guardado localmente! Se sincronizará automáticamente cuando tengas conexión".
        - El registro aparece visiblemente en la interfaz como "pendiente" (ej. con un ícono de reloj o bandera).
        - Las validaciones de formulario (ADR-002) se aplican localmente con las reglas centralizadas.
        - Cuando se recupera la conexión, el motor de sincronización (ADR-001) procesa automáticamente la cola.
        - El usuario puede cerrar la aplicación y el registro permanece almacenado de forma segura.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación medio-alto, pero el más alto retorno en confiabilidad y experiencia de usuario.
      - **Ejemplos**:
        - **Licencias**: bases de datos locales (SQLite, Realm) son gratuitas.
        - **Capacitación**: baja, porque el usuario no necesita hacer nada especial; el sistema es transparente.
        - **Operación**: requiere monitoreo de la cola de pendientes y de los estados de los registros.
        - **Medición**: se puede medir la cantidad de registros offline exitosos y el tiempo promedio de sincronización.

    - **Análisis FODA**:
      - **Fortalezas**:
        - Disponibilidad total en cualquier situación de conectividad.
        - Persistencia garantizada de los datos.
        - Feedback claro y tranquilizador para el usuario.
        - Integración natural con la arquitectura definida en ADR-001 y ADR-002.
        - El usuario percibe la aplicación como robusta y confiable.
      - **Debilidades**:
        - Mayor complejidad de implementación (base de datos local, cola de pendientes, manejo de estados).
        - Requiere un buen diseño de la capa de persistencia.
        - El usuario debe entender el concepto de "pendiente de sincronización" (educación sutil mediante UI).
      - **Oportunidades**:
        - La misma base de datos local puede usarse para otras funcionalidades (historial, caché de datos maestros).
        - Se puede mostrar un contador de registros pendientes en la pantalla principal para dar visibilidad.
      - **Amenazas**:
        - Si la base de datos local se corrompe (raro, pero posible), los registros offline se pierden.
        - Si el usuario desinstala la aplicación antes de sincronizar, los datos se pierden.
        - (Estos riesgos se mitigan con políticas de respaldo y advertencias al desinstalar).

    - **Opiniones y comentarios internos**:
      - "Esta es la solución que realmente resuelve el problema del campesino. Es el corazón de AgroTrack".
      - "La base de datos local es nuestra 'caja fuerte' mientras no hay internet. Y el motor de sincronización es el cartero que entrega los datos cuando vuelve la luz".
      - "El mensaje de confirmación debe ser muy claro, quizá con un ícono de escudo o candado para dar sensación de seguridad".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-005 — Validará que el registro offline persiste, se encola y muestra feedback claro — Propuesto.
    - SPIKE-006 — Validará que los datos sobreviven al cierre y reapertura de la app — Propuesto.
    - SPIKE-007 — Validará que los registros no confirmados se conservan ante interrupción — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Bloquear el registro sin conexión — descartado por inutilizar la app en zonas rurales.
    - Almacenamiento temporal no confirmado — descartado por riesgo de pérdida de datos.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, en zonas rurales sin cobertura.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante los spikes SPIKE-005, SPIKE-006 y SPIKE-007, que probarán la persistencia, el feedback al usuario y la conservación de registros no confirmados.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **registro offline-first completo** porque:
    - Es la única opción que cumple con el requisito de disponibilidad (100 % de uso offline).
    - Garantiza la integridad de los datos mediante almacenamiento local persistente.
    - Proporciona feedback claro y tranquilizador al usuario.
    - Se integra perfectamente con el motor de sincronización (ADR-001) y las validaciones (ADR-002).
    - Es la solución estándar y probada en aplicaciones similares.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución de los spikes. Se espera que los registros offline se almacenen en SQLite, se encolen y se sincronicen automáticamente al recuperar la conexión. El mensaje de confirmación debe aparecer en el 100 % de los casos.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los registros realizados sin conexión utilizarán este flujo.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con la base de datos local (SQLite o equivalente), con el motor de sincronización (ADR-001) para procesar la cola de pendientes, con el sistema de validación de formularios (ADR-002), con el sistema de autenticación (asociar el registro al usuario autenticado) y con el sistema de feedback al usuario (toasts, snackbars, indicadores visuales).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir la cola de pendientes y el esquema de la base de datos local desde el día 1, para evitar migraciones costosas. Incluir un indicador visual claro (ícono de reloj o bandera) junto a los registros pendientes. Asegurarse de que el mensaje de confirmación sea conciso y tranquilizador. Considerar la posibilidad de advertir al usuario si intenta desinstalar la app con registros pendientes.

  - **Anécdotas**:

    - En el diseño del SPIKE-005 se aprendió que el mensaje "Guardado localmente" tranquiliza al usuario; sin él, duda si se guardó.
    - También se identificó que un indicador visual (reloj, bandera) ayuda al usuario a entender que el registro está pendiente sin necesidad de explicaciones técnicas.
    - Se observó que el usuario puede confundir "pendiente de sincronización" con "error"; conviene usar un lenguaje positivo.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar el **registro offline-first completo**, utilizando una base de datos local persistente y la cola de operaciones pendientes definida en ADR-001, con un feedback claro al usuario que confirme el almacenamiento local y el estado de pendiente de sincronización, cumpliendo con el escenario ESC-CAL-DP-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre disponibilidad, integridad de datos, experiencia de usuario y alineación con la arquitectura definida.

    La implementación deberá considerar como mínimo:

    - Una base de datos local (SQLite, Realm o similar) para almacenar los registros offline.
    - Una tabla `pending_operations` con los campos: `localId` (UUID), `operationType` (GASTO, INGRESO), `payload` (JSON), `createdAt` (timestamp), `status` (PENDING, SYNCED, ERROR), `retryCount` y `lastAttemptAt`.
    - Asignación de un `localId` único a cada registro offline.
    - Validación de formulario sin conexión utilizando las reglas centralizadas (ADR-002).
    - Mensaje de confirmación claro al usuario: "¡Guardado localmente! Se sincronizará automáticamente cuando tengas conexión".
    - Indicador visual (ícono de reloj, bandera o punto naranja) junto a los registros pendientes en las listas.
    - Integración con el motor de sincronización (ADR-001) para procesar la cola al recuperar la conectividad.
    - Manejo de errores de sincronización: si falla, el registro permanece en la cola y se reintenta con backoff exponencial.
    - Pruebas de integridad para garantizar que los registros no se pierden al cerrar la aplicación.
    - Un mecanismo de purga o archivo de registros sincronizados para evitar que la base local crezca indefinidamente.

    Se descarta bloquear el registro offline por su contradicción con el objetivo principal de AgroTrack, y el almacenamiento temporal por su falta de garantía de persistencia. El registro offline-first completo es la opción que convierte a AgroTrack en una herramienta verdaderamente útil en el contexto rural.