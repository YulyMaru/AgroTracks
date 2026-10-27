# ADR-031: Desplegar el backend en Google Cloud con Cloud Run y Cloud SQL

- **Título**: Desplegar el backend de AgroTrack en Google Cloud usando servicios gestionados: Cloud Run para ejecutar el contenedor del backend, Cloud SQL para PostgreSQL, Secret Manager para los secretos y Cloud Monitoring y Cloud Logging para la observabilidad. Las versiones se publican desde GitHub Actions y el tráfico llega a través de Cloudflare. Se descartan el despliegue manual, un servidor Linux propio (máquina virtual con docker-compose) y Kubernetes.

- **Estado**: Propuesto.

- **Historial**: La primera versión de este ADR proponía un servidor Linux propio con Docker y docker-compose, publicado por SSH. Se reemplazó por esta versión porque el equipo decidió no administrar un servidor Linux (sistema operativo, parches, copias de seguridad y monitoreo a cargo del equipo) y usar los servicios gestionados de Google Cloud, que además cobran por uso, como pide la restricción de presupuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar dónde y cómo se ejecuta el backend de AgroTrack en staging y producción, buscando un despliegue reproducible, de bajo costo, operable por un equipo pequeño sin conocimientos de administración de servidores, y coherente con el stack (ADR-016), el estilo arquitectónico (ADR-018), el monitoreo (ADR-021), el pipeline (ADR-025), la protección perimetral (ADR-027) y los secretos (ADR-030).

  - **Detalles**:

    - **Reproducibilidad**: el despliegue debe poder repetirse con un procedimiento definido y documentado (restricción técnica de despliegue).
    - **Costo operativo**: el costo mensual de infraestructura debe ser bajo y, en lo posible, proporcional al uso (restricción de negocio de presupuesto: "servicios que cobren por uso").
    - **Residencia de datos**: debe conocerse y documentarse en qué región quedan los datos productivos y económicos del campesino (restricción legal de soberanía y residencia).
    - **Simplicidad de operación**: el equipo es pequeño y no debe administrar servidores, sistemas operativos ni orquestadores.
    - **Coherencia con el modelo C4**: los contenedores del diagrama (API Backend y PostgreSQL) y el monitoreo deben tener un lugar claro donde ejecutarse.
    - **Seguridad**: la base de datos no debe quedar expuesta a internet y los secretos no deben quedar en archivos.
    - **Recuperación**: debe existir copia de seguridad de la base de datos y una forma de volver a la versión anterior del backend.
    - **Escenarios de calidad relacionados**: ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01, ESC-CAL-SEG-01, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cuatro formas de desplegar un backend monolítico en contenedor para un proyecto en fase de piloto, todas sobre Google Cloud.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Despliegue manual**: el equipo copia el JAR a una máquina y lo arranca a mano.
    2. **Máquina virtual Linux (Compute Engine) con Docker + docker-compose**: una máquina virtual ejecuta en contenedores el backend, PostgreSQL, Redis y el monitoreo; el pipeline publica cada versión por SSH.
    3. **Cloud Run + Cloud SQL (servicios gestionados)**: el contenedor del backend se ejecuta en Cloud Run, que escala a cero cuando no hay tráfico; PostgreSQL lo administra Google en Cloud SQL.
    4. **Kubernetes gestionado (GKE)**: el backend y sus servicios se despliegan en un clúster administrado por Google.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se compararon las cuatro opciones frente a las restricciones de AgroTrack. El punto decisivo es que el equipo no quiere administrar un servidor Linux y que la restricción de presupuesto pide pagar por uso.

  - **1. Despliegue manual**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con reproducibilidad ni con recuperación.

      - **Detalles**:
        - Cada despliegue depende de la persona que lo ejecuta y de los pasos que recuerde.
        - No queda registro de qué versión está publicada.
        - Volver a la versión anterior es lento y propenso a errores.
        - Contradice el pipeline automatizado de ADR-025.

    - **Análisis de costos**:

      - **Resumen**: Bajo costo de infraestructura, alto costo en tiempo del equipo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: alta carga manual en cada versión.
        - **Medición**: no hay trazabilidad de despliegues.

    - **Análisis FODA**:

      - **Fortalezas**: no requiere aprender contenedores.
      - **Debilidades**: no reproducible, sin trazabilidad, sin vuelta atrás.
      - **Oportunidades**: ninguna relevante.
      - **Amenazas**: errores humanos en producción.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

  - **2. Máquina virtual Linux (Compute Engine) con Docker + docker-compose**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con reproducibilidad, coherencia con el C4 y recuperación, pero no cumple con simplicidad de operación y solo parcialmente con costo.

      - **Detalles**:
        - Un solo `docker-compose.yml` describe backend, PostgreSQL, Redis, Prometheus, Grafana y Alertmanager.
        - El equipo debe administrar el sistema operativo Linux: actualizaciones, parches de seguridad, firewall, disco y copias de seguridad.
        - La máquina se paga todo el mes aunque no haya tráfico.
        - Una sola máquina es un punto único de falla.

    - **Análisis de costos**:

      - **Resumen**: Costo fijo mensual (máquina de 2 vCPU y 4 GB de RAM) independiente del uso.

      - **Ejemplos**:
        - **Licencias**: ninguna; todo el software es open source.
        - **Capacitación**: Linux, Docker, docker-compose, SSH.
        - **Operación**: alta; todo el mantenimiento es del equipo.
        - **Medición**: Prometheus y Grafana instalados por el equipo.

    - **Análisis FODA**:

      - **Fortalezas**: control total, sin dependencia de servicios específicos de un proveedor.
      - **Debilidades**: administración de Linux, pago fijo, punto único de falla.
      - **Oportunidades**: migrar después a servicios gestionados.
      - **Amenazas**: un parche olvidado o un backup mal configurado puede causar incidentes o pérdida de datos.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

  - **3. Cloud Run + Cloud SQL (servicios gestionados)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con reproducibilidad, costo, simplicidad, seguridad y recuperación. Obliga a ajustar las decisiones de caché (ADR-009, ADR-013), monitoreo (ADR-021) y secretos (ADR-030), que suponían servicios corriendo en un servidor propio.

      - **Detalles**:
        - No hay servidor que administrar: Google se encarga del sistema operativo, los parches y la disponibilidad.
        - Cloud Run cobra solo mientras atiende solicitudes y escala a cero cuando no hay tráfico.
        - Como la app es offline-first, el arranque en frío del backend no lo percibe el campesino: la sincronización ocurre en segundo plano.
        - Cloud SQL hace copias de seguridad automáticas diarias y permite recuperar a un punto en el tiempo.
        - Cada despliegue crea una revisión nueva en Cloud Run; volver a la anterior es mover el tráfico a esa revisión.
        - HTTPS viene incluido en Cloud Run.
        - Cloud SQL no queda abierto a internet: el backend se conecta mediante el conector oficial de Cloud SQL con permisos de IAM.
        - No se pueden ejecutar Redis, Prometheus, Grafana ni Alertmanager junto al backend; se reemplazan por caché en memoria y por Cloud Monitoring y Cloud Logging.
        - Cloud SQL sí tiene un costo fijo mensual (la instancia está siempre encendida), aunque bajo en su tamaño más pequeño.

    - **Análisis de costos**:

      - **Resumen**: El costo más bajo de las cuatro opciones durante el piloto. Cloud Run, Artifact Registry y Secret Manager quedan dentro o cerca de la capa gratuita con el tráfico del piloto; el costo fijo principal es la instancia más pequeña de Cloud SQL.

      - **Ejemplos**:
        - **Licencias**: costo por uso de Google Cloud; sin licencias de software.
        - **Capacitación**: consola de Google Cloud y la herramienta `gcloud`; no requiere Linux ni Docker avanzado.
        - **Operación**: mínima.
        - **Medición**: Cloud Monitoring (latencia, errores, instancias, CPU y memoria) y Cloud Logging, incluidos en Google Cloud.

    - **Análisis FODA**:

      - **Fortalezas**: sin servidores, pago por uso, backups automáticos, vuelta atrás inmediata, HTTPS incluido.
      - **Debilidades**: dependencia de Google Cloud; arranque en frío de la JVM; la caché deja de ser compartida entre instancias.
      - **Oportunidades**: añadir Memorystore (Redis gestionado) o subir el tamaño de Cloud SQL si el proyecto crece, sin cambiar el código de negocio.
      - **Amenazas**: cambios en precios o en la capa gratuita de Google Cloud; un costo inesperado si no se fijan límites de instancias y alertas de presupuesto.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

  - **4. Kubernetes gestionado (GKE)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de costo ni de simplicidad de operación.

      - **Detalles**:
        - Resuelve problemas de escala y alta disponibilidad que AgroTrack no tiene en el piloto.
        - Exige conocimientos de orquestación que el equipo no posee.
        - El costo mínimo del clúster supera al de las otras opciones.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación y de operación altos, sin retorno para el alcance actual.

      - **Ejemplos**:
        - **Licencias**: costo del clúster gestionado.
        - **Capacitación**: alta.
        - **Operación**: alta.
        - **Medición**: herramientas del clúster.

    - **Análisis FODA**:

      - **Fortalezas**: alta disponibilidad y escalado horizontal.
      - **Debilidades**: complejidad y costo desproporcionados.
      - **Oportunidades**: útil solo si el proyecto crece mucho.
      - **Amenazas**: desviar al equipo del desarrollo del producto.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos que cubren el despliegue, el monitoreo y los secretos.

  - **¿Quién da la opinión?**:

    - SPIKE-025 — Validará que GitHub Actions construye la imagen, la publica en Artifact Registry y la despliega en Cloud Run (staging) — Propuesto.
    - SPIKE-021 — Validará que las métricas y alertas del backend se ven en Cloud Monitoring — Propuesto.
    - SPIKE-030 — Validará que el backend lee sus secretos desde Secret Manager — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Despliegue manual — descartado por no ser reproducible.
    - Máquina virtual Linux con docker-compose — descartada porque obliga al equipo a administrar un servidor Linux y se paga aunque no haya tráfico. Era la propuesta de la primera versión de este ADR.
    - Kubernetes gestionado — descartado por complejidad y costo.

  - **¿Qué estás creando?**:

    - Infraestructura de ejecución del backend de una aplicación B2C para campesinos, offline-first y en fase de piloto.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-025 (despliegue del backend a staging), con apoyo de SPIKE-021 (monitoreo) y SPIKE-030 (secretos).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **Cloud Run + Cloud SQL** porque:
    - El equipo no administra servidores ni sistemas operativos.
    - Cobra por uso, como pide la restricción de presupuesto.
    - Hace el despliegue reproducible y trazable (ADR-025), con vuelta atrás inmediata por revisiones.
    - Las copias de seguridad de la base de datos son automáticas.
    - El backend ya se empaqueta como una sola unidad desplegable (ADR-018) y ya lee el puerto desde la variable `PORT`, que es la que usa Cloud Run.
    - Permite elegir y documentar la región donde residen los datos.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el pipeline publique una versión sin intervención manual, que el arranque en frío sea menor a 15 segundos y que el costo mensual del piloto se mantenga bajo.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las solicitudes de sincronización y consulta en línea.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Actions (ADR-025), Artifact Registry, Cloudflare (ADR-027), Spring Boot (ADR-016), Cloud SQL para PostgreSQL (ADR-013), Flyway (ADR-019), Cloud Monitoring y Cloud Logging (ADR-021) y Secret Manager (ADR-030).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Decidir el despliegue junto con el estilo arquitectónico y no al final. Configurar desde el primer día una alerta de presupuesto en Google Cloud. Probar la restauración de una copia de seguridad antes de salir a producción.

  - **Anécdotas**:

    - Durante el análisis se identificó que ningún ADR anterior decía dónde se ejecuta el backend, aunque varios lo daban por hecho.
    - La primera versión de este ADR elegía un servidor propio; al decidir no administrar Linux se cambió a servicios gestionados y se ajustaron ADR-009, ADR-013, ADR-021, ADR-025, ADR-027 y ADR-030.

- **Recomendación**:

  - **Resumen**:

    Se recomienda desplegar el backend en **Google Cloud con Cloud Run + Cloud SQL para PostgreSQL**, con imágenes en **Artifact Registry**, secretos en **Secret Manager**, observabilidad en **Cloud Monitoring + Cloud Logging**, publicación desde **GitHub Actions** y tráfico de internet a través de **Cloudflare**, cumpliendo con los escenarios ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01, ESC-CAL-SEG-01 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa es la más simple de operar para el equipo y la más alineada con la restricción de presupuesto.

    La implementación deberá considerar como mínimo:

    - **Proyecto y región**:
      - Un proyecto de Google Cloud para AgroTrack con facturación y **alerta de presupuesto** configuradas.
      - Región: **`us-east1` (Carolina del Sur, EE. UU.)**. Google Cloud no tiene región en Colombia. Se elige `us-east1` porque ofrece todos los servicios necesarios (incluido el dominio propio en Cloud Run), está en el nivel de precios más bajo y tiene buena latencia desde Colombia.
      - Los datos productivos y económicos del campesino residen en EE. UU.; esto se documenta frente a la restricción de residencia y a la Ley 1581 de 2012 (transferencia internacional de datos), verificando que EE. UU. figure entre los países con nivel adecuado de protección según la Superintendencia de Industria y Comercio.
    - **Backend en Cloud Run**:
      - Imagen de contenedor con el JAR de Spring Boot 4.1 sobre Java 27 (ADR-016), guardada en Artifact Registry.
      - Perfil de Spring `prod` y puerto leído de la variable `PORT`.
      - Instancias mínimas: 0 (pago por uso). Instancias máximas: 3, para limitar el costo.
      - 1 vCPU y 1 GB de memoria por instancia, a confirmar en el SPIKE-025.
      - Una cuenta de servicio propia para el backend con solo los permisos necesarios (cliente de Cloud SQL y lector de secretos).
      - Verificación de salud con `/actuator/health`.
    - **Base de datos en Cloud SQL**:
      - PostgreSQL 16 (ADR-013) en la instancia más pequeña (núcleo compartido) durante el piloto.
      - Sin IP pública abierta: el backend se conecta con el conector de Cloud SQL para Java (dependencia `postgres-socket-factory`) y permisos de IAM.
      - Copias de seguridad automáticas diarias y recuperación a un punto en el tiempo habilitadas.
      - Flyway aplica las migraciones al arrancar el backend (ADR-019).
    - **Caché**:
      - Durante el piloto, caché en memoria de cada instancia con Spring Cache y vencimiento de 5 minutos (ADR-009).
      - Memorystore (Redis gestionado) queda como evolución si se necesitan varias instancias con caché compartida.
    - **Entornos**:
      - Staging y producción como dos servicios de Cloud Run (`agrotrack-staging` y `agrotrack-prod`), cada uno con su propia base de datos y sus propios secretos.
      - Durante el piloto pueden compartir la instancia de Cloud SQL (dos bases de datos separadas); al pasar a producción real deben separarse.
    - **Publicación de una versión (ADR-025)**:
      - GitHub Actions se autentica en Google Cloud con Workload Identity Federation (sin llaves JSON guardadas).
      - Construye la imagen, la etiqueta con el commit y la sube a Artifact Registry.
      - Despliega una revisión nueva en Cloud Run.
      - Si `/actuator/health` falla, el tráfico vuelve a la revisión anterior.
    - **Exposición y seguridad (ADR-022, ADR-027)**:
      - Dominio propio asociado al servicio de Cloud Run, con DNS y proxy en Cloudflare y TLS en modo Full (strict).
      - La dirección `*.run.app` de Cloud Run sigue siendo pública; para que solo Cloudflare llegue al backend, Cloudflare añade un encabezado secreto a cada solicitud y el backend rechaza las que no lo traen.
    - **Observabilidad (ADR-021)**:
      - Los logs del backend van a Cloud Logging automáticamente (en formato JSON, con el `idTraza`).
      - Cloud Monitoring muestra latencia, errores, instancias, CPU y memoria de Cloud Run y de Cloud SQL, y envía las alertas.
    - **Datos fuera de Google Cloud**:
      - Firebase y Cloudflare son servicios auxiliares: no almacenan los datos productivos ni económicos del campesino.
      - Los eventos enviados a Firebase Analytics no deben incluir valores económicos ni datos personales.
    - **Documentación**:
      - Procedimiento para crear el proyecto y los servicios desde cero.
      - Procedimiento de despliegue, vuelta atrás y restauración de la base de datos.
      - Diagrama de despliegue junto al modelo C4.

    Se descarta el despliegue manual por no ser reproducible, la máquina virtual Linux con docker-compose porque obliga a administrar un servidor y a pagarlo aunque no haya tráfico, y Kubernetes por complejidad y costo. Cloud Run + Cloud SQL es la opción que permite a un equipo pequeño publicar AgroTrack sin administrar servidores y con un costo proporcional al uso.
