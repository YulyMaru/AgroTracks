# ADR-030: Gestionar secretos de forma segura en backend y CI/CD

- **Título**: Usar GitHub Secrets para los secretos del pipeline de CI/CD y Secret Manager de Google Cloud para los secretos del backend, descartando secretos hardcodeados, archivos `.env` versionados y gestores de secretos de otros proveedores o autoalojados.

- **Historial**: La primera versión de este ADR guardaba los secretos del backend en un archivo `.env` del servidor propio. Al desplegar el backend en Cloud Run (ADR-031) ya no hay servidor, por lo que los secretos del backend pasan a Secret Manager.

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
    2. **GitHub Secrets + Secret Manager de Google Cloud**: los secretos del pipeline se gestionan en GitHub Secrets; los secretos del backend se guardan en Secret Manager y Cloud Run los entrega al backend como variables de entorno.
    3. **Gestor de secretos de otro proveedor o autoalojado (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)**: servicio dedicado para almacenar, rotar y auditar secretos, fuera de Google Cloud.

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


  - **2. GitHub Secrets + Secret Manager de Google Cloud**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción más equilibrada para el presupuesto y para el despliegue en Google Cloud (ADR-031).

      - **Detalles**:
        - **GitHub Secrets** para el pipeline de CI/CD: almacena secretos cifrados, accesibles solo por workflows autorizados, y los enmascara en los logs.
        - **Secret Manager** para el backend: cada secreto (por ejemplo `AGROTRACK_DB_CLAVE`, `AGROTRACK_JWT_SECRETO`) se guarda cifrado y Cloud Run lo entrega al backend como variable de entorno al arrancar. El código del backend no cambia: sigue leyendo variables de entorno.
        - Los secretos nunca están en el código ni en archivos versionados, y no hay archivos `.env` en ningún servidor.
        - Separación por entorno: secretos distintos para staging y producción (por ejemplo `agrotrack-staging-db-clave` y `agrotrack-prod-db-clave`).
        - Rotación: se crea una versión nueva del secreto y se despliega una revisión nueva de Cloud Run; la versión anterior queda disponible para volver atrás.
        - Trazabilidad: Cloud Audit Logs registra quién creó, leyó o cambió cada secreto y cuándo.
        - Acceso restringido con IAM: solo la cuenta de servicio del backend puede leer los secretos.
        - GitHub Actions se autentica en Google Cloud con Workload Identity Federation, por lo que no hace falta guardar una llave JSON de Google en GitHub.

    - **Análisis de costos**:

      - **Resumen**: Costo prácticamente nulo.

      - **Ejemplos**:
        - **Licencias**: GitHub Secrets es gratuito; Secret Manager cobra por versión activa de cada secreto y por accesos, centavos de dólar al mes para el número de secretos de AgroTrack.
        - **Capacitación**: mínima; configurar secretos en GitHub y en la consola de Google Cloud.
        - **Operación**: rotación manual documentada.
        - **Medición**: GitHub y Cloud Audit Logs registran los cambios.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Costo casi nulo.
        - Sin servidores ni archivos `.env` que proteger.
        - Integración nativa con Cloud Run y con GitHub Actions (ADR-025).
        - Auditoría de accesos y control con IAM.
        - Versionado de secretos.
      - **Debilidades**:
        - Rotación manual.
        - Dos lugares donde hay secretos (GitHub para el pipeline, Google Cloud para el backend).
      - **Oportunidades**:
        - Automatizar la rotación si el proyecto crece.
      - **Amenazas**:
        - Si una cuenta con permisos de administrador en GitHub o en Google Cloud se compromete, los secretos quedan expuestos; se mitiga con verificación en dos pasos y permisos mínimos.

    - **Opiniones y comentarios internos**:

      - "GitHub Secrets es el estándar para CI/CD en GitHub."
      - "Si el backend corre en Google Cloud, sus secretos deben estar en Google Cloud."

  - **3. Gestor de secretos de otro proveedor o autoalojado (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con los criterios de costo y simplicidad, y no tiene sentido si el backend se ejecuta en Google Cloud.

      - **Detalles**:
        - **AWS Secrets Manager**: ~$0.40 por secreto por mes + $0.05 por 10,000 llamadas.
        - **Azure Key Vault**: ~$0.03 por 10,000 operaciones.
        - **HashiCorp Vault**: gratuito si se autoaloja, pero requiere servidor y configuración.
        - Ofrecen rotación automática, auditoría avanzada y control granular.
        - Requieren integrar el backend con el servicio (SDK, configuración).
        - Requieren configurar el pipeline para leer secretos del vault.
        - Añaden complejidad operativa.
        - Obligan a conectar Google Cloud con otro proveedor, o a administrar un servidor de Vault.

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
      - "Usar el gestor de secretos de otro proveedor añade una dependencia sin beneficio."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-030 — Validará que el backend en Cloud Run lee sus secretos desde Secret Manager y que el pipeline usa GitHub Secrets sin exponerlos — Propuesto.
    - SPIKE-025 — Validará que el pipeline lee los secretos de GitHub Secrets sin exponerlos en logs — Propuesto.
    - SPIKE-011 — Validará la autenticación con JWT cuya clave de firma se gestiona como secreto; la gestión de la clave se valida en SPIKE-030 — Propuesto.
    - SPIKE-027 — Validará que el API Token de Cloudflare se gestiona en GitHub Secrets — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Secretos hardcodeados — descartados por inseguros.
    - Archivos `.env` versionados — descartados por exponer secretos en el repositorio.
    - Variables de entorno en un archivo `.env` de un servidor propio — descartado al no haber servidor (ADR-031); era la propuesta de la primera versión de este ADR.
    - AWS Secrets Manager y Azure Key Vault — descartados por ser de otro proveedor de nube y por costo recurrente.
    - HashiCorp Vault autoalojado — descartado por complejidad de configuración.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con secretos que deben gestionarse de forma segura.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-030 (gestión de secretos), SPIKE-025 (integración con CI/CD), SPIKE-011 (autenticación JWT) y SPIKE-027 (API Token de Cloudflare).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **GitHub Secrets + Secret Manager de Google Cloud** porque:
    - Su costo es prácticamente nulo.
    - Es el servicio nativo de Google Cloud, donde se ejecuta el backend (ADR-031).
    - Se integra nativamente con GitHub Actions (ADR-025).
    - Los secretos se enmascaran en los logs.
    - Permite separar secretos por entorno.
    - Tiene trazabilidad de cambios.
    - Es fácil de implementar y mantener.
    - Es suficiente para el volumen y la escala de AgroTrack.
    - No requiere servidores ni archivos `.env`.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que GitHub Secrets y Secret Manager gestionen los secretos sin exponerlos, y que el pipeline los lea sin problemas.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los secretos.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Secrets (CI/CD), Secret Manager y Cloud Run (backend Spring Boot), GitHub Actions (ADR-025), Spring Boot (ADR-016) y Cloudflare API Token (ADR-027).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Nunca hardcodear secretos. Configurar GitHub Secrets desde el día 1. Separar secretos por entorno (dev, staging, prod). Documentar el procedimiento de rotación. Nunca imprimir secretos en logs. Usar el enmascaramiento automático de GitHub Actions. Migrar a un Key Vault si el proyecto crece mucho.

  - **Anécdotas**:

    - Durante el análisis se concluyó que un archivo `.env` versionado habría expuesto las credenciales de la base de datos.
    - Se identificó que GitHub Actions enmascara automáticamente los secretos en los logs, lo cual previene fugas accidentales.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **GitHub Secrets (pipeline) + Secret Manager de Google Cloud (backend)** como estrategia de gestión de secretos, cumpliendo con los escenarios ESC-CAL-SEG-01 y ESC-CAL-ESC-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre seguridad, costo, simplicidad y mantenibilidad para un backend desplegado en Google Cloud (ADR-031).

    La implementación deberá considerar como mínimo:

    - **GitHub Secrets (CI/CD)**:
      - Configurar los secretos en la configuración del repositorio.
      - Usar environments de GitHub para separar staging y prod (con aprobación manual para prod).
      - Referenciar los secretos en los workflows con `${{ secrets.NOMBRE }}`.
      - Verificar que los secretos se enmascaran en los logs.
    - **Secret Manager (backend en Cloud Run)**:
      - Crear un secreto por valor y por entorno (staging y prod).
      - Entregar los secretos al backend como variables de entorno al desplegar en Cloud Run (`--set-secrets`).
      - Dar permiso de lectura (`Secret Manager Secret Accessor`) solo a la cuenta de servicio del backend.
      - En desarrollo local los secretos siguen siendo variables de entorno de cada persona; nunca se versiona un archivo `.env` (incluirlo en `.gitignore`).
    - **Secretos a gestionar** (los nombres coinciden con los que ya lee el backend):
      - En Secret Manager:
        - `AGROTRACK_DB_CLAVE`: contraseña del usuario de PostgreSQL en Cloud SQL.
        - `AGROTRACK_JWT_SECRETO`: clave para firmar los access tokens JWT (mínimo 32 caracteres). Los refresh tokens son valores aleatorios guardados como hash en la base de datos, por lo que no necesitan una clave propia.
        - `AGROTRACK_ORIGEN_SECRETO`: valor del encabezado que Cloudflare añade a cada solicitud para que el backend acepte solo tráfico que pasó por Cloudflare (ADR-027).
        - `FIREBASE_SERVICE_ACCOUNT`: credencial (JSON) de la cuenta de servicio que usa Firebase Admin SDK para enviar notificaciones push (ADR-028).
      - En GitHub Secrets:
        - `GCP_WORKLOAD_IDENTITY_PROVIDER` y `GCP_CUENTA_DESPLIEGUE`: identifican cómo se autentica el pipeline en Google Cloud (no son llaves, pero se guardan como secretos para no publicarlos).
        - `FIREBASE_APP_DISTRIBUTION`: credencial para subir el APK a Firebase App Distribution (ADR-025).
        - `CLOUDFLARE_API_TOKEN`: token de API de Cloudflare (ADR-027).
      - Ya no se necesitan `DEPLOY_SSH_KEY`, `REDIS_PASSWORD` ni `GRAFANA_PASSWORD`: no hay servidor por SSH, ni Redis, ni Grafana (ADR-031, ADR-021).
    - **Rotación**:
      - Documentar el procedimiento de rotación por secreto.
      - Rotar secretos periódicamente (ej. cada 6 meses).
      - Rotar inmediatamente si se sospecha compromiso.
    - **Acceso**:
      - Solo administradores del repositorio pueden gestionar GitHub Secrets.
      - Solo administradores del proyecto de Google Cloud pueden crear o cambiar secretos; solo la cuenta de servicio del backend puede leerlos.
      - Verificación en dos pasos obligatoria en GitHub y en Google Cloud.
    - **Pruebas**:
      - Verificar que los secretos se enmascaran en los logs del pipeline.
      - Verificar que el backend lee los secretos correctamente desde Secret Manager.
      - Verificar que la rotación de un secreto no afecta el servicio.
      - Verificar que no hay secretos en el código ni en archivos versionados.
    - **Documentación**:
      - Lista de secretos y su propósito.
      - Procedimiento de configuración inicial.
      - Procedimiento de rotación.
      - Procedimiento de recuperación ante fuga.

    Se descartan los secretos hardcodeados o en archivos `.env` versionados por inseguros, y los gestores de secretos de otros proveedores o autoalojados por costo y complejidad. GitHub Secrets + Secret Manager es la opción que garantiza seguridad, simplicidad y un costo casi nulo para AgroTrack.
