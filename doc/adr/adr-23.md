# ADR-023: Garantizar tamaños táctiles, contraste y legibilidad en la interfaz móvil

- **Título**: Estandarizar tamaños táctiles mínimos, contraste suficiente y respeto por el tamaño de fuente del sistema en toda la interfaz móvil.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Asegurar que los controles de la aplicación son fáciles de presionar y que el contenido es legible bajo condiciones reales de campo (sol directo, manos con tierra), sin introducir complejidad innecesaria de accesibilidad avanzada.

  - **Detalles**:

    - **Tamaño táctil**: el 100 % de los controles interactivos debe cumplir con un tamaño mínimo de 48x48 dp (ESC-CAL-ACC-02).
    - **Separación**: debe haber al menos 8 dp de separación entre controles adyacentes para evitar pulsaciones accidentales.
    - **Contraste**: el texto normal debe tener un ratio de contraste ≥ 4.5:1; el texto grande (≥ 18 pt o 14 pt bold) ≥ 3:1; los iconos ≥ 3:1.
    - **Fuente del sistema**: la app debe respetar el tamaño de fuente configurado por el usuario (`fontScale`) sin romper el layout.
    - **Consistencia visual**: los tamaños, colores y tipografía deben definirse en el sistema de diseño y reutilizarse en todos los componentes.
    - **Costo de implementación**: la solución debe ser viable con el stack actual (React Native) sin librerías adicionales.
    - **Mantenibilidad**: los criterios deben aplicarse desde el sistema de diseño, no componente por componente.
    - **Escenarios de calidad relacionados**: ESC-CAL-ACC-02, ESC-CAL-ACC-06.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para garantizar la usabilidad táctil y visual de la interfaz móvil.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Sin estándares**: se usan las dimensiones y colores predeterminados de los frameworks, sin verificar tamaños mínimos ni contraste.
    2. **Estándares básicos (tamaños + contraste + fuente)**: se define un sistema de diseño con tamaños mínimos de 48x48 dp, una paleta de colores con contraste verificado, y se respeta el tamaño de fuente del sistema.
    3. **Accesibilidad completa (WCAG 2.1 AA + TalkBack + alternativas al color para daltonismo)**: añade soporte para lectores de pantalla, etiquetas de accesibilidad, pruebas con usuarios con discapacidad y alternativas al color para daltonismo.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de diseño táctil y visual para aplicaciones móviles usadas en entornos rurales, considerando las condiciones reales del usuario (manos grandes, sol directo, suciedad, posible baja visión leve). Se revisaron las guías de Material Design y las recomendaciones de WCAG 2.1 AA para tamaños y contraste, sin extender el alcance a lectores de pantalla ni pruebas con daltonismo.

  - **1. Sin estándares**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de usabilidad táctil ni legibilidad.

      - **Detalles**:
        - Los controles por defecto de React Native pueden ser pequeños (ej. 24x24 dp para algunos iconos).
        - El contraste no se verifica, lo que dificulta la lectura bajo el sol.
        - Los botones demasiado juntos provocan pulsaciones accidentales.
        - El layout puede romperse con fuentes grandes del sistema.
        - Genera errores de interacción y frustración.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero alto costo de soporte y abandono.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: alta tasa de errores reportados ("no puedo darle al botón").
        - **Medición**: cantidad de errores de interacción.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin inversión inicial.
      - **Debilidades**:
        - Inaccesible bajo el sol.
        - Difícil de presionar con manos grandes.
        - Layout frágil con fuentes grandes.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Abandono de la app.
        - Mala reputación.

    - **Opiniones y comentarios internos**:

      - "El campesino trabaja bajo el sol; necesitamos alto contraste."
      - "Los botones pequeños son el principal problema de usabilidad en apps para agricultores."

  - **2. Estándares básicos (tamaños + contraste + fuente)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con los criterios definidos. Cubre el 80 % del beneficio con el 20 % del esfuerzo.

      - **Detalles**:
        - Tamaños táctiles ≥ 48x48 dp definidos en el sistema de diseño.
        - Separación ≥ 8 dp entre controles.
        - Paleta de colores con contraste verificado con WebAIM.
        - `allowFontScaling` en componentes `Text` para respetar `fontScale`.
        - Layout con `flex` y `ScrollView` para adaptarse a fuentes grandes.
        - Componentes base reutilizables que aplican los estándares por defecto.
        - No requiere librerías adicionales.
        - Se puede evolucionar a accesibilidad completa en una futura iteración.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, costo operativo bajo, retorno alto en usabilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima; el equipo aprende a usar el sistema de diseño.
        - **Operación**: medición de errores de interacción y legibilidad.
        - **Medición**: tamaños con Layout Inspector, contraste con WebAIM.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Rápido de implementar.
        - Cubre las necesidades reales del usuario.
        - Se aplica desde el sistema de diseño.
        - Sin librerías adicionales.
        - Compatible con el stack actual.
      - **Debilidades**:
        - No cubre TalkBack ni daltonismo severo.
        - Requiere disciplina del equipo para no romper los estándares.
      - **Oportunidades**:
        - Evolucionar a accesibilidad completa si el negocio lo requiere.
        - Reutilizar el sistema de diseño en futuros módulos.
      - **Amenazas**:
        - Si no se mantiene la disciplina, los componentes nuevos pueden romper los estándares.
        - Nuevos colores sin verificar contraste.

    - **Opiniones y comentarios internos**:

      - "Con tamaños y contraste cubrimos el 80 % del problema real."
      - "TalkBack y daltonismo se pueden añadir después si el negocio lo pide."
      - "El sistema de diseño debe aplicarse desde el día 1."

  - **3. Accesibilidad completa (WCAG 2.1 AA + TalkBack + alternativas al color para daltonismo)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero añade complejidad y tiempo de implementación desproporcionados para el timebox actual.

      - **Detalles**:
        - Añade soporte para TalkBack con `accessibilityLabel`, `accessibilityRole` y `accessibilityHint`.
        - Requiere pruebas con lectores de pantalla en cada componente.
        - Requiere pruebas con usuarios con daltonismo.
        - Requiere alternativas al color (iconos, patrones, etiquetas textuales).
        - Añade tiempo de implementación y pruebas.
        - No es viable para el timebox actual.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto, retorno alto pero a largo plazo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe aprender accesibilidad avanzada.
        - **Operación**: pruebas adicionales por release.
        - **Medición**: cantidad de componentes con etiquetas, tiempo con TalkBack.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Inclusivo.
        - Cumple WCAG 2.1 AA completo.
        - Beneficia a usuarios con discapacidad.
      - **Debilidades**:
        - Mayor inversión inicial.
        - Mayor tiempo de pruebas.
        - Requiere usuarios reales con discapacidad.
        - No es viable para el timebox actual.
      - **Oportunidades**:
        - Reconocimiento por accesibilidad.
        - Expansión a más usuarios.
      - **Amenazas**:
        - Retraso en el desarrollo.
        - Si no se mantiene, la accesibilidad se degrada.

    - **Opiniones y comentarios internos**:

      - "TalkBack y daltonismo son importantes, pero no críticos para nuestra primera versión."
      - "Podemos añadirlo en una futura iteración si el negocio lo pide."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-023 — Validará que los componentes cumplen tamaños táctiles ≥ 48x48 dp, contraste ≥ 4.5:1 y respetan `fontScale` sin romper el layout — Propuesto.
    - SPIKE-010 — Validará los tamaños táctiles del sistema de diseño — Propuesto.
    - SPIKE-003 — Validará que las tarjetas de resultados económicos son legibles y con contraste suficiente — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Sin estándares — descartado por inaccesible bajo el sol y difícil de presionar.
    - Accesibilidad completa (WCAG 2.1 AA + TalkBack + daltonismo) — descartada por complejidad y tiempo desproporcionados para el timebox actual.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con posible baja visión leve, manos grandes y uso bajo el sol.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-023 (tamaños, contraste y fuente), SPIKE-010 (tamaños táctiles) y SPIKE-003 (legibilidad de tarjetas).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionaron los **estándares básicos (tamaños + contraste + fuente)** porque:
    - Cubren las necesidades reales del usuario (manos grandes, sol directo, baja visión leve).
    - Son rápidos de implementar y no requieren librerías adicionales.
    - Se aplican desde el sistema de diseño, garantizando consistencia.
    - No introducen complejidad de TalkBack ni daltonismo, que se pueden añadir en una futura iteración.
    - El tiempo del equipo se prioriza en funcionalidades críticas (offline, sincronización, cálculos).

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el 100 % de los controles cumplan 48x48 dp, que el contraste sea suficiente y que el layout no se rompa con fuentes grandes.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de la interfaz de usuario.
    - **¿Qué tipos de integraciones están involucradas?**: Sistema de diseño (ADR-010), componentes base (`Button`, `Input`, `Card`, `ListItem`), Layout Inspector, WebAIM Contrast Checker y React Native.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir el sistema de diseño desde el día 1 con tamaños y paleta verificada. Verificar contraste antes de aprobar nuevos colores. Probar con `fontScale` al 200 % en cada release. No añadir componentes sin respetar los estándares.

  - **Anécdotas**:

    - En el diseño del SPIKE-010 se identificó que un botón de 30x30 dp causa errores frecuentes; al pasar a 48x48 dp, el problema desaparece.
    - Durante el análisis se concluyó que TalkBack y daltonismo añadirían semanas de trabajo que no se justifican para la primera versión.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **estándares básicos de tamaños táctiles, contraste y legibilidad** desde el sistema de diseño, cumpliendo con los escenarios ESC-CAL-ACC-02 y ESC-CAL-ACC-06.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre usabilidad, costo y tiempo de implementación.

    La implementación deberá considerar como mínimo:

    - **Tamaños táctiles**:
      - Todos los controles interactivos: mínimo 48x48 dp.
      - Separación mínima de 8 dp entre controles adyacentes.
      - Usar `dp` y `flex` en lugar de píxeles fijos.
    - **Contraste**:
      - Paleta de colores verificada con WebAIM Contrast Checker.
      - Texto normal: ratio ≥ 4.5:1.
      - Texto grande (≥ 18 pt o 14 pt bold): ratio ≥ 3:1.
      - Iconos: ratio ≥ 3:1.
    - **Fuente**:
      - `allowFontScaling` en componentes `Text`.
      - Layout con `flex` y `ScrollView` para adaptarse a fuentes grandes.
      - Probar con `fontScale` al 100 %, 150 % y 200 %.
    - **Sistema de diseño**:
      - Componentes base (`Button`, `IconButton`, `Input`, `Card`, `ListItem`) con tamaños y colores accesibles por defecto.
      - Paleta de colores con contraste verificado.
      - Tipografía legible.
    - **Pruebas**:
      - Layout Inspector para tamaños táctiles.
      - WebAIM Contrast Checker para contraste.
      - Prueba con `fontScale` al 200 %.
    - **Documentación**:
      - Guía de uso del sistema de diseño.
      - Checklist de tamaños y contraste para nuevos componentes.
    - **Evolución futura**:
      - Si el negocio lo requiere, se añadirá TalkBack y pruebas con daltonismo en un ADR separado.

    Se descarta el diseño sin estándares por inaccesible bajo el sol y difícil de presionar, y la accesibilidad completa por complejidad y tiempo desproporcionados para el timebox actual. Los estándares básicos son la opción que garantiza usabilidad y legibilidad en AgroTrack.