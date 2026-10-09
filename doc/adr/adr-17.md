# ADR-017: Usar React Native con TypeScript como stack del frontend móvil

- **Título**: Usar React Native con TypeScript y un conjunto de librerías específicas (React Navigation, Axios, SQLite, NetInfo, SecureStore) como stack del frontend móvil, descartando Flutter y Android nativo (Kotlin).

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar el stack tecnológico del frontend móvil que mejor equilibre portabilidad, usabilidad, rendimiento, ecosistema offline-first, curva de aprendizaje, disponibilidad de talento y costo, considerando que AgroTrack es una aplicación Android-first orientada a campesinos con recursos limitados y conectividad intermitente.

  - **Detalles**:

    - **Portabilidad**: debe permitir una sola base de código para Android (y futuro iOS) sin reescribir la aplicación.
    - **Usabilidad**: debe facilitar la construcción de interfaces táctiles grandes, claras y accesibles para usuarios con baja alfabetización digital (ESC-CAL-US-01, ESC-CAL-ACC-02, ESC-CAL-ACC-06).
    - **Rendimiento**: debe mantener una UI fluida en dispositivos de gama baja (≤ 16 ms por frame) y tiempos de renderizado dentro de los umbrales definidos (ESC-CAL-RN-02, ESC-CAL-RN-04).
    - **Ecosistema offline-first**: debe contar con librerías maduras para SQLite, detección de conectividad, almacenamiento seguro y generación de UUID (ADR-001, ADR-005, ADR-006, ADR-011).
    - **Curva de aprendizaje**: el equipo debe poder adoptarlo sin una inversión desproporcionada en capacitación.
    - **Costo de implementación y operación**: la solución debe ser viable con el presupuesto y el equipo de AgroTrack, sin licencias costosas ni herramientas propietarias.
    - **Disponibilidad de talento**: debe existir suficiente talento en el mercado hispanohablante para mantener y evolucionar la aplicación.
    - **Mantenibilidad**: debe permitir código modular, tipado y testeable.
    - **Escenarios de calidad relacionados**: ESC-CAL-US-01, ESC-CAL-US-03, ESC-CAL-US-06, ESC-CAL-US-13, ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-DP-03, ESC-CAL-ACC-02, ESC-CAL-ACC-06, ESC-CAL-POR-01, ESC-CAL-SEG-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres stacks de frontend móvil ampliamente utilizados en aplicaciones Android-first con requisitos offline-first y de usabilidad.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **React Native + TypeScript**: framework de Facebook que permite escribir una sola base de código en JavaScript/TypeScript y renderizar componentes nativos en Android e iOS.
    2. **Flutter + Dart**: framework de Google que usa Dart y renderiza una UI propia mediante Skia, con una sola base de código para Android, iOS, web y escritorio.
    3. **Android nativo (Kotlin + Jetpack Compose)**: desarrollo específico para Android usando Kotlin, Jetpack Compose, Room, WorkManager y otras librerías nativas.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de desarrollo móvil para aplicaciones offline-first en el contexto rural latinoamericano, considerando rendimiento en gama baja, ecosistema offline-first, disponibilidad de librerías y talento, y velocidad de desarrollo. Se revisaron experiencias de equipos que migraron entre React Native, Flutter y nativo.

  - **1. React Native + TypeScript**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es el stack más alineado con el ecosistema offline-first definido en los ADR previos.

      - **Detalles**:
        - Los spikes 001 a 016 están diseñados en React Native; migrar a otro stack implicaría reescribirlos.
.
        - El ecosistema offline-first es maduro:
          - `@op-engineering/op-sqlite` para SQLite, con soporte de SQLCipher (ADR-005, ADR-013, ADR-022).
          - `@react-native-community/netinfo` para detección de conectividad (ADR-006).
          - `react-native-secure-storage` para almacenamiento seguro (ADR-011).
          - `react-native-uuid` para generación de UUID (ADR-007).
          - `axios` para HTTP (ADR-015).
          - `@react-navigation/native` para navegación (ADR-011).
        - La UI es reactiva por naturaleza (ADR-014).
        - Permite una sola base de código para Android (y futuro iOS).
        - El rendimiento en gama baja es aceptable con optimizaciones (`FlatList`, `memo`, `useMemo`).
        - Existe amplio talento en el mercado hispanohablante.
        - Sin costo de licencias.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo, sin licencias.

      - **Ejemplos**:
        - **Licencias**: React Native y sus librerías son open source.
        - **Capacitación**: el equipo ya conoce React y TypeScript.
        - **Operación**: distribución vía Google Play; Firebase App Distribution para pruebas.
        - **Medición**: Firebase Crashlytics, Firebase Analytics, React Native DevTools.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Alineado con los spikes y ADRs previos.
        - Ecosistema offline-first maduro.
        - Curva de aprendizaje baja.
        - Una sola base de código.
        - Amplio talento disponible.
        - Sin costo de licencias.
      - **Debilidades**:
        - Dependencia de puentes nativos para algunas funcionalidades.
        - Rendimiento en gama baja requiere optimización.
        - Tamaño del bundle mayor que nativo.
      - **Oportunidades**:
        - Reutilizar lógica de validación (ADR-002) y sincronización (ADR-001).
        - Migrar a Fabric/TurboModules para mejor rendimiento.
        - Añadir iOS en el futuro sin reescribir.
      - **Amenazas**:
        - Cambios en el ecosistema de librerías.
        - Problemas de compatibilidad con versiones de Android muy antiguas.

    - **Opiniones y comentarios internos**:

      - "React Native es el stack que ya elegimos implícitamente en los spikes. Cambiar ahora sería un retroceso."
      - "Compartir TypeScript con el backend (si fuera Node.js) sería ideal, pero incluso con Spring Boot, TypeScript en el frontend nos da tipificación fuerte."
      - "El ecosistema offline-first de React Native es más maduro que el de Flutter."

  - **2. Flutter + Dart**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con la mayoría de los criterios, pero introduce un cambio de stack que no se justifica y tiene desventajas en el ecosistema offline-first.

      - **Detalles**:
        - Flutter ofrece un rendimiento excelente gracias a su motor de renderizado propio (Skia/Impeller).
        - La UI es consistente entre plataformas.
        - El ecosistema offline-first es bueno pero menos maduro que el de React Native:
          - `sqflite` para SQLite.
          - `connectivity_plus` para conectividad.
          - `flutter_secure_storage` para almacenamiento seguro.
          - `uuid` para UUID.
          - `http` o `dio` para HTTP.
        - El equipo tendría que aprender Dart, lo que añade curva de aprendizaje.
        - Los spikes existentes están en React Native; migrarlos implicaría reescribir código.
        - El tamaño del bundle es mayor que React Native.
        - El talento disponible en el mercado hispanohablante es menor que el de React Native.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto por cambio de stack; costo operativo bajo.

      - **Ejemplos**:
        - **Licencias**: Flutter y sus librerías son open source.
        - **Capacitación**: el equipo debe aprender Dart y Flutter.
        - **Operación**: distribución vía Google Play.
        - **Medición**: Firebase Crashlytics, Firebase Analytics, DevTools.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Rendimiento excelente.
        - UI consistente.
        - Motor de renderizado propio.
      - **Debilidades**:
        - Curva de aprendizaje de Dart.
        - Ecosistema offline-first menos maduro.
        - Spikes existentes en React Native.
        - Menor talento disponible.
        - Mayor tamaño de bundle.
      - **Oportunidades**:
        - Útil si se requiere UI muy personalizada.
      - **Amenazas**:
        - Retraso en el desarrollo por cambio de stack.
        - Problemas de integración con librerías nativas.

    - **Opiniones y comentarios internos**:

      - "Flutter es excelente, pero no podemos ignorar que todos nuestros spikes están en React Native."
      - "Aprender Dart nos costaría semanas que no tenemos."
      - "El ecosistema offline-first de React Native es más maduro para nuestro caso."

  - **3. Android nativo (Kotlin + Jetpack Compose)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con los criterios de rendimiento y control, pero no con los de portabilidad y costo.

      - **Detalles**:
        - Kotlin + Jetpack Compose ofrecen el mejor rendimiento posible en Android.
        - Room es un ORM maduro para SQLite.
        - WorkManager maneja tareas en segundo plano.
        - DataStore maneja preferencias y almacenamiento seguro.
        - Retrofit/Ktor para HTTP.
        - Sin embargo, no es portable a iOS: si en el futuro se requiere iOS, habría que reescribir todo.
        - El equipo tendría que aprender Kotlin y Jetpack Compose, lo que añade curva de aprendizaje.
        - El desarrollo es más lento que en React Native o Flutter.
        - Los spikes existentes están en React Native.
        - El talento disponible es menor que para React Native.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto por ser específico de Android y requerir nuevo aprendizaje; costo operativo bajo.

      - **Ejemplos**:
        - **Licencias**: Kotlin y Android son open source, pero algunas herramientas de Google pueden tener costo.
        - **Capacitación**: el equipo debe aprender Kotlin y Jetpack Compose.
        - **Operación**: distribución vía Google Play.
        - **Medición**: Firebase Crashlytics, Android Profiler.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Máximo rendimiento.
        - Control total sobre la plataforma.
        - Acceso a todas las APIs nativas.
        - Room y WorkManager maduros.
      - **Debilidades**:
        - No portable a iOS.
        - Curva de aprendizaje de Kotlin y Compose.
        - Desarrollo más lento.
        - Spikes existentes en React Native.
        - Menor talento disponible.
      - **Oportunidades**:
        - Útil si se requiere integración profunda con hardware.
      - **Amenazas**:
        - Costo de mantenimiento de una sola plataforma.
        - Dificultad para escalar a iOS.

    - **Opiniones y comentarios internos**:

      - "Android nativo es el mejor en rendimiento, pero no podemos atarnos a una sola plataforma."
      - "Kotlin es un gran lenguaje, pero nuestro equipo ya sabe TypeScript."
      - "No queremos reescribir todo si mañana el negocio pide iOS."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-017 — Validará que React Native + TypeScript con las librerías seleccionadas cubre todos los requisitos funcionales y no funcionales del frontend móvil — Propuesto.
    - SPIKE-013 — Validará que SQLite local funciona correctamente en React Native — Propuesto.
    - SPIKE-006 — Validará que NetInfo detecta la conectividad correctamente — Propuesto.
    - SPIKE-011 — Validará que SecureStore protege el token — Propuesto.
    - SPIKE-014 — Validará que la reactividad basada en componentes es suficiente — Propuesto.
    - SPIKE-010 — Validará que los controles táctiles y la presentación de valores funcionan correctamente — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Flutter + Dart — descartado por cambio de stack y menor madurez del ecosistema offline-first en el contexto del equipo.
    - Android nativo (Kotlin) — descartado por falta de portabilidad a iOS y mayor curva de aprendizaje.
    - Ionic + Capacitor — descartado por menor rendimiento en gama baja.
    - Xamarin/.NET MAUI — descartado por menor adopción y dependencia de Microsoft.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, Android-first, offline-first, con UI sencilla y clara.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-017 (stack completo), SPIKE-013 (SQLite), SPIKE-006 (NetInfo), SPIKE-011 (SecureStore), SPIKE-014 (reactividad) y SPIKE-010 (interacción táctil).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **React Native + TypeScript** porque:
    - Es el stack que ya usan todos los spikes existentes.
    - El ecosistema offline-first es maduro y probado.
    - La curva de aprendizaje es baja para el equipo.
    - Permite una sola base de código para Android (y futuro iOS).
    - Existe amplio talento en el mercado hispanohablante.
    - Sin costo de licencias.
    - Se integra naturalmente con el backend REST (ADR-015) y el stack de backend (ADR-016).

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que React Native + TypeScript con SQLite, NetInfo, SecureStore, Axios y React Navigation cubra todos los requisitos funcionales y no funcionales del frontend móvil.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de la interfaz de usuario.
    - **¿Qué tipos de integraciones están involucradas?**: React Navigation (navegación), Axios (HTTP), SQLite (base local), NetInfo (conectividad), SecureStore (almacenamiento seguro), react-native-uuid (UUID), react-native-vector-icons (iconos) y Firebase Crashlytics (monitoreo).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir el stack completo desde el día 1 y no cambiarlo. Usar TypeScript estricto. Configurar ESLint y Prettier. Elegir desde el inicio una librería de SQLite compatible con SQLCipher (`@op-engineering/op-sqlite`) para no migrar al cifrar la base (ADR-022). Aprovechar Firebase App Distribution para pruebas tempranas.

  - **Anécdotas**:

    - En el diseño del SPIKE-013 se planteó como hipótesis que SQLite en React Native soporta transacciones ACID y consultas con 10,000 registros sin problemas.
    - Durante el análisis se concluyó que migrar a Flutter habría implicado reescribir todos los spikes, con un costo de semanas que no se justificaba.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **React Native con TypeScript** y las siguientes librerías: **React Navigation, Axios, @op-engineering/op-sqlite (con SQLCipher), @react-native-community/netinfo, react-native-secure-storage, react-native-uuid y react-native-vector-icons**, cumpliendo con los escenarios ESC-CAL-US-01, ESC-CAL-US-03, ESC-CAL-US-06, ESC-CAL-US-13, ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-DP-03, ESC-CAL-ACC-02, ESC-CAL-ACC-06, ESC-CAL-POR-01 y ESC-CAL-SEG-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre portabilidad, usabilidad, rendimiento, ecosistema y costo.

    La implementación deberá considerar como mínimo:

    - **Framework**: React Native con TypeScript estricto.
    - **Navegación**: `@react-navigation/native` con `native-stack` y `bottom-tabs`.
    - **HTTP**: Axios con interceptores para JWT y refresco (ADR-011).
    - **Base de datos local**: `@op-engineering/op-sqlite` con SQLCipher (ADR-022).
    - **Conectividad**: `@react-native-community/netinfo`.
    - **Almacenamiento seguro**: `react-native-secure-storage` (en los demás ADR se le llama SecureStore).
    - **Notificaciones**: `@notifee/react-native` y `@react-native-firebase/messaging` (ADR-028).
    - **UUID**: `react-native-uuid`.
    - **Iconos**: `react-native-vector-icons`.
    - **Estado**: `useState`, `useReducer`, `useContext` (ADR-014); evaluar Zustand si crece.
    - **Listas**: `FlatList` con `memo`; evaluar `FlashList` si el volumen crece.
    - **Validación**: esquema JSON compartido (ADR-002) con `ajv`.
    - **Monitoreo**: Firebase Crashlytics y Firebase Analytics.
    - **Pruebas**: Jest, React Native Testing Library, Detox (E2E).
    - **Distribución**: Google Play; Firebase App Distribution para pruebas.
    - **Estructura**: carpetas por dominio (fincas, cultivos, transacciones, sincronización, autenticación) y por capa (componentes, hooks, servicios, repositorios).

    Se descarta Flutter por cambio de stack y menor madurez del ecosistema offline-first en el contexto del equipo, y Android nativo por falta de portabilidad a iOS y mayor curva de aprendizaje. React Native + TypeScript es la opción que garantiza portabilidad, usabilidad y velocidad de desarrollo en AgroTrack.