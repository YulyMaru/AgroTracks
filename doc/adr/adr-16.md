# ADR-016: Usar Spring Boot 3 con Java 17 como stack del backend

- **Título**: Usar Spring Boot 3 con Java 17, PostgreSQL, Flyway, Spring Security, JWT y Spring Data JPA como stack tecnológico del backend, descartando Node.js/NestJS, Django y .NET Core.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar el stack tecnológico del backend que mejor equilibre robustez transaccional, madurez del ecosistema, seguridad, rendimiento, costo, mantenibilidad y disponibilidad de talento, considerando el dominio relacional de AgroTrack, la necesidad de transacciones ACID, la sincronización idempotente y la seguridad basada en JWT.

  - **Detalles**:

    - **Robustez transaccional**: debe soportar transacciones ACID, bloqueos, aislamiento y manejo de concurrencia para garantizar la integridad de los datos (ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05).
    - **Seguridad**: debe ofrecer mecanismos maduros para autenticación, autorización, cifrado y protección contra vulnerabilidades comunes (ESC-CAL-SEG-01).
    - **Rendimiento**: debe soportar consultas optimizadas, agregaciones y caché dentro de los tiempos definidos (ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01).
    - **Mantenibilidad**: debe permitir código limpio, modular, testeable y fácil de evolucionar.
    - **Ecosistema**: debe contar con librerías maduras para PostgreSQL, JWT, validación, migraciones, documentación OpenAPI y pruebas.
    - **Costo de implementación y operación**: la solución debe ser viable con el presupuesto y el equipo de AgroTrack.
    - **Curva de aprendizaje**: el equipo debe poder adoptarlo sin una inversión desproporcionada en capacitación.
    - **Escalabilidad**: debe permitir crecer vertical y horizontalmente si el proyecto lo requiere.
    - **Escenarios de calidad relacionados**: ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-CF-08, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-SEG-01, ESC-CAL-ESC-01, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cuatro stacks de backend ampliamente utilizados en aplicaciones móviles con dominio relacional y requisitos de seguridad.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Spring Boot 3 + Java 17**: framework maduro con inyección de dependencias, Spring Data JPA, Spring Security, SpringDoc, Flyway y ecosistema empresarial.
    2. **Node.js + NestJS + TypeScript**: framework progresivo con arquitectura modular, TypeORM/Prisma, Passport JWT y documentación Swagger.
    3. **Django + Python**: framework con ORM, migraciones, autenticación y panel administrativo integrados.
    4. **.NET Core + C#**: framework multiplataforma con Entity Framework Core, ASP.NET Identity y ecosistema Microsoft.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de backend para aplicaciones móviles offline-first con dominio relacional, considerando transacciones ACID, seguridad JWT, migraciones versionadas, documentación OpenAPI y disponibilidad de talento en el contexto de AgroTrack.

  - **1. Spring Boot 3 + Java 17**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción más madura para aplicaciones empresariales con requisitos de transacciones, seguridad y mantenibilidad.

      - **Detalles**:
        - Spring Data JPA abstrae el acceso a PostgreSQL y soporta transacciones declarativas con `@Transactional`.
        - Spring Security ofrece autenticación, autorización y JWT de forma madura y configurable (ADR-011).
        - Flyway se integra nativamente para migraciones versionadas (ADR-019).
        - SpringDoc genera OpenAPI/Swagger automáticamente (ADR-015).
        - Spring Cache y Redis se integran fácilmente para caché (ADR-009, ADR-013).
        - El ecosistema de pruebas (JUnit 5, Mockito, Testcontainers) es robusto.
        - La tipificación fuerte de Java reduce errores en tiempo de compilación.
        - El rendimiento es adecuado para el volumen de AgroTrack.
        - Existe amplio talento en el mercado hispanohablante.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, costo operativo bajo-medio, sin licencias.

      - **Ejemplos**:
        - **Licencias**: Spring Boot, Java y PostgreSQL son open source.
        - **Capacitación**: el equipo debe conocer Java y Spring; si no, requiere formación inicial.
        - **Operación**: monitoreo estándar con Actuator, Micrometer y Prometheus.
        - **Medición**: métricas de endpoints, transacciones y uso de recursos.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Madurez y estabilidad.
        - Transacciones ACID robustas.
        - Seguridad completa con Spring Security.
        - Ecosistema amplio (JPA, Flyway, SpringDoc, Actuator).
        - Tipificación fuerte.
        - Amplio talento disponible.
      - **Debilidades**:
        - Mayor consumo de memoria que Node.js.
        - Curva de aprendizaje inicial si el equipo no conoce Java.
        - Arranque más lento en desarrollo.
      - **Oportunidades**:
        - Spring Cloud si se migra a microservicios.
        - Spring Batch si se requieren procesos masivos.
        - Integración con Kafka si se añade mensajería.
      - **Amenazas**:
        - Configuración excesiva si no se disciplina el proyecto.
        - Dependencias transitivas que aumenten el tamaño del artefacto.

    - **Opiniones y comentarios internos**:

      - "Spring Boot es el estándar para backends empresariales. No hay razón para reinventarlo."
      - "La tipificación fuerte y las transacciones declarativas reducen errores en sincronización."
      - "El ecosistema de pruebas con Testcontainers nos permite validar PostgreSQL real."

  - **2. Node.js + NestJS + TypeScript**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente, pero con desventajas en robustez transaccional y tipificación en tiempo de ejecución.

      - **Detalles**:
        - NestJS ofrece arquitectura modular similar a Spring, con inyección de dependencias.
        - TypeORM/Prisma permiten acceso a PostgreSQL, pero las transacciones son más manuales que en Spring.
        - Passport JWT cubre autenticación, pero la seguridad es menos madura que Spring Security.
        - La documentación con Swagger es buena.
        - El rendimiento en I/O es excelente, pero el CPU single-thread limita cálculos pesados.
        - La tipificación de TypeScript desaparece en tiempo de ejecución, lo que puede generar errores no detectados.
        - El ecosistema es amplio pero menos maduro que Spring en el ámbito empresarial.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo si el equipo conoce TypeScript; costo operativo bajo.

      - **Ejemplos**:
        - **Licencias**: todas open source.
        - **Capacitación**: el equipo ya conoce TypeScript desde React Native.
        - **Operación**: monitoreo con herramientas estándar.
        - **Medición**: métricas de endpoints y uso de CPU.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Reutilización de TypeScript con el frontend.
        - Bajo consumo de memoria.
        - Ecosistema npm amplio.
      - **Debilidades**:
        - Transacciones menos robustas.
        - Seguridad menos madura que Spring Security.
        - Tipificación débil en runtime.
        - Menor madurez en el ámbito empresarial.
      - **Oportunidades**:
        - Útil si el equipo es 100 % JavaScript/TypeScript.
        - Bueno para prototipos rápidos.
      - **Amenazas**:
        - Bugs en producción por falta de tipificación fuerte.
        - Complejidad al manejar transacciones ACID.

    - **Opiniones y comentarios internos**:

      - "Compartir TypeScript con el frontend suena atractivo, pero el backend exige más rigor transaccional."
      - "Spring Security es más maduro que Passport para un dominio financiero."

  - **3. Django + Python**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente, pero con desventajas en rendimiento y tipificación.

      - **Detalles**:
        - Django ORM y migraciones son maduros.
        - Django REST Framework facilita APIs REST.
        - La autenticación es buena, pero JWT requiere librerías adicionales (djangorestframework-simplejwt).
        - Python es dinámico; la tipificación es opcional y menos fuerte.
        - El rendimiento es inferior a Java y Node.js en cargas concurrentes.
        - El ecosistema es amplio, pero menos orientado a aplicaciones empresariales móviles.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio; costo operativo medio.

      - **Ejemplos**:
        - **Licencias**: open source.
        - **Capacitación**: el equipo debe conocer Python y Django.
        - **Operación**: monitoreo estándar.
        - **Medición**: métricas de endpoints y uso de CPU.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Desarrollo rápido.
        - Panel administrativo integrado.
        - ORM maduro.
      - **Debilidades**:
        - Rendimiento inferior.
        - Tipificación dinámica.
        - Menor adecuación para transacciones complejas.
      - **Oportunidades**:
        - Útil para prototipos o herramientas internas.
      - **Amenazas**:
        - Cuellos de botella en cargas concurrentes.

    - **Opiniones y comentarios internos**:

      - "Django es excelente para MVPs, pero AgroTrack requiere más robustez transaccional."

  - **4. .NET Core + C#**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con la mayoría de los criterios, pero con desventajas en costo y ecosistema en el contexto del equipo.

      - **Detalles**:
        - ASP.NET Core es robusto y de alto rendimiento.
        - Entity Framework Core soporta transacciones ACID.
        - ASP.NET Identity cubre autenticación; JWT es soportado.
        - Swagger se integra con Swashbuckle.
        - La tipificación fuerte de C# es una ventaja.
        - Sin embargo, el ecosistema open source es menos amplio que el de Spring.
        - La disponibilidad de talento en el contexto de AgroTrack puede ser menor.
        - Algunas herramientas y librerías requieren licencias o suscripciones.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto por licencias y talento; costo operativo medio.

      - **Ejemplos**:
        - **Licencias**: algunas herramientas de Microsoft tienen costo.
        - **Capacitación**: el equipo debe conocer C# y .NET.
        - **Operación**: monitoreo con Application Insights (opcional).
        - **Medición**: métricas de endpoints y uso de recursos.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Alto rendimiento.
        - Tipificación fuerte.
        - Integración con Azure.
      - **Debilidades**:
        - Menor ecosistema open source.
        - Costos de licencias en algunas herramientas.
        - Menor disponibilidad de talento en el contexto local.
      - **Oportunidades**:
        - Útil si el equipo ya conoce .NET.
      - **Amenazas**:
        - Dependencia de Microsoft.
        - Costos imprevistos.

    - **Opiniones y comentarios internos**:

      - ".NET es potente, pero no queremos atarnos a un ecosistema propietario."
      - "El equipo tiene más experiencia en Java/Spring que en C#."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-016 — Validará que Spring Boot 3 con PostgreSQL, Flyway, Spring Security y JWT cubre todos los requisitos del backend — Propuesto.
    - SPIKE-009 — Validará que PostgreSQL con índices y agregaciones cumple los tiempos definidos — Propuesto.
    - SPIKE-011 — Validará en la app móvil el manejo de sesión con JWT (401, refresco y redirección) contra un backend simulado; la protección de endpoints con Spring Security se valida en SPIKE-016 — Propuesto.
    - SPIKE-015 — Validará que los endpoints REST se documentan con OpenAPI — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Node.js + NestJS — descartado por menor robustez transaccional y tipificación débil en runtime.
    - Django — descartado por rendimiento inferior y tipificación dinámica.
    - .NET Core — descartado por menor ecosistema open source y disponibilidad de talento.
    - Quarkus — descartado por menor madurez en el contexto del equipo.

  - **¿Qué estás creando?**:

    - Backend para aplicación móvil B2C para campesinos, con dominio relacional, transacciones ACID, sincronización idempotente y seguridad JWT.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-016 (stack completo), SPIKE-009 (rendimiento de PostgreSQL), SPIKE-011 (manejo de sesión JWT en la app) y SPIKE-015 (REST y OpenAPI).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **Spring Boot 3 + Java 17** porque:
    - Es el stack más maduro para aplicaciones empresariales con transacciones ACID.
    - Spring Security ofrece seguridad robusta y configurable.
    - Flyway, SpringDoc, Spring Data JPA y Spring Cache cubren todas las necesidades.
    - La tipificación fuerte de Java reduce errores en tiempo de compilación.
    - El ecosistema de pruebas (JUnit, Mockito, Testcontainers) es completo.
    - Amplio talento disponible en el mercado hispanohablante.
    - Sin costo de licencias.
    - Escalable vertical y horizontalmente.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que Spring Boot 3 con PostgreSQL, Flyway, Spring Security y JWT cubra todos los requisitos funcionales y no funcionales del backend.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las operaciones del backend.
    - **¿Qué tipos de integraciones están involucradas?**: PostgreSQL (base de datos), Flyway (migraciones), Spring Security + JWT (autenticación), SpringDoc (OpenAPI), Redis (caché), Spring Data JPA (persistencia), Actuator y Micrometer (monitoreo) y el cliente móvil React Native (consumo REST).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir la estructura modular por dominio desde el día 1 (fincas, cultivos, transacciones, sincronización, usuarios). Usar Flyway desde el inicio. Configurar Spring Security y JWT antes de implementar la primera funcionalidad. Aprovechar Spring Boot Actuator para monitoreo. Escribir pruebas con Testcontainers para validar PostgreSQL real.

  - **Anécdotas**:

    - En el diseño del SPIKE-015 se planteó como hipótesis que Spring Boot con SpringDoc genera OpenAPI sin esfuerzo adicional, lo que facilita la integración con el equipo móvil.
    - Durante el análisis se concluyó que intentar replicar las transacciones ACID de Spring en Node.js habría requerido más código y cuidado, aumentando el riesgo de errores en sincronización.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **Spring Boot 3 + Java 17** con **PostgreSQL 15+**, **Flyway**, **Spring Security + JWT**, **Spring Data JPA**, **SpringDoc OpenAPI** y **Redis (caché)** como stack del backend, cumpliendo con los escenarios ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-CF-08, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-SEG-01, ESC-CAL-ESC-01 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre robustez, seguridad, rendimiento, costo y mantenibilidad.

    La implementación deberá considerar como mínimo:

    - **Framework**: Spring Boot 3 sobre Java 17 (LTS).
    - **Build**: Maven (o Gradle).
    - **Persistencia**: Spring Data JPA + Hibernate sobre PostgreSQL 15+.
    - **Migraciones**: Flyway para versionar el esquema.
    - **Seguridad**: Spring Security + JWT con access token y refresh token.
    - **Documentación**: SpringDoc OpenAPI (Swagger UI).
    - **Caché**: Spring Cache + Redis.
    - **Validación**: reglas de formularios con el esquema JSON compartido (ADR-002) mediante `json-schema-validator`; Jakarta Validation (Bean Validation) solo para la estructura de los DTO.
    - **Manejo de errores**: `@ControllerAdvice` con respuestas estructuradas (`codigo`, `mensaje`, `detalles`).
    - **Idempotencia**: verificación de `idLocal` en endpoints de sincronización.
    - **Monitoreo**: Spring Boot Actuator + Micrometer.
    - **Pruebas**: JUnit 5, Mockito, Spring Boot Test y Testcontainers.
    - **Estructura modular**: paquetes por dominio (fincas, cultivos, transacciones, sincronización, usuarios) dentro de un monolito modular (ADR-018).

    Se descarta Node.js/NestJS por menor robustez transaccional y tipificación débil en runtime, Django por rendimiento inferior y tipificación dinámica, y .NET Core por menor ecosistema open source y disponibilidad de talento. Spring Boot 3 es la opción que garantiza robustez, seguridad y mantenibilidad en AgroTrack.
