# ADR-033: Integrar controles DevSecOps en el pipeline de CI/CD

- **Título**: Integrar controles automáticos de calidad y seguridad en los pipelines de GitHub Actions del backend y de la app móvil, con JaCoCo y Jest Coverage (cobertura), SonarCloud (calidad y seguridad del código), Trivy (vulnerabilidades, secretos y configuración) y Dependabot (actualización de dependencias), descartando la revisión manual exclusiva y las suites comerciales de pago.

- **Estado**: Aceptado.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia DevSecOps que mejor equilibre detección temprana de defectos y vulnerabilidades, costo, tiempo del pipeline y facilidad de uso, considerando que AgroTrack maneja información productiva y económica de campesinos (Ley 1581 de 2012), que el equipo es pequeño, que el pipeline de CI/CD ya existe en GitHub Actions (ADR-025) y que la app móvil todavía no tenía pipeline.

  - **Detalles**:

    - **Cobertura medible**: cada ejecución del pipeline debe medir qué porcentaje del código recorren las pruebas, en backend y móvil (ADR-020).
    - **Calidad del código**: deben detectarse duplicación, complejidad excesiva, *code smells* y bugs, como evidencia objetiva de Clean Code, DRY y SOLID.
    - **Vulnerabilidades en dependencias**: deben detectarse librerías con vulnerabilidades conocidas (CVE) en Maven, npm y la imagen Docker (OWASP A06).
    - **Secretos y configuración insegura**: deben detectarse claves o tokens escritos en el repositorio y configuraciones inseguras del Dockerfile (OWASP A02, A05).
    - **Integridad del pipeline**: las herramientas de terceros usadas en el pipeline no deben poder cambiar sin que el equipo lo note (OWASP A08).
    - **Bloqueo efectivo**: una imagen con vulnerabilidades críticas corregibles no debe llegar a Cloud Run (ADR-031).
    - **Tiempo del pipeline**: los controles no deben llevar el pipeline por encima de los 15 minutos definidos en ADR-025.
    - **Costo de implementación y operación**: la solución debe ser gratuita o de costo casi nulo, en línea con ADR-031.
    - **Mantenibilidad**: los controles deben vivir en los mismos workflows y no requerir servidores propios.
    - **Escenarios de calidad relacionados**: ESC-CAL-SEG-01, ESC-CAL-CF-04, ESC-CAL-CF-05.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias para incorporar calidad y seguridad automatizadas al ciclo de desarrollo.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Revisión manual sin controles automáticos**: SonarLint en el IDE de cada desarrollador y revisión de código entre compañeros antes de fusionar.
    2. **Suite comercial (Snyk + GitHub Advanced Security o SonarQube de pago)**: herramientas propietarias con análisis de dependencias, código y secretos, y paneles centralizados.
    3. **Herramientas gratuitas integradas en GitHub Actions (JaCoCo + Jest Coverage + SonarCloud + Trivy + Dependabot)**: cobertura en cada ejecución, análisis de código en SonarCloud, escaneo de imagen, dependencias, secretos y configuración con Trivy, y actualizaciones semanales con Dependabot.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se revisaron prácticas DevSecOps en proyectos con backend Spring Boot en contenedores y apps React Native, considerando el presupuesto, que el código vive en GitHub, la imagen se publica en Artifact Registry y que el equipo no puede mantener servidores adicionales. También se revisaron incidentes recientes de seguridad en la cadena de suministro de GitHub Actions.

  - **1. Revisión manual sin controles automáticos**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de cobertura medible, vulnerabilidades en dependencias ni bloqueo efectivo.

      - **Detalles**:
        - SonarLint solo analiza lo que cada desarrollador tiene abierto y no deja registro compartido.
        - La revisión entre compañeros no detecta CVE en las cientos de dependencias transitivas.
        - No se mide la cobertura, aunque ADR-020 y ADR-025 la exigen.
        - Nada impide que una imagen vulnerable llegue a Cloud Run.
        - Depende de la disciplina de cada persona.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, costo de riesgo alto.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: tiempo de revisión en cada PR.
        - **Medición**: no hay métricas.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin inversión.
        - SonarLint ya está instalado en el IDE.
      - **Debilidades**:
        - Sin evidencia medible.
        - No detecta vulnerabilidades en dependencias.
        - No bloquea despliegues.
      - **Oportunidades**:
        - Complementa a cualquier control automático.
      - **Amenazas**:
        - Vulnerabilidades conocidas en producción.
        - Exposición de datos de los campesinos.

    - **Opiniones y comentarios internos**:

      - "SonarLint ayuda, pero no sirve como evidencia ante nadie."
      - "Nadie va a revisar a mano las dependencias de Spring y de React Native."

  - **2. Suite comercial (Snyk + GitHub Advanced Security o SonarQube de pago)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple técnicamente, pero no con el criterio de costo.

      - **Detalles**:
        - Snyk analiza dependencias, contenedores y código, con buenas sugerencias de corrección.
        - GitHub Advanced Security agrega análisis de código (CodeQL) y detección de secretos, pero tiene costo por usuario en repositorios privados.
        - Las ediciones de pago de SonarQube agregan análisis de ramas y PR que la gratuita no tiene.
        - Los planes gratuitos tienen límites de escaneos mensuales que se alcanzan con Dependabot y PR frecuentes.
        - Varias cuentas y paneles separados que mantener.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, costo operativo alto por licencias.

      - **Ejemplos**:
        - **Licencias**: por desarrollador y por mes, fuera del presupuesto del proyecto.
        - **Capacitación**: cada herramienta tiene su propio panel y configuración.
        - **Operación**: gestión de cuentas y límites de uso.
        - **Medición**: paneles completos.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Análisis profundo.
        - Soporte comercial.
        - Paneles avanzados.
      - **Debilidades**:
        - Costo de licencias.
        - Límites en planes gratuitos.
        - Dependencia de varios proveedores.
      - **Oportunidades**:
        - Útil si el proyecto crece y consigue financiación.
      - **Amenazas**:
        - Perder el análisis al terminar un periodo de prueba.

    - **Opiniones y comentarios internos**:

      - "Pagar licencias para un piloto no tiene sentido."
      - "Si el plan gratuito se acaba a mitad de semestre, nos quedamos sin evidencia."

  - **3. Herramientas gratuitas integradas en GitHub Actions (JaCoCo + Jest Coverage + SonarCloud + Trivy + Dependabot)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple con todos los criterios.

      - **Detalles**:
        - JaCoCo (backend) y Jest Coverage (móvil) miden la cobertura en cada ejecución y publican el reporte como artefacto del workflow.
        - SonarCloud analiza calidad y seguridad del código y recibe la cobertura. Es gratuito para repositorios públicos y no requiere servidor propio.
        - Trivy escanea con una sola herramienta la imagen Docker, el `package-lock.json`, los secretos y el Dockerfile. No requiere cuenta y su base de vulnerabilidades se actualiza sola.
        - Trivy escanea la imagen antes de subirla a Artifact Registry: si encuentra vulnerabilidades CRITICAL con arreglo disponible, la imagen no se publica ni se despliega.
        - Dependabot viene incluido en GitHub y abre PR semanales para Maven, npm, la imagen base y las acciones del pipeline.
        - Las acciones de terceros se fijan por SHA de commit, no por etiqueta, para que no puedan cambiar sin que el equipo lo note.
        - Todo vive en los workflows existentes (`backend.yml`) y en uno nuevo para la app móvil (`movil.yml`).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, costo operativo nulo.

      - **Ejemplos**:
        - **Licencias**: ninguna. SonarCloud, Trivy y Dependabot son gratuitos para el uso de AgroTrack.
        - **Capacitación**: leer los reportes de SonarCloud y las tablas de Trivy.
        - **Operación**: revisar los PR semanales de Dependabot; de 2 a 4 minutos más por ejecución del pipeline.
        - **Medición**: cobertura, Quality Gate, bugs, vulnerabilidades, duplicación y CVE por severidad.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin costo.
        - Integrado con GitHub, donde ya vive el código.
        - Bloquea imágenes vulnerables antes de publicarlas.
        - Evidencia medible para la evaluación del proyecto.
      - **Debilidades**:
        - Varias herramientas que configurar.
        - SonarCloud requiere crear una cuenta y un token.
        - El pipeline tarda un poco más.
      - **Oportunidades**:
        - Activar el Quality Gate de SonarCloud como bloqueo cuando la cobertura se estabilice.
        - Firmar imágenes (cosign) y generar SBOM para completar OWASP A08.
      - **Amenazas**:
        - Una vulnerabilidad nueva puede bloquear un despliegue urgente hasta actualizar la librería.
        - Una acción de terceros comprometida, mitigada al fijarlas por SHA.

    - **Opiniones y comentarios internos**:

      - "Todo queda en GitHub Actions, que ya usamos y conocemos."
      - "Trivy hace con una herramienta lo que Snyk y Dependency-Check hacen por separado."
      - "Que la imagen no se suba si tiene algo crítico es lo que más nos protege."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de la verificación local realizada al implementar la decisión y de los spikes relacionados con pruebas y CI/CD.

  - **¿Quién da la opinión?**:

    - Verificación local (2026-11-01) — Backend: 41 pruebas pasan y JaCoCo genera el reporte, con 90,8 % de líneas cubiertas (registros 97 %, sincronización 87 %, compartido 84 %, autenticación 81 %, catálogo 50 %). Móvil: 20 pruebas pasan, lint y tipos sin errores, cobertura de 10,75 % de líneas — Realizado.
    - Pruebas de la capa de aplicación del móvil (2026-11-03) — Con dobles en memoria de los puertos (sin celular ni SQLite): motor y cola de sincronización, casos de uso de registros, sesión y análisis. 85 pruebas; dominio y aplicación quedan cerca del 100 % y la cobertura que mide SonarCloud sube de 10,4 % a 53 %. La infraestructura (SQLite, HTTP, Keychain) se valida en el dispositivo (ADR-012) — Realizado.
    - Pruebas de integración de la infraestructura del móvil (2026-11-04) — Las consultas SQL reales de los adaptadores corren contra el SQLite de Node (`node:sqlite`), el cliente HTTP contra un servidor de prueba con los interceptores reales (renovación del token, clasificación de errores), y una prueba recorre la app completa desde `src/composicion.ts`: anotar sin señal, consultar el análisis y sincronizar al volver la conexión. 122 pruebas; la cobertura que mide SonarCloud sube a 96 %. Solo quedan fuera el cifrado con SQLCipher y la migración de la base sin cifrar, que se validan en el dispositivo (ADR-012, ADR-022) — Realizado.
    - `npm audit` (2026-11-01) — Encontró 3 vulnerabilidades HIGH en el móvil, que se corrigieron antes de activar el bloqueo de Trivy — Realizado.
    - SPIKE-020 — Validará que las pruebas en capas se integran en el pipeline — Propuesto.
    - SPIKE-025 — Validará el pipeline completo de CI/CD — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - SonarQube Community autoalojado — descartado porque requiere un servidor 24/7 y su mantenimiento (ADR-031 busca costo casi nulo).
    - OWASP Dependency-Check — descartado porque solo analiza dependencias Java, es lento sin caché y Trivy ya cubre Maven, npm y la imagen.
    - CodeQL — considerado para análisis de código, pero se prefirió SonarCloud porque además mide duplicación y mantenibilidad y recibe la cobertura.
    - `npm audit` en el pipeline — descartado como bloqueo porque solo cubre npm; se usa en local para diagnosticar.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con dominio relacional, offline-first y sincronización diferida.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular con arquitectura hexagonal (ADR-018, ADR-032).

  - **¿Cómo evaluó a los candidatos?**:

    Comparando la cobertura de cada candidato frente a los criterios (cobertura, calidad, dependencias, secretos, integridad, bloqueo, costo) y ejecutando en local las pruebas con cobertura y la auditoría de dependencias sobre el código actual.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó **JaCoCo + Jest Coverage + SonarCloud + Trivy + Dependabot en GitHub Actions** porque:
    - Es gratuito para el volumen de uso de AgroTrack.
    - Vive en los mismos workflows de ADR-025, sin servidores adicionales.
    - Cubre cobertura, calidad del código, dependencias, imagen, secretos y configuración.
    - Bloquea imágenes con vulnerabilidades críticas corregibles antes de publicarlas.
    - Da a la app móvil un pipeline propio que antes no tenía.
    - Produce evidencia medible para OWASP A02, A05, A06 y A08 y para Clean Code y DRY.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Implementado en `.github/workflows/backend.yml`, `.github/workflows/movil.yml` y `.github/dependabot.yml`. Verificado en local; pendiente la primera ejecución en GitHub y la creación de los proyectos en SonarCloud (pasos en `doc/devsecops.md`).
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las imágenes del backend que llegan a staging y producción pasan por el escaneo de Trivy.
    - **¿Qué tipos de integraciones están involucradas?**: GitHub Actions (orquestación), JaCoCo y Jest (cobertura), SonarCloud (análisis de código, vía `SONAR_TOKEN` en GitHub Secrets), Trivy (escaneo), Dependabot (actualizaciones), Artifact Registry y Cloud Run (destino de la imagen escaneada).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Activar la cobertura y el escaneo de dependencias desde el primer commit, para no acumular vulnerabilidades y pruebas rotas. Mantener las pruebas de la app ejecutables fuera del celular (simular la raíz de composición) para que corran en CI. Fijar por SHA toda acción de terceros.

  - **Anécdotas**:

    - En marzo de 2026 se reescribieron etiquetas de `aquasecurity/trivy-action` para distribuir código malicioso a los pipelines que las usaban. Por eso las acciones nuevas se fijan por SHA de commit y no por etiqueta.
    - Al preparar el pipeline del móvil se encontró que la prueba `App.test.tsx` fallaba desde antes: la app abría SQLite cifrado y el Keychain, que solo existen en el celular. Se corrigió simulando la raíz de composición (`src/composicion.ts`), algo que la arquitectura hexagonal (ADR-032) permite sin tocar la app.
    - La auditoría encontró `follow-redirects` 1.16.1, usada por `axios` dentro de la app, con una vulnerabilidad que podía reenviar credenciales al seguir redirecciones. Se actualizó a 1.16.2.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **controles DevSecOps con JaCoCo, Jest Coverage, SonarCloud, Trivy y Dependabot en GitHub Actions**, cumpliendo con los escenarios ESC-CAL-SEG-01, ESC-CAL-CF-04 y ESC-CAL-CF-05.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre detección temprana, costo, tiempo del pipeline y mantenibilidad.

    La implementación deberá considerar como mínimo:

    - **Cobertura**:
      - Backend: plugin `jacoco-maven-plugin` 0.8.16 (primera versión con soporte oficial de Java 27); `./mvnw verify` genera `target/site/jacoco/`.
      - Móvil: `npm run test:cobertura` genera `coverage/lcov.info`.
      - Las pantallas y la navegación del móvil (`src/pantallas`, `src/navegacion`, `App.tsx`) no cuentan para la cobertura (`sonar.coverage.exclusions`): según ADR-020 se validan con E2E, usabilidad y pruebas en dispositivos (ADR-012), no con pruebas unitarias. Siguen analizándose por bugs, seguridad y duplicación.
      - Publicar ambos reportes como artefactos del workflow y enviarlos a SonarCloud.
    - **SonarCloud**:
      - Dos proyectos (backend y móvil) en la misma organización, porque ambos viven en el mismo repositorio.
      - Organización y claves de proyecto como variables de GitHub (`SONAR_ORGANIZACION`, `SONAR_PROYECTO_BACKEND`, `SONAR_PROYECTO_MOVIL`); token como secreto (`SONAR_TOKEN`).
      - Si no existe el token, el paso se salta y el resto del pipeline continúa.
      - El Quality Gate informa pero no bloquea, hasta que la cobertura del código nuevo se estabilice.
    - **Trivy**:
      - Backend: escaneo de secretos y configuración del Dockerfile en cada ejecución (bloquea con HIGH o CRITICAL).
      - Imagen del backend: informe de HIGH y CRITICAL; bloqueo solo con CRITICAL que tenga arreglo, en cada PR y antes de subir a Artifact Registry.
      - Móvil: escaneo de dependencias y secretos (bloquea con HIGH o CRITICAL que tengan arreglo).
      - Las vulnerabilidades sin versión corregida no bloquean (`ignore-unfixed`); las excepciones justificadas van en `.trivyignore`.
    - **Dependabot**:
      - Revisión semanal de Maven, npm, la imagen Docker y las acciones de GitHub.
      - Actualizaciones menores agrupadas en un solo PR por ecosistema.
    - **Integridad del pipeline**:
      - Acciones de terceros nuevas fijadas por SHA de commit, con la versión como comentario.
    - **Documentación**:
      - `doc/devsecops.md` con la configuración de SonarCloud, qué hacer si Trivy bloquea y la evidencia para la sustentación.

    Se descarta la revisión manual exclusiva porque no produce evidencia ni detecta vulnerabilidades en dependencias, y las suites comerciales por costo de licencias y límites de los planes gratuitos. Los controles gratuitos integrados en GitHub Actions son la opción que garantiza calidad y seguridad verificables en AgroTrack sin aumentar el costo.
