# ADR-026: Definir el canal de distribución de la aplicación móvil

- **Título**: Distribuir la aplicación móvil Android mediante GitHub Releases para el piloto y Firebase App Distribution para testers, dejando Google Play como canal oficial para producción futura, descartando tiendas alternativas como Uptodown en la primera versión.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar el canal de distribución que mejor equilibre costo, confianza del usuario, facilidad de actualización, alcance y esfuerzo operativo, considerando que AgroTrack es una aplicación B2C para campesinos colombianos con presupuesto limitado y que se encuentra en fase de piloto.

  - **Detalles**:

    - **Costo**: la solución debe ser viable con presupuesto limitado; se prefieren canales gratuitos para el piloto.
    - **Confianza del usuario**: el campesino debe poder instalar la app sin temor a malware o fraudes.
    - **Facilidad de instalación**: el proceso de descarga e instalación debe ser simple, sin pasos técnicos complejos.
    - **Actualizaciones**: debe existir un mecanismo para distribuir nuevas versiones.
    - **Alcance**: debe permitir llegar al mercado objetivo (campesinos colombianos).
    - **Trazabilidad**: debe permitir rastrear qué versión tiene cada usuario.
    - **Escalabilidad**: debe permitir crecer hacia producción sin rehacer la estrategia.
    - **Escenarios de calidad relacionados**: ESC-CAL-POR-01, ESC-CAL-SEG-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cuatro canales de distribución para aplicaciones Android.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **GitHub Releases**: subir el APK como asset de una release en el repositorio de GitHub; los usuarios descargan el enlace directo.
    2. **Firebase App Distribution**: servicio gratuito de Firebase para distribuir builds a testers; notifica por email y gestiona grupos.
    3. **Google Play Console**: tienda oficial de Android; requiere pago único de $25 USD y revisión de la app.
    4. **Tiendas alternativas (Uptodown, Aptoide, F-Droid)**: tiendas no oficiales que permiten publicar apps gratis sin revisión de Google.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron los canales de distribución disponibles para aplicaciones Android, considerando el contexto de un proyecto B2C en fase de piloto con presupuesto limitado y un mercado objetivo de campesinos colombianos con baja familiaridad tecnológica. Se revisaron las ventajas y desventajas de cada canal en términos de costo, confianza, facilidad de instalación y actualizaciones.

  - **1. GitHub Releases**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con los criterios de costo, trazabilidad y escalabilidad, pero no con el de confianza del usuario ni facilidad de instalación para el usuario final.

      - **Detalles**:
        - Es completamente gratuito.
        - Se integra naturalmente con el pipeline de CI/CD (ADR-025).
        - Permite versionar cada release y adjuntar el APK.
        - Sin embargo, el usuario debe habilitar "Instalar desde fuentes desconocidas" en Android.
        - No hay notificaciones automáticas de actualización.
        - El enlace no es familiar para el campesino promedio.
        - Es ideal para el piloto y pruebas internas, no para distribución masiva.

    - **Análisis de costos**:

      - **Resumen**: Costo cero.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: integrado con el repositorio.
        - **Medición**: trazabilidad por release y commit.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Gratuito.
        - Integración con CI/CD.
        - Trazabilidad completa.
      - **Debilidades**:
        - Requiere habilitar fuentes desconocidas.
        - Sin notificaciones de actualización.
        - Poco familiar para el usuario final.
      - **Oportunidades**:
        - Ideal para el piloto.
      - **Amenazas**:
        - El usuario puede desconfiar del enlace.

    - **Opiniones y comentarios internos**:

      - "GitHub Releases es perfecto para el piloto, pero no para el campesino."
      - "El enlace se lo podemos dar a los testers y a los campesinos del piloto."

  - **2. Firebase App Distribution**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con todos los criterios para testers y usuarios piloto.

      - **Detalles**:
        - Completamente gratuito (hasta 500 testers por proyecto).
        - Notifica a los testers por email cuando hay una nueva versión.
        - Permite agrupar testers.
        - Se integra con GitHub Actions (ADR-025).
        - El usuario recibe un enlace directo para instalar.
        - Requiere habilitar fuentes desconocidas (igual que GitHub Releases).
        - Es ideal para el piloto con campesinos seleccionados.

    - **Análisis de costos**:

      - **Resumen**: Costo cero.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: integrado con CI/CD.
        - **Medición**: trazabilidad por tester y versión.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Gratuito.
        - Notificaciones automáticas.
        - Gestión de grupos de testers.
        - Integración con CI/CD.
      - **Debilidades**:
        - Requiere habilitar fuentes desconocidas.
        - No es para distribución masiva.
      - **Oportunidades**:
        - Ideal para el piloto.
      - **Amenazas**:
        - Límite de 500 testers.

    - **Opiniones y comentarios internos**:

      - "Firebase App Distribution es perfecto para los testers del piloto."
      - "Las notificaciones automáticas ahorran tiempo."

  - **3. Google Play Console**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con todos los criterios, pero requiere una inversión única de $25 USD y una revisión de la app.

      - **Detalles**:
        - Es la tienda oficial de Android.
        - Genera confianza en el usuario.
        - Actualizaciones automáticas.
        - Alcance masivo.
        - Requiere pago único de $25 USD.
        - Requiere verificación de identidad y cumplimiento de políticas de Google.
        - La revisión de la app puede tardar días.
        - Es el canal recomendado para producción.

    - **Análisis de costos**:

      - **Resumen**: Costo único de $25 USD, sin costo recurrente.

      - **Ejemplos**:
        - **Licencias**: $25 USD pago único.
        - **Capacitación**: mínima.
        - **Operación**: gestionado por Google.
        - **Medición**: estadísticas en Google Play Console.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Tienda oficial.
        - Confianza del usuario.
        - Actualizaciones automáticas.
        - Alcance masivo.
        - Estadísticas y monitoreo.
      - **Debilidades**:
        - Requiere pago único.
        - Revisión de la app.
        - Políticas estrictas.
      - **Oportunidades**:
        - Canal oficial para producción.
      - **Amenazas**:
        - La app puede ser rechazada si no cumple políticas.

    - **Opiniones y comentarios internos**:

      - "Google Play es el destino final, pero no ahora."
      - "Los $25 USD son una inversión única que vale la pena cuando estemos listos."

  - **4. Tiendas alternativas (Uptodown, Aptoide, F-Droid)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de confianza del usuario ni facilidad de actualización.

      - **Detalles**:
        - Son gratuitas para publicar.
        - Sin revisión de Google.
        - Sin embargo, el campesino promedio no las conoce.
        - No ofrecen actualizaciones automáticas.
        - Pueden asociarse con contenido pirata o malicioso (percepción).
        - No generan confianza para una app que maneja datos financieros.
        - Añaden un canal más que mantener sin aportar valor claro.

    - **Análisis de costos**:

      - **Resumen**: Costo cero, pero sin retorno claro.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: un canal más que gestionar.
        - **Medición**: limitada.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Gratuitas.
      - **Debilidades**:
        - Poco conocidas.
        - Sin actualizaciones automáticas.
        - Percepción de inseguridad.
      - **Oportunidades**:
        - Nicho de usuarios técnicos.
      - **Amenazas**:
        - Confusión del usuario.
        - Mala percepción de la marca.

    - **Opiniones y comentarios internos**:

      - "Uptodown no es conocida por el campesino promedio."
      - "No queremos que el usuario desconfíe de la app."
      - "Si en el futuro Google Play no funciona, evaluamos alternativas."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de la experiencia del equipo y del análisis de canales de distribución para aplicaciones B2C en Latinoamérica.

  - **¿Quién da la opinión?**:

    - SPIKE-026 — Validará que GitHub Releases y Firebase App Distribution son suficientes para el piloto y que los testers pueden instalar la app sin fricción — Propuesto.
    - SPIKE-012 — Validará que la app se instala en 3 dispositivos Android físicos — Propuesto.
    - SPIKE-025 — Validará que el pipeline distribuye el APK con Firebase App Distribution — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Uptodown — descartado por falta de confianza del usuario y ausencia de actualizaciones automáticas.
    - Aptoide — descartado por las mismas razones.
    - F-Droid — descartado por estar orientado a software libre y usuarios técnicos.
    - Distribución por email o WhatsApp — descartado por falta de trazabilidad y seguridad.
    - Distribución por USB — descartado por inviable a escala.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos colombianos, Android-first, offline-first.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el análisis de canales de distribución y la validación en el SPIKE-026, SPIKE-012 y SPIKE-025.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó una **estrategia en dos fases**:
    - **Fase 1 (piloto)**: GitHub Releases + Firebase App Distribution. Gratis, integrado con CI/CD, suficiente para testers y campesinos del piloto.
    - **Fase 2 (producción)**: Google Play Console. Pago único de $25 USD, confianza del usuario, actualizaciones automáticas, alcance masivo.

    Se descartan las tiendas alternativas (Uptodown, Aptoide, F-Droid) porque no generan confianza en el campesino promedio, no ofrecen actualizaciones automáticas y añaden un canal que mantener sin aportar valor claro.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que GitHub Releases y Firebase App Distribution permitan distribuir la app a los testers y campesinos del piloto sin fricción, y que Google Play sea el canal oficial cuando la app esté lista para producción.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las instalaciones de la app.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Releases (CI/CD, ADR-025), Firebase App Distribution (CI/CD, ADR-025), Google Play Console (futuro), y el APK generado por el pipeline.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Empezar con GitHub Releases y Firebase App Distribution para el piloto. No invertir tiempo en tiendas alternativas. Preparar la app para Google Play desde el día 1 (cumplir políticas, privacidad, permisos). Los $25 USD de Google Play son una inversión única que vale la pena.

  - **Anécdotas**:

    - Durante el análisis se concluyó que Uptodown, aunque es gratuita y tiene presencia en Latinoamérica, no es conocida por el campesino promedio. El usuario podría desconfiar de una app que no está en Google Play.
    - Se identificó que el proceso de habilitar "fuentes desconocidas" es una barrera para el usuario no técnico; por eso Google Play es el destino final.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar una **estrategia de distribución en dos fases**:
    - **Fase 1 (piloto)**: GitHub Releases + Firebase App Distribution.
    - **Fase 2 (producción)**: Google Play Console.

    Se descartan las tiendas alternativas (Uptodown, Aptoide, F-Droid) en la primera versión.

  - **Detalles**:

    Esta estrategia ofrece el mejor equilibrio entre costo, confianza, facilidad de actualización y alcance.

    La implementación deberá considerar como mínimo:

    - **Fase 1 (piloto)**:
      - **GitHub Releases**: subir el APK como asset en cada release del repositorio. Usar el pipeline de CI/CD (ADR-025) para automatizar la subida.
      - **Firebase App Distribution**: configurar grupos de testers y campesinos del piloto. Notificar por email cuando haya nueva versión.
      - **Instrucciones de instalación**: incluir una guía simple con capturas de pantalla para habilitar "fuentes desconocidas" e instalar el APK.
      - **Soporte**: ofrecer un canal de soporte (WhatsApp o email) para resolver dudas de instalación.
    - **Fase 2 (producción)**:
      - **Google Play Console**: registrarse como desarrollador ($25 USD pago único). Preparar la app para cumplir políticas de Google (privacidad, permisos, contenido).
      - **Publicación**: subir el APK/AAB firmado. Configurar la ficha de la app (descripción, capturas, icono).
      - **Actualizaciones**: usar Google Play para actualizaciones automáticas.
    - **Preparación desde el día 1**:
      - Cumplir con las políticas de Google Play (privacidad, permisos, contenido).
      - Firmar el APK con una clave de release.
      - Documentar el proceso de publicación.
      - No invertir tiempo en tiendas alternativas.

    Se descartan las tiendas alternativas (Uptodown, Aptoide, F-Droid) porque no generan confianza en el campesino promedio, no ofrecen actualizaciones automáticas y añaden un canal que mantener sin aportar valor claro. La estrategia en dos fases es la opción que garantiza distribución efectiva en AgroTrack.