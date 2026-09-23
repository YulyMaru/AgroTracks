# ADR-012: Validar el funcionamiento de la app en dispositivos Android soportados mediante pruebas manuales en dispositivos físicos propios

- **Título**: Validar el funcionamiento de la app en los dispositivos Android oficialmente soportados utilizando exclusivamente dispositivos físicos propios y pruebas manuales, descartando Firebase Test Lab por su costo y las herramientas autoalojadas por su complejidad.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Asegurar que la aplicación se instala, ejecuta y permite utilizar las funciones principales en el 100 % de las configuraciones Android oficialmente soportadas, con un enfoque simple, de bajo costo y sin añadir complejidad innecesaria al proyecto.

  - **Detalles**:

    - **Instalación**: la aplicación debe instalarse correctamente en todos los dispositivos Android soportados.
    - **Ejecución estable**: la aplicación debe iniciar sin cierres inesperados (crash) en el 100 % de los dispositivos.
    - **Funcionalidad principal**: las funciones principales (login, registro de gastos, consulta, resumen económico) deben ser utilizables en todos los dispositivos soportados.
    - **Rendimiento aceptable**: la app debe ser fluida en los dispositivos de menor rendimiento dentro del soporte (ej. gama baja), sin caídas de frames significativas ni tiempos de respuesta excesivos.
    - **Adaptación de UI**: la interfaz debe adaptarse correctamente a diferentes resoluciones, densidades y orientaciones, sin elementos superpuestos, cortados o ilegibles.
    - **Simplicidad**: la solución no debe introducir herramientas, servidores ni configuraciones complejas que desvíen el foco del desarrollo.
    - **Costo**: la solución debe ser viable con un presupuesto limitado, priorizando dispositivos físicos propios y herramientas gratuitas ya integradas en el stack (Crashlytics).
    - **Escenario de calidad relacionado**: ESC-CAL-POR-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para asegurar la compatibilidad con dispositivos Android, considerando el equilibrio entre simplicidad, costo y confiabilidad.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Desarrollo sin pruebas en dispositivos reales**: solo se prueba en emuladores del entorno de desarrollo, sin validación en hardware físico.
    2. **Pruebas manuales en dispositivos físicos propios (3 dispositivos representativos)**: se adquieren 3 dispositivos Android (gama baja, media y alta) y se prueban manualmente las funciones principales antes de cada release, complementado con Crashlytics para monitoreo en producción.
    3. **Pruebas en servicios en la nube (Firebase Test Lab, BrowserStack) o herramientas autoalojadas (GADS, Phone Farm)**: se utilizan plataformas externas o herramientas open source que requieren configuración de servidores, Docker, Appium, etc.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron las prácticas de pruebas de compatibilidad en aplicaciones Android, considerando la fragmentación del ecosistema y el contexto de un equipo pequeño con presupuesto limitado. Se concluyó que para una primera versión, las pruebas manuales en dispositivos físicos propios son suficientes y no añaden complejidad operativa. Firebase Test Lab y las herramientas autoalojadas, aunque potentes, introducen costos o configuraciones que no se justifican para el alcance actual de AgroTrack.

  - **1. Desarrollo sin pruebas en dispositivos reales**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de estabilidad ni adaptación.

      - **Detalles**:
        - Los emuladores no replican fielmente el comportamiento de hardware real.
        - No detectan problemas específicos de hardware (RAM limitada, procesadores lentos).
        - La UI puede verse bien en el emulador pero mal en dispositivos reales.
        - Genera bugs en producción que el usuario reporta.

    - **Análisis de costos**:

      - **Resumen**: Costo nulo, pero alto costo de reputación y soporte.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: alta tasa de bugs en producción.
        - **Medición**: cantidad de crashes reportados.

    - **Análisis FODA**:

      - **Fortalezas**: sin inversión inicial.
      - **Debilidades**: no detecta problemas reales.
      - **Oportunidades**: ninguna.
      - **Amenazas**: app inutilizable en gama baja.

    - **Opiniones y comentarios internos**:

      - "No podemos lanzar sin probar en dispositivos reales."

  - **2. Pruebas manuales en dispositivos físicos propios (3 dispositivos representativos)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios, con la máxima simplicidad y mínimo costo.

      - **Detalles**:
        - Se adquieren 3 dispositivos Android representativos del mercado objetivo:
          - Gama baja (ej. Samsung Galaxy A12, RAM 4 GB, Android 11).
          - Gama media (ej. Xiaomi Redmi Note 10, RAM 6 GB, Android 12).
          - Gama alta (ej. Samsung Galaxy S22, RAM 8 GB, Android 13).
        - Antes de cada release, se prueban manualmente las funciones principales en los 3 dispositivos.
        - Se verifica instalación, ejecución, funcionalidad, adaptación de UI y rendimiento.
        - Se documentan los bugs encontrados y se priorizan para corrección.
        - En producción, se usa Crashlytics (ADR-021) para monitorear crashes y detectar problemas en dispositivos no cubiertos por el laboratorio.
        - No se requieren servidores, Docker, Appium ni configuraciones complejas.
        - El equipo no necesita aprender herramientas nuevas.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo (compra única de 3 dispositivos), sin costo recurrente.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima; los QA ya saben probar manualmente.
        - **Operación**: sin servidores ni configuraciones.
        - **Medición**: se puede medir la reducción de crashes en producción con Crashlytics.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Máxima simplicidad.
        - Sin costo recurrente.
        - Sin configuración de servidores.
        - Detecta problemas reales de hardware.
        - Crashlytics complementa la cobertura en producción.
      - **Debilidades**:
        - No cubre toda la fragmentación de Android.
        - Las pruebas manuales son lentas.
      - **Oportunidades**:
        - Ampliar el laboratorio de dispositivos si el proyecto crece.
        - Usar Appetize.io (100 minutos gratis al mes) para pruebas puntuales en navegador.
      - **Amenazas**:
        - Si el mercado objetivo cambia, el conjunto de dispositivos queda obsoleto.
        - Bugs específicos de dispositivos no cubiertos.

    - **Opiniones y comentarios internos**:

      - "Con 3 dispositivos bien elegidos cubrimos el 80 % de los casos reales."
      - "Crashlytics nos avisa si algún dispositivo no cubierto falla en producción."
      - "No queremos configurar servidores ni aprender Appium; eso nos desvía del desarrollo."

  - **3. Pruebas en servicios en la nube o herramientas autoalojadas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con los criterios de simplicidad ni de costo.

      - **Detalles**:
        - **Firebase Test Lab**: $5/hora por dispositivo físico, $1/hora por dispositivo virtual. El plan gratuito (120 minutos virtuales, 30 minutos físicos al mes) se agota en una sola ejecución.
        - **BrowserStack**: desde $129/mes.
        - **AWS Device Farm**: modelo de pago por uso similar a Firebase.
        - **GADS**: requiere Docker, MongoDB, configuración de hub y provider, y aprendizaje de Appium.
        - **Phone Farm**: requiere Java 17+, Android SDK, Appium y configuración local.
        - **OmniLab ATS**: requiere configuración de servidor y suites de pruebas.
        - **Cuttlefish**: requiere máquinas Linux con recursos significativos.
        - Todas estas opciones añaden complejidad operativa que no se justifica para una primera versión.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto, costo operativo recurrente o complejidad de configuración.

      - **Ejemplos**:
        - **Licencias**: Firebase Test Lab, BrowserStack y AWS Device Farm tienen costo por uso o suscripción.
        - **Capacitación**: el equipo debe aprender a usar cada plataforma o configurar herramientas autoalojadas.
        - **Operación**: mantenimiento de servidores, contenedores o suscripciones.
        - **Medición**: costo por bug detectado, tiempo de configuración.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Cobertura masiva de dispositivos (servicios en la nube).
        - Automatización de pruebas (herramientas autoalojadas).
      - **Debilidades**:
        - Costo recurrente (servicios en la nube).
        - Complejidad de configuración (herramientas autoalojadas).
        - Dependencia de proveedores externos.
        - Tiempo de aprendizaje.
      - **Oportunidades**:
        - Útil si el proyecto escala y requiere cobertura masiva.
      - **Amenazas**:
        - Presupuesto agotado rápidamente.
        - Desviación del foco del desarrollo.
        - Mantenimiento de infraestructura innecesaria.

    - **Opiniones y comentarios internos**:

      - "Firebase Test Lab es potente pero no podemos pagar $5/hora."
      - "GADS y Phone Farm requieren configurar servidores que no tenemos."
      - "Prefiero invertir ese tiempo en mejorar la app, no en infraestructura de pruebas."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-012 — Validará que la app se instala, ejecuta y permite las funciones principales en 3 dispositivos Android representativos, y que Crashlytics detecta crashes en producción — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Solo emuladores — descartado por no replicar hardware real.
    - Firebase Test Lab — descartado por costo ($5/hora por dispositivo físico).
    - BrowserStack — descartado por costo ($129/mes).
    - AWS Device Farm — descartado por costo similar a Firebase.
    - GADS, Phone Farm, OmniLab ATS, Cuttlefish — descartados por complejidad de configuración (Docker, Appium, servidores) y desviación del foco del desarrollo.
    - Uso de dispositivos prestados o alquilados — descartado por complejidad logística.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con mercado objetivo Android (gamas baja, media y alta).
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-012, que probará la instalación, ejecución, funciones principales y adaptación de UI en 3 dispositivos Android representativos, y verificará que Crashlytics detecta crashes en producción.

  - **¿Por qué elegiste al ganador?**:

    Se selecciona la **opción 2 (pruebas manuales en dispositivos físicos propios)** porque:
    - Es la opción más simple y directa.
    - No requiere configuración de servidores, Docker ni Appium.
    - No tiene costo recurrente.
    - Detecta problemas reales de hardware, rendimiento y adaptación.
    - Crashlytics complementa la cobertura en producción sin costo adicional.
    - El equipo puede enfocarse en el desarrollo en lugar de en infraestructura de pruebas.
    - Es suficiente para una primera versión con un mercado objetivo bien definido.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se definirá una política de compatibilidad Android 8.0+ con al menos 2 GB de RAM y resolución HD+; se adquirirán 3 dispositivos Android representativos; se probará manualmente antes de cada release; se usará Crashlytics para monitoreo en producción.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los usuarios Android.
    - **¿Qué tipos de integraciones están involucradas?**: Crashlytics (monitoreo en producción, ADR-021), Firebase App Distribution (distribución de APK a testers, ADR-025), y el pipeline de CI/CD (GitHub Actions, ADR-025) para builds.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: No esperar a tener la app completa para empezar las pruebas; definir la política de dispositivos soportados desde el inicio; adquirir los 3 dispositivos lo antes posible; usar Crashlytics desde la primera versión; no invertir tiempo en herramientas complejas de automatización que no se justifican para el alcance actual.

  - **Anécdotas**:

    - Durante el análisis se concluyó que Firebase Test Lab habría consumido el presupuesto de pruebas en menos de una semana de uso intensivo.
    - Se observó que las herramientas autoalojadas requieren configuración de servidores, Docker y Appium, lo cual desvía al equipo del desarrollo de la app.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar una **estrategia de pruebas manuales en 3 dispositivos físicos propios** (gama baja, media y alta), complementada con **Crashlytics** para monitoreo en producción, cumpliendo con el escenario ESC-CAL-POR-01 sin añadir complejidad innecesaria ni costos recurrentes.

  - **Detalles**:

    Esta estrategia ofrece el mejor equilibrio entre simplicidad, costo, confiabilidad y foco en el desarrollo.

    La implementación deberá considerar como mínimo:

    - **Definición de la política de compatibilidad**:
      - Android API 26+ (Android 8.0) o superior.
      - RAM mínima: 2 GB.
      - Resolución mínima: HD+ (720x1280) o equivalente.
      - Almacenamiento mínimo: 32 MB libres.
      - Documentar y publicar esta política.
    - **Laboratorio de dispositivos físicos**:
      - Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
      - Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
      - Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).
      - Realizar pruebas manuales exhaustivas antes de cada release mayor.
    - **Monitoreo en producción**:
      - Usar Crashlytics (ADR-021) para monitorear crashes en producción.
      - Configurar alertas si la tasa de crashes supera el 1 %.
      - Revisar periódicamente los dispositivos más usados en Google Play Console.
    - **Proceso de regresión**:
      - Incorporar las pruebas de compatibilidad en el proceso de desarrollo.
      - Todo cambio que afecte UI, rendimiento o lógica principal debe probarse en los dispositivos clave antes de fusionarse.
    - **Distribución de builds**:
      - Firebase App Distribution (ADR-025) para distribuir APK a testers.
    - **Pruebas puntuales en la nube (opcional)**:
      - Appetize.io: 100 minutos gratis al mes para pruebas en navegador, si se requiere validar algún dispositivo específico sin comprarlo.

    Se descarta la prueba únicamente en emuladores por su baja fiabilidad. Se descarta Firebase Test Lab por su costo ($5/hora por dispositivo físico). Se descartan las herramientas autoalojadas (GADS, Phone Farm, etc.) por su complejidad de configuración y la desviación del foco del desarrollo. La estrategia de pruebas manuales en dispositivos físicos propios con Crashlytics es la opción más simple, económica y alineada con el alcance actual de AgroTrack.