# ADR-028: Implementar notificaciones locales y push para eventos clave

- **Título**: Implementar notificaciones locales y push con Firebase Cloud Messaging (plan gratuito) para informar al usuario sobre sincronización, confirmaciones y eventos clave, descartando notificaciones por email, SMS o WhatsApp en la primera versión.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de notificaciones que mejor equilibre utilidad para el campesino, simplicidad de implementación, costo y experiencia de usuario, considerando que AgroTrack debe informar sobre sincronización (HU-43), confirmaciones de registro y eventos relevantes sin ser invasivo ni interrumpir el trabajo del usuario.

  - **Detalles**:

    - **Notificación de sincronización**: el usuario debe ser notificado cuando hay datos pendientes y se recupera la conexión (HU-43).
    - **Confirmación de acciones**: el usuario debe recibir feedback claro cuando registra información (HU-45).
    - **No intrusivo**: las notificaciones no deben interrumpir el trabajo del usuario ni ser molestas.
    - **Autonomía del campesino**: respetar la restricción de negocio de no enviar alertas automáticas no solicitadas (ej. "Es hora de regar").
    - **Funcionamiento offline**: las notificaciones locales deben funcionar sin conexión; las push requieren conexión.
    - **Costo**: debe ser viable con presupuesto limitado; se prefieren planes gratuitos.
    - **Simplicidad**: no debe requerir infraestructura adicional ni servidores de notificaciones.
    - **Privacidad**: no debe exponer información sensible en la notificación.
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-01, ESC-CAL-DP-03, ESC-CAL-US-13.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de notificación para aplicaciones móviles.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Sin notificaciones**: la app solo muestra mensajes dentro de la interfaz (toasts, snackbars, banners).
    2. **Notificaciones locales + push con Firebase Cloud Messaging (plan gratuito)**: la app usa notificaciones locales para eventos sin conexión y FCM para eventos que requieren conexión (ej. sincronización completada en background).
    3. **Notificaciones multicanal (email, SMS, WhatsApp, push)**: se envían notificaciones por múltiples canales usando servicios como Twilio, SendGrid o WhatsApp Business API.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de notificación en aplicaciones móviles para usuarios rurales, considerando la restricción de negocio de autonomía del campesino (no imposiciones), la HU-43 (notificar disponibilidad de sincronización) y la HU-45 (confirmación de acciones). Se revisaron las capacidades de Firebase Cloud Messaging en su plan gratuito y los costos de servicios multicanal.

  - **1. Sin notificaciones**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con HU-43 (notificar disponibilidad de sincronización).

      - **Detalles**:
        - El usuario no sabe cuándo hay datos pendientes de sincronizar.
        - El usuario no recibe feedback fuera de la app.
        - Si la app está en background, el usuario no se entera de que la sincronización terminó.
        - No cumple con HU-43.
        - Pero sigue cumpliendo con HU-45 (mensajes dentro de la app).

    - **Análisis de costos**:

      - **Resumen**: Costo cero.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: ninguna.
        - **Medición**: no aplica.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin costo.
        - Sin complejidad.
      - **Debilidades**:
        - No cumple HU-43.
        - El usuario no sabe cuándo sincronizar.
      - **Oportunidades**:
        - Útil para MVP mínimo.
      - **Amenazas**:
        - El usuario puede olvidar sincronizar.
        - Los datos quedan pendientes más tiempo del necesario.

    - **Opiniones y comentarios internos**:

      - "Sin notificaciones, el usuario tendría que abrir la app manualmente para saber si hay pendientes."
      - "HU-43 pide explícitamente que se notifique."

  - **2. Notificaciones locales + push con Firebase Cloud Messaging (plan gratuito)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios.

      - **Detalles**:
        - **Notificaciones locales**: para eventos que ocurren sin conexión o en el dispositivo (ej. "Registro guardado localmente", "5 registros pendientes de sincronizar").
        - **Firebase Cloud Messaging (FCM)**: para eventos que requieren conexión (ej. "Sincronización completada", "Nuevos datos disponibles desde el servidor").
        - FCM es **gratuito e ilimitado**.
        - Funciona en Android e iOS.
        - No requiere servidor propio de notificaciones.
        - Se integra con Spring Boot (backend) y React Native (frontend).
        - **No intrusivo**: solo se envían notificaciones para eventos relevantes (sincronización, confirmaciones).
        - **Respeta la autonomía**: no se envían alertas automáticas no solicitadas.
        - **Privacidad**: las notificaciones no exponen datos sensibles (ej. "Tienes 3 registros pendientes" en lugar de "$50,000 de gasto pendiente").
        - **HU-43**: el usuario recibe notificación cuando hay conexión y datos pendientes.
        - **HU-45**: el usuario recibe confirmación dentro de la app y, si está en background, por notificación local.

    - **Análisis de costos**:

      - **Resumen**: Costo cero.

      - **Ejemplos**:
        - **Licencias**: FCM es gratuito e ilimitado.
        - **Capacitación**: mínima; el equipo debe aprender a usar FCM.
        - **Operación**: gestionado por Firebase.
        - **Medición**: Firebase Console muestra métricas de envío.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Gratuito e ilimitado.
        - Funciona en Android e iOS.
        - Integración nativa con React Native.
        - Notificaciones locales funcionan sin conexión.
        - No requiere servidor propio.
        - Respeta la autonomía del campesino.
      - **Debilidades**:
        - Requiere configurar Firebase.
        - Las notificaciones push requieren conexión.
        - El usuario debe aceptar permisos de notificación.
      - **Oportunidades**:
        - Añadir notificaciones segmentadas en el futuro.
        - Usar Firebase Analytics para medir engagement.
      - **Amenazas**:
        - El usuario puede desactivar las notificaciones.
        - Si Firebase cambia sus políticas.

    - **Opiniones y comentarios internos**:

      - "FCM es el estándar para notificaciones push en móvil."
      - "Las notificaciones locales cubren los eventos sin conexión."
      - "No queremos ser invasivos; solo notificamos lo relevante."

  - **3. Notificaciones multicanal (email, SMS, WhatsApp, push)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con los criterios de costo y simplicidad.

      - **Detalles**:
        - **Email**: requiere servicio de envío (SendGrid, Mailgun). Costo variable.
        - **SMS**: requiere Twilio o similar. Costo por mensaje (~$0.01-0.05 USD).
        - **WhatsApp Business API**: requiere aprobación de Meta y costo por conversación.
        - **Push**: FCM es gratuito.
        - La combinación multicanal añade complejidad significativa.
        - El campesino promedio no revisa email con frecuencia.
        - WhatsApp podría ser útil, pero requiere integración con la API de Meta y cumplir políticas.
        - El costo recurrente puede ser alto si el volumen de notificaciones crece.
        - No es viable para la primera versión.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto, costo operativo variable.

      - **Ejemplos**:
        - **Licencias**: SendGrid (~$15/mes), Twilio (~$0.01-0.05 por SMS), WhatsApp Business API (costo por conversación).
        - **Capacitación**: el equipo debe aprender cada servicio.
        - **Operación**: monitoreo de envíos, gestión de plantillas.
        - **Medición**: métricas por canal.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Alcance multicanal.
        - WhatsApp es popular en Latinoamérica.
      - **Debilidades**:
        - Costo recurrente.
        - Complejidad de integración.
        - Aprobaciones de terceros (Meta).
        - El email no es efectivo para el campesino.
      - **Oportunidades**:
        - Útil si el negocio lo requiere en el futuro.
      - **Amenazas**:
        - Costos imprevistos.
        - Desviación del foco del desarrollo.

    - **Opiniones y comentarios internos**:

      - "El email no es un canal efectivo para el campesino."
      - "WhatsApp podría ser útil, pero requiere aprobación de Meta y costos."
      - "No queremos añadir complejidad para el piloto."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-028 — Validará que las notificaciones locales y push con FCM funcionan correctamente en los 3 dispositivos Android, sin ser intrusivas — Propuesto.
    - SPIKE-006 — Validará que NetInfo detecta conectividad y activa la notificación de sincronización — Propuesto.
    - SPIKE-001 — Validará que la sincronización offline funciona con retry y backoff — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Sin notificaciones — descartado por no cumplir HU-43.
    - Notificaciones multicanal (email, SMS, WhatsApp) — descartadas por costo y complejidad.
    - Notificaciones solo push (sin locales) — descartado porque no funcionan sin conexión.
    - Notificaciones solo locales (sin push) — insuficiente para eventos que requieren conexión.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, Android-first, offline-first, con restricción de autonomía (no alertas automáticas no solicitadas).
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-028 (notificaciones locales + push), SPIKE-006 (detección de conectividad) y SPIKE-001 (sincronización offline).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **notificaciones locales + push con Firebase Cloud Messaging** porque:
    - FCM es gratuito e ilimitado.
    - Las notificaciones locales funcionan sin conexión.
    - Las push cubren eventos que requieren conexión.
    - Se integra naturalmente con React Native y Spring Boot.
    - Respeta la autonomía del campesino (solo notifica eventos relevantes).
    - No expone datos sensibles en la notificación.
    - Cumple con HU-43 y HU-45.
    - Es el estándar en aplicaciones móviles.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que las notificaciones locales y push funcionen correctamente en los 3 dispositivos, sin ser intrusivas, y que el usuario reciba notificación de sincronización cuando corresponda.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las notificaciones de la app.
    - **¿Qué tipos de integraciones están involucradas?**: Firebase Cloud Messaging (backend + frontend), notificaciones locales (React Native), NetInfo (ADR-006), motor de sincronización (ADR-001), y Firebase Analytics (ADR-021).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Usar notificaciones locales para eventos sin conexión y push para eventos que requieren conexión. No exponer datos sensibles en la notificación. Respetar la autonomía del campesino (no alertas automáticas no solicitadas). Solicitar permisos de notificación con contexto (explicar por qué). Probar en los 3 dispositivos desde el día 1.

  - **Anécdotas**:

    - Durante el análisis se concluyó que el email no es un canal efectivo para el campesino (revisa poco el correo).
    - Se identificó que WhatsApp sería útil pero requiere aprobación de Meta y costos por conversación, lo cual no es viable para el piloto.
    - Se decidió que las notificaciones deben ser no intrusivas: solo eventos relevantes (sincronización, confirmaciones).

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **notificaciones locales + push con Firebase Cloud Messaging** para informar al usuario sobre sincronización, confirmaciones y eventos clave, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-03 y ESC-CAL-US-13.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre utilidad, simplicidad, costo y experiencia de usuario.

    La implementación deberá considerar como mínimo:

    - **Notificaciones locales (React Native)**:
      - **Registro guardado**: "¡Guardado localmente! Se sincronizará automáticamente."
      - **Registros pendientes**: "Tienes N registros pendientes de sincronizar."
      - **Sincronización completada**: "Tus datos se sincronizaron correctamente."
      - **Error de sincronización**: "No se pudieron sincronizar N registros. Se reintentará automáticamente."
      - **Sin conexión**: "Sin conexión. Los datos se guardarán localmente."
    - **Notificaciones push (Firebase Cloud Messaging)**:
      - **Sincronización completada desde background**: "Tus datos se sincronizaron."
      - **Nuevos datos disponibles**: "Hay nuevos datos disponibles. Abre la app para verlos."
      - **Recordatorio de sincronización manual** (si el usuario lo activa): "Tienes datos pendientes. ¿Quieres sincronizar ahora?"
    - **Configuración de Firebase Cloud Messaging**:
      - Crear proyecto en Firebase Console.
      - Registrar la app Android.
      - Configurar la clave del servidor en el backend (Spring Boot).
      - Implementar el envío de notificaciones desde el backend.
      - Implementar la recepción en React Native.
    - **Privacidad**:
      - No exponer datos sensibles en la notificación (ej. "Tienes 3 registros pendientes" en lugar de "$50,000 de gasto pendiente").
      - Permitir al usuario desactivar las notificaciones desde la configuración de la app.
    - **Autonomía del campesino**:
      - No enviar alertas automáticas no solicitadas (ej. "Es hora de regar").
      - Solo notificar eventos iniciados por el usuario o relacionados con la sincronización.
    - **Permisos**:
      - Solicitar permisos de notificación con contexto (explicar por qué se necesitan).
      - Si el usuario rechaza, respetar su decisión y no insistir.
    - **Pruebas**:
      - Verificar que las notificaciones locales funcionan sin conexión.
      - Verificar que las notificaciones push funcionan con conexión.
      - Verificar que no son intrusivas.
      - Verificar que no exponen datos sensibles.
      - Verificar en los 3 dispositivos Android.

    Se descarta "sin notificaciones" por no cumplir HU-43, y las notificaciones multicanal (email, SMS, WhatsApp) por costo y complejidad. Las notificaciones locales + push con FCM son la opción que garantiza utilidad, simplicidad y costo cero para AgroTrack.