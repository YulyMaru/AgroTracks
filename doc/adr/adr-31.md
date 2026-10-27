# ADR-031: Desplegar el backend en un servidor propio con Docker y docker-compose

- **Título**: Desplegar el backend de AgroTrack y sus servicios de apoyo (PostgreSQL, Redis, Prometheus, Grafana y Alertmanager) en un servidor propio con Docker y docker-compose, publicado por SSH desde GitHub Actions y expuesto únicamente a través de Cloudflare, descartando el despliegue manual, los contenedores serverless y Kubernetes.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar dónde y cómo se ejecuta el backend de AgroTrack en staging y producción, buscando un despliegue reproducible, de bajo costo, operable por un equipo pequeño y coherente con las decisiones ya tomadas sobre el stack (ADR-016), el estilo arquitectónico (ADR-018), el monitoreo (ADR-021), el pipeline (ADR-025), la protección perimetral (ADR-027) y los secretos (ADR-030).

  - **Detalles**:

    - **Reproducibilidad**: el despliegue debe poder repetirse con un procedimiento definido y documentado (restricción técnica de despliegue).
    - **Costo operativo**: el costo mensual de infraestructura debe ser bajo y predecible (restricción de negocio de presupuesto).
    - **Residencia de datos**: debe conocerse y documentarse en qué región quedan los datos productivos y económicos del campesino (restricción legal de soberanía y residencia).
    - **Simplicidad de operación**: el equipo es pequeño; la solución no debe exigir conocimientos de orquestación avanzada.
    - **Coherencia con el modelo C4**: los contenedores del diagrama (API Backend, PostgreSQL, Redis) y el sistema de monitoreo deben tener un lugar claro donde ejecutarse.
    - **Seguridad**: la base de datos, la caché y el monitoreo no deben quedar expuestos a internet.
    - **Recuperación**: debe existir copia de seguridad de la base de datos y una forma de volver a la versión anterior del backend.
    - **Escenarios de calidad relacionados**: ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01, ESC-CAL-SEG-01, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron cuatro formas de desplegar un backend monolítico en contenedor para un proyecto en fase de piloto.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Despliegue manual en un servidor**: el equipo copia el JAR al servidor y lo arranca a mano, con PostgreSQL instalado directamente en el sistema operativo.
    2. **Servidor propio con Docker + docker-compose, desplegado por SSH desde GitHub Actions**: un servidor Linux ejecuta en contenedores el backend, PostgreSQL, Redis y el monitoreo; el pipeline publica cada versión por SSH.
    3. **Contenedor serverless con base de datos gestionada**: el mismo backend se ejecuta en un servicio que escala a cero cuando no hay tráfico, con PostgreSQL gestionado por un proveedor.
    4. **Kubernetes gestionado**: el backend y sus servicios se despliegan en un clúster administrado por un proveedor de nube.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se compararon las cuatro opciones frente a las restricciones de AgroTrack y a los componentes que ya exigen los demás ADR. El punto decisivo es que ADR-013, ADR-021 y ADR-030 ya suponen servicios que corren junto al backend (Redis, Prometheus, Grafana, Alertmanager y un archivo `.env` en el servidor).

  - **1. Despliegue manual en un servidor**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con reproducibilidad ni con recuperación.

      - **Detalles**:
        - Cada despliegue depende de la persona que lo ejecuta y de los pasos que recuerde.
        - No queda registro de qué versión está publicada.
        - Volver a la versión anterior es lento y propenso a errores.
        - Contradice el pipeline automatizado de ADR-025.

    - **Análisis de costos**:

      - **Resumen**: Costo de infraestructura igual al del candidato 2, con mayor costo en tiempo del equipo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: mínima.
        - **Operación**: alta carga manual en cada versión.
        - **Medición**: no hay trazabilidad de despliegues.

    - **Análisis FODA**:

      - **Fortalezas**: no requiere aprender Docker.
      - **Debilidades**: no reproducible, sin trazabilidad, sin vuelta atrás.
      - **Oportunidades**: ninguna relevante.
      - **Amenazas**: errores humanos en producción.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

  - **2. Servidor propio con Docker + docker-compose, desplegado por SSH desde GitHub Actions**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con reproducibilidad, simplicidad, coherencia con el C4, seguridad y recuperación. Cumple solo parcialmente con el criterio de costo, porque el servidor se paga aunque no haya tráfico.

      - **Detalles**:
        - Un solo archivo `docker-compose.yml` describe todos los servicios: backend, PostgreSQL, Redis, Prometheus, Grafana y Alertmanager.
        - El mismo archivo sirve para staging y para producción, cambiando solo el archivo `.env` (ADR-030).
        - GitHub Actions (ADR-025) publica cada versión por SSH y deja registro de qué commit está desplegado.
        - PostgreSQL, Redis y el monitoreo quedan en la red interna de Docker, sin puertos abiertos a internet.
        - El equipo elige el proveedor y la región del servidor, lo que permite documentar dónde residen los datos.
        - Es el modelo que ya describen el diagrama de contenedores y ADR-021 ("contenedores en el mismo servidor del backend").

    - **Análisis de costos**:

      - **Resumen**: Costo fijo mensual bajo y predecible, pero independiente del uso.

      - **Ejemplos**:
        - **Licencias**: ninguna; Docker, PostgreSQL, Redis, Prometheus, Grafana y Alertmanager son open source.
        - **Capacitación**: el equipo debe aprender Docker y docker-compose.
        - **Operación**: actualizaciones del sistema operativo, copias de seguridad y vigilancia del servidor a cargo del equipo.
        - **Medición**: uso de CPU, memoria y disco del servidor en Grafana (ADR-021).

    - **Análisis FODA**:

      - **Fortalezas**:
        - Despliegue reproducible y versionado.
        - Todo el sistema en un solo lugar, fácil de entender.
        - Sin dependencia de un proveedor específico: el mismo `docker-compose.yml` corre en cualquier servidor Linux.
        - Control sobre la región donde residen los datos.
      - **Debilidades**:
        - El servidor se paga todo el mes aunque no haya tráfico, lo que no coincide con el plan de acción de la restricción de presupuesto ("servicios que cobren por uso").
        - Un solo servidor es un punto único de falla.
        - El equipo asume la operación: parches, copias de seguridad y monitoreo.
        - Seis servicios en una sola máquina exigen memoria suficiente.
      - **Oportunidades**:
        - Pasar la base de datos a un servicio gestionado si el proyecto crece.
        - Migrar a un contenedor serverless sin cambiar el código, porque el backend ya está empaquetado en Docker.
      - **Amenazas**:
        - Si el servidor falla, la sincronización queda detenida hasta recuperarlo (la app sigue funcionando sin conexión).
        - Una copia de seguridad mal configurada puede causar pérdida de datos.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

  - **3. Contenedor serverless con base de datos gestionada**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con costo, reproducibilidad y simplicidad de operación, pero no es coherente con los servicios de apoyo ya decididos.

      - **Detalles**:
        - Se paga solo mientras el backend atiende solicitudes, que es lo que pide el plan de acción de la restricción de presupuesto.
        - No hay servidor que mantener.
        - Como la app es offline-first, el arranque en frío del backend no lo percibe el usuario: la sincronización ocurre en segundo plano.
        - No permite ejecutar Redis, Prometheus, Grafana ni Alertmanager junto al backend; habría que reemplazarlos por caché en memoria y por las métricas del proveedor, cambiando ADR-009, ADR-013, ADR-021 y ADR-030.
        - La región disponible depende del proveedor y debe verificarse frente a la restricción de residencia.

    - **Análisis de costos**:

      - **Resumen**: Costo variable según uso, potencialmente el más bajo durante el piloto.

      - **Ejemplos**:
        - **Licencias**: costo por uso del proveedor.
        - **Capacitación**: el equipo debe aprender la plataforma elegida.
        - **Operación**: mínima.
        - **Medición**: métricas del proveedor.

    - **Análisis FODA**:

      - **Fortalezas**: pago por uso, sin servidores, escalado automático.
      - **Debilidades**: dependencia de proveedor, arranque en frío del JVM, obliga a rehacer las decisiones de caché y monitoreo.
      - **Oportunidades**: es la evolución natural si el costo fijo del servidor se vuelve un problema.
      - **Amenazas**: cambios en los planes del proveedor.

    - **Opiniones y comentarios internos**:

      - (Por completar por el equipo al revisar esta propuesta.)

  - **4. Kubernetes gestionado**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de costo ni de simplicidad de operación.

      - **Detalles**:
        - Resuelve problemas de escala y alta disponibilidad que AgroTrack no tiene en el piloto.
        - Exige conocimientos de orquestación que el equipo no posee.
        - El costo mínimo de un clúster gestionado supera al de un servidor único.

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

  - **Resumen**: La validación proviene del spike técnico que ya cubre el despliegue del backend.

  - **¿Quién da la opinión?**:

    - SPIKE-025 — Validará que GitHub Actions despliega el backend a staging con Docker + docker-compose por SSH (Prueba 8) — Propuesto.
    - SPIKE-021 — Validará que Prometheus, Grafana y Alertmanager funcionan como contenedores junto al backend — Propuesto.
    - SPIKE-030 — Validará que el backend lee sus secretos desde las variables de entorno del servidor — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Despliegue manual — descartado por no ser reproducible.
    - Contenedor serverless con base de datos gestionada — descartado por ahora porque obliga a rehacer las decisiones de caché y monitoreo; queda como evolución prevista.
    - Kubernetes gestionado — descartado por complejidad y costo.

  - **¿Qué estás creando?**:

    - Infraestructura de ejecución del backend de una aplicación B2C para campesinos, offline-first y en fase de piloto.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial (ADR-018).

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-025 (despliegue del backend a staging), con apoyo de SPIKE-021 (monitoreo en contenedores) y SPIKE-030 (secretos en el servidor).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **servidor propio con Docker + docker-compose** porque:
    - Es coherente con el modelo C4 y con los servicios que ya exigen ADR-013, ADR-021 y ADR-030.
    - Hace el despliegue reproducible y trazable (ADR-025).
    - Es simple de entender y de operar para un equipo pequeño.
    - Permite elegir y documentar la región donde residen los datos.
    - No ata el proyecto a un proveedor.
    - Deja abierta la migración a un contenedor serverless sin cambiar el código.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el backend y sus servicios arranquen con un solo comando, que el pipeline publique una versión sin intervención manual y que el servidor tenga memoria suficiente para los seis servicios.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las solicitudes de sincronización y consulta en línea.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Actions (ADR-025), Cloudflare (ADR-027), Spring Boot (ADR-016), PostgreSQL y Redis (ADR-013), Flyway (ADR-019), Prometheus, Grafana y Alertmanager (ADR-021) y la gestión de secretos (ADR-030).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Decidir el despliegue junto con el estilo arquitectónico y no al final. Contar cuántos servicios deben correr antes de elegir el tamaño del servidor. Probar la restauración de una copia de seguridad antes de salir a producción.

  - **Anécdotas**:

    - Durante el análisis se identificó que ningún ADR anterior decía dónde se ejecuta el backend, aunque varios lo daban por hecho.
    - Se identificó que la restricción de presupuesto sugiere servicios de pago por uso, mientras que las decisiones de caché y monitoreo suponen un servidor siempre encendido; este ADR deja esa tensión documentada.

- **Recomendación**:

  - **Resumen**:

    Se recomienda desplegar el backend en un **servidor propio con Docker + docker-compose, publicado por SSH desde GitHub Actions y expuesto solo a través de Cloudflare**, cumpliendo con los escenarios ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-ESC-01, ESC-CAL-SEG-01 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa es la más coherente con el resto de las decisiones y la más simple de operar para el equipo.

    La implementación deberá considerar como mínimo:

    - **Servidor**:
      - Un servidor Linux con Docker Engine y docker-compose.
      - Tamaño inicial estimado: 2 vCPU y 4 GB de RAM, a confirmar midiendo el consumo real en el SPIKE-025.
      - Proveedor y región: **por definir antes de aceptar este ADR**. Se debe elegir la región disponible más cercana a Colombia y documentarla frente a la restricción de residencia de datos.
    - **Servicios en `docker-compose.yml`**:
      - `backend`: API Backend (Spring Boot 3 + Java 17, ADR-016).
      - `postgres`: base de datos PostgreSQL 15+ con volumen persistente (ADR-013).
      - `redis`: caché de resúmenes económicos (ADR-009, ADR-013).
      - `prometheus`, `grafana` y `alertmanager`: monitoreo (ADR-021).
    - **Red y exposición**:
      - Solo el backend recibe tráfico de internet, y únicamente el que llega desde Cloudflare (ADR-027).
      - PostgreSQL, Redis y el monitoreo quedan en la red interna de Docker, sin puertos publicados.
      - El acceso a Grafana se hace por túnel SSH o restringido por dirección IP.
    - **Entornos**:
      - Staging y producción como dos proyectos de docker-compose separados, cada uno con su archivo `.env` (ADR-030).
      - Durante el piloto pueden compartir servidor; al pasar a producción real deben separarse.
    - **Publicación de una versión (ADR-025)**:
      - GitHub Actions compila el JAR y lo publica en GitHub Releases.
      - Se conecta al servidor por SSH, copia el JAR y reconstruye solo el contenedor `backend`.
      - Flyway aplica las migraciones al arrancar (ADR-019).
      - El pipeline verifica `/actuator/health` y, si falla, vuelve a la versión anterior.
    - **Copias de seguridad**:
      - Copia diaria de PostgreSQL con `pg_dump`, guardada fuera del servidor.
      - Prueba de restauración antes de salir a producción.
    - **Datos fuera del servidor**:
      - Firebase y Cloudflare son servicios auxiliares: no almacenan los datos productivos ni económicos del campesino.
      - Los eventos enviados a Firebase Analytics no deben incluir valores económicos ni datos personales.
    - **Documentación**:
      - Procedimiento de instalación del servidor desde cero.
      - Procedimiento de despliegue, vuelta atrás y restauración.
      - Diagrama de despliegue junto al modelo C4.

    Se descarta el despliegue manual por no ser reproducible y Kubernetes por complejidad y costo. El contenedor serverless con base de datos gestionada se descarta por ahora porque obligaría a rehacer las decisiones de caché y monitoreo, y queda documentado como la evolución prevista si el costo fijo del servidor resulta un problema. El servidor propio con Docker + docker-compose es la opción que mantiene coherentes el modelo C4 y el resto de los ADR de AgroTrack.
