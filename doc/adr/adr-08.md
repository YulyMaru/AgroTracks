# ADR-008: Advertir análisis incompletos con datos faltantes

- **Título**: Advertir análisis incompletos con datos faltantes, cumpliendo con el escenario de calidad ESC-CAL-CF-08.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones que permitan identificar cuándo un análisis económico no cuenta con todos los datos requeridos, evitando presentar un resultado incompleto como definitivo y comunicando claramente al usuario qué información falta.

  - **Detalles**:

    - **Detección de datos faltantes**: el sistema debe verificar los datos necesarios para cada análisis antes de mostrar un resultado.
    - **Comunicación clara**: el 100 % de los análisis con información insuficiente debe identificarse como incompleto, con un mensaje que indique específicamente qué datos faltan.
    - **Prevención de decisiones erróneas**: evitar que el usuario tome decisiones económicas basándose en resultados que no representan toda la información disponible.
    - **Transparencia**: el usuario debe poder ver el resultado parcial si lo desea, pero siempre con una advertencia prominente de que está incompleto.
    - **Mantenibilidad**: las reglas de integridad (qué datos son mínimos para cada análisis) deben ser fáciles de configurar y actualizar.
    - **Costo de implementación**: la solución debe ser viable con el stack actual y no requerir infraestructura adicional.
    - **Escenario de calidad relacionado**: ESC-CAL-CF-08.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para manejar análisis con información insuficiente, considerando la experiencia de usuario y la integridad de los resultados.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **No verificar integridad (mostrar resultado parcial sin advertencia)**: el sistema muestra el resultado con los datos disponibles, aunque sea incompleto, sin indicar que falta información.
    2. **Verificar y advertir (resultado parcial con advertencia)**: el sistema verifica los datos, muestra una advertencia clara (ej. "Análisis incompleto"), identifica los datos faltantes y presenta el resultado parcial con un indicador visible de que no es definitivo.
    3. **Bloquear análisis incompleto**: el sistema impide generar el análisis hasta que se completen todos los datos requeridos, mostrando un mensaje de "Datos insuficientes".

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de validación de integridad en sistemas de análisis y reporting, considerando el equilibrio entre utilidad (mostrar algo) y precisión (no engañar al usuario).

  - **1. No verificar integridad (mostrar resultado parcial sin advertencia)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de comunicación clara ni prevención de decisiones erróneas.

      - **Detalles**:
        - El usuario ve un resultado que parece completo, pero en realidad solo considera una parte de los datos.
        - Puede tomar decisiones de negocio basadas en información incorrecta (ej. pensar que tuvo ganancias cuando en realidad no registró todos los gastos).
        - No hay ningún indicio de que falta información, por lo que el usuario confía en un dato erróneo.
        - Es el enfoque más peligroso desde el punto de vista de la confiabilidad.

    - **Análisis de costos**:
      - **Resumen**: Bajo costo de implementación (no hacer nada), pero altísimo costo de reputación y confianza.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el usuario debe aprender a identificar por sí mismo si faltan datos.
        - **Operación**: alto riesgo de reclamos y pérdida de confianza.
        - **Medición**: cantidad de reclamos por resultados incorrectos.

    - **Análisis FODA**:
      - **Fortalezas**: simplicidad, no requiere lógica adicional.
      - **Debilidades**: engaña al usuario, genera decisiones incorrectas, destruye la confianza en AgroTrack.
      - **Oportunidades**: ninguna.
      - **Amenazas**: el campesino podría tomar decisiones financieras equivocadas y culpar a la aplicación.

    - **Opiniones y comentarios internos**:
      - "Es inaceptable mostrar un resultado incompleto como si fuera definitivo. Es peor que no mostrar nada".

  - **2. Verificar y advertir (resultado parcial con advertencia)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios, ofreciendo el mejor equilibrio entre utilidad y transparencia.

      - **Detalles**:
        - El sistema verifica previamente si existen todos los datos mínimos requeridos para el análisis.
        - Si faltan datos, muestra un mensaje claro y contextual: "Análisis incompleto. Faltan datos de gastos para el período seleccionado".
        - Presenta el resultado parcial (ej. solo ingresos) pero con un indicador visual prominente (ej. fondo amarillo, borde naranja, ícono de advertencia) que indica que no es definitivo.
        - El usuario puede ver la información parcial (útil para tener una idea) pero sabe que no debe tomar decisiones definitivas.
        - Los datos faltantes se listan explícitamente, orientando al usuario sobre qué debe registrar para completar el análisis.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación medio, pero alto retorno en confiabilidad y confianza del usuario.
      - **Ejemplos**:
        - **Licencias**: no requiere licencias adicionales.
        - **Capacitación**: baja, porque la interfaz es autodescriptiva.
        - **Operación**: requiere definir para cada análisis los datos mínimos requeridos.
        - **Medición**: se puede medir la frecuencia de análisis incompletos y la efectividad de las advertencias.

    - **Análisis FODA**:
      - **Fortalezas**:
        - Comunica claramente la insuficiencia de datos.
        - Permite al usuario ver información parcial sin engañarlo.
        - Orienta al usuario sobre qué datos faltan.
        - Es transparente y genera confianza.
      - **Debilidades**:
        - Requiere definir reglas de integridad para cada tipo de análisis.
        - El usuario podría ignorar la advertencia y aun así tomar decisiones prematuras.
      - **Oportunidades**:
        - Se puede expandir a otros módulos de análisis (ej. rentabilidad por cultivo).
        - Se puede integrar con el sistema de notificaciones para recordar al usuario registrar datos faltantes.
      - **Amenazas**:
        - Si la advertencia no es lo suficientemente visible, el usuario podría pasarla por alto.

    - **Opiniones y comentarios internos**:
      - "Esta es la opción correcta. No escondemos la información, pero tampoco engañamos. El campesino merece saber la verdad completa".
      - "Podemos usar un banner con ícono de advertencia y un mensaje claro. El resultado parcial se muestra pero con un fondo de color diferente".

  - **3. Bloquear análisis incompleto**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con la prevención de decisiones erróneas, pero falla en la utilidad y experiencia de usuario.

      - **Detalles**:
        - Impide completamente al usuario ver cualquier tipo de resultado si faltan datos.
        - El usuario se queda sin información y no puede tener ni siquiera una visión parcial.
        - Puede ser frustrante si el usuario quiere ver un avance, aunque sea incompleto.
        - No permite al usuario identificar fácilmente qué datos faltan, a menos que se muestre en el mensaje de bloqueo.

    - **Análisis de costos**:
      - **Resumen**: Costo medio, pero baja satisfacción del usuario.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el usuario debe entender por qué no puede ver el análisis.
        - **Operación**: similar a la opción 2, pero con menos flexibilidad.
        - **Medición**: cantidad de usuarios que abandonan la pantalla al ver el bloqueo.

    - **Análisis FODA**:
      - **Fortalezas**: garantiza que nunca se muestre un resultado incompleto.
      - **Debilidades**: frustra al usuario, no permite ver avances, puede parecer que la app "no funciona".
      - **Oportunidades**: podría ser útil para análisis críticos donde el resultado parcial es realmente engañoso.
      - **Amenazas**: el usuario puede abandonar la app si constantemente encuentra bloqueos.

    - **Opiniones y comentarios internos**:
      - "Es demasiado restrictivo. A veces el campesino quiere ver cuánto ha ingresado aunque no haya registrado todos los gastos".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-008 — Validará que el 100 % de los usuarios identifica análisis incompleto, sabe qué datos faltan y distingue el resultado parcial — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Mostrar resultado sin advertencia — descartado por engañoso.
    - Bloquear análisis — descartado por restrictivo.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos que toman decisiones económicas.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-008, que probará la detección de datos faltantes, la claridad de la advertencia y la comprensión del resultado parcial.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **opción 2 (verificar y advertir)** porque:
    - Es la única que combina transparencia (informa al usuario) con utilidad (muestra el resultado parcial).
    - Previene decisiones erróneas mediante una advertencia clara.
    - Orienta al usuario sobre qué datos faltan, fomentando la acción correctiva.
    - Es el enfoque estándar en aplicaciones de análisis.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el 100 % de los usuarios identifique el análisis incompleto y sepa qué datos faltan. Se medirá la frecuencia de análisis incompletos y la efectividad de las advertencias.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los análisis económicos utilizarán esta validación.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con el módulo de ingresos y gastos, con el sistema de validación de formularios (ADR-002), con el sistema de presentación de resultados (ADR-003) y con el sistema de estados vacíos (ADR-004) para diferenciar "sin datos" de "datos insuficientes".
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir las reglas de integridad por análisis desde el inicio, en colaboración con el Product Owner. Hacer la advertencia visualmente prominente. Incluir un enlace directo para registrar los datos faltantes. Probar la comprensión de la advertencia con usuarios reales.

  - **Anécdotas**:

    - En el diseño del SPIKE-008 se aprendió que un campesino puede confiar en un resultado incompleto si no se le advierte.
    - También se identificó que el resultado parcial debe mostrarse con un estilo visual diferenciado (fondo amarillo, borde naranja) para que el usuario no lo confunda con un resultado completo.
    - Se observó que listar explícitamente los datos faltantes ("Faltan gastos de transporte") es más efectivo que un mensaje genérico.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un sistema de **verificación de integridad de datos con advertencia contextual**, que identifique los análisis con información insuficiente, muestre un mensaje claro sobre los datos faltantes, y presente el resultado parcial con una advertencia visible, cumpliendo con el escenario de calidad ESC-CAL-CF-08.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre transparencia, utilidad y prevención de errores.

    La implementación deberá considerar como mínimo:

    - Un servicio de validación de integridad que, antes de generar cualquier análisis, verifique si existen los datos mínimos requeridos.
    - Componente UI de advertencia: banner "Análisis incompleto" con ícono, mensaje contextual y lista de datos faltantes.
    - Presentación del resultado parcial con un estilo diferenciado (fondo amarillo, borde naranja) para que el usuario sepa que no es definitivo.
    - Mensaje orientado a la acción: "Para completar este análisis, registra los siguientes datos: [lista]".
    - Enlace directo al formulario de registro de los datos faltantes.
    - Diferenciación clara respecto al estado vacío (ADR-004): "sin datos" ≠ "datos insuficientes".
    - Pruebas de usabilidad para validar que los usuarios entienden la advertencia y saben qué hacer.

    Se descarta mostrar el resultado sin advertencia (por su peligrosidad) y bloquear completamente el análisis (por su baja utilidad). La verificación con advertencia es la opción que empodera al usuario con información transparente y accionable.