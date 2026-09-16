# ADR-001: Implementar sincronización offline con retry y backoff

- **Título**: Implementar sincronización offline con retry y backoff para operaciones registradas sin conexión.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones que permitan a los campesinos trabajar sin conexión, garantizando que los datos generados en modo offline se sincronicen de forma fiable y sin duplicados al recuperar la conectividad.

  - **Detalles**:

    - **Consistencia de datos**: el 100 % de las operaciones registradas sin conexión debe conservarse y sincronizarse sin pérdida.
    - **Resiliencia**: manejo de errores transitorios como timeouts, pérdida de conexión y redes inestables.
    - **Experiencia de usuario**: sincronización automática en segundo plano, sin bloquear el uso de la aplicación.
    - **Prevención de duplicados**: las operaciones deben procesarse de manera idempotente; N reintentos deben generar exactamente 1 registro remoto.
    - **Costo de implementación y operación**: la solución debe ser viable para el alcance y los recursos de AgroTrack.
    - **Escalabilidad**: soporte para cientos de dispositivos reconectando simultáneamente sin degradar el servicio.
    - **Mantenibilidad**: facilidad para monitorear, probar y modificar el mecanismo de sincronización.
    - **Escenario de calidad relacionado**: ESC-CAL-DP-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques comunes para la sincronización de datos en aplicaciones móviles con conectividad intermitente.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Sincronización manual (Pull)**: el usuario inicia la sincronización mediante un botón.
    2. **Sincronización automática con reintentos y backoff exponencial**: el sistema detecta la conexión disponible y sincroniza las operaciones pendientes en segundo plano, aplicando reintentos controlados.
    3. **Sincronización híbrida (Pull + Push)**: combina sincronizaciones periódicas iniciadas por el cliente con notificaciones del backend para solicitar sincronizaciones.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se realizó una investigación sobre patrones de sincronización para sistemas distribuidos y aplicaciones móviles, considerando estrategias como Offline-first, sincronización incremental, colas de operaciones pendientes, idempotencia y mecanismos de resiliencia como Retry with Backoff y Circuit Breaker.

  - **1. Sincronización manual (Pull)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple completamente con los criterios establecidos. Aunque es sencilla de implementar, depende directamente de que el usuario recuerde ejecutar la sincronización.

      - **Detalles**:

        - No garantiza que el usuario sincronice la información después de recuperar la conexión.
        - Traslada al campesino una responsabilidad que debería manejar automáticamente el sistema.
        - Puede provocar acumulación de operaciones pendientes.
        - No proporciona por sí sola un mecanismo adecuado para manejar errores transitorios.
        - La experiencia de usuario es inferior frente a una solución automática.

    - **Análisis de costos**:

      - **Resumen**: Presenta un costo inicial bajo, pero puede generar costos indirectos asociados con soporte, errores de usuario y pérdida de confianza en la aplicación.

      - **Ejemplos**:

        - **Licencias**: no requiere licencias adicionales.
        - **Capacitación**: requiere explicar al usuario cuándo y cómo sincronizar.
        - **Operación**: bajo costo técnico, pero mayor dependencia del soporte al usuario.
        - **Medición**: requiere monitorear operaciones pendientes y errores de sincronización.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Implementación sencilla.
        - Bajo costo inicial.
        - Fácil de comprender desde el punto de vista técnico.

      - **Debilidades**:
        - Dependencia del usuario.
        - Mayor posibilidad de olvidar la sincronización.
        - Menor transparencia para el usuario.
        - No maneja automáticamente los errores de conectividad.

      - **Oportunidades**:
        - Puede utilizarse como mecanismo de sincronización manual complementario.
        - Puede servir como mecanismo de recuperación cuando una sincronización automática falle.

      - **Amenazas**:
        - Pérdida o retraso en la sincronización de información.
        - Frustración del usuario.
        - Pérdida de confianza en la aplicación.

    - **Opiniones y comentarios internos**:

      - "Nuestros usuarios son campesinos con poco tiempo; no podemos esperar que recuerden sincronizar manualmente".

      - Se considera que una solución que dependa constantemente de acciones manuales no está suficientemente alineada con el objetivo de simplificar el uso de AgroTrack.

  - **2. Sincronización automática con reintentos y backoff exponencial**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con los criterios principales y presenta el mejor equilibrio entre confiabilidad, experiencia de usuario, complejidad y costo.

      - **Detalles**:

        - Permite registrar información sin conexión.
        - Al recuperar la conectividad, el sistema puede procesar automáticamente las operaciones pendientes.
        - Utiliza una cola local para almacenar operaciones que todavía no han sido sincronizadas.
        - Implementa reintentos controlados ante errores transitorios.
        - El backoff exponencial evita realizar solicitudes repetitivas en intervalos demasiado cortos.
        - La idempotencia permite evitar duplicados cuando una operación se reintenta.
        - Puede incorporar Circuit Breaker para evitar sobrecargar el backend durante fallos prolongados.
        - No requiere que el usuario conozca el funcionamiento interno de la sincronización.

    - **Análisis de costos**:

      - **Resumen**: Presenta un costo de implementación medio, pero un costo operativo relativamente bajo debido a la automatización.

      - **Ejemplos**:

        - **Licencias**: puede implementarse utilizando tecnologías y bibliotecas disponibles dentro del stack de AgroTrack, sin necesidad de contratar una plataforma externa específica.
        - **Capacitación**: baja, debido a que el proceso es transparente para el usuario.
        - **Operación**: requiere monitoreo de errores, operaciones pendientes y fallos de sincronización.
        - **Medición**: requiere medir cantidad de reintentos, tiempo promedio de sincronización, operaciones fallidas y comportamiento durante reconexiones simultáneas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Alta resiliencia frente a interrupciones de conectividad.
        - Automatización del proceso.
        - Mejor experiencia de usuario.
        - Permite controlar los reintentos.
        - Puede prevenir duplicados mediante idempotencia.
        - No requiere infraestructura adicional compleja.

      - **Debilidades**:
        - Mayor complejidad que una sincronización manual.
        - Requiere diseñar correctamente la cola de operaciones.
        - La idempotencia debe implementarse correctamente.
        - Requiere pruebas específicas de fallos y reconexiones.

      - **Oportunidades**:
        - Puede ampliarse para manejar diferentes tipos de información.
        - Puede incorporar mecanismos de monitoreo y métricas.
        - Puede evolucionar posteriormente hacia estrategias de sincronización más avanzadas.

      - **Amenazas**:
        - Una configuración incorrecta del backoff podría generar demasiadas solicitudes.
        - Una gran cantidad de dispositivos reconectándose simultáneamente podría generar picos de tráfico.
        - Errores en la lógica de idempotencia podrían producir duplicados.

    - **Opiniones y comentarios internos**:

      - "Es la opción que mejor se alinea con los requisitos y atributos de calidad definidos para AgroTrack".

      - El equipo considera que la automatización reduce la carga cognitiva del campesino y permite que el sistema sea responsable de garantizar la sincronización.

  - **3. Sincronización híbrida (Pull + Push)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con los criterios, pero introduce una complejidad que no resulta necesaria para el alcance actual de AgroTrack.

      - **Detalles**:

        - El Pull permite que el dispositivo solicite las operaciones pendientes.
        - El Push podría permitir que el backend solicite una sincronización.
        - Puede proporcionar una sincronización más cercana al tiempo real.
        - Requiere mecanismos adicionales como WebSockets o servicios de notificaciones.
        - Aumenta la cantidad de componentes que deben mantenerse y monitorearse.
        - Actualmente AgroTrack no requiere que el backend fuerce una sincronización inmediata.

    - **Análisis de costos**:

      - **Resumen**: Presenta un costo mayor debido a la infraestructura y complejidad adicional.

      - **Ejemplos**:

        - **Licencias**: dependiendo de la tecnología utilizada, podría requerir servicios externos.
        - **Capacitación**: mayor conocimiento técnico para administrar canales de comunicación persistentes.
        - **Operación**: mayor cantidad de componentes que mantener y monitorear.
        - **Medición**: sería necesario controlar conexiones activas, consumo de recursos, mensajes enviados y fallos de comunicación.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Permite sincronización casi en tiempo real.
        - Puede responder rápidamente a cambios solicitados por el backend.
        - Puede reutilizarse posteriormente para notificaciones.

      - **Debilidades**:
        - Mayor complejidad.
        - Mayor consumo de recursos.
        - Requiere infraestructura adicional.
        - Mayor esfuerzo de mantenimiento.

      - **Oportunidades**:
        - Permite incorporar notificaciones en tiempo real.
        - Puede ser útil para futuras funcionalidades colaborativas.
        - Puede evolucionar hacia una arquitectura de comunicación más dinámica.

      - **Amenazas**:
        - Mayor superficie de ataque.
        - Dependencia de servicios adicionales.
        - Posibles problemas de conexiones persistentes en redes inestables.
        - Incremento del costo operativo.

    - **Opiniones y comentarios internos**:

      - "Es demasiado para la fase inicial; podemos iterar después si el negocio lo requiere".

      - El equipo considera que la complejidad adicional no está justificada mientras el principal problema sea garantizar la sincronización confiable de operaciones registradas sin conexión.

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-001 — Validará que la sincronización automática con retry, backoff e idempotencia no pierde ni duplica datos — Propuesto.
    - SPIKE-005 — Validará que el registro offline se almacena, se encola y se sincroniza al reconectar — Propuesto.
    - SPIKE-006 — Validará que la consulta offline, la persistencia y la detección de conectividad funcionan — Propuesto.
    - SPIKE-007 — Validará que los reintentos no generan duplicados y que los registros no confirmados se conservan — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Sincronización manual, sincronización híbrida Pull + Push, Message Brokers, WebSockets. Descartados por complejidad e infraestructura adicional.

  - **¿Qué estás creando?**:

    - Una aplicación **móvil orientada a campesinos**, diseñada para funcionar tanto con conexión como sin conexión.
    - **B2B o B2C**: B2C, orientada directamente al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final, no exclusivamente a empleados.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: inicialmente se implementará como una primera versión funcional, con criterios de calidad que permitan posteriormente utilizarla en producción.
    - **Monolito o microservicios**: inicialmente se utilizará una arquitectura monolítica para reducir la complejidad y facilitar el desarrollo y mantenimiento del sistema.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante los spikes SPIKE-001, SPIKE-005, SPIKE-006 y SPIKE-007, que probarán la estrategia en condiciones reales de pérdida y recuperación de conexión.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **sincronización automática con retry y backoff exponencial** porque proporciona el mejor equilibrio entre los criterios definidos.

    La solución permite que el usuario trabaje sin conexión, almacena las operaciones pendientes y las sincroniza automáticamente cuando la conectividad se recupera. Además, el uso de reintentos controlados permite manejar fallos transitorios sin exigir intervención del usuario.

    La incorporación de idempotencia permite reducir el riesgo de duplicados, mientras que el backoff exponencial disminuye la posibilidad de saturar el backend cuando múltiples dispositivos intentan reconectarse.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: En la primera implementación se espera que las operaciones registradas sin conexión permanezcan almacenadas localmente hasta que exista conectividad. Una vez recuperada la conexión, el motor deberá procesar automáticamente la cola de operaciones pendientes. El desempeño deberá comprobarse mediante pruebas que incluyan pérdida y recuperación de conexión, múltiples operaciones pendientes, errores del servidor y reconexiones simultáneas.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: Para las operaciones realizadas en modo offline, se espera que el 100 % de las operaciones pendientes utilicen el mecanismo de sincronización automática una vez que la funcionalidad sea implementada.
    - **¿Qué tipos de integraciones están involucradas?**: Almacenamiento local de la aplicación móvil, motor de sincronización, API/backend de AgroTrack, base de datos PostgreSQL, sistema de autenticación y mecanismos de registro y monitoreo de errores. No se considera necesario incorporar inicialmente un Message Broker, WebSockets u otra infraestructura de comunicación persistente.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Se recomienda comenzar con una implementación sencilla basada en cola local, idempotencia, retry y backoff exponencial, y medir su comportamiento antes de incorporar infraestructura adicional. Si posteriormente el número de usuarios aumenta considerablemente o aparece la necesidad de sincronización en tiempo real, se deberá realizar un nuevo análisis arquitectónico antes de introducir tecnologías como Message Brokers, WebSockets o servicios externos de Push.

  - **Anécdotas**:

    - Durante el análisis se identificó que una solución técnicamente más avanzada no necesariamente representa una mejor decisión arquitectónica para el contexto actual. En AgroTrack, incorporar WebSockets o un Message Broker desde la primera versión aumentaría la complejidad sin resolver una necesidad prioritaria.
    - También se identificó que el principal riesgo de una sincronización offline no consiste únicamente en detectar nuevamente la conexión, sino en garantizar que una misma operación no sea registrada varias veces debido a los reintentos. Por esta razón, la **idempotencia** se considera un elemento fundamental de la solución y deberá implementarse mediante un identificador único de operación que permita al backend reconocer solicitudes previamente procesadas.
    - En el diseño del SPIKE-001 se confirmó que el principal riesgo no es detectar la reconexión, sino evitar duplicados por reintentos.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar la **sincronización automática con retry y backoff exponencial** como mecanismo central de sincronización offline para AgroTrack.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre complejidad, costo, confiabilidad y experiencia de usuario.

    La implementación deberá considerar como mínimo:

    - Una cola local de operaciones pendientes.
    - Detección de recuperación de conectividad.
    - Procesamiento automático de operaciones pendientes.
    - Retry para errores transitorios.
    - Backoff exponencial para controlar la frecuencia de los reintentos.
    - Identificador único por operación.
    - Idempotencia en el backend para evitar duplicados.
    - Registro de errores y operaciones fallidas.
    - Mecanismo de Circuit Breaker para proteger el backend ante fallos prolongados o picos de reconexión.
    - Pruebas de carga y reconexión para validar el comportamiento ante múltiples dispositivos sincronizando simultáneamente.

    La sincronización manual podrá mantenerse como mecanismo complementario de recuperación, pero no como estrategia principal.

    La sincronización híbrida y el uso de Message Brokers quedan como alternativas para evaluar mediante futuros ADR si AgroTrack aumenta su escala o requiere sincronización en tiempo real.