# ADR-004: Comunicar ausencia de datos con estados vacíos

- **Título**: Comunicar ausencia de datos con estados vacíos contextuales para cumplir con el escenario de calidad ESC-CAL-US-13.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones para comunicar explícitamente al usuario cuando una consulta no arroja resultados, evitando que interprete una pantalla vacía como un error de la aplicación o como pérdida de información.

  - **Detalles**:

    - **Claridad comunicativa**: el mensaje debe indicar inequívocamente que no existen datos para los criterios seleccionados, no que hay un error o que la pantalla está en blanco por un fallo.
    - **Distinción entre estados**: el sistema debe diferenciar claramente entre "no hay datos" (estado vacío legítimo) y "no se pudo cargar la información" (error de conexión, timeout, etc.).
    - **Contextualización**: el mensaje debe ser específico al módulo o criterio consultado (ej. "No hay gastos registrados en enero de 2026" en lugar de un genérico "Sin datos").
    - **Orientación a la acción**: el estado vacío debe sugerir una acción al usuario (ej. "Registra tu primer gasto" o "Prueba con otro período") para guiarlo y reducir la frustración.
    - **Reutilización**: los componentes de mensajes (vacío, error, carga) deben ser reutilizables en toda la aplicación para mantener consistencia y reducir esfuerzo de desarrollo.
    - **Rendimiento**: la decisión entre mostrar datos o mostrar el estado vacío debe resolverse sin renderizado adicional perceptible (< 16 ms).
    - **Costo de implementación**: la solución debe ser viable con el stack actual y no requerir infraestructura adicional.
    - **Escenario de calidad relacionado**: ESC-CAL-US-13.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para manejar la ausencia de resultados en aplicaciones móviles, considerando la experiencia de usuario y la claridad comunicativa.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Pantalla completamente en blanco**: no se muestra ningún mensaje ni elemento; la pantalla aparece vacía.
    2. **Mensaje de texto genérico**: se muestra un texto fijo como "No hay datos" o "Sin resultados", sin contexto adicional ni acción sugerida.
    3. **Componente de estado vacío contextual**: se muestra una ilustración/icono, un mensaje específico al contexto (ej. "Aún no has registrado gastos en este mes"), y una acción sugerida (ej. "Registrar gasto" o "Cambiar período").

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de diseño de estados vacíos (empty states) en aplicaciones móviles, considerando guías de diseño ampliamente adoptadas y la experiencia de aplicaciones móviles modernas. Se identificó que el estado vacío es una oportunidad de interacción, no un callejón sin salida.

  - **1. Pantalla completamente en blanco**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con ninguno de los criterios de claridad, distinción ni orientación.

      - **Detalles**:
        - El usuario no recibe ninguna explicación, por lo que puede asumir que la aplicación no funciona, que se perdieron sus datos, o que la consulta está mal hecha.
        - No permite distinguir entre falta de datos y error de carga.
        - No guía al usuario hacia ninguna acción, dejándolo sin saber qué hacer.
        - Es el enfoque más pobre desde el punto de vista de UX.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación nulo (no hacer nada), pero alto costo de soporte y abandono de la aplicación.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el usuario necesitaría soporte externo para entender qué pasa.
        - **Operación**: alta tasa de consultas de soporte ("¿La app se dañó?").
        - **Medición**: no aplica, porque la funcionalidad no cumple el objetivo.

    - **Análisis FODA**:
      - **Fortalezas**: no consume tiempo de desarrollo.
      - **Debilidades**: pésima experiencia de usuario, genera incertidumbre y desconfianza.
      - **Oportunidades**: ninguna.
      - **Amenazas**: pérdida de confianza en AgroTrack, abandono de la aplicación.

    - **Opiniones y comentarios internos**:
      - "Una pantalla en blanco es lo peor que le puede pasar a un usuario. Prefiere un error a un silencio".

  - **2. Mensaje de texto genérico**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con la claridad básica, pero falla en la contextualización y orientación a la acción.

      - **Detalles**:
        - Al menos informa que no hay datos, lo cual es mejor que el blanco absoluto.
        - Sin embargo, el mensaje "No hay datos" es frío y no contextualiza.
        - El usuario no sabe si es porque no registró nada, porque eligió un período incorrecto, o porque hay un problema.
        - No ofrece ninguna acción sugerida, por lo que el usuario debe explorar por su cuenta.
        - No hay diferenciación visual entre estado vacío y estado de error.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación muy bajo, pero utilidad limitada.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima, pero el mensaje no ayuda mucho.
        - **Operación**: fácil de implementar, pero no reduce significativamente la confusión del usuario.
        - **Medición**: se puede medir la cantidad de clics del usuario intentando "hacer algo" tras ver el mensaje.

    - **Análisis FODA**:
      - **Fortalezas**: implementación trivial, comunica lo básico.
      - **Debilidades**: no es contextual, no orienta, no es amigable.
      - **Oportunidades**: podría evolucionar fácilmente a la opción 3.
      - **Amenazas**: el usuario sigue sin saber qué hacer y puede frustrarse.

    - **Opiniones y comentarios internos**:
      - "Es mejor que nada, pero sigue siendo un mensaje robótico. No le habla al campesino en su lenguaje".

  - **3. Componente de estado vacío contextual**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios, ofreciendo la mejor experiencia de usuario, claridad y orientación.

      - **Detalles**:
        - Utiliza una ilustración, icono o elemento visual que suaviza la experiencia (ej. una lupa, una lista vacía, un ícono de calendario).
        - El mensaje es específico al contexto: indica qué módulo se está consultando y qué criterios se usaron (ej. "No hay gastos registrados para el cultivo de café en enero").
        - Diferencia visualmente el estado vacío del estado de error (colores, iconos distintos, mensajes diferentes).
        - Incluye una acción sugerida: un botón o enlace que lleva al usuario a realizar una acción útil (ej. "Registrar gasto", "Seleccionar otro período", "Agregar cultivo").
        - El componente es reutilizable en toda la aplicación, pero permite personalizar mensaje, ícono y acción según el contexto.
        - Reduce la frustración y guía al usuario hacia el siguiente paso.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación moderado (diseño de componentes), pero alto retorno en retención y satisfacción del usuario.
      - **Ejemplos**:
        - **Licencias**: se pueden usar librerías de iconos o ilustraciones gratuitas (ej. `react-native-vector-icons`, ilustraciones SVG).
        - **Capacitación**: baja, porque el diseño es intuitivo y autodescriptivo.
        - **Operación**: el componente debe recibir parámetros (mensaje, acción, ícono), lo cual es manejable.
        - **Medición**: se puede medir el clic en el botón de acción sugerida como indicador de engagement.

    - **Análisis FODA**:
      - **Fortalezas**:
        - Comunica claramente la ausencia de datos.
        - Diferencia el estado vacío del error.
        - Orienta al usuario con una acción concreta.
        - Humaniza la experiencia y genera confianza.
        - Es reusable y escalable a toda la aplicación.
      - **Debilidades**:
        - Requiere un diseño cuidadoso de ilustraciones y textos.
        - Cada módulo necesita su propio mensaje y acción, lo que implica un poco más de planificación.
      - **Oportunidades**:
        - Se puede usar en toda la aplicación (historial, resultados, seguimientos, etc.).
        - Se pueden hacer pruebas A/B de mensajes para mejorar la efectividad.
      - **Amenazas**:
        - Si la ilustración o mensaje es genérico, pierde efectividad.
        - Si la acción sugerida no es relevante, el usuario la ignora.

    - **Opiniones y comentarios internos**:
      - "Es el patrón que usan las aplicaciones modernas para guiar al usuario en lugar de dejarlo en un callejón sin salida".
      - "Podemos tener un componente `EmptyState` que reciba `title`, `description`, `iconName` y `actionButton`".
      - "Es crucial que el mensaje sea en lenguaje coloquial, no técnico. Decir 'Gastos' en lugar de 'Transacciones debitadas'".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-004 — Validará que el 100 % de los usuarios distingue "sin datos" de "error" — Propuesto.
    - SPIKE-008 — Validará que la diferenciación entre vacío, incompleto y error es comprendida — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Mostrar un mensaje emergente al cargar una pantalla vacía — descartado porque es intrusivo y no persistente.
    - Redirigir automáticamente a otra pantalla (ej. al registro) — descartado porque quita el control al usuario.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, donde las consultas sin resultados son comunes (meses sin gastos, cultivos nuevos sin seguimientos).
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante los spikes SPIKE-004 y SPIKE-008, que probarán la comprensión de los usuarios y la diferenciación entre estados (vacío, incompleto, error).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **componente de estado vacío contextual** porque:
    - Cumple al 100 % con el criterio de comunicación explícita.
    - Diferencia claramente "sin datos" de "error".
    - Orienta al usuario con una acción concreta, convirtiendo una situación de "callejón sin salida" en una oportunidad de interacción.
    - Es altamente reutilizable y estandarizable en toda la aplicación.
    - Es el patrón común en aplicaciones modernas, lo que reduce la curva de aprendizaje.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Se implementará un componente `EmptyState` en el módulo de componentes compartidos. Se usará en todas las pantallas de listado (gastos, ingresos, seguimientos, resultados, etc.). Cada pantalla definirá su propio mensaje y acción sugerida. Pendiente de ejecución de los spikes.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las consultas sin resultados utilizarán este componente.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con el sistema de navegación (para las acciones sugeridas), con el módulo de estado de las pantallas (`loading`, `success`, `empty`, `error`), con el repositorio local (ADR-006) para determinar si hay datos, y con el sistema de internacionalización si aplica.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: No subestimar el poder de las ilustraciones; un buen ícono o ilustración puede hacer que el estado vacío sea casi agradable. Definir un set de mensajes estandarizados por módulo desde el principio para evitar inconsistencias. Probar los mensajes con usuarios reales; a veces lo que parece obvio para el equipo no lo es para el campesino.

  - **Anécdotas**:

    - En el diseño del SPIKE-004 se aprendió que un buen icono (lupa, calendario vacío) suaviza la experiencia.
    - También se identificó que los mensajes deben estar en lenguaje coloquial; "No hay transacciones debitadas" no se entiende, "No hay gastos" sí.
    - Se observó que cuando la acción sugerida no está clara (ej. solo un texto sin botón), el usuario no interactúa con ella.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un **componente de estado vacío contextual** como la estrategia estándar para manejar la ausencia de información en todas las consultas de AgroTrack, cumpliendo con el escenario ESC-CAL-US-13.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre claridad comunicativa, experiencia de usuario, orientación a la acción y reutilización.

    La implementación deberá considerar como mínimo:

    - Un componente reutilizable `EmptyState` que acepte parámetros: `icon` (nombre del ícono o ilustración), `title` (título del mensaje), `description` (descripción contextual), `actionLabel` (texto del botón) y `onAction` (función a ejecutar).
    - Un componente separado `ErrorState` para errores de conexión o servidor, con un mensaje diferente y una acción de "Reintentar".
    - Definición de mensajes específicos por módulo (ej. Gastos: "No hay gastos en este período"; Ingresos: "Aún no has registrado ingresos"; Resultados: "No hay movimientos para mostrar").
    - Acciones sugeridas alineadas con el contexto (ej. "Registrar gasto", "Seleccionar otro mes", "Agregar cultivo").
    - Un diseño visual consistente (color neutro, icono amigable, tipografía clara) que no confunda con una pantalla de error.
    - Mensajes en lenguaje coloquial, no técnico.
    - Pruebas de usabilidad para validar que el 100 % de los usuarios identifica correctamente que no hay datos y entiende la acción sugerida.

    Se descarta la pantalla en blanco por su nula comunicación y el mensaje genérico por su falta de contexto y orientación. El estado vacío contextual es la opción que convierte una experiencia potencialmente negativa en una oportunidad de engagement.