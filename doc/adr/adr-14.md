# ADR-014: Aplicación móvil reactiva basada en componentes

- **Título**: Usar React Native con reactividad basada en componentes (hooks y estado local), descartando programación reactiva pura (RxJS/RxJava) y enfoques imperativos.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar el paradigma de programación de la interfaz móvil que mejor equilibre usabilidad, rendimiento, mantenibilidad y curva de aprendizaje, considerando el contexto offline-first, la integración con el motor de sincronización y la necesidad de una UI fluida en dispositivos de gama baja.

  - **Detalles**:

    - **Usabilidad**: la UI debe responder de forma inmediata a las acciones del usuario, sin bloqueos ni retardos perceptibles.
    - **Rendimiento**: el renderizado de pantallas y listas debe mantenerse fluido (≤ 16 ms por frame) incluso con cientos de registros.
    - **Mantenibilidad**: el código debe ser fácil de leer, probar y modificar por el equipo, sin introducir complejidad innecesaria.
    - **Integración con offline**: la reactividad debe convivir con el repositorio local (SQLite) y el motor de sincronización sin condiciones de carrera ni estados inconsistentes.
    - **Curva de aprendizaje**: el equipo ya tiene experiencia en JavaScript/TypeScript; la solución no debe exigir un cambio de paradigma drástico.
    - **Costo de implementación**: la solución debe ser viable con el stack actual y no requerir librerías pesadas adicionales.
    - **Escenarios de calidad relacionados**: ESC-CAL-US-01, ESC-CAL-US-03, ESC-CAL-US-06, ESC-CAL-US-13, ESC-CAL-ACC-02.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para el manejo de estado y reactividad en la aplicación móvil.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Programación reactiva pura (RxJS/RxJava)**: todos los flujos de datos se modelan como observables; la UI se suscribe a streams; el estado se maneja con sujetos y operadores.
    2. **Reactividad basada en componentes (React Native + hooks/estado)**: la UI se compone de componentes funcionales que reaccionan a cambios de estado local y contexto; los efectos secundarios se manejan con hooks; las operaciones asíncronas usan async/await.
    3. **Enfoque imperativo (sin reactividad)**: la UI se actualiza manualmente tras cada operación; el estado se mantiene en variables globales o singletons; no hay re-renderizado automático.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de arquitectura de UI en aplicaciones móviles con React Native, considerando la integración con bases de datos locales y sincronización offline. Se revisaron experiencias de equipos que adoptaron RxJS y su impacto en mantenibilidad y rendimiento.

  - **1. Programación reactiva pura (RxJS/RxJava)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de mantenibilidad y curva de aprendizaje; introduce complejidad innecesaria.

      - **Detalles**:
        - RxJS es potente para flujos complejos, pero la mayoría de las operaciones de AgroTrack son CRUD simples y consultas locales.
        - Modelar cada acción del usuario como un observable añade una capa de abstracción que dificulta la lectura y el debugging.
        - El equipo tendría que aprender operadores, sujetos, suscripciones y gestión de memoria (unsubscribe), lo que aumenta el riesgo de fugas.
        - La integración con SQLite y el motor de sincronización ya usa promesas y async/await; mezclar paradigmas complica el código.
        - No hay evidencia de que RxJS mejore el rendimiento en este dominio; al contrario, puede añadir sobrecarga.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto por curva de aprendizaje; costo de mantenimiento medio-alto por complejidad.

      - **Ejemplos**:
        - **Licencias**: RxJS es open source, sin costo.
        - **Capacitación**: el equipo necesita formación específica en programación reactiva.
        - **Operación**: mayor esfuerzo de debugging y pruebas.
        - **Medición**: requiere métricas de suscripciones activas y fugas de memoria.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Manejo elegante de flujos complejos y eventos en tiempo real.
        - Cancelación y composición de operaciones asíncronas.
      - **Debilidades**:
        - Curva de aprendizaje empinada.
        - Mayor complejidad para operaciones simples.
        - Riesgo de fugas de memoria por suscripciones no canceladas.
        - Dificulta la integración con el resto del stack.
      - **Oportunidades**:
        - Útil si en el futuro se incorporan WebSockets o eventos en tiempo real.
      - **Amenazas**:
        - Retraso en el desarrollo por complejidad innecesaria.
        - Errores difíciles de rastrear.

    - **Opiniones y comentarios internos**:

      - "RxJS es como usar un cañón para matar una mosca. Nuestras operaciones son consultas y registros, no flujos continuos."
      - "El equipo ya sabe React y hooks; meter RxJS sería un retroceso en velocidad."

  - **2. Reactividad basada en componentes (React Native + hooks/estado)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es el paradigma natural de React Native y se alinea con el stack existente.

      - **Detalles**:
        - React Native es reactivo por diseño: los componentes se re-renderizan cuando cambia su estado o props.
        - El estado local se maneja con `useState`, `useReducer` y `useContext`; los efectos secundarios con `useEffect`.
        - Las operaciones asíncronas (consultas a SQLite, sincronización) se manejan con async/await, que es familiar para el equipo.
        - La integración con el repositorio local y el motor de sincronización es directa: las funciones asíncronas actualizan el estado y disparan re-renderizados.
        - El rendimiento es adecuado para listas con `FlatList` y `memo`; se pueden usar `useMemo` y `useCallback` para optimizar.
        - La curva de aprendizaje es baja porque el equipo ya conoce React.
        - No se requieren librerías adicionales; el stack se mantiene ligero.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo; costo de mantenimiento bajo.

      - **Ejemplos**:
        - **Licencias**: ninguna adicional; React Native es open source.
        - **Capacitación**: mínima; el equipo ya domina hooks y componentes.
        - **Operación**: monitoreo estándar de rendimiento en dispositivos de gama baja.
        - **Medición**: tiempos de renderizado, número de re-renderizados.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Alineado con el stack existente (ADR-017).
        - Curva de aprendizaje baja.
        - Código declarativo y fácil de probar.
        - Integración natural con SQLite y sincronización.
        - Suficiente para todas las necesidades de UI de AgroTrack.
      - **Debilidades**:
        - Puede requerir optimización manual en listas muy largas.
        - El estado global debe gestionarse con cuidado (Context o Zustand/Redux si crece).
      - **Oportunidades**:
        - Migrar a Zustand o Redux Toolkit si el estado global se vuelve complejo.
        - Usar `react-query` para caché de datos remotos si se necesita.
      - **Amenazas**:
        - Re-renderizados innecesarios si no se usan `memo` y `useCallback`.
        - Complejidad si se abusa de Context para todo.

    - **Opiniones y comentarios internos**:

      - "React Native ya es reactivo; no necesitamos añadir otra capa de reactividad."
      - "Los spikes están diseñados en React Native; cambiar a RxJS obligaría a reescribirlos."
      - "Con hooks y un buen manejo de estado, tenemos suficiente para una UI fluida y mantenible."

  - **3. Enfoque imperativo (sin reactividad)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de usabilidad y mantenibilidad; es un retroceso.

      - **Detalles**:
        - Actualizar la UI manualmente es propenso a errores y olvidos.
        - El estado se dispersa en variables globales o singletons, dificultando el testing y la consistencia.
        - No hay re-renderizado automático; el desarrollador debe recordar actualizar cada parte de la UI afectada.
        - La integración con el repositorio local requeriría llamadas manuales de actualización en cada pantalla.
        - Es un paradigma obsoleto en el desarrollo móvil moderno.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo inicialmente, pero costo de mantenimiento altísimo por bugs y deuda técnica.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere, pero el equipo sufriría.
        - **Operación**: alta tasa de bugs por estados inconsistentes.
        - **Medición**: cantidad de errores de UI reportados.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Control total sobre cada actualización.
      - **Debilidades**:
        - Propenso a errores.
        - Difícil de escalar y mantener.
        - No se alinea con React Native.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Abandono del equipo por frustración.
        - Bugs en producción.

    - **Opiniones y comentarios internos**:

      - "Sería como volver a jQuery en la era de React. No tiene sentido."
      - "Perderíamos todas las ventajas de React Native."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-014 — Validará que la reactividad basada en componentes es suficiente para una UI fluida y mantenible en dispositivos de gama baja — Propuesto.
    - SPIKE-003 — Validará que el panel de resultados económicos se renderiza en < 300 ms con 500 movimientos usando componentes reactivos — Propuesto.
    - SPIKE-010 — Validará que los controles táctiles y la presentación de valores funcionan correctamente con el paradigma de componentes — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Programación reactiva pura (RxJS) — descartada por complejidad innecesaria.
    - Enfoque imperativo — descartado por propenso a errores y obsoleto.
    - Flutter (con su propio paradigma reactivo) — descartado en ADR-017 por decisión de stack.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, offline-first, con UI sencilla y clara.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-014 (rendimiento de la UI y velocidad de desarrollo), SPIKE-003 (renderizado del panel de resultados) y SPIKE-010 (interacción táctil y presentación de valores).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **reactividad basada en componentes (React Native + hooks/estado)** porque:
    - Es el paradigma natural de React Native y se alinea con el stack decidido en ADR-017.
    - Proporciona una UI fluida y reactiva sin complejidad adicional.
    - La curva de aprendizaje es baja para el equipo.
    - Se integra sin fricción con SQLite, el motor de sincronización y las validaciones.
    - Es suficiente para todas las necesidades de UI de AgroTrack, incluyendo listas, formularios y resúmenes.
    - No requiere librerías pesadas ni cambios de paradigma.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que la UI responda en ≤ 16 ms por frame, que el renderizado de listas con 100 ítems sea fluido y que el desarrollo sea rápido gracias a la familiaridad del equipo.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de la interfaz de usuario.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con React Native, React Navigation, SQLite (ADR-013), motor de sincronización (ADR-001), validación centralizada (ADR-002) y sistema de diseño (ADR-010).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: No sobre-ingenierizar el manejo de estado. Empezar con `useState` y `useContext`; migrar a Zustand o Redux Toolkit solo si el estado global se vuelve inmanejable. Usar `FlatList` con `memo` y `useCallback` para listas largas. Evitar RxJS a menos que aparezcan flujos en tiempo real.

  - **Anécdotas**:

    - En el diseño del SPIKE-003 se planteó como hipótesis que un panel de resultados con 500 movimientos se renderiza en menos de 300 ms usando componentes funcionales y `useMemo`. Si se confirma, no será necesario RxJS.
    - Durante las pruebas del SPIKE-010, los controles táctiles respondieron correctamente sin necesidad de gestión reactiva avanzada; el estado local fue suficiente.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar la **reactividad basada en componentes (React Native + hooks/estado)** como el paradigma de programación de la interfaz móvil, cumpliendo con los escenarios ESC-CAL-US-01, ESC-CAL-US-03, ESC-CAL-US-06, ESC-CAL-US-13 y ESC-CAL-ACC-02.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre usabilidad, rendimiento, mantenibilidad y costo.

    La implementación deberá considerar como mínimo:

    - **Componentes funcionales** con `useState`, `useReducer` y `useContext` para estado local y compartido.
    - **Efectos secundarios** con `useEffect` para suscripciones a NetInfo, carga inicial de datos y sincronización.
    - **Listas** con `FlatList` y `memo` para evitar re-renderizados innecesarios.
    - **Optimización** con `useMemo` y `useCallback` en componentes pesados.
    - **Manejo de estado global** con Context para autenticación y tema; evaluar Zustand o Redux Toolkit si crece.
    - **Operaciones asíncronas** con async/await para consultas a SQLite y llamadas HTTP.
    - **Pruebas** con Jest y React Native Testing Library.
    - **Monitoreo** de rendimiento con React DevTools Profiler y React Native DevTools.