# ADR-015: Usar REST como estilo de comunicación entre cliente y servidor

- **Título**: Usar REST con JSON sobre HTTPS como estilo principal de comunicación entre la aplicación móvil y el backend, descartando GraphQL, gRPC, WebSockets y SSE en la primera versión.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar el estilo de comunicación cliente-servidor que mejor equilibre simplicidad, interoperabilidad, rendimiento, costo, madurez del ecosistema y compatibilidad con el contexto offline-first de AgroTrack, considerando que no se requiere comunicación en tiempo real ni streaming continuo.

  - **Detalles**:

    - **Simplicidad**: el estilo debe ser fácil de entender, implementar, probar y mantener por el equipo.
    - **Interoperabilidad**: debe funcionar correctamente sobre redes rurales inestables y con proxies, firewalls y operadores móviles.
    - **Compatibilidad con offline-first**: debe integrarse sin fricción con el motor de sincronización (ADR-001), la cola de pendientes (ADR-005) y el repositorio local (ADR-006, ADR-013).
    - **Rendimiento**: debe permitir consultas y sincronización dentro de los tiempos definidos (ESC-CAL-RN-02, ESC-CAL-RN-04).
    - **Seguridad**: debe soportar autenticación con tokens (ADR-011) y cifrado en tránsito (TLS).
    - **Costo de implementación y operación**: la solución debe ser viable con el stack actual (Spring Boot + React Native) sin infraestructura adicional.
    - **Mantenibilidad**: debe permitir versionado de API, documentación clara y evolución controlada.
    - **Escalabilidad**: debe soportar cientos de dispositivos reconectando simultáneamente sin degradar el servicio (ESC-CAL-ESC-01).
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-SEG-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cinco estilos de comunicación comunes en aplicaciones móviles con backend, considerando las necesidades reales de AgroTrack.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **REST con JSON sobre HTTPS**: endpoints HTTP con verbos estándar (GET, POST, PUT, DELETE), respuestas JSON y códigos de estado HTTP.
    2. **GraphQL**: un único endpoint que permite al cliente solicitar exactamente los datos que necesita mediante consultas tipadas.
    3. **gRPC**: comunicación binaria con Protocol Buffers sobre HTTP/2, orientada a alto rendimiento y contratos fuertes.
    4. **WebSockets**: canal bidireccional persistente para comunicación en tiempo real.
    5. **Server-Sent Events (SSE)**: canal unidireccional servidor → cliente para streaming de eventos.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de comunicación en aplicaciones móviles offline-first con conectividad intermitente. Se revisaron experiencias de equipos que adoptaron GraphQL y gRPC, y se analizó la viabilidad de WebSockets y SSE en redes rurales inestables.

  - **1. REST con JSON sobre HTTPS**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es el estilo más simple y compatible con el contexto de AgroTrack.

      - **Detalles**:
        - HTTP es universalmente soportado por operadores móviles, proxies y firewalls.
        - Los verbos y códigos de estado son estándar y ampliamente comprendidos.
        - Se integra naturalmente con Spring Boot (`@RestController`) y con Axios en React Native.
        - Es compatible con autenticación JWT (ADR-011) y TLS.
        - Permite caché HTTP estándar (ETag, Cache-Control) y paginación.
        - La sincronización offline se realiza con POST a endpoints idempotentes (ADR-007).
        - El versionado se maneja con prefijos de URL (`/api/v1/...`).
        - No requiere infraestructura adicional ni conexiones persistentes.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, costo operativo bajo, sin licencias adicionales.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo ya conoce REST.
        - **Operación**: monitoreo estándar de endpoints.
        - **Medición**: tiempos de respuesta por endpoint, tasa de errores.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Simplicidad y universalidad.
        - Compatible con proxies y redes inestables.
        - Integración natural con Spring Boot y Axios.
        - Fácil de versionar y documentar (OpenAPI/Swagger).
        - Sin infraestructura adicional.
      - **Debilidades**:
        - Puede haber sobre-fetching o under-fetching.
        - Múltiples round-trips para vistas complejas.
      - **Oportunidades**:
        - OpenAPI para generar clientes y documentación.
        - Caché HTTP para reducir tráfico.
        - Paginación y filtros por query params.
      - **Amenazas**:
        - Mal diseño de endpoints que genere acoplamiento.
        - Falta de versionado que rompa compatibilidad.

    - **Opiniones y comentarios internos**:

      - "REST es lo que el equipo ya sabe usar. No necesitamos reinventar la rueda."
      - "La sincronización offline encaja perfecto con POST idempotentes."
      - "No tenemos casos de uso de tiempo real que justifiquen WebSockets."

  - **2. GraphQL**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente, pero introduce complejidad que no se justifica para el alcance actual.

      - **Detalles**:
        - Permite al cliente solicitar exactamente los datos que necesita, reduciendo sobre-fetching.
        - Sin embargo, introduce un nuevo paradigma (esquema, resolvers, queries, mutations) que el equipo debe aprender.
        - La caché es más compleja que en REST; requiere librerías especializadas.
        - La idempotencia y la sincronización offline no son tan naturales como con REST.
        - El versionado de esquemas es más complejo.
        - Añade una capa de infraestructura (servidor GraphQL) sobre Spring Boot.
        - El beneficio principal (evitar sobre-fetching) no es crítico en AgroTrack, donde las vistas son simples y bien conocidas.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto por curva de aprendizaje; costo operativo medio.

      - **Ejemplos**:
        - **Licencias**: GraphQL es open source, sin costo.
        - **Capacitación**: el equipo debe aprender esquemas, resolvers y herramientas.
        - **Operación**: monitoreo más complejo (queries por resolver).
        - **Medición**: requiere métricas específicas de GraphQL.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Consultas flexibles y tipadas.
        - Un solo endpoint.
        - Documentación autogenerada (GraphiQL).
      - **Debilidades**:
        - Curva de aprendizaje.
        - Caché compleja.
        - Sobre-ingeniería para vistas simples.
        - No aporta ventajas claras sobre REST en este dominio.
      - **Oportunidades**:
        - Útil si el número de clientes y vistas crece mucho.
      - **Amenazas**:
        - Complejidad innecesaria que retrase el desarrollo.
        - Problemas de rendimiento si las queries no se optimizan.

    - **Opiniones y comentarios internos**:

      - "GraphQL brilla cuando hay muchos clientes con necesidades diversas. Nosotros tenemos un solo cliente móvil."
      - "No queremos añadir complejidad sin beneficio claro."

  - **3. gRPC**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de simplicidad e interoperabilidad en el contexto de AgroTrack.

      - **Detalles**:
        - gRPC usa HTTP/2 y Protocol Buffers, lo cual no es soportado nativamente por React Native sin puentes nativos.
        - Requiere generar stubs y manejar contratos `.proto`, añadiendo complejidad.
        - No es compatible con navegadores ni con todos los proxies.
        - Aunque es eficiente en binario, el beneficio no es relevante para el volumen de datos de AgroTrack.
        - La integración con Spring Boot es posible pero no tan natural como REST.
        - La sincronización offline no se beneficia de gRPC.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto por integración con React Native; costo operativo medio.

      - **Ejemplos**:
        - **Licencias**: gRPC es open source, sin costo.
        - **Capacitación**: el equipo debe aprender Protocol Buffers y herramientas.
        - **Operación**: monitoreo más complejo.
        - **Medición**: métricas específicas de gRPC.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Alto rendimiento y bajo consumo de ancho de banda.
        - Contratos fuertes y tipados.
      - **Debilidades**:
        - Soporte limitado en React Native.
        - No compatible con navegadores.
        - Complejidad innecesaria para el volumen de AgroTrack.
      - **Oportunidades**:
        - Útil si en el futuro se requiere comunicación entre microservicios.
      - **Amenazas**:
        - Retraso en el desarrollo por problemas de integración.

    - **Opiniones y comentarios internos**:

      - "gRPC es para microservicios, no para una app móvil con backend monolítico."
      - "El ahorro de ancho de banda no justifica la complejidad."

  - **4. WebSockets**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de simplicidad ni de compatibilidad con redes rurales inestables.

      - **Detalles**:
        - WebSockets mantiene una conexión persistente que se rompe frecuentemente en redes móviles inestables.
        - Requiere reconexión, heartbeat y manejo de estados, añadiendo complejidad.
        - No hay casos de uso de tiempo real en AgroTrack: la sincronización se puede hacer con polling o al recuperar conectividad (ADR-001, ADR-006).
        - Aumenta el consumo de batería y datos.
        - Introduce una superficie de ataque adicional.
        - La integración con Spring Boot requiere configuración específica.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto; costo operativo alto por conexiones persistentes.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe aprender manejo de conexiones persistentes.
        - **Operación**: monitoreo de conexiones activas y reconexiones.
        - **Medición**: métricas de conexiones y mensajes.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Comunicación bidireccional en tiempo real.
      - **Debilidades**:
        - Frágil en redes inestables.
        - Mayor consumo de recursos.
        - Complejidad de reconexión.
        - No hay caso de uso que lo justifique.
      - **Oportunidades**:
        - Útil si en el futuro se añaden notificaciones en tiempo real.
      - **Amenazas**:
        - Conexiones caídas que confundan al usuario.
        - Consumo excesivo de batería.

    - **Opiniones y comentarios internos**:

      - "En zonas rurales la conexión aparece y desaparece; una conexión persistente es una mala idea."
      - "No necesitamos tiempo real; con sincronización automática al recuperar red es suficiente."

  - **5. Server-Sent Events (SSE)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de simplicidad ni de necesidad real.

      - **Detalles**:
        - SSE es unidireccional (servidor → cliente) y requiere una conexión HTTP persistente.
        - Tiene los mismos problemas que WebSockets en redes inestables.
        - No hay casos de uso que requieran streaming continuo desde el servidor.
        - La sincronización se puede lograr con polling o al recuperar conectividad.
        - Añade complejidad sin beneficio claro.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio; costo operativo medio-alto.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe aprender manejo de streams.
        - **Operación**: monitoreo de conexiones.
        - **Medición**: métricas de eventos enviados.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Streaming unidireccional simple.
      - **Debilidades**:
        - Frágil en redes inestables.
        - No hay caso de uso.
        - Complejidad innecesaria.
      - **Oportunidades**:
        - Útil si se añaden notificaciones push desde el servidor.
      - **Amenazas**:
        - Consumo de recursos sin beneficio.

    - **Opiniones y comentarios internos**:

      - "SSE es para dashboards en tiempo real, no para una app offline-first."
      - "No queremos conexiones persistentes en el campo."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-015 — Validará que REST con JSON es suficiente para sincronización, consultas y autenticación sin necesidad de otros estilos — Propuesto.
    - SPIKE-001 — Validará que la sincronización offline funciona con POST idempotentes sobre REST — Propuesto.
    - SPIKE-009 — Validará que las consultas REST con paginación cumplen los tiempos definidos — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - GraphQL — descartado por complejidad innecesaria.
    - gRPC — descartado por falta de soporte nativo en React Native.
    - WebSockets — descartado por fragilidad en redes rurales.
    - SSE — descartado por falta de caso de uso.
    - Firebase Cloud Messaging — descartado por dependencia de proveedor externo.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, offline-first, con sincronización automática al recuperar conectividad.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-015 (validación de REST para sync, consultas y autenticación), SPIKE-001 (sync offline con POST idempotentes) y SPIKE-009 (rendimiento de consultas REST con paginación).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **REST con JSON sobre HTTPS** porque:
    - Es el estilo más simple y universalmente soportado.
    - Se integra naturalmente con Spring Boot y Axios.
    - Es compatible con proxies, firewalls y operadores móviles.
    - La sincronización offline encaja perfecto con POST idempotentes.
    - Permite autenticación JWT, caché HTTP y versionado.
    - No requiere conexiones persistentes ni infraestructura adicional.
    - No hay casos de uso de tiempo real que justifiquen WebSockets o SSE.
    - El equipo ya conoce REST, lo que reduce la curva de aprendizaje.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución de los spikes. Se espera que REST cumpla los tiempos definidos, que la sincronización offline funcione con POST idempotentes y que la autenticación JWT se integre sin problemas.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de la comunicación cliente-servidor.
    - **¿Qué tipos de integraciones están involucradas?**: Spring Boot (controladores REST), Axios (cliente HTTP en React Native), JWT (autenticación), SQLite (repositorio local), motor de sincronización (ADR-001), validación centralizada (ADR-002) y OpenAPI para documentación.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir los endpoints REST desde el inicio con OpenAPI. Usar versionado en la URL (`/api/v1/`). Diseñar endpoints idempotentes para sincronización. No introducir GraphQL ni WebSockets sin un caso de uso claro. Mantener las respuestas JSON simples y paginadas.

  - **Anécdotas**:

    - En el diseño del SPIKE-001 se comprobó que un POST idempotente con `localId` es suficiente para garantizar que N reintentos generen 1 solo registro. No se necesita nada más complejo.
    - Durante el análisis se concluyó que intentar mantener una conexión WebSocket en zonas rurales sería un error: la conexión se caería constantemente y el usuario vería errores.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **REST con JSON sobre HTTPS** como el estilo de comunicación entre la aplicación móvil y el backend, cumpliendo con los escenarios ESC-CAL-DP-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-RN-02, ESC-CAL-RN-04 y ESC-CAL-SEG-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre simplicidad, interoperabilidad, rendimiento y costo.

    La implementación deberá considerar como mínimo:

    - **Diseño de endpoints**:
      - Prefijo de versión: `/api/v1/...`.
      - Recursos REST para fincas, lotes, cultivos, transacciones, usuarios y sincronización.
      - Endpoints idempotentes para sincronización (`POST /api/v1/sync/transactions`).
      - Paginación con query params (`?page=1&size=20`).
      - Filtros por fecha, tipo, finca, lote y cultivo.
    - **Seguridad**:
      - Autenticación JWT en el header `Authorization: Bearer <token>`.
      - TLS obligatorio (HTTPS).
      - Interceptor en Axios para inyectar el token y manejar 401 (ADR-011).
    - **Documentación**:
      - OpenAPI/Swagger autogenerado con SpringDoc.
      - Contratos claros para el equipo móvil.
    - **Manejo de errores**:
      - Códigos de estado HTTP estándar (200, 201, 400, 401, 403, 404, 409, 500, 503).
      - Cuerpo de error estructurado con `code`, `message` y `details`.
    - **Idempotencia**:
      - Los endpoints de sincronización verifican `localId` y devuelven la misma respuesta en reintentos (ADR-007).
    - **Caché**:
      - Uso de ETag y Cache-Control para consultas de datos maestros.
      - Redis para caché de resúmenes económicos (ADR-009, ADR-013).
    - **Pruebas**:
      - Pruebas de integración con Spring Boot Test.