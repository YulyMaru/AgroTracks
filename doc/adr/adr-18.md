# ADR-018: Usar monolito modular por capas con arquitectura offline-first y patrón Repository

- **Título**: Usar un monolito modular por capas (presentación, aplicación, dominio, infraestructura) con módulos por dominio (fincas, cultivos, transacciones, sincronización, usuarios) y patrón Repository, descartando microservicios, monolito tradicional y serverless.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar el estilo arquitectónico que mejor equilibre mantenibilidad, escalabilidad, costo, simplicidad, separación de responsabilidades y evolución, considerando que AgroTrack es una primera versión con un equipo pequeño, dominio relacional, requisitos de transacciones ACID y una arquitectura offline-first con sincronización diferida.

  - **Detalles**:

    - **Mantenibilidad**: el código debe ser fácil de leer, probar y modificar sin afectar componentes no relacionados (restricción técnica de mantenibilidad).
    - **Separación de responsabilidades**: la lógica de dominio, la presentación, la persistencia y la sincronización deben estar claramente separadas.
    - **Bajo acoplamiento y alta cohesión**: los módulos deben ser independientes y agrupar funcionalidad relacionada (restricción técnica de arquitectura y diseño).
    - **Testabilidad**: cada capa y módulo debe poder probarse de forma aislada.
    - **Escalabilidad**: la estructura debe permitir crecer en funcionalidades y usuarios sin una reconstrucción completa (restricción técnica de escalabilidad, ESC-CAL-ESC-01).
    - **Costo de implementación y operación**: la solución debe ser viable para el alcance y los recursos de AgroTrack, sin infraestructura distribuida innecesaria.
    - **Evolución**: debe permitir extraer módulos a microservicios en el futuro si el proyecto escala, sin reescribir todo.
    - **Integración con offline-first**: el estilo debe soportar el patrón Repository en el cliente y en el backend, con sincronización diferida y cola persistente (ADR-001, ADR-005, ADR-006, ADR-007).
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-DP-03, ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-CF-08, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cuatro estilos arquitectónicos comunes en aplicaciones móviles con backend, considerando el contexto de AgroTrack.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Monolito tradicional (sin módulos explícitos)**: una sola aplicación con capas técnicas (controladores, servicios, repositorios) sin separación por dominio.
    2. **Monolito modular por capas con módulos por dominio y patrón Repository**: una sola aplicación con capas bien definidas (presentación, aplicación, dominio, infraestructura) y módulos por dominio (fincas, cultivos, transacciones, sincronización, usuarios), comunicados por interfaces.
    3. **Microservicios**: múltiples servicios independientes (fincas, cultivos, transacciones, sincronización, usuarios) con comunicación por red (REST o mensajería).
    4. **Serverless (funciones como servicio)**: funciones independientes desplegadas en un proveedor cloud, con base de datos gestionada y sin servidor propio.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones arquitectónicos para aplicaciones móviles offline-first con backend relacional, considerando el tamaño del equipo, la etapa del proyecto, los requisitos de transacciones ACID y la necesidad de evolucionar sin reescribir. Se revisaron experiencias de equipos que adoptaron microservicios prematuramente y de equipos que mantuvieron un monolito modular exitosamente.

  - **1. Monolito tradicional (sin módulos explícitos)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de mantenibilidad, separación de responsabilidades ni evolución.

      - **Detalles**:
        - Sin separación por dominio, el código tiende a acoplarse y a mezclar responsabilidades.
        - Un cambio en transacciones puede afectar fincas o usuarios.
        - Difícil de probar de forma aislada.
        - Difícil de extraer a microservicios en el futuro.
        - Aunque es más simple al inicio, genera deuda técnica rápidamente.
        - No favorece SOLID ni bajo acoplamiento (restricción técnica de arquitectura).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo al inicio, pero costo de mantenimiento creciente y alto a mediano plazo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: sencilla al inicio, compleja con el crecimiento.
        - **Medición**: difícil de medir por falta de separación.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Implementación rápida al inicio.
        - Sin infraestructura adicional.
      - **Debilidades**:
        - Acoplamiento alto.
        - Difícil de mantener y probar.
        - No favorece la evolución.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Deuda técnica que frene el desarrollo.
        - Dificultad para incorporar nuevos desarrolladores.

    - **Opiniones y comentarios internos**:

      - "Un monolito sin módulos es como una casa sin habitaciones: todo está mezclado."
      - "No podemos permitirnos deuda técnica desde el día 1."

  - **2. Monolito modular por capas con módulos por dominio y patrón Repository**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción que mejor equilibra simplicidad, mantenibilidad, escalabilidad y costo.

      - **Detalles**:
        - Capas bien definidas: presentación (controladores REST), aplicación (casos de uso), dominio (entidades y reglas de negocio), infraestructura (persistencia, seguridad, mensajería).
        - Módulos por dominio: fincas, cultivos, transacciones, sincronización, usuarios.
        - Comunicación entre módulos por interfaces, evitando acoplamiento directo.
        - Patrón Repository para abstraer el acceso a datos (PostgreSQL en backend, SQLite en cliente).
        - Favorece SOLID: responsabilidad única, inversión de dependencias, segregación de interfaces.
        - Fácil de probar por capa y por módulo.
        - Permite extraer módulos a microservicios en el futuro si el proyecto escala.
        - El cliente móvil también aplica offline-first con Repository, cola de pendientes y motor de sincronización.
        - Se integra naturalmente con Spring Boot (ADR-016) y React Native (ADR-017).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, costo operativo bajo, retorno alto en mantenibilidad y evolución.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe entender el patrón modular y el patrón Repository.
        - **Operación**: monitoreo estándar por módulo.
        - **Medición**: métricas por módulo (tiempos, errores, uso).

    - **Análisis FODA**:

      - **Fortalezas**:
        - Separación clara de responsabilidades.
        - Bajo acoplamiento y alta cohesión.
        - Testabilidad por capa y por módulo.
        - Favorece SOLID y Clean Code.
        - Permite evolución a microservicios.
        - Integración natural con Spring Boot y React Native.
      - **Debilidades**:
        - Requiere disciplina del equipo para respetar las capas.
        - Puede parecer sobre-ingeniería al inicio si no se entiende el propósito.
        - Mayor cantidad de archivos y paquetes que un monolito tradicional.
      - **Oportunidades**:
        - Extraer módulos a microservicios si el proyecto escala.
        - Reutilizar módulos en otros proyectos.
        - Incorporar nuevos desarrolladores con menos fricción.
      - **Amenazas**:
        - Si el equipo no respeta las capas, el monolito se degrada.
        - Si se abusa de la modularidad, puede generar complejidad innecesaria.

    - **Opiniones y comentarios internos**:

      - "Es el equilibrio perfecto: simplicidad de un monolito con la organización de microservicios."
      - "El patrón Repository nos permite cambiar la base de datos sin afectar el dominio."
      - "Si mañana necesitamos microservicios, ya tenemos los módulos separados."

  - **3. Microservicios**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de costo, simplicidad ni viabilidad para el alcance actual.

      - **Detalles**:
        - Requiere infraestructura distribuida: orquestación, service discovery, API gateway, mensajería.
        - Mayor complejidad operativa: despliegue, monitoreo, trazabilidad distribuida.
        - Mayor costo: múltiples instancias, más recursos, más personal.
        - Transacciones ACID entre servicios son complejas (sagas, compensaciones).
        - El equipo es pequeño; mantener microservicios sería desproporcionado.
        - No hay necesidad real de escalar horizontalmente cada módulo por separado.
        - Contradice la decisión de monolito inicial (ADR-001, ADR-005, ADR-011, ADR-016).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto, costo operativo alto, sin retorno claro para el alcance actual.

      - **Ejemplos**:
        - **Licencias**: algunas herramientas de orquestación tienen costo.
        - **Capacitación**: el equipo debe aprender Kubernetes, mensajería, tracing.
        - **Operación**: monitoreo distribuido, logs centralizados, alertas.
        - **Medición**: métricas por servicio, trazabilidad distribuida.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Escalabilidad independiente por servicio.
        - Aislamiento de fallos.
        - Libertad tecnológica por servicio.
      - **Debilidades**:
        - Complejidad operativa alta.
        - Costo elevado.
        - Transacciones ACID complejas.
        - Desproporcionado para el equipo y el alcance.
      - **Oportunidades**:
        - Útil si el proyecto escala mucho.
      - **Amenazas**:
        - Retraso en el desarrollo por complejidad.
        - Costos imprevistos.
        - Fallos en cascada.

    - **Opiniones y comentarios internos**:

      - "Los microservicios son para equipos grandes con dominios bien delimitados. Nosotros no estamos ahí."
      - "Empezar con microservicios sería un suicidio para un equipo pequeño."

  - **4. Serverless (funciones como servicio)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de portabilidad, control ni residencia de datos.

      - **Detalles**:
        - Dependencia de un proveedor cloud (AWS Lambda, Azure Functions, Google Cloud Functions).
        - Difícil de migrar entre proveedores.
        - Problemas de residencia de datos (restricción legal de soberanía y residencia).
        - Cold starts que afectan la latencia.
        - Difícil de probar localmente.
        - Transacciones ACID complejas entre funciones.
        - No se alinea con la decisión de monolito modular ni con el stack Spring Boot.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, costo operativo variable según uso, con dependencia de proveedor.

      - **Ejemplos**:
        - **Licencias**: costo por invocación.
        - **Capacitación**: el equipo debe aprender el modelo serverless.
        - **Operación**: monitoreo del proveedor.
        - **Medición**: métricas del proveedor.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Escalabilidad automática.
        - Pago por uso.
      - **Debilidades**:
        - Dependencia de proveedor.
        - Cold starts.
        - Difícil de probar.
        - Problemas de residencia de datos.
      - **Oportunidades**:
        - Útil para tareas puntuales.
      - **Amenazas**:
        - Costos imprevistos por uso.
        - Bloqueo de proveedor.

    - **Opiniones y comentarios internos**:

      - "Serverless es atractivo en teoría, pero nos ata a un proveedor y complica la residencia de datos."
      - "No queremos cold starts en una app que debe responder rápido."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-018 — Validará que el monolito modular por capas con patrón Repository es mantenible, testeable y evolutivo — Propuesto.
    - SPIKE-016 — Validará que Spring Boot 3 con Spring Data JPA implementa el patrón Repository correctamente — Propuesto.
    - SPIKE-017 — Validará que React Native + TypeScript permite aplicar el patrón Repository en el cliente — Propuesto.
    - SPIKE-013 — Validará que SQLite local soporta el patrón Repository con transacciones ACID — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Monolito tradicional — descartado por falta de separación de responsabilidades.
    - Microservicios — descartado por complejidad y costo desproporcionados.
    - Serverless — descartado por dependencia de proveedor y problemas de residencia de datos.
    - Arquitectura hexagonal (puertos y adaptadores) — considerada como variante del monolito modular, pero se prefirió capas explícitas por simplicidad.
    - Clean Architecture — considerada, pero se prefirió capas explícitas por menor complejidad inicial.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-018 (validación del monolito modular), SPIKE-016 (Spring Data JPA), SPIKE-017 (React Native + TypeScript) y SPIKE-013 (SQLite local).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **monolito modular por capas con módulos por dominio y patrón Repository** porque:
    - Es simple de implementar y operar para un equipo pequeño.
    - Mantiene separación clara de responsabilidades.
    - Favorece SOLID y Clean Code.
    - Es testeable por capa y por módulo.
    - Permite evolucionar a microservicios si el proyecto escala.
    - Se integra naturalmente con Spring Boot (ADR-016) y React Native (ADR-017).
    - No requiere infraestructura distribuida.
    - Es viable con el presupuesto y el equipo de AgroTrack.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el monolito modular por capas sea mantenible, testeable y evolutivo, y que el patrón Repository abstraiga correctamente el acceso a datos tanto en backend como en cliente.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % del backend y del frontend móvil.
    - **¿Qué tipos de integraciones están involucradas?**: Spring Boot (ADR-016), Spring Data JPA, PostgreSQL (ADR-013), SQLite local (ADR-005, ADR-013), motor de sincronización (ADR-001), REST (ADR-015), React Native (ADR-017) y Firebase Crashlytics.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir los módulos por dominio desde el día 1 (fincas, cultivos, transacciones, sincronización, usuarios). Respetar las capas sin excepciones. Usar interfaces entre módulos. Documentar la estructura con un diagrama de arquitectura. No caer en la tentación de microservicios prematuros.

  - **Anécdotas**:

    - En el diseño del SPIKE-016 se confirmó que Spring Boot con Spring Data JPA implementa el patrón Repository de forma natural, reduciendo el código boilerplate.
    - Durante el análisis se concluyó que intentar microservicios desde el inicio habría requerido al menos el doble de infraestructura y un equipo más grande.
    - En el diseño del SPIKE-013 se confirmó que el patrón Repository en el cliente permite cambiar SQLite por otra base local sin afectar el dominio.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un **monolito modular por capas con módulos por dominio y patrón Repository** en backend (Spring Boot) y en frontend móvil (React Native), cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-DP-03, ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-CF-08, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre simplicidad, mantenibilidad, escalabilidad y costo.

    La implementación deberá considerar como mínimo:

    - **Capas del backend (Spring Boot)**:
      - **Presentación**: controladores REST (`@RestController`) con DTOs y validación.
      - **Aplicación**: servicios de caso de uso (`@Service`) que orquestan la lógica.
      - **Dominio**: entidades, value objects y reglas de negocio puras.
      - **Infraestructura**: repositorios (`@Repository`) con Spring Data JPA, configuración de seguridad, caché y mensajería.
    - **Módulos por dominio en el backend**:
      - `farms`, `lots`, `crops`, `transactions`, `sync`, `users`, `auth`.
      - Cada módulo con sus propias capas y expuesto por interfaces.
    - **Patrón Repository en el backend**:
      - Interfaces de repositorio en el dominio.
      - Implementaciones con Spring Data JPA en infraestructura.
      - Consultas personalizadas cuando sea necesario.
    - **Capas del frontend (React Native)**:
      - **Presentación**: componentes y pantallas.
      - **Aplicación**: hooks y casos de uso.
      - **Dominio**: entidades y reglas de negocio.
      - **Infraestructura**: repositorios locales (SQLite), cliente HTTP (Axios), almacenamiento seguro (SecureStore), conectividad (NetInfo).
    - **Módulos por dominio en el frontend**:
      - `farms`, `lots`, `crops`, `transactions`, `sync`, `auth`.
      - Cada módulo con sus componentes, hooks, servicios y repositorios.
    - **Patrón Repository en el frontend**:
      - Interfaces de repositorio en el dominio.
      - Implementaciones que combinan SQLite local y Axios remoto.
      - El repositorio decide si leer de local o remoto según conectividad.
    - **Offline-first**:
      - Cola persistente de operaciones pendientes (ADR-005).
      - Motor de sincronización con retry y backoff (ADR-001).
      - Idempotencia con `localId` (ADR-007).
      - Detección de conectividad (ADR-006).
    - **Documentación**:
      - Diagrama de arquitectura de capas y módulos.
      - Guía de estilo para el equipo.
    - **Pruebas**:
      - Pruebas unitarias por capa y por módulo.
      - Pruebas de integración con Testcontainers (backend).
      - Pruebas de UI y E2E (frontend).

    Se descarta el monolito tradicional por falta de separación de responsabilidades, los microservicios por complejidad y costo desproporcionados, y serverless por dependencia de proveedor y problemas de residencia de datos. El monolito modular por capas con patrón Repository es la opción que garantiza mantenibilidad, escalabilidad y evolución en AgroTrack.