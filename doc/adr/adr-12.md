# ADR-012: Validar app en dispositivos Android soportados

- **Título**: Validar el funcionamiento de la app en los dispositivos Android oficialmente soportados, cumpliendo con el escenario ESC-CAL-POR-01.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones para asegurar que la aplicación se instala, ejecuta y permite utilizar las funciones principales en el 100 % de las configuraciones Android oficialmente soportadas (versiones de sistema operativo, hardware, resoluciones de pantalla y densidades de píxel).

  - **Detalles**:

    - **Instalación**: la aplicación debe instalarse correctamente en todos los dispositivos Android soportados, sin errores de empaquetado o dependencias faltantes.
    - **Ejecución estable**: la aplicación debe iniciar sin cierres inesperados (crash) en el 100 % de los dispositivos.
    - **Funcionalidad principal**: las funciones principales (login, registro de gastos, consulta, resumen económico) deben ser utilizables en todos los dispositivos soportados.
    - **Rendimiento aceptable**: la app debe ser fluida en los dispositivos de menor rendimiento dentro del soporte (ej. gama baja), sin caídas de frames significativas ni tiempos de respuesta excesivos.
    - **Adaptación de UI**: la interfaz debe adaptarse correctamente a diferentes resoluciones (HD, Full HD, 4K), densidades (ldpi, mdpi, hdpi, xhdpi, xxhdpi) y orientaciones (vertical/horizontal), sin elementos superpuestos, cortados o ilegibles.
    - **Costo de implementación**: la solución debe ser viable y no requerir mantener múltiples codebases.
    - **Escenario de calidad relacionado**: ESC-CAL-POR-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para asegurar la compatibilidad con dispositivos Android, considerando el equilibrio entre cobertura de pruebas, costo y confiabilidad.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Desarrollo sin pruebas en dispositivos reales**: solo se prueba en emuladores del entorno de desarrollo, sin validación en hardware físico.
    2. **Pruebas en dispositivos representativos (manuales)**: se prueba la app en un conjunto limitado (3-5) de dispositivos Android físicos representativos del mercado objetivo (gama baja, media, alta) antes de cada release.
    3. **Pruebas continuas en Device Farm (automatizadas)**: se utiliza Firebase Test Lab para ejecutar pruebas automatizadas (UI tests) en decenas de dispositivos Android reales en cada integración continua (CI).

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron las prácticas de pruebas de compatibilidad en aplicaciones Android, considerando la fragmentación del ecosistema (múltiples versiones, fabricantes, resoluciones). Se identificó que la combinación de pruebas manuales en dispositivos clave y pruebas automatizadas en Device Farm es el enfoque más confiable.

  - **1. Desarrollo sin pruebas en dispositivos reales**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de estabilidad ni adaptación, porque los emuladores no replican fielmente el comportamiento de hardware real.

      - **Detalles**:
        - Los emuladores suelen tener mejor rendimiento que los dispositivos reales de gama baja.
        - No detectan problemas específicos de hardware (memoria RAM limitada, procesadores lentos).
        - No replican comportamientos del sistema operativo real (gestión de memoria, procesos en segundo plano).
        - La UI puede verse bien en el emulador pero mal en dispositivos reales por diferencias de densidad y tamaño.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero altísimo costo de reputación y soporte.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo no necesita invertir en dispositivos.
        - **Operación**: alta tasa de bugs reportados por usuarios en dispositivos específicos.
        - **Medición**: la cantidad de crashes en producción será alta.

    - **Análisis FODA**:

      - **Fortalezas**: ahorro de costos iniciales.
      - **Debilidades**: no detecta problemas reales de hardware, rendimiento o adaptación.
      - **Oportunidades**: ninguna.
      - **Amenazas**: la app puede ser inutilizable en dispositivos de gama baja, comunes en el mercado objetivo.

    - **Opiniones y comentarios internos**:

      - "No podemos lanzar al mercado sin probar en dispositivos reales. Es un riesgo inaceptable".

  - **2. Pruebas en dispositivos representativos (manuales)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple si se eligen los dispositivos correctos y se prueba con suficiente profundidad antes de cada release.

      - **Detalles**:
        - Probar en 3-5 dispositivos Android que cubran las marcas, versiones de SO y gamas más comunes.
        - Permite pruebas de usabilidad en físico y detección de problemas de rendimiento reales.
        - No cubre toda la variedad del mercado, pero reduce significativamente el riesgo.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio (compra de dispositivos + tiempo de QA), con alto retorno en calidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: los QA deben aprender a probar en diferentes dispositivos.
        - **Operación**: se requiere un laboratorio pequeño de dispositivos (3 Android).
        - **Medición**: se puede medir la reducción de crashes en producción.

    - **Análisis FODA**:

      - **Fortalezas**: detecta problemas reales de hardware, rendimiento y adaptación; relativamente económico; permite pruebas de usabilidad.
      - **Debilidades**: no cubre todos los dispositivos del mercado; las pruebas manuales son lentas.
      - **Oportunidades**: se puede complementar con pruebas automatizadas en CI.
      - **Amenazas**: si el mercado objetivo cambia, el conjunto de prueba queda obsoleto.

    - **Opiniones y comentarios internos**:

      - "Necesitamos al menos un dispositivo gama baja, uno medio y uno alto".

  - **3. Pruebas continuas en Device Farm (automatizadas)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente y es el estándar para aplicaciones con alta cobertura de dispositivos y releases frecuentes.

      - **Detalles**:
        - Firebase Test Lab permite ejecutar pruebas automatizadas (UI tests) en decenas de dispositivos Android reales (diferentes marcas, versiones de SO, resoluciones, idiomas).
        - Las pruebas automáticas son scripts que emulan acciones de usuario real (tocar botones, escribir, deslizar) sobre dispositivos físicos en la nube.
        - Se integra con CI/CD (GitHub Actions, Jenkins), ejecutando pruebas automáticamente en cada PR o release candidate.
        - Detecta incompatibilidades, crashes y problemas de rendimiento de forma temprana.
        - Permite pruebas de regresión continuas sin intervención manual.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto (suscripción + desarrollo de pruebas), pero el mayor retorno en calidad y confianza.

      - **Ejemplos**:
        - **Licencias**: Firebase Test Lab tiene modelo de pago por uso (gratis hasta cierto límite).
        - **Capacitación**: el equipo debe aprender a escribir pruebas automatizadas (Maestro, Espresso).
        - **Operación**: requiere mantenimiento de las pruebas y análisis de resultados.
        - **Medición**: se puede medir la cobertura de dispositivos y la tasa de detección de bugs antes de producción.

    - **Análisis FODA**:

      - **Fortalezas**: cobertura masiva, detección temprana de incompatibilidades, integración con CI/CD, confiabilidad alta.
      - **Debilidades**: costo, requiere mantener pruebas automatizadas robustas, no reemplaza pruebas manuales de usabilidad.
      - **Oportunidades**: se puede usar para pruebas de rendimiento y accesibilidad.
      - **Amenazas**: si las pruebas no están bien escritas, generan falsos positivos/negativos.

    - **Opiniones y comentarios internos**:

      - "Firebase Test Lab es excelente para Android y tiene un costo razonable para empezar".
      - "Combinar Device Farm con pruebas manuales en dispositivos clave es el enfoque ideal".
      - "Usar Maestro nos permite escribir las pruebas una sola vez y ejecutarlas en múltiples dispositivos Android, reduciendo el esfuerzo de mantenimiento".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-012 — Validará que la app se instala, ejecuta y permite las funciones principales en 3 dispositivos Android representativos, y que Firebase Test Lab ejecuta pruebas automatizadas en al menos 10 dispositivos Android — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Solo emuladores — descartado por no replicar hardware real.
    - Solo dispositivos físicos — insuficiente para cubrir la fragmentación de Android.
    - Solo Device Farm — no reemplaza pruebas manuales de usabilidad.
    - Uso de dispositivos prestados o alquilados — descartado por complejidad logística.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con mercado objetivo Android (gamas baja, media y alta).
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-012, que probará la instalación, ejecución, funciones principales y adaptación de UI en dispositivos Android representativos, y configurará Firebase Test Lab para pruebas automatizadas.

  - **¿Por qué elegiste al ganador?**:

    Se selecciona una **estrategia combinada (opción 2 + opción 3)**: pruebas manuales en 3 dispositivos Android representativos, complementadas con pruebas automáticas en Firebase Test Lab en cada integración continua.
    - La combinación ofrece el mejor equilibrio: las pruebas manuales validan usabilidad y flujos complejos; las pruebas en Device Farm cubren la fragmentación de Android de forma automática.
    - El costo es manejable: los dispositivos físicos son una inversión única; Firebase Test Lab tiene costos de uso razonables.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se definirá una política de compatibilidad Android 8.0+ con al menos 2 GB de RAM y resolución HD+; se adquirirán 3 dispositivos Android representativos; se configurará Firebase Test Lab en el pipeline de CI.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los usuarios Android.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con Firebase Test Lab, con CI/CD (GitHub Actions o Jenkins) y con Crashlytics para monitoreo en producción.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: No esperar a tener la app completa para empezar las pruebas; definir la política de dispositivos soportados desde el inicio; automatizar las pruebas lo antes posible; incluir dispositivos de gama baja con versiones antiguas de Android.

  - **Anécdotas**:

    - En el diseño del SPIKE-012 se identificó que un bug crítico puede aparecer solo en un dispositivo específico (ej. Galaxy A10) no incluido en el laboratorio; añadirlo permitió detectar y corregir el problema.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar una **estrategia combinada de pruebas de compatibilidad Android**: pruebas manuales en 3 dispositivos representativos (gama baja, media, alta) complementadas con pruebas automatizadas en Firebase Test Lab en el pipeline de CI, cumpliendo con el escenario ESC-CAL-POR-01.

  - **Detalles**:

    Esta estrategia ofrece el mejor equilibrio entre cobertura, costo, confiabilidad y tiempo de ejecución.

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
    - **Pruebas automatizadas en Firebase Test Lab**:
      - Usar Maestro (YAML) o Espresso (nativo Android).
      - Ejecutar en al menos 10 dispositivos Android por cada PR a la rama principal.
      - Umbral de éxito: 0 crashes, 90 % de pruebas pasadas.
    - **Monitoreo en producción**:
      - Usar Crashlytics para monitorear crashes en producción.
      - Configurar alertas si la tasa de crashes supera el 1 %.
      - Revisar periódicamente los dispositivos más usados en Google Play Console.
    - **Proceso de regresión**:
      - Incorporar las pruebas de compatibilidad en el proceso de desarrollo.
      - Todo cambio que afecte UI, rendimiento o lógica principal debe probarse en los dispositivos clave antes de fusionarse.

    Se descarta la prueba únicamente en emuladores por su baja fiabilidad. La estrategia combinada de pruebas manuales en dispositivos clave y automatizadas en Firebase Test Lab es la opción más profesional y confiable para garantizar el funcionamiento de AgroTrack en el diverso mercado Android.