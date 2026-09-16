# ADR-006: Consultar datos offline y detectar conectividad

- **Título**: Consultar datos offline y detectar conectividad para sincronización automática.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones que permitan al usuario consultar información previamente almacenada sin conexión, garantizar que los datos persistan después de cerrar la aplicación, y detectar automáticamente la recuperación de conectividad para habilitar la sincronización de registros pendientes.

  - **Detalles**:

    - **Disponibilidad offline de consultas**: el 100 % de la información definida como consultable sin conexión debe poder consultarse sin Internet.
    - **Persistencia local**: el 100 % de los registros locales confirmados previamente debe continuar disponible después de cerrar y abrir la aplicación.
    - **Detección de conectividad**: cada recuperación de conexión debe permitir detectar los registros pendientes y habilitar o iniciar su sincronización.
    - **Consistencia**: la información local puede no contener los últimos cambios de otros dispositivos, pero debe reflejar fielmente los registros guardados localmente.
    - **Transparencia**: el usuario debe saber si está viendo datos locales (sin conexión) o datos sincronizados.
    - **Rendimiento**: la consulta offline debe ser rápida (≤ 2 segundos para listados de hasta 100 registros).
    - **Costo de implementación**: la solución debe aprovechar la base de datos local ya definida en ADR-005.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para manejar la consulta y persistencia offline, y la detección de conectividad. Se descartaron de entrada las soluciones que dependen completamente de la red por ser incompatibles con el contexto rural de AgroTrack.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Consulta siempre remota (dependencia total de red)**: el sistema solo permite consultar información cuando hay conexión a Internet.
    2. **Consulta con caché en memoria (no persistente)**: el sistema mantiene una caché en memoria mientras la app está abierta, pero los datos se pierden al cerrarla.
    3. **Consulta desde repositorio local persistente + monitor de conectividad**: el sistema utiliza una base de datos local (SQLite) como fuente principal de consulta, actualizada periódicamente con datos del servidor cuando hay conexión, y un monitor de conectividad que activa la sincronización automáticamente al recuperar la red.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de aplicaciones offline-first, el uso de monitores de conectividad (React Native o Flutter, según el stack de AgroTrack), y la experiencia de proyectos de campo que operan con red intermitente. Se identificó que la persistencia y la detección automática de red son los dos puntos críticos.

  - **1. Consulta siempre remota**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con DP-02 (consulta offline) ni DP-06 (persistencia). Depende completamente de la red.

      - **Detalles**:
        - El usuario no puede consultar nada sin Internet, lo cual es inaceptable en el contexto rural.
        - No hay persistencia local, por lo que no aplica el concepto de "datos disponibles al cerrar la app".
        - La detección de conectividad sería irrelevante porque no hay cola de pendientes.
        - La experiencia de usuario es pobre y contradice el objetivo principal de AgroTrack.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero inutilizable en el contexto de AgroTrack.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere, pero el usuario no puede usar la app sin red.
        - **Operación**: baja carga en el dispositivo, pero alta dependencia del servidor.
        - **Medición**: no aplica, porque el escenario no es viable.

    - **Análisis FODA**:

      - **Fortalezas**: implementación trivial.
      - **Debilidades**: inutilizable en zonas rurales sin cobertura.
      - **Oportunidades**: ninguna en el contexto de AgroTrack.
      - **Amenazas**: abandono de la aplicación.

    - **Opiniones y comentarios internos**:

      - "Inaceptable para nuestro contexto. El campesino trabaja donde no hay señal".
      - "No podemos construir una app offline-first y luego depender de la red para todo".

  - **2. Caché en memoria (no persistente)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con DP-02 (consulta offline mientras la app está abierta), pero no cumple con DP-06 (persistencia después del cierre).

      - **Detalles**:
        - Mientras la app está abierta, el usuario puede ver datos aunque no haya red.
        - Al cerrar la aplicación, toda la caché se pierde y el usuario debe reconectarse para volver a ver su información.
        - No hay persistencia real, por lo que la promesa de "consultar sin conexión" queda a medias.
        - No aprovecha la base de datos local definida en ADR-005.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero insuficiente para los requisitos.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: bajo costo, pero datos volátiles.
        - **Medición**: no mide persistencia real.

    - **Análisis FODA**:

      - **Fortalezas**: fácil de implementar, mejora la experiencia mientras la app está abierta.
      - **Debilidades**: no persiste, no cumple DP-06, no se integra con la cola de pendientes.
      - **Oportunidades**: podría evolucionar a persistencia con SQLite.
      - **Amenazas**: frustración del usuario al perder los datos al cerrar la app.

    - **Opiniones y comentarios internos**:

      - "No sirve si el usuario cierra la app. Es un parche, no una solución".
      - "El campesino abre y cierra la app varias veces al día. Necesitamos persistencia real".

  - **3. Repositorio local persistente + monitor de conectividad**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con DP-02, DP-06 y DP-03. Es la única opción que cubre los tres escenarios.

      - **Detalles**:
        - La base de datos local (SQLite) actúa como fuente principal de consulta.
        - Todas las consultas se realizan primero al repositorio local, que devuelve los datos inmediatamente.
        - Cuando hay conexión, un servicio en segundo plano sincroniza los datos locales con el servidor (pull de datos maestros, push de operaciones pendientes).
        - Un monitor de conectividad (`NetInfo` en React Native) detecta cambios de red y activa la sincronización automáticamente.
        - Los datos persisten después del cierre de la app porque están en SQLite.
        - El usuario ve un indicador de "datos locales" vs "datos sincronizados" si es relevante.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, pero la infraestructura ya está definida en ADR-001 y ADR-005.

      - **Ejemplos**:
        - **Licencias**: SQLite y `NetInfo` son gratuitos.
        - **Capacitación**: el equipo debe aprender a manejar el monitor de conectividad y la sincronización en segundo plano.
        - **Operación**: requiere monitoreo de la sincronización y de la última fecha de actualización.
        - **Medición**: se puede medir el tiempo de consulta offline y la frecuencia de sincronización.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Disponibilidad total de consultas sin conexión.
        - Persistencia garantizada al cerrar y abrir la app.
        - Sincronización automática al recuperar la red.
        - Reutiliza la infraestructura definida en ADR-001 y ADR-005.
      - **Debilidades**:
        - Mayor complejidad inicial, aunque ya mitigada por los ADR previos.
        - La información local puede estar desactualizada si no se sincroniza con frecuencia.
      - **Oportunidades**:
        - La misma base de datos local sirve para consultas, registros y cola de pendientes.
        - Se puede mostrar al usuario la última sincronización exitosa.
      - **Amenazas**:
        - Si el monitor de conectividad falla, la sincronización no se activa automáticamente.
        - Si la base local se corrompe, se pierden los datos no sincronizados.

    - **Opiniones y comentarios internos**:

      - "El repositorio local es el corazón de la app offline. Todas las consultas pasan por él".
      - "El monitor de conectividad debe ser robusto, porque en zonas rurales la red puede aparecer y desaparecer varias veces en minutos".
      - "Debemos mostrar al usuario cuándo fue la última sincronización para que sepa si los datos están frescos".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-006 — Validará que la consulta offline responde en < 2 s, que los datos persisten al cerrar y reabrir la app, y que el monitor de conectividad detecta cambios de red — Propuesto.
    - SPIKE-007 — Validará que los cálculos se actualizan correctamente cuando se modifican datos locales — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Consulta siempre remota — descartada por inutilizable sin red.
    - Caché en memoria — descartada por no persistente.
    - Uso de Firebase Firestore con persistencia — descartado porque no está en el stack de AgroTrack.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con uso principal en zonas rurales con conectividad limitada o nula.
    - Primera versión funcional con criterios de calidad para producción.
    - Arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante los spikes SPIKE-006 y SPIKE-007, que probarán la consulta offline, la persistencia y la detección de conectividad en condiciones reales.

  - **¿Por qué elegiste al ganador?**:

    - Porque es la única opción que cumple los tres escenarios (DP-02, DP-06, DP-03).
    - Porque reutiliza la base de datos local definida en ADR-005.
    - Porque el monitor de conectividad permite la sincronización automática sin intervención del usuario.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Se implementará SQLite como fuente primaria de consulta, `NetInfo` como monitor de conectividad, y un indicador de última sincronización exitosa. Pendiente de ejecución de los spikes.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las consultas de información almacenada localmente.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con SQLite (ADR-005), con el motor de sincronización (ADR-001), con el repositorio local y con el sistema de indicadores de UI.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir la política de sincronización desde el inicio; mostrar al usuario la última sync exitosa; monitorear la conectividad de forma robusta.

  - **Anécdotas**:

    - En el diseño del SPIKE-006 se identificó que en zonas rurales la red puede aparecer y desaparecer varias veces en minutos; el monitor debe tolerar ese comportamiento sin disparar sincronizaciones innecesarias.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un **repositorio local persistente (SQLite) como fuente primaria de consultas**, con un monitor de conectividad que active la sincronización automática al recuperar la red, cumpliendo con los escenarios ESC-CAL-DP-02, ESC-CAL-DP-06 y ESC-CAL-DP-03.

  - **Detalles**:

    Esta alternativa ofrece disponibilidad total, persistencia garantizada y sincronización automática, aprovechando la infraestructura definida en ADR-001 y ADR-005.

    La implementación deberá considerar como mínimo:

    - SQLite como fuente primaria de todas las consultas.
    - Monitor de conectividad (`NetInfo`) que detecte cambios de red.
    - Sincronización automática al recuperar la conexión.
    - Indicador visual de "datos locales" cuando no hay conexión.
    - Fecha y hora de la última sincronización exitosa visible para el usuario.
    - Tolerancia a apariciones y desapariciones frecuentes de red.
    - Pruebas de consulta offline con hasta 100 registros (≤ 2 s).
    - Pruebas de persistencia al cerrar y reabrir la app.

    Se descarta la consulta siempre remota por su inutilidad en el contexto rural, y la caché en memoria por su falta de persistencia. El repositorio local persistente con monitor de conectividad es la opción que garantiza el funcionamiento offline real de AgroTrack.