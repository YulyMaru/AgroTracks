# ADR-027: Proteger el backend con WAF y defensas perimetrales

- **Título**: Implementar protección perimetral con Cloudflare (plan gratuito) como WAF, mitigación DDoS, terminación TLS y rate limiting, complementado con Spring Security en el backend, descartando WAFs de pago y soluciones autoalojadas complejas.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de protección perimetral que mejor equilibre seguridad, costo, simplicidad y efectividad, considerando que el backend de AgroTrack estará expuesto a Internet, maneja datos sensibles (económicos, productivos, personales) y que el equipo tiene un presupuesto limitado y poco tiempo para configurar infraestructura compleja.

  - **Detalles**:

    - **Mitigación DDoS**: debe proteger contra ataques de denegación de servicio distribuidos.
    - **WAF**: debe filtrar tráfico malicioso (SQL injection, XSS, path traversal, etc.) antes de llegar al backend.
    - **TLS**: debe gestionar certificados SSL/TLS y forzar HTTPS.
    - **Rate limiting**: debe limitar solicitudes por IP/usuario para prevenir abuso.
    - **Costo**: debe ser viable con presupuesto limitado; se prefieren planes gratuitos o de bajo costo.
    - **Simplicidad**: no debe requerir configurar servidores ni software adicional.
    - **Compatibilidad**: debe integrarse con el stack actual (Spring Boot, React Native, GitHub Actions).
    - **Escalabilidad**: debe permitir crecer sin rehacer la estrategia.
    - **Escenarios de calidad relacionados**: ESC-CAL-SEG-01, ESC-CAL-ESC-01, ESC-CAL-RN-02.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de protección perimetral para el backend.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Solo Spring Security (sin WAF externo)**: el backend se protege únicamente con autenticación JWT, validación de entrada y configuración de Spring Security, sin capa perimetral externa.
    2. **Cloudflare (plan gratuito) + Spring Security**: se usa Cloudflare como WAF, mitigador DDoS, terminador TLS y rate limiter, complementado con Spring Security en el backend.
    3. **WAF gestionado de pago (AWS WAF, Azure WAF) o autoalojado (ModSecurity + OWASP CRS)**: se despliega un WAF dedicado, ya sea como servicio en la nube o como módulo en un servidor propio (Nginx + ModSecurity).

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron las opciones de protección perimetral disponibles para aplicaciones web con backend Spring Boot, considerando el costo, la simplicidad de configuración y la efectividad contra ataques comunes. Se revisaron las capacidades de Cloudflare en su plan gratuito, los costos de AWS WAF y la complejidad de ModSecurity autoalojado.

  - **1. Solo Spring Security (sin WAF externo)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de mitigación DDoS ni de protección perimetral.

      - **Detalles**:
        - Spring Security protege contra accesos no autorizados, pero no contra ataques volumétricos (DDoS).
        - No filtra tráfico malicioso antes de llegar al servidor de aplicaciones.
        - Un ataque DDoS puede saturar el backend y dejarlo inaccesible.
        - No hay terminación TLS gestionada; habría que configurar certificados manualmente.
        - El rate limiting debe implementarse a mano en el backend.
        - El backend queda expuesto directamente a Internet.

    - **Análisis de costos**:

      - **Resumen**: Costo cero, pero alto riesgo de indisponibilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe configurar TLS y rate limiting manualmente.
        - **Operación**: el backend puede caer ante un ataque.
        - **Medición**: no hay métricas de tráfico malicioso.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin costo.
        - Sin dependencia de terceros.
      - **Debilidades**:
        - Sin mitigación DDoS.
        - Sin WAF.
        - TLS manual.
        - Rate limiting manual.
      - **Oportunidades**:
        - Útil solo como capa interna complementaria.
      - **Amenazas**:
        - El backend puede ser saturado por un ataque.
        - Los datos pueden filtrarse si hay una vulnerabilidad.

    - **Opiniones y comentarios internos**:

      - "No podemos exponer el backend directamente sin ninguna capa perimetral."
      - "Un ataque DDoS básico dejaría la app inutilizable."

  - **2. Cloudflare (plan gratuito) + Spring Security**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción más equilibrada para el presupuesto y el contexto de AgroTrack.

      - **Detalles**:
        - **Plan gratuito de Cloudflare** incluye:
          - Mitigación DDoS ilimitada (capa 3, 4 y 7).
          - WAF con reglas gestionadas básicas (OWASP Top 10).
          - Terminación TLS con certificados gratuitos.
          - Rate limiting básico (10,000 solicitudes por mes).
          - CDN global (mejora la latencia para usuarios rurales).
          - DNS gestionado.
          - Protección contra bots.
        - Spring Security sigue manejando autenticación, autorización y validación.
        - El backend queda oculto detrás de Cloudflare (IP del servidor no expuesta).
        - Cloudflare se integra con GitHub Actions para despliegues.
        - El plan gratuito es suficiente para el volumen de AgroTrack en fase de piloto.

    - **Análisis de costos**:

      - **Resumen**: Costo cero en el plan gratuito; opciones de pago disponibles si se necesita más.

      - **Ejemplos**:
        - **Licencias**: $0 (plan gratuito).
        - **Capacitación**: mínima; el equipo debe aprender a configurar Cloudflare.
        - **Operación**: gestionado por Cloudflare.
        - **Medición**: panel de Cloudflare con métricas de tráfico y ataques.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Plan gratuito muy completo.
        - Mitigación DDoS ilimitada.
        - WAF gestionado.
        - TLS gratuito.
        - Rate limiting básico.
        - CDN global (mejora latencia).
        - IP del backend oculta.
        - Fácil integración con el stack actual.
      - **Debilidades**:
        - Dependencia de Cloudflare.
        - El plan gratuito tiene límites (10,000 solicitudes de rate limiting por mes).
        - Algunas reglas WAF avanzadas requieren plan de pago.
      - **Oportunidades**:
        - Escalar a un plan de pago si el tráfico crece.
        - Usar Cloudflare Workers para lógica personalizada.
      - **Amenazas**:
        - Si Cloudflare cambia su plan gratuito.
        - Si Cloudflare sufre un outage, el backend queda inaccesible.

    - **Opiniones y comentarios internos**:

      - "Cloudflare es el estándar para protección perimetral gratuita."
      - "El plan gratuito cubre más que suficiente para el piloto."
      - "La CDN también ayuda a los campesinos con conexiones lentas."

  - **3. WAF gestionado de pago o autoalojado**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con los criterios de costo y simplicidad.

      - **Detalles**:
        - **AWS WAF**: ~$5/mes por ACL + $1 por regla + $0.60 por millón de solicitudes.
        - **Azure WAF**: desde ~$50/mes.
        - **ModSecurity + OWASP CRS**: requiere configurar Nginx, actualizar reglas, monitorear.
        - Los costos de AWS WAF y Azure WAF son bajos pero no cero.
        - ModSecurity añade complejidad operativa (actualizaciones, falsos positivos, logs).
        - El equipo tendría que aprender a configurar y mantener el WAF.
        - No aporta beneficios significativos sobre Cloudflare para el volumen de AgroTrack.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto, costo operativo medio.

      - **Ejemplos**:
        - **Licencias**: AWS WAF ~$5-20/mes; Azure WAF ~$50/mes; ModSecurity gratis pero requiere servidor.
        - **Capacitación**: el equipo debe aprender a configurar y mantener el WAF.
        - **Operación**: actualizaciones, monitoreo, ajuste de reglas.
        - **Medición**: métricas de ataques bloqueados.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Control total sobre las reglas.
        - Personalizable.
      - **Debilidades**:
        - Costo recurrente o complejidad de configuración.
        - Mayor mantenimiento.
        - No aporta beneficios sobre Cloudflare para el volumen actual.
      - **Oportunidades**:
        - Útil si se requiere control granular.
      - **Amenazas**:
        - Costos imprevistos.
        - Desviación del foco del desarrollo.

    - **Opiniones y comentarios internos**:

      - "AWS WAF es potente, pero Cloudflare gratuito es suficiente."
      - "ModSecurity requiere tiempo de configuración que no tenemos."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-027 — Validará que Cloudflare plan gratuito protege el backend contra ataques comunes sin degradar el rendimiento — Propuesto.
    - SPIKE-011 — Validará que el backend rechaza accesos no autorizados con JWT — Propuesto.
    - SPIKE-025 — Validará que el pipeline de CI/CD se integra con Cloudflare — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Solo Spring Security — descartado por falta de mitigación DDoS.
    - AWS WAF — descartado por costo recurrente.
    - Azure WAF — descartado por costo elevado.
    - ModSecurity + OWASP CRS — descartado por complejidad de configuración.
    - Imperva, Akamai — descartados por costo empresarial.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con datos económicos, productivos y personales sensibles.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-027 (validación de Cloudflare), SPIKE-011 (autenticación JWT) y SPIKE-025 (integración con CI/CD).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **Cloudflare (plan gratuito) + Spring Security** porque:
    - El plan gratuito es muy completo y cubre las necesidades de AgroTrack en fase de piloto.
    - Mitigación DDoS ilimitada sin costo.
    - WAF gestionado con reglas OWASP Top 10.
    - TLS gratuito y automático.
    - Rate limiting básico.
    - CDN global que mejora la latencia para usuarios rurales.
    - IP del backend oculta.
    - Fácil integración con el stack actual.
    - Sin costo recurrente.
    - Spring Security complementa con autenticación, autorización y validación.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que Cloudflare plan gratuito proteja el backend contra ataques comunes, que el rendimiento no se degrade significativamente y que la integración con el stack actual sea sencilla.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % del tráfico HTTP/HTTPS hacia el backend.
    - **¿Qué tipos de integraciones están involucradas?**: Cloudflare (DNS, WAF, DDoS, TLS, rate limiting, CDN), Spring Security (autenticación, autorización), el backend Spring Boot (ADR-016), el pipeline de CI/CD (ADR-025) y el dominio del proyecto.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Configurar Cloudflare desde el día 1. No exponer la IP del backend directamente. Usar TLS estricto. Configurar reglas WAF básicas. Monitorear el panel de Cloudflare. Considerar un plan de pago si el tráfico crece mucho.

  - **Anécdotas**:

    - Durante el análisis se concluyó que Cloudflare ofrece más funcionalidades en su plan gratuito que muchos WAFs de pago.
    - Se identificó que la CDN de Cloudflare puede reducir la latencia para campesinos con conexiones lentas.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **Cloudflare (plan gratuito) + Spring Security** como estrategia de protección perimetral, cumpliendo con los escenarios ESC-CAL-SEG-01, ESC-CAL-ESC-01 y ESC-CAL-RN-02.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre seguridad, costo, simplicidad y efectividad.

    La implementación deberá considerar como mínimo:

    - **Cloudflare (plan gratuito)**:
      - Registrar el dominio en Cloudflare.
      - Configurar DNS con proxy habilitado (naranja).
      - Habilitar TLS estricto (Full Strict).
      - Habilitar WAF con reglas gestionadas (OWASP Top 10).
      - Configurar rate limiting básico (10,000 solicitudes por mes).
      - Habilitar mitigación DDoS (automática).
      - Habilitar protección contra bots.
      - Ocultar la IP del backend.
    - **Backend (Spring Boot)**:
      - Configurar Spring Security para autenticación JWT (ADR-011).
      - Validar todas las entradas (ADR-002).
      - Implementar CORS restrictivo.
      - Configurar headers de seguridad (HSTS, X-Content-Type-Options, X-Frame-Options).
      - Implementar rate limiting interno como complemento (opcional).
    - **Pipeline de CI/CD**:
      - Integrar Cloudflare con GitHub Actions para invalidar caché tras despliegues.
    - **Monitoreo**:
      - Usar el panel de Cloudflare para métricas de tráfico y ataques.
      - Configurar alertas para ataques DDoS o picos de tráfico anómalos.
    - **Documentación**:
      - Guía de configuración de Cloudflare.
      - Lista de reglas WAF habilitadas.
      - Procedimiento para escalar a plan de pago si es necesario.

    Se descarta Spring Security solo por falta de mitigación DDoS, AWS WAF y Azure WAF por costo recurrente, y ModSecurity por complejidad de configuración. Cloudflare plan gratuito + Spring Security es la opción que garantiza seguridad, simplicidad y costo cero para AgroTrack.