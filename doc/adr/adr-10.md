# ADR-010: Estandarizar táctil y valores con unidades

- **Título**: Estandarizar la interacción táctil y la presentación de valores con unidades, cumpliendo con los escenarios ESC-CAL-ACC-02 y ESC-CAL-ACC-06.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones para asegurar que los controles táctiles en la aplicación móvil tienen dimensiones adecuadas y separación suficiente para reducir pulsaciones accidentales, y que los valores numéricos se presentan con su concepto y unidad correspondiente de manera clara, permitiendo que el usuario identifique correctamente ingresos, gastos, cantidades, áreas y otras magnitudes.

  - **Detalles**:

    - **Interacción táctil precisa**: el 100 % de los controles principales (botones, enlaces, checkboxes, elementos de navegación) debe cumplir con las dimensiones mínimas definidas para interacción táctil (ej. 44x44 pt en iOS, 48x48 dp en Android).
    - **Separación adecuada**: debe haber suficiente espacio entre controles (mínimo 8 dp) para evitar pulsaciones accidentales, especialmente en dispositivos con pantallas pequeñas.
    - **Distinción de valores y unidades**: el 100 % de los valores numéricos presentados (ingresos, gastos, cantidades, áreas, pesos, etc.) debe incluir una identificación clara del concepto y la unidad correspondiente.
    - **Consistencia visual**: los formatos de unidades deben ser consistentes en toda la aplicación (ej. COP para pesos colombianos, kg para kilogramos, m² para metros cuadrados, L para litros, etc.).
    - **Accesibilidad**: los colores y contrastes deben ser adecuados para usuarios con baja visión, y se debe considerar el daltonismo (usar iconos o patrones además del color).
    - **Costo de implementación**: la solución debe basarse en componentes reutilizables del sistema de diseño, sin requerir infraestructura adicional.
    - **Escenarios de calidad relacionados**: ESC-CAL-ACC-02, ESC-CAL-ACC-06.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para la interacción táctil y tres para la presentación de valores, considerando la usabilidad, la accesibilidad y el costo de implementación.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    **Para interacción táctil:**

    1. **Controles sin estándares (dimensiones pequeñas o predeterminadas)**: se usan las dimensiones predeterminadas de los frameworks sin ajustes, que en algunos casos pueden ser pequeñas (ej. 24x24 dp para algunos iconos o botones sin padding).
    2. **Controles con dimensiones estándar fijas**: se aplican estrictamente las dimensiones mínimas (48x48 dp en Android, 44x44 pt en iOS) a todos los controles, sin excepción.
    3. **Controles adaptativos (estándar + ajuste por densidad)**: se usan las dimensiones estándar como base, pero se ajustan automáticamente a diferentes densidades de píxel (usando unidades `dp` en Android y `pt` en iOS) y se adaptan a diferentes tamaños de pantalla (ej. usando `flex` o `%`).

    **Para presentación de valores y unidades:**

    A. **Valor sin unidad**: se muestra solo el número (ej. "50000").
    B. **Valor con unidad abreviada**: se muestra el número con una abreviatura (ej. "$50,000" o "50,000 COP").
    C. **Valor con concepto y unidad completa**: se muestra el concepto (ej. "Ingresos totales"), el valor (ej. "$125,000") y la unidad completa (ej. "COP" o "pesos colombianos"), todo en una etiqueta clara.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de interacción táctil y tamaño de objetivos táctiles en aplicaciones móviles, considerando las dimensiones mínimas adoptadas por las guías modernas de diseño. Para la presentación de datos, se revisaron las mejores prácticas en aplicaciones financieras y agrícolas, priorizando la claridad para usuarios con baja alfabetización financiera.

  - **1. Interacción táctil: Controles sin estándares (dimensiones pequeñas)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de interacción táctil precisa.

      - **Detalles**:
        - Los controles pequeños (ej. 24x24 dp) son difíciles de presionar con precisión en pantallas táctiles, especialmente para usuarios con dedos grandes, en condiciones de movimiento (ej. caminando por el campo) o con baja destreza motriz.
        - La falta de estándares genera inconsistencias: algunos botones pueden ser grandes y otros pequeños, confundiendo al usuario.
        - Aumenta la tasa de errores de selección (pulsaciones accidentales), lo que genera frustración y abandono.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo (no hacer nada), pero alto costo de soporte y pérdida de usuarios.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el usuario debe "aprender a presionar con cuidado" (ineficiente).
        - **Operación**: alta tasa de errores reportados ("no puedo darle al botón").
        - **Medición**: se puede medir la tasa de clics accidentales en analytics.

    - **Análisis FODA**:

      - **Fortalezas**: no requiere esfuerzo de desarrollo.
      - **Debilidades**: mala usabilidad, inconsistencia, alta tasa de errores.
      - **Oportunidades**: ninguna.
      - **Amenazas**: abandono de la aplicación por frustración.

    - **Opiniones y comentarios internos**:

      - "Los botones pequeños son el principal problema de usabilidad en apps móviles para agricultores, que suelen tener manos grandes y están en entornos de campo".
      - "No podemos dejar que el usuario se equivoque de botón constantemente, es inaceptable".

  - **2. Interacción táctil: Controles con dimensiones estándar fijas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con los criterios de precisión, pero puede tener problemas de adaptación en dispositivos muy pequeños o muy grandes.

      - **Detalles**:
        - Aplicar 48x48 dp en Android y 44x44 pt en iOS garantiza que los controles sean fáciles de presionar en la mayoría de los dispositivos.
        - Sin embargo, en pantallas muy pequeñas (ej. relojes inteligentes, que no son soportados) o muy grandes (ej. tablets), las dimensiones fijas pueden no ser óptimas.
        - Tampoco se ajusta automáticamente si el usuario cambia el tamaño de fuente del sistema.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, alto retorno en usabilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima, el equipo debe aplicar los estándares en todos los componentes.
        - **Operación**: fácil de mantener con un sistema de diseño.
        - **Medición**: se puede medir la reducción de errores de pulsación.

    - **Análisis FODA**:

      - **Fortalezas**: Mejora la precisión, reduce errores, alineado con buenas prácticas, fácil de implementar.
      - **Debilidades**: Puede no ser óptimo para todas las densidades/tamaños de pantalla sin ajustes adicionales.
      - **Oportunidades**: Base para evolucionar a la opción 3.
      - **Amenazas**: En tablets, un botón de 48dp puede verse demasiado pequeño en relación con el resto de la UI.

    - **Opiniones y comentarios internos**:

      - "Aplicar 48dp en Android es lo mínimo que debemos hacer. Es un estándar desde hace años".
      - "Podemos usar este enfoque como base y luego ajustar para tablets si es necesario".

  - **3. Interacción táctil: Controles adaptativos (estándar + ajuste por densidad)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente, ofreciendo la mejor flexibilidad y usabilidad en todos los dispositivos.

      - **Detalles**:
        - Se usan las dimensiones estándar (48dp / 44pt) como valor mínimo, pero se implementan con unidades relativas y layouts flexibles (ej. `flex` en React Native, `ConstraintLayout` en Android, `Auto Layout` en iOS).
        - En tablets o pantallas grandes, los controles pueden crecer proporcionalmente para mantener una buena experiencia.
        - Se respetan las preferencias de accesibilidad del sistema (ej. tamaño de fuente grande).
        - Se usa `padding` y `margin` adecuados para asegurar separación entre controles.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio (requiere un sistema de diseño bien estructurado), pero alto retorno en accesibilidad y adaptabilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe aprender a usar las herramientas de diseño responsive.
        - **Operación**: requiere pruebas en múltiples resoluciones.
        - **Medición**: se pueden medir las tasas de error en diferentes dispositivos.

    - **Análisis FODA**:

      - **Fortalezas**: Mejor experiencia en todos los dispositivos, accesible, escalable, alineado con las guías modernas de UI.
      - **Debilidades**: Mayor complejidad inicial, pero mitigada con un buen sistema de diseño.
      - **Oportunidades**: Los mismos componentes se pueden reutilizar para web si se necesita.
      - **Amenazas**: Si no se prueba adecuadamente, puede tener comportamientos inesperados en algunos dispositivos.

    - **Opiniones y comentarios internos**:

      - "Usar `dp` en lugar de píxeles fijos ya nos da adaptabilidad. Combinado con `flex`, tenemos una solución robusta".
      - "Es la opción que elegiría cualquier app moderna. No podemos quedarnos en lo mínimo".

  - **4. Presentación de valores: A. Valor sin unidad**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con la distinción de valores y unidades.

      - **Detalles**:
        - El usuario ve "50000" pero no sabe si son pesos, kilos, litros, metros cuadrados, etc. Genera confusión.
        - Un mismo número puede significar cosas muy diferentes (ej. 50000 COP vs 50000 kg).
        - Riesgo de malinterpretación de datos económicos y de producción.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero altísimo costo de confusión y errores.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: alto riesgo de reclamos por malinterpretación.
        - **Medición**: cantidad de consultas de soporte ("¿eso es en qué?").

    - **Análisis FODA**:
      - **Fortalezas**: implementación trivial.
      - **Debilidades**: ambigüedad total, inaceptable para datos económicos y productivos.
      - **Oportunidades**: ninguna.
      - **Amenazas**: decisiones erróneas del usuario por malinterpretación.

    - **Opiniones y comentarios internos**:
      - "Mostrar un número sin unidad es como dar una dirección sin ciudad. No sirve".

  - **5. Presentación de valores: B. Valor con unidad abreviada**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente, pero aún puede faltar el concepto.

      - **Detalles**:
        - Muestra "$50,000" o "50,000 COP". El usuario sabe que es dinero, pero no sabe si es ingreso, gasto, costo de producción, o valor de venta, a menos que el contexto lo indique.
        - En listados donde hay diferentes conceptos (ingresos y gastos mezclados), la unidad abreviada no es suficiente para diferenciarlos.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, con mejora parcial.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: fácil de mantener, pero requiere contexto adicional.
        - **Medición**: cantidad de consultas de soporte.

    - **Análisis FODA**:
      - **Fortalezas**: Mejor que solo el número, fácil de implementar.
      - **Debilidades**: Falta el concepto (ingreso vs gasto), puede generar confusión en resúmenes.
      - **Oportunidades**: Se puede combinar con etiquetas de encabezado.
      - **Amenazas**: Confusión en pantallas donde se mezclan ingresos y gastos.

    - **Opiniones y comentarios internos**:
      - "Es aceptable en columnas donde el encabezado ya dice 'Gastos', pero no en resúmenes mixtos".

  - **6. Presentación de valores: C. Valor con concepto y unidad completa**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente, eliminando toda ambigüedad.

      - **Detalles**:
        - "Ingresos totales: $125,000 COP". El usuario sabe qué concepto es (ingreso), el valor (125,000) y la unidad (pesos colombianos).
        - "Área total: 5.2 ha" (hectáreas).
        - "Producción: 1,500 kg" (kilogramos).
        - Es la opción más clara y alineada con los criterios de calidad del escenario ACC-06.
        - Se puede implementar un componente reutilizable `<ValueWithUnit concept="Ingresos totales" value={125000} unit="COP" />`.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo (componente reutilizable), alto retorno en claridad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe acordar un estándar de unidades.
        - **Operación**: fácil de mantener con un objeto de configuración de unidades.
        - **Medición**: se puede medir la reducción de consultas de soporte.

    - **Análisis FODA**:

      - **Fortalezas**: Elimina toda ambigüedad, mejora la comprensión, profesionaliza la app, fácil de implementar con un componente reutilizable.
      - **Debilidades**: Ocupa un poco más de espacio en pantalla, pero es un sacrificio necesario por la claridad.
      - **Oportunidades**: Se puede internacionalizar fácilmente.
      - **Amenazas**: Si no se estandarizan las unidades, puede haber inconsistencias.

    - **Opiniones y comentarios internos**:

      - "El campesino necesita saber exactamente qué está viendo. 'Ingresos totales: $125,000 COP' es perfecto".
      - "Podemos crear un objeto `UNITS` en el código con `COP`, `kg`, `ha`, `L`, y usarlo en toda la app".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-010 — Validará que los controles de 48x48 dp reducen errores a < 5 % y que el formato "Concepto: $Valor Unidad" elimina ambigüedad — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Uso de colores para distinguir conceptos (verde para ingresos, rojo para gastos) — se considera complementario, pero no suficiente sin etiquetas de texto.
    - Uso de tooltips al presionar un valor para mostrar la unidad — descartado porque oculta la información y requiere interacción adicional.
    - Controles con dimensiones fijas sin adaptación — descartado por falta de flexibilidad en tablets.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos que manejan datos económicos y productivos.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-010, que probará la precisión táctil y la comprensión de los valores con concepto y unidad.

  - **¿Por qué elegiste al ganador?**:

    Para **interacción táctil**, se seleccionaron los **controles adaptativos (estándar + ajuste por densidad)** porque:
    - Garantizan la precisión en todos los dispositivos (cumpliendo con ACC-02).
    - Se adaptan a diferentes tamaños de pantalla y densidades.
    - Son el estándar moderno de diseño y accesibilidad.

    Para **presentación de valores**, se seleccionó la opción **C (Valor con concepto y unidad completa)** porque:
    - Elimina toda ambigüedad (cumple con ACC-06).
    - El 100 % de los valores presentados incluyen concepto y unidad.
    - Es fácil de implementar con un componente reutilizable y un sistema de unidades estandarizadas.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se creará un sistema de diseño con componentes que aseguren dimensiones mínimas de 48x48 dp / 44x44 pt, y un componente `<ValueWithUnit>` reutilizable. Se medirá la reducción de errores de pulsación y la mejora en comprensión de valores.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las interacciones táctiles y el 100 % de los valores presentados utilizarán estas estrategias.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con el sistema de diseño de la aplicación, con el módulo de internacionalización (para traducir conceptos y unidades), con el módulo de resultados económicos (ADR-003) y con el módulo de consultas (ADR-006).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir el sistema de diseño y los estándares de unidades desde el inicio del proyecto, para evitar refactorizaciones costosas. Probar los tamaños táctiles en dispositivos reales con usuarios, no solo en emuladores. Considerar el daltonismo usando iconos además del color. Incluir el componente `ValueWithUnit` en todas las pantallas de consulta, resumen y listado desde la primera implementación.

  - **Anécdotas**:

    - En el diseño del SPIKE-010 se aprendió que un botón de 30x30 dp causa errores frecuentes; al pasar a 48x48 dp, el problema desaparece.
    - También se identificó que un usuario confundió un gasto de $50,000 con un ingreso porque solo veía el número sin el concepto. Al agregar "Gastos: $50,000 COP", la comprensión mejoró drásticamente.
    - Se observó que las unidades abreviadas como "COP" no siempre son claras; conviene usar "$" + "COP" o "pesos colombianos".

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar una estrategia combinada de **controles táctiles adaptativos (estándar + ajuste por densidad)** junto con la presentación de **valores con concepto y unidad completa** (ej. "Ingresos totales: $125,000 COP"), cumpliendo con los escenarios ESC-CAL-ACC-02 y ESC-CAL-ACC-06.

  - **Detalles**:

    Esta estrategia ofrece el mejor equilibrio entre precisión táctil, claridad de información, accesibilidad y costo de implementación.

    La implementación deberá considerar como mínimo:

    - **Sistema de diseño táctil**:
      - Crear un conjunto de componentes UI base (Button, IconButton, Checkbox, Radio, TouchableArea) que aseguren un tamaño mínimo de 48x48 dp en Android y 44x44 pt en iOS.
      - Usar unidades relativas (`dp`, `pt`, `flex`) en lugar de píxeles fijos para adaptarse a diferentes densidades.
      - Asegurar una separación mínima de 8 dp entre controles adyacentes.
      - Probar en dispositivos de diferentes tamaños (teléfonos pequeños, grandes, tablets).
    - **Sistema de presentación de valores**:
      - Definir un estándar de unidades para toda la aplicación (ej. `COP` para pesos colombianos, `kg` para kilogramos, `ha` para hectáreas, `L` para litros, `unidad` para cantidades genéricas).
      - Usar este componente en todas las pantallas donde se presenten datos numéricos: resúmenes económicos, listados de gastos/ingresos, fichas de cultivos, reportes de producción, etc.
      - Complementar con iconos (↑ para ingresos, ↓ para gastos) y colores semánticos (verde/azul para ingresos, rojo/naranja para gastos), sin depender únicamente del color para la diferenciación (accesibilidad).
    - **Pruebas de usabilidad**:
      - Realizar pruebas con usuarios objetivo (campesinos) para validar que los controles son fáciles de presionar y que los valores se entienden correctamente.
      - Ajustar el diseño según el feedback (ej. aumentar el tamaño de algunos botones críticos).

    Se descartan los controles pequeños por su mala usabilidad, y los valores sin unidad o con unidad abreviada por su ambigüedad. La combinación de controles adaptativos y valores con concepto y unidad es la opción que garantiza una interacción precisa y una comprensión clara de la información en AgroTrack.