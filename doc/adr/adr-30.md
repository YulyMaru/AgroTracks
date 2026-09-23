# ADR-030: Gestionar secretos de forma segura en backend y CI/CD

- **Título**: Usar GitHub Secrets y variables de entorno del servidor para gestionar secretos del backend y del pipeline de CI/CD, descartando secretos hardcodeados, archivos `.env` versionados y servicios de Key Vault de pago.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de gestión de secretos (credenciales de base de datos, clave JWT, credenciales de Firebase, tokens de API) que mejor equilibre seguridad, costo, simplicidad y mantenibilidad, considerando el equipo pequeño de AgroTrack y el uso de GitHub Actions como CI/CD.

  - **Detalles**:

    - **No hardcodear**: ningún secreto debe estar en el código fuente ni en archivos versionados.
    - **Separación por entorno**: los secretos de desarrollo, staging y producción deben estar separados.
    - **Rotación**: debe ser posible rotar un secreto sin afectar el servicio.
    - **Trazabilidad**: debe haber registro de cuándo se cambió un secreto (quién y cuándo).
    - **Acceso restringido**: solo las personas y sistemas autorizados deben acceder a los secretos.
    - **Integración con CI/CD**: el pipeline debe poder leer los secretos sin exponerlos en los logs.
    - **Costo**: la solución debe ser viable con presupuesto limitado; se prefieren planes gratuitos.
    - **Simplicidad**: no debe requerir infraestructura adicional ni configuración compleja.
    - **Escalabilidad**: debe permitir crecer hacia un Key Vault gestionado si el proyecto lo requiere.
    - **Escenarios de calidad relacionados**: ESC-CAL-SEG-01, ESC-CAL-ESC-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de gestión de secretos.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Secretos hardcodeados o en archivos `.env` versionados**: los secretos se incluyen en el código o en archivos `.env` que se suben al repositorio.
    2. **GitHub Secrets + variables de entorno del servidor**: los secretos del pipeline se gestionan en GitHub Secrets; los secretos del backend en producción se inyectan como variables de entorno del servidor.
    3. **Key Vault gestionado (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)**: servicio dedicado para almacenar, rotar y auditar secretos, con integración con el backend y el pipeline.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron las prácticas de gestión de secretos en proyectos con backend Spring Boot y CI/CD en GitHub Actions, considerando el costo, la simplicidad y la seguridad. Se revisaron las capacidades de GitHub Secrets en su plan gratuito y los costos de los servicios de Key Vault.

  - **1. Secretos hardcodeados o en archivos `.env` versionados**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con ningún criterio de seguridad. Es inaceptable.

      - **Detalles**:
        - Los secretos quedan expuestos en el repositorio (incluso si el repo es privado).
        - Cualquier persona con acceso al repositorio puede verlos.
        - Si el repositorio se filtra, los secretos quedan comprometidos.
        - No hay rotación ni trazabilidad.
        - Los logs pueden exponer secretos si se imprimen.
        - Viola las buenas prácticas de seguridad.

    - **Análisis de costos**:

      - **Resumen**: Costo cero, pero riesgo de seguridad altísimo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: riesgo de brecha de seguridad.
        - **Medición**: no aplica.

    - **Análisis FODA**:

      - **Fortalezas**: sin inversión.
      - **Debilidades**: inseguro, sin rotación, sin trazabilidad.
      - **Oportunidades**: ninguna.
      - **Amenazas**: brechas de seguridad, sanciones legales.

    - **Opiniones y comentarios internos**:

      - "Hardcodear secretos es la peor práctica posible."
      - "Un secreto en el repositorio es un secreto comprometido."

  - **2. GitHub Secrets + variables de entorno del servidor**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción más equilibrada para el presupuesto y el contexto de AgroTrack.

      - **Detalles**:
        - **GitHub Secrets** para el pipeline de CI/CD: almacena secretos cifrados, accesibles solo por workflows autorizados.
        - **Variables de entorno del servidor** para el backend en producción: los secretos se inyectan al arrancar la aplicación (ej. `DB_PASSWORD`, `JWT_SECRET`).
        - Los secretos nunca están en el código ni en archivos versionados.
        - GitHub Secrets no expone los secretos en los logs (los enmascara).
        - Permite separar secretos por entorno (usando environments de GitHub).
        - Rotación manual: cambiar el secreto en GitHub Secrets y en el servidor.
        - Trazabilidad: GitHub registra quién cambió un secreto y cuándo.
        - Acceso restringido: solo administradores del repositorio pueden ver/gestionar secretos.
        - Costo cero.

    - **Análisis de costos**:

      - **Resumen**: Costo cero.

      - **Ejemplos**:
        - **Licencias**: GitHub Secrets y variables de entorno son gratuitos.
        - **Capacitación**: mínima; el equipo debe aprender a configurar secretos en GitHub.
        - **Operación**: rotación manual documentada.
        - **Medición**: GitHub registra cambios en secretos.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin costo.
        - Integración nativa con GitHub Actions (ADR-025).
        - Secretos enmascarados en logs.
        - Separación por entorno.
        - Trazabilidad de cambios.
        - Fácil de implementar.
      - **Debilidades**:
        - Rotación manual.
        - Sin auditoría avanzada.
        - Sin rotación automática.
        - El backend en producción depende de variables de entorno del servidor.
      - **Oportunidades**:
        - Migrar a un Key Vault gestionado si el proyecto crece.
        - Automatizar la rotación con scripts.
      - **Amenazas**:
        - Si un administrador del repositorio se compromete, los secretos quedan expuestos.
        - Si el servidor se compromete, las variables de entorno quedan expuestas.

    - **Opiniones y comentarios internos**:

      - "GitHub Secrets es el estándar para CI/CD en GitHub."
      - "Las variables de entorno del servidor son suficientes para el backend en producción."
      - "Podemos migrar a un Key Vault si el proyecto crece."

  - **3. Key Vault gestionado (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con los criterios de costo y simplicidad.

      - **Detalles**:
        - **AWS Secrets Manager**: ~$0.40 por secreto por mes + $0.05 por 10,000 llamadas.
        - **Azure Key Vault**: ~$0.03 por 10,000 operaciones.
        - **HashiCorp Vault**: gratuito si se autoaloja, pero requiere servidor y configuración.
        - Ofrecen rotación automática, auditoría avanzada y control granular.
        - Requieren integrar el backend con el servicio (SDK, configuración).
        - Requieren configurar el pipeline para leer secretos del vault.
        - Añaden complejidad operativa.
        - No aportan beneficios significativos sobre GitHub Secrets para el volumen de AgroTrack.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto, costo operativo bajo pero recurrente.

      - **Ejemplos**:
        - **Licencias**: AWS Secrets Manager ~$5-10/mes; Azure Key Vault ~$1-5/mes; HashiCorp Vault gratis pero requiere servidor.
        - **Capacitación**: el equipo debe aprender a usar el servicio.
        - **Operación**: configuración, monitoreo, rotación.
        - **Medición**: métricas de uso del vault.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Rotación automática.
        - Auditoría avanzada.
        - Control granular.
        - Estándar en empresas grandes.
      - **Debilidades**:
        - Costo recurrente.
        - Complejidad de integración.
        - Mayor mantenimiento.
        - No aporta beneficios significativos para el volumen actual.
      - **Oportunidades**:
        - Útil si el proyecto escala mucho.
      - **Amenazas**:
        - Costos imprevistos.
        - Desviación del foco del desarrollo.

    - **Opiniones y comentarios internos**:

      - "Un Key Vault gestionado es sobre-ingeniería para el piloto."
      - "GitHub Secrets es suficiente para nuestra escala."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-030 — Validará que GitHub Secrets y variables de entorno del servidor gestionan los secretos sin exponerlos — Propuesto.
    - SPIKE-025 — Validará que el pipeline lee los secretos de GitHub Secrets sin exponerlos en logs — Propuesto.
    - SPIKE-011 — Validará que la clave JWT se gestiona correctamente — Propuesto.
    - SPIKE-027 — Validará que el API Token de Cloudflare se gestiona en GitHub Secrets — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Secretos hardcodeados — descartados por inseguros.
    - Archivos `.env` versionados — descartados por exponer secretos en el repositorio.
    - AWS Secrets Manager — descartado por costo recurrente.
    - Azure Key Vault — descartado por costo recurrente.
    - HashiCorp Vault autoalojado — descartado por complejidad de configuración.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con secretos que deben gestionarse de forma segura.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-030 (gestión de secretos), SPIKE-025 (integración con CI/CD), SPIKE-011 (clave JWT) y SPIKE-027 (API Token de Cloudflare).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **GitHub Secrets + variables de entorno del servidor** porque:
    - No tiene costo.
    - Se integra nativamente con GitHub Actions (ADR-025).
    - Los secretos se enmascaran en los logs.
    - Permite separar secretos por entorno.
    - Tiene trazabilidad de cambios.
    - Es fácil de implementar y mantener.
    - Es suficiente para el volumen y la escala de AgroTrack.
    - Se puede migrar a un Key Vault gestionado si el proyecto crece.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que GitHub Secrets y las variables de entorno del servidor gestionen los secretos sin exponerlos, y que el pipeline los lea sin problemas.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los secretos.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Secrets (CI/CD), variables de entorno del servidor (backend Spring Boot), GitHub Actions (ADR-025), Spring Boot (ADR-016) y Cloudflare API Token (ADR-027).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Nunca hardcodear secretos. Configurar GitHub Secrets desde el día 1. Separar secretos por entorno (dev, staging, prod). Documentar el procedimiento de rotación. Nunca imprimir secretos en logs. Usar el enmascaramiento automático de GitHub Actions. Migrar a un Key Vault si el proyecto crece mucho.

  - **Anécdotas**:

    - Durante el análisis se concluyó que un archivo `.env` versionado habría expuesto las credenciales de la base de datos.
    - Se identificó que GitHub Actions enmascara automáticamente los secretos en los logs, lo cual previene fugas accidentales.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **GitHub Secrets + variables de entorno del servidor** como estrategia de gestión de secretos, cumpliendo con los escenarios ESC-CAL-SEG-01 y ESC-CAL-ESC-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre seguridad, costo, simplicidad y mantenibilidad.

    La implementación deberá considerar como mínimo:

    - **GitHub Secrets (CI/CD)**:
      - Configurar los secretos en la configuración del repositorio.
      - Usar environments de GitHub para separar dev, staging y prod.
      - Referenciar los secretos en los workflows con `${{ secrets.NOMBRE }}`.
      - Verificar que los secretos se enmascaran en los logs.
    - **Variables de entorno del servidor (backend en producción)**:
      - Inyectar los secretos como variables de entorno al arrancar la aplicación.
      - Usar un archivo `.env` **no versionado** en el servidor (incluido en `.gitignore`).
      - Configurar Spring Boot para leer las variables de entorno.
      - Documentar el procedimiento de despliegue con las variables.
    - **Secretos a gestionar**:
      - `DB_PASSWORD`: contraseña de PostgreSQL.
      - `JWT_SECRET`: clave para firmar tokens JWT.
      - `JWT_REFRESH_SECRET`: clave para refresh tokens.
      - `FIREBASE_SERVER_KEY`: clave del servidor de Firebase Cloud Messaging.
      - `CLOUDFLARE_API_TOKEN`: token de API de Cloudflare.
      - `SMTP_PASSWORD`: contraseña de email (si aplica).
      - `GRAFANA_PASSWORD`: contraseña de Grafana (si aplica).
    - **Rotación**:
      - Documentar el procedimiento de rotación por secreto.
      - Rotar secretos periódicamente (ej. cada 6 meses).
      - Rotar inmediatamente si se sospecha compromiso.
    - **Acceso**:
      - Solo administradores del repositorio pueden gestionar GitHub Secrets.
      - Solo administradores del servidor pueden acceder a las variables de entorno.
    - **Pruebas**:
      - Verificar que los secretos se enmascaran en los logs del pipeline.
      - Verificar que el backend lee las variables de entorno correctamente.
      - Verificar que la rotación de un secreto no afecta el servicio.
      - Verificar que no hay secretos en el código ni en archivos versionados.
    - **Documentación**:
      - Lista de secretos y su propósito.
      - Procedimiento de configuración inicial.
      - Procedimiento de rotación.
      - Procedimiento de recuperación ante fuga.
    - **Evolución futura**:
      - Si el proyecto crece mucho, migrar a un Key Vault gestionado (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).
      - Considerar rotación automática con scripts.

    Se descartan los secretos hardcodeados o en archivos `.env` versionados por inseguros, y los Key Vaults gestionados por costo y complejidad. GitHub Secrets + variables de entorno del servidor es la opción que garantiza seguridad, simplicidad y costo cero para AgroTrack.