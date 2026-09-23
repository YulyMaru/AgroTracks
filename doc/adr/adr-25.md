# ADR-025: Automatizar integración continua y despliegue con GitHub Actions

- **Título**: Implementar un pipeline de CI/CD con GitHub Actions para backend (Spring Boot) y frontend (React Native), usando Firebase App Distribution para distribución de pruebas y despliegue automatizado del backend, descartando builds y despliegues manuales.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de integración continua y despliegue que mejor equilibre automatización, confiabilidad, costo, velocidad de feedback y facilidad de uso, considerando el equipo pequeño de AgroTrack, la necesidad de validar cada cambio antes de fusionar, y la distribución de builds de prueba a testers y usuarios piloto.

  - **Detalles**:

    - **Automatización**: cada PR a la rama principal debe disparar la compilación y las pruebas automáticamente.
    - **Feedback rápido**: el pipeline debe ejecutarse en menos de 15 minutos para no ralentizar el desarrollo.
    - **Calidad**: el pipeline debe bloquear el merge si las pruebas fallan o si la cobertura baja del umbral (ADR-020).
    - **Artefactos**: cada build debe generar artefactos (JAR del backend, APK del frontend) versionados y descargables.
    - **Distribución**: los APK de prueba deben distribuirse a testers mediante Firebase App Distribution.
    - **Despliegue del backend**: el backend debe desplegarse automáticamente a un entorno de staging tras merge a `main`.
    - **Seguridad**: las credenciales y secretos deben gestionarse con GitHub Secrets, nunca en el código.
    - **Trazabilidad**: cada build debe estar asociado a un commit, una rama y un autor.
    - **Costo de implementación y operación**: la solución debe ser viable con el presupuesto de AgroTrack (preferiblemente gratuito o de bajo costo).
    - **Mantenibilidad**: el pipeline debe ser fácil de modificar y extender.
    - **Escenarios de calidad relacionados**: ESC-CAL-POR-01, ESC-CAL-SEG-01, ESC-CAL-ESC-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de CI/CD para proyectos con backend Spring Boot y frontend React Native.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Builds y despliegues manuales**: el equipo compila y despliega manualmente cada release desde su máquina local.
    2. **CI/CD con GitHub Actions + Firebase App Distribution**: GitHub Actions ejecuta pruebas y compila; los APK se distribuyen con Firebase App Distribution; el backend se despliega a staging automáticamente.
    3. **CI/CD con Jenkins o GitLab CI autogestionado**: se levanta un servidor Jenkins o GitLab CI propio para orquestar el pipeline.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de CI/CD en proyectos móviles con backend, considerando el tamaño del equipo, el presupuesto, la integración con GitHub (donde se aloja el código), y las herramientas de distribución de builds para Android. Se revisaron experiencias de equipos que adoptaron Jenkins y su costo de mantenimiento.

  - **1. Builds y despliegues manuales**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de automatización, trazabilidad ni velocidad de feedback.

      - **Detalles**:
        - Cada release requiere que un desarrollador compile y despliegue manualmente.
        - Propenso a errores humanos (olvidar pasos, usar versiones diferentes de JDK o Node).
        - No hay validación automática de PRs.
        - Los bugs se detectan tarde, cuando ya están en producción.
        - No hay trazabilidad entre build y commit.
        - Difícil de reproducir.
        - No escala con el crecimiento del equipo.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero costo operativo alto por tiempo perdido y errores.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: cada release consume horas de trabajo manual.
        - **Medición**: no hay métricas de builds.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin inversión inicial.
      - **Debilidades**:
        - Propenso a errores.
        - Sin trazabilidad.
        - Lentitud de feedback.
      - **Oportunidades**:
        - Ninguna en el contexto de AgroTrack.
      - **Amenazas**:
        - Bugs en producción.
        - Inconsistencias entre entornos.

    - **Opiniones y comentarios internos**:

      - "Compilar a mano cada release es un desperdicio de tiempo."
      - "No podemos darnos el lujo de desplegar con errores humanos."

  - **2. CI/CD con GitHub Actions + Firebase App Distribution**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios.

      - **Detalles**:
        - GitHub Actions está integrado con el repositorio donde vive el código.
        - Se puede configurar un pipeline que se dispare en cada PR a `main`.
        - El pipeline ejecuta pruebas unitarias, de integración y linting.
        - Compila el JAR del backend y el APK del frontend.
        - Publica cobertura con JaCoCo y Jest Coverage.
        - Bloquea el merge si las pruebas fallan o la cobertura baja.
        - Los APK se distribuyen a testers con Firebase App Distribution.
        - El backend se despliega automáticamente a staging tras merge a `main`.
        - Los secretos se gestionan con GitHub Secrets.
        - El plan gratuito de GitHub Actions cubre 2,000 minutos al mes para repositorios privados, suficiente para el proyecto.
        - Firebase App Distribution es gratuito e ilimitado.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo, sin licencias.

      - **Ejemplos**:
        - **Licencias**: GitHub Actions y Firebase App Distribution son gratuitos en el plan básico.
        - **Capacitación**: el equipo debe aprender a configurar workflows YAML.
        - **Operación**: monitoreo de builds en GitHub.
        - **Medición**: tiempo de pipeline, tasa de éxito, cobertura.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Integración nativa con GitHub.
        - Sin costo de licencias.
        - Feedback rápido.
        - Trazabilidad completa.
        - Distribución de APK a testers sin fricción.
        - Despliegue automatizado del backend.
      - **Debilidades**:
        - El pipeline YAML requiere aprendizaje.
        - Dependencia de GitHub (aunque es el repositorio actual).
      - **Oportunidades**:
        - Añadir despliegue a producción cuando el proyecto crezca.
        - Integrar análisis de seguridad (SAST) en el pipeline.
        - Notificaciones a Slack o email.
      - **Amenazas**:
        - Si el pipeline se vuelve muy complejo, puede ralentizar el desarrollo.
        - Fuga de secretos si no se gestionan correctamente.

    - **Opiniones y comentarios internos**:

      - "GitHub Actions es la opción natural porque ya usamos GitHub."
      - "Firebase App Distribution elimina la fricción de distribuir APK a testers."
      - "Bloquear el merge si las pruebas fallan es clave para la calidad."

  - **3. CI/CD con Jenkins o GitLab CI autogestionado**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con los criterios de costo y mantenibilidad.

      - **Detalles**:
        - Jenkins requiere un servidor propio, configuración y mantenimiento.
        - GitLab CI requiere migrar el repositorio de GitHub a GitLab.
        - Mayor complejidad operativa: actualizar plugins, gestionar agentes, monitorear.
        - Mayor costo: servidor 24/7.
        - Mayor tiempo de configuración.
        - No aporta beneficios sobre GitHub Actions para un equipo pequeño.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación alto, costo operativo medio-alto.

      - **Ejemplos**:
        - **Licencias**: Jenkins es open source, pero el servidor tiene costo.
        - **Capacitación**: el equipo debe aprender Jenkins o GitLab CI.
        - **Operación**: mantenimiento de plugins y agentes.
        - **Medición**: métricas personalizadas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Control total sobre el servidor.
        - Personalizable.
      - **Debilidades**:
        - Mayor costo.
        - Mayor complejidad.
        - Mayor mantenimiento.
        - No aporta beneficios sobre GitHub Actions.
      - **Oportunidades**:
        - Útil si se requieren pipelines muy específicos.
      - **Amenazas**:
        - Retraso en el desarrollo.
        - Costos imprevistos.

    - **Opiniones y comentarios internos**:

      - "Jenkins es sobre-ingeniería para un equipo pequeño."
      - "No queremos mantener un servidor de CI."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-025 — Validará que GitHub Actions ejecuta pruebas, compila backend y frontend, distribuye APK con Firebase App Distribution y despliega el backend a staging — Propuesto.
    - SPIKE-020 — Validará que las pruebas en capas se integran en el pipeline — Propuesto.
    - SPIKE-012 — Validará que los APK se distribuyen a los dispositivos de prueba — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Jenkins — descartado por costo y mantenimiento.
    - GitLab CI — descartado por requerir migrar el repositorio de GitHub a GitLab.
    - Bitrise — considerado para mobile, pero se prefirió GitHub Actions por integración con el repositorio.
    - CircleCI — considerado, pero se prefirió GitHub Actions por simplicidad y plan gratuito.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-025 (pipeline completo), SPIKE-020 (pruebas en CI) y SPIKE-012 (distribución de APK).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **GitHub Actions + Firebase App Distribution** porque:
    - Está integrado con el repositorio donde vive el código.
    - Es gratuito para el volumen de uso de AgroTrack.
    - Permite ejecutar pruebas, compilar y distribuir en cada PR.
    - Bloquea el merge si las pruebas fallan.
    - Distribuye APK a testers sin fricción con Firebase App Distribution.
    - Despliega el backend automáticamente a staging.
    - Gestiona secretos con GitHub Secrets.
    - Tiene trazabilidad completa (commit, rama, autor).

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el pipeline se ejecute en menos de 15 minutos, que las pruebas unitarias e integración se ejecuten en cada PR, que las E2E se ejecuten en releases, y que los APK se distribuyan a testers con Firebase App Distribution.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los builds y despliegues.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Actions (CI/CD), Firebase App Distribution (distribución de APK), GitHub Secrets (gestión de credenciales), JaCoCo y Jest Coverage (cobertura), y el backend Spring Boot desplegado en un servidor o contenedor.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir el pipeline desde el día 1. Usar GitHub Secrets desde el inicio. Ejecutar pruebas unitarias e integración en cada PR y E2E solo en releases. Bloquear el merge si las pruebas fallan. Distribuir APK a testers con Firebase App Distribution desde la primera versión.

  - **Anécdotas**:

    - En el diseño del SPIKE-020 se confirmó que GitHub Actions puede ejecutar pruebas unitarias, integración y cobertura en menos de 15 minutos.
    - Durante el análisis se concluyó que Jenkins habría requerido al menos una semana de configuración y un servidor dedicado, sin aportar beneficios sobre GitHub Actions.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **CI/CD con GitHub Actions + Firebase App Distribution** para backend y frontend, cumpliendo con los escenarios ESC-CAL-POR-01, ESC-CAL-SEG-01 y ESC-CAL-ESC-01.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre automatización, costo, velocidad y mantenibilidad.

    La implementación deberá considerar como mínimo:

    - **Pipeline de PR**:
      - Disparar en cada PR a `main`.
      - Ejecutar linting (ESLint para frontend, Checkstyle para backend).
      - Ejecutar pruebas unitarias (Jest, JUnit).
      - Ejecutar pruebas de integración (Testcontainers, MockMvc).
      - Publicar reporte de cobertura (JaCoCo, Jest Coverage).
      - Bloquear merge si las pruebas fallan o la cobertura baja del umbral (70 % en dominio).
      - Tiempo máximo del pipeline: 15 minutos.
    - **Pipeline de merge a `main`**:
      - Compilar el JAR del backend con Maven.
      - Compilar el APK de release del frontend.
      - Publicar artefactos versionados en GitHub Releases.
      - Desplegar el backend a staging (Docker + docker-compose o servicio gestionado).
      - Subir el APK a Firebase App Distribution.
      - Notificar a testers.
    - **Pipeline de release**:
      - Ejecutar pruebas E2E (Detox o Maestro).
      - Firmar el APK de release.
      - Publicar en Google Play (futuro).
      - Etiquetar el commit con la versión.
    - **Gestión de secretos**:
      - GitHub Secrets para credenciales de Firebase, JWT, base de datos, etc.
      - Nunca hardcodear secretos en el código.
    - **Trazabilidad**:
      - Cada build asociado a commit, rama, autor.
      - Cada artefacto etiquetado con la versión y el commit.
    - **Documentación**:
      - README con instrucciones para el pipeline.
      - Convención de ramas y commits.
      - Guía de resolución de problemas comunes.

    Se descartan los builds y despliegues manuales por propensos a errores y sin trazabilidad, y Jenkins o GitLab CI por costo y mantenimiento. GitHub Actions + Firebase App Distribution es la opción que garantiza automatización, velocidad y confiabilidad en AgroTrack.