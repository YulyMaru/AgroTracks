# ADR-003: Presentar resultados económicos en tarjetas

- **Título**: Presentar resultados económicos en tarjetas diferenciadas para la comprensión del usuario.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones para presentar ingresos, gastos y resultado económico de manera clara y diferenciada, asegurando que el campesino identifique correctamente cada concepto y comprenda su situación financiera en el periodo consultado.

  - **Detalles**:

    - **Claridad conceptual**: el usuario debe distinguir correctamente entre ingresos, gastos y resultado (utilidad/pérdida).
    - **Diferenciación visual**: cada concepto debe tener una representación visual distintiva (colores, iconos, posición) que facilite su identificación.
    - **Comprensión del resultado**: el sistema debe indicar claramente si el resultado es positivo (ganancia) o negativo (pérdida) mediante una etiqueta textual.
    - **Consistencia de datos**: los valores mostrados deben ser exactos y consistentes con los registros almacenados.
    - **Rendimiento**: el cálculo y renderizado del panel debe completarse en < 300 ms para 500 movimientos.
    - **Mantenibilidad**: la lógica de cálculo debe estar separada de la capa de presentación.
    - **Costo de implementación**: la solución debe ser viable con el stack actual (aplicación móvil + backend PostgreSQL).
    - **Escenario de calidad relacionado**: ESC-CAL-US-06.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para la presentación de resultados económicos en aplicaciones móviles, considerando la capacidad del usuario para comprender la información financiera.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Vista numérica única (resultado total)**: se muestra únicamente el número del resultado final (ej. "+$125.000" o "-$30.000") sin desglosar ingresos ni gastos.
    2. **Vista tabular detallada con resumen**: se muestra una tabla con todos los movimientos del periodo (ingresos y gastos mezclados) y al final un total acumulado.
    3. **Panel de control resumido (tarjetas diferenciadas)**: se presentan tres tarjetas o bloques visuales separados:
       - **Ingresos totales** (verde/azul, con icono de ingreso).
       - **Gastos totales** (rojo/naranja, con icono de gasto).
       - **Resultado neto** (destacado, con color positivo/negativo según corresponda, y texto explicativo como "Ganancia" o "Pérdida").

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de visualización de datos financieros en aplicaciones de finanzas personales y agrícolas, considerando la alfabetización financiera limitada del usuario objetivo. Se revisaron estudios de usabilidad sobre el uso de color, etiquetas y agrupación para mejorar la comprensión.

  - **1. Vista numérica única (resultado total)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de claridad conceptual ni diferenciación.

      - **Detalles**:
        - El usuario ve un número, pero no sabe de dónde viene ni si es bueno o malo en el contexto de sus operaciones.
        - No distingue entre ingresos y gastos, por lo que no puede tomar decisiones informadas ("¿Dónde estoy gastando mucho?").
        - Si el resultado es negativo, el usuario no sabe cuánto gastó en exceso.
        - Es la opción más sencilla técnicamente, pero la menos útil para el usuario.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación muy bajo, pero alto costo de soporte y posible abandono de la aplicación por falta de utilidad.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el usuario necesitaría explicación adicional para interpretar el número.
        - **Operación**: baja carga de cálculo, pero alta frustración del usuario.
        - **Medición**: no aplica, porque la funcionalidad no cumple el objetivo.

    - **Análisis FODA**:
      - **Fortalezas**: simplicidad extrema.
      - **Debilidades**: no cumple el objetivo principal de ayudar al campesino a comprender su situación.
      - **Oportunidades**: podría complementarse con más detalles, pero en su forma pura es insuficiente.
      - **Amenazas**: pérdida de confianza en la herramienta porque "no explica nada".

    - **Opiniones y comentarios internos**:
      - "Eso sería como darle la temperatura sin decirle si tiene fiebre".

  - **2. Vista tabular detallada con resumen**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con la exactitud y consistencia, pero falla en la claridad y diferenciación visual.

      - **Detalles**:
        - Muestra todos los movimientos, lo que puede ser abrumador para el campesino, especialmente si hay muchas transacciones.
        - Los totales suelen aparecer al final, pero el usuario tiene que hacer un esfuerzo cognitivo para separar mentalmente ingresos y gastos.
        - No hay diferenciación visual fuerte entre tipos de movimientos.
        - Aunque permite auditoría, no facilita la comprensión rápida del resultado.

    - **Análisis de costos**:
      - **Resumen**: Costo medio de implementación, pero requiere un buen diseño de tabla y paginación.
      - **Ejemplos**:
        - **Licencias**: librerías de tablas.
        - **Capacitación**: el usuario debe aprender a leer la tabla y buscar los totales.
        - **Operación**: puede ser lenta si no se indexan bien las fechas.
        - **Medición**: tiempo de carga de la tabla con diferentes volúmenes de datos.

    - **Análisis FODA**:
      - **Fortalezas**: transparencia total, el usuario ve todos los registros.
      - **Debilidades**: sobrecarga de información, difícil identificar rápidamente el resultado.
      - **Oportunidades**: puede usarse como vista de detalle, pero no como vista principal.
      - **Amenazas**: el usuario se siente abrumado y abandona la consulta.

    - **Opiniones y comentarios internos**:
      - "Esto es bueno para un contador, pero nuestro usuario es un campesino que quiere saber si ganó o perdió".

  - **3. Panel de control resumido (tarjetas diferenciadas)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios de claridad, diferenciación y comprensión.

      - **Detalles**:
        - Presenta los tres conceptos clave (Ingresos, Gastos, Resultado) en bloques visuales independientes.
        - Cada tarjeta usa un color distintivo y un icono reconocible (ej. flecha hacia arriba, flecha hacia abajo, y un círculo para el resultado).
        - El resultado se muestra con un énfasis especial (tamaño de fuente mayor) y un mensaje textual (ej. "Ganancia" en verde o "Pérdida" en rojo) que elimina la ambigüedad.
        - El usuario puede comparar rápidamente ingresos vs gastos y entender el resultado.
        - Permite agregar un botón "Ver detalle" para navegar a la vista tabular si el usuario quiere profundizar, manteniendo la pantalla principal simple.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación moderado, pero alto retorno en experiencia de usuario.
      - **Ejemplos**:
        - **Licencias**: no requiere licencias adicionales.
        - **Capacitación**: mínima, porque el diseño es intuitivo.
        - **Operación**: el cálculo es el mismo (suma de ingresos y gastos), la separación es solo en la presentación.
        - **Medición**: se puede medir la tasa de éxito en pruebas de usabilidad (identificación correcta de los conceptos).

    - **Análisis FODA**:
      - **Fortalezas**:
        - Alta claridad y diferenciación.
        - Reduce la carga cognitiva.
        - Permite tomar decisiones rápidas.
        - Escalable a más periodos o comparativas.
        - Experiencia de usuario alineada con el objetivo principal de AgroTrack.
      - **Debilidades**:
        - Requiere un diseño cuidadoso de colores, iconos y tipografía.
        - Si no se eligen bien los colores, puede haber confusión.
        - Depende de que los datos estén correctamente categorizados (ingreso vs gasto).
      - **Oportunidades**:
        - Se puede extender con gráficos simples (ej. barras comparativas).
        - Se puede aplicar a otros módulos de la aplicación (ej. resultados por cultivo).
      - **Amenazas**:
        - El usuario podría ignorar el detalle si no se usa el color/texto adecuado.
        - Si el resultado es cero, debe manejarse con un mensaje neutral (ej. "Punto de equilibrio").

    - **Opiniones y comentarios internos**:
      - "Es la forma en que los bancos y las billeteras móviles muestran el saldo; los usuarios ya están familiarizados con este patrón".
      - "Podemos usar verde para ingresos, rojo para gastos, y un azul fuerte o amarillo para el resultado, con un emoji como ✅ o ❌".
      - "El orden importa: Ingresos → Gastos → Resultado cuenta una historia lógica".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-003 — Validará que las 3 tarjetas (Ingresos, Gastos, Resultado) son comprendidas por el 100 % de los usuarios — Propuesto.
    - SPIKE-008 — Validará que la advertencia de análisis incompleto se distingue del resultado completo — Propuesto.
    - SPIKE-010 — Validará que los valores con concepto y unidad eliminan ambigüedad — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Uso de gráficos circulares (donut charts) para mostrar proporciones — descartado porque el resultado neto no se representa bien en un círculo.
    - Vista numérica única — descartada por pobreza informativa.
    - Tabla detallada — descartada por sobrecarga cognitiva.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, sin conocimientos contables avanzados.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante los spikes SPIKE-003, SPIKE-008 y SPIKE-010, que probarán la claridad, la diferenciación visual y la comprensión de los valores por parte de los usuarios.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **panel de control resumido con tarjetas diferenciadas** porque:
    - Los spikes demostrarán comprensión del 100 % sin sobrecargar.
    - Proporciona la información clave de un vistazo.
    - Diferencia claramente ingresos, gastos y resultado mediante color, icono y posición.
    - El resultado se presenta con un mensaje textual positivo/negativo que elimina ambigüedades.
    - Es un patrón conocido en otras aplicaciones, lo que reduce la curva de aprendizaje.
    - Permite profundizar (vista detalle) sin saturar la pantalla principal.
    - Es técnicamente sencillo de implementar con el stack actual.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Se espera que, en las pruebas de usabilidad, el 100 % de los usuarios identifiquen correctamente ingresos, gastos y resultado, tal como exige el escenario de calidad. Se realizarán pruebas A/B de los colores y etiquetas para optimizar la comprensión. El tiempo de carga del panel debe ser inferior a 1 s para 500 movimientos. Pendiente de ejecución de los spikes.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las consultas de resultados económicos utilizarán este panel de control.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con el módulo de ingresos y gastos, con el motor de sincronización offline (ADR-001) para mostrar resultados sin conexión, con el sistema de autenticación para filtrar por usuario, y con el sistema de analítica para registrar eventos de consulta.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: No subestimar la importancia del mensaje textual acompañado del número. Un número solo es frío; "Ganancia: $125.000" es mucho más significativo. Asegurarse de incluir el periodo consultado (ej. "Enero 2026") para dar contexto. Incluir una comparativa con el periodo anterior (ej. flecha de tendencia) si los datos lo permiten, como valor agregado. Considerar el daltonismo usando iconos además del color.

  - **Anécdotas**:

    - En el diseño del SPIKE-003 se aprendió que el orden de las tarjetas importa: Ingresos → Gastos → Resultado cuenta una historia lógica ("esto entra, esto sale, esto queda").
    - También se identificó que un número solo, sin etiqueta de "Ganancia" o "Pérdida", genera preguntas como "¿eso es bueno o malo?". La etiqueta textual es clave.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un **panel de control resumido con tres tarjetas diferenciadas (Ingresos, Gastos, Resultado)** como la estrategia de presentación de resultados económicos, cumpliendo con el escenario ESC-CAL-US-06.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre claridad, experiencia de usuario y costo de implementación.

    La implementación deberá considerar como mínimo:

    - Tres tarjetas visualmente diferenciadas: Ingresos (verde/azul, icono ↑), Gastos (rojo/naranja, icono ↓), Resultado (destacado, con color variable según signo).
    - Etiqueta textual del resultado: "Ganancia" (si > 0), "Pérdida" (si < 0), o "Punto de equilibrio" (si = 0).
    - Formato de moneda local (ej. pesos colombianos COP) con separadores de miles.
    - Indicación clara del periodo consultado (ej. "Del 1 al 31 de enero de 2026").
    - Lógica de cálculo separada en un servicio o hook, para mantener la presentación limpia.
    - Opción "Ver detalle" que navegue a la vista tabular (candidato 2) como capa de profundización.
    - Pruebas de usabilidad con usuarios reales para validar la comprensión (criterio de éxito: 100 % de identificación correcta).

    Se descarta la vista numérica única por su pobreza informativa, y la tabla detallada como vista principal por su sobrecarga cognitiva. El panel de control es la opción que empodera al campesino con información clara y accionable.