# ADR-029: Centralizar parámetros no sensibles en un catálogo compartido

- **Título**: Implementar un catálogo de parámetros no sensibles (categorías de gastos, unidades de medida, tipos de cultivo, tipos de actividad, tipos de recurso) gestionado en el backend y consumido por el frontend mediante REST, con caché local en SQLite para funcionamiento offline, descartando parámetros hardcodeados en el cliente.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia para gestionar parámetros no sensibles que backend y frontend necesitan compartir (categorías, unidades, tipos), garantizando consistencia, facilidad de actualización, funcionamiento offline y sin necesidad de recompilar la app para cambiar un parámetro.

  - **Detalles**:

    - **Consistencia**: los mismos parámetros deben existir en backend y frontend; no puede haber divergencias.
    - **Actualización sin recompilar**: cambiar un parámetro (ej. añadir una categoría) no debe requerir actualizar la app.
    - **Funcionamiento offline**: el frontend debe poder usar los parámetros sin conexión.
    - **Trazabilidad**: debe haber historial de cambios en los parámetros.
    - **Mantenibilidad**: los parámetros deben ser fáciles de gestionar (CRUD).
    - **Rendimiento**: la carga de parámetros no debe degradar la experiencia.
    - **Costo**: la solución debe ser viable con el stack actual (Spring Boot + React Native + PostgreSQL + SQLite).
    - **Escenarios de calidad relacionados**: ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-US-01, ESC-CAL-ACC-06, ESC-CAL-CF-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias para gestionar parámetros compartidos entre backend y frontend.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Parámetros hardcodeados en el frontend**: las categorías, unidades y tipos están definidos en el código de la app; cambiarlos requiere una nueva versión.
    2. **Parámetros en tabla de base de datos sin API de catálogo**: los parámetros existen en tablas de PostgreSQL, pero el frontend los consume mediante endpoints específicos por tipo (ej. `GET /api/v1/expense-categories`).
    3. **Catálogo centralizado de parámetros con API única y caché local**: un único endpoint `GET /api/v1/parameters` devuelve todos los parámetros activos; el frontend los cachea en SQLite y los usa offline.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de gestión de catálogos en aplicaciones móviles con backend, considerando la necesidad de consistencia entre cliente y servidor, la facilidad de actualización y el funcionamiento offline. Se revisaron experiencias de aplicaciones que hardcodean parámetros y sufren por cada cambio.

  - **1. Parámetros hardcodeados en el frontend**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con los criterios de consistencia ni actualización sin recompilar.

      - **Detalles**:
        - Cambiar una categoría requiere actualizar la app.
        - Si el backend añade una categoría, el frontend no la conoce hasta que se actualiza.
        - Riesgo de divergencia entre backend y frontend.
        - Los usuarios con versiones antiguas no ven los cambios.
        - Difícil de mantener.

    - **Análisis de costos**:

      - **Resumen**: Costo inicial nulo, pero costo de mantenimiento alto.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: cada cambio de parámetro requiere release de la app.
        - **Medición**: no hay trazabilidad.

    - **Análisis FODA**:

      - **Fortalezas**: sin inversión inicial.
      - **Debilidades**: sin consistencia, sin actualización sin recompilar.
      - **Oportunidades**: ninguna.
      - **Amenazas**: divergencia entre backend y frontend; releases forzadas.

    - **Opiniones y comentarios internos**:

      - "Cambiar una categoría no debería requerir publicar una nueva versión."
      - "Necesitamos que backend y frontend compartan los mismos parámetros."

  - **2. Parámetros en tabla de base de datos sin API de catálogo**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente. Los parámetros están en el backend, pero el frontend debe consultarlos con múltiples endpoints.

      - **Detalles**:
        - Cada tipo de parámetro tiene su propio endpoint (`/expense-categories`, `/units`, `/crop-types`, etc.).
        - El frontend debe hacer múltiples llamadas para obtener todos los parámetros.
        - Mayor tráfico y latencia.
        - Sin caché unificada.
        - Difícil de mantener si se añaden nuevos tipos de parámetro.

    - **Análisis de costos**:

      - **Resumen**: Costo medio, retorno medio.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe crear múltiples endpoints.
        - **Operación**: mayor número de llamadas.
        - **Medición**: métricas por endpoint.

    - **Análisis FODA**:

      - **Fortalezas**: parámetros centralizados en backend.
      - **Debilidades**: múltiples endpoints, sin caché unificada, difícil de escalar.
      - **Oportunidades**: unificar en una API de catálogo.
      - **Amenazas**: latencia, complejidad de mantenimiento.

    - **Opiniones y comentarios internos**:

      - "Múltiples endpoints para parámetros es ineficiente."
      - "Una API única simplifica el frontend."

  - **3. Catálogo centralizado de parámetros con API única y caché local**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios.

      - **Detalles**:
        - **Backend**: tabla `parameters` con `id`, `type`, `code`, `label`, `sortOrder`, `active`, `createdAt`, `updatedAt`.
        - **API**: `GET /api/v1/parameters?since=...` devuelve todos los parámetros activos (o solo los modificados desde una fecha).
        - **Frontend**: cachea los parámetros en SQLite; los usa offline; se actualiza al recuperar conexión.
        - **Consistencia**: backend y frontend usan los mismos códigos y etiquetas.
        - **Actualización sin recompilar**: añadir una categoría en backend no requiere actualizar la app.
        - **Trazabilidad**: la tabla `parameters` tiene `createdAt` y `updatedAt`.
        - **Rendimiento**: una sola llamada trae todos los parámetros.
        - **Offline**: el frontend funciona sin conexión con los parámetros cacheados.
        - **Tipos de parámetros**:
          - `EXPENSE_CATEGORY`: Abonos y semillas, Mano de obra, Transporte, Otros.
          - `INCOME_CATEGORY`: Venta de café, Venta de plátano, Otros ingresos.
          - `UNIT`: kg, tonelada, arroba, bulto, ha, m², L, unidad.
          - `CROP_TYPE`: Café, Plátano, Maíz, Frijol, Yuca, etc.
          - `ACTIVITY_TYPE`: Siembra, Riego, Fertilización, Cosecha, etc.
          - `RESOURCE_TYPE`: Fertilizante, Semilla, Agua, etc.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo-medio, costo operativo bajo, retorno alto en consistencia.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe implementar el CRUD de parámetros.
        - **Operación**: monitoreo de cambios en parámetros.
        - **Medición**: métricas de uso por tipo de parámetro.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Consistencia entre backend y frontend.
        - Actualización sin recompilar.
        - Funcionamiento offline con caché.
        - Trazabilidad.
        - Una sola llamada para el frontend.
        - Fácil de mantener y escalar.
      - **Debilidades**:
        - Requiere implementar CRUD de parámetros en el backend.
        - Requiere caché local y lógica de sincronización de parámetros.
      - **Oportunidades**:
        - Añadir nuevos tipos de parámetros sin cambiar el frontend.
        - Panel administrativo para gestionar parámetros.
      - **Amenazas**:
        - Si el frontend no actualiza la caché, puede quedar desactualizado.
        - Si un parámetro se elimina, el frontend puede quedar inconsistente.

    - **Opiniones y comentarios internos**:

      - "Una API única de parámetros simplifica el frontend."
      - "La caché local permite que el frontend funcione offline."
      - "Los parámetros deben poder actualizarse sin recompilar la app."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-029 — Validará que el catálogo centralizado funciona con caché local y sincronización — Propuesto.
    - SPIKE-005 — Validará que el registro offline usa los parámetros cacheados — Propuesto.
    - SPIKE-006 — Validará que la consulta offline usa los parámetros cacheados — Propuesto.
    - SPIKE-019 — Validará que la tabla `parameters` se versiona con migraciones — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Parámetros hardcodeados — descartado por falta de consistencia.
    - Parámetros en tabla sin API de catálogo — descartado por múltiples endpoints.
    - Configuración remota (Firebase Remote Config) — descartado por no estar en el stack y por no funcionar offline.
    - Archivo JSON empaquetado en la app — descartado porque requiere recompilar para actualizar.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, offline-first, con categorías, unidades y tipos compartidos entre backend y frontend.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-029 (catálogo centralizado), SPIKE-005 (registro offline), SPIKE-006 (consulta offline) y SPIKE-019 (migraciones).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **catálogo centralizado de parámetros con API única y caché local** porque:
    - Garantiza consistencia entre backend y frontend.
    - Permite actualizar parámetros sin recompilar la app.
    - Funciona offline con la caché local.
    - Tiene trazabilidad de cambios.
    - Reduce el tráfico (una sola llamada).
    - Es fácil de mantener y escalar.
    - Se integra naturalmente con el stack actual.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que el catálogo centralizado funcione correctamente, que el frontend cachee los parámetros en SQLite y que las actualizaciones se propaguen al recuperar conexión.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los parámetros no sensibles.
    - **¿Qué tipos de integraciones están involucradas?**: PostgreSQL (tabla `parameters`), Spring Boot (API REST), SQLite (caché local), motor de sincronización (ADR-001), repositorio local (ADR-006) y el CRUD de parámetros en el backend.
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Definir los tipos de parámetros desde el día 1. Usar códigos estables (ej. `EXPENSE_CATEGORY_FERTILIZER`) en lugar de IDs numéricos. Incluir `updatedAt` para sincronización incremental. Permitir desactivar parámetros sin eliminarlos. Cachear en SQLite desde la primera versión.

  - **Anécdotas**:

    - Durante el análisis se concluyó que hardcodear categorías obligaría a publicar una nueva versión cada vez que se añade una.
    - Se identificó que múltiples endpoints para parámetros complican el frontend y aumentan el tráfico.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un **catálogo centralizado de parámetros no sensibles** con API única (`GET /api/v1/parameters`) y caché local en SQLite, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-US-01, ESC-CAL-ACC-06 y ESC-CAL-CF-03.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre consistencia, actualización sin recompilar, funcionamiento offline y costo.

    La implementación deberá considerar como mínimo:

    - **Backend (Spring Boot)**:
      - Tabla `parameters` con columnas: `id` (UUID), `type` (texto), `code` (texto único), `label` (texto), `description` (texto opcional), `sort_order` (int), `active` (boolean), `created_at`, `updated_at`.
      - Restricción única en `(type, code)`.
      - Índice en `(type, active)`.
      - Endpoint `GET /api/v1/parameters` que devuelve todos los parámetros activos.
      - Parámetro opcional `?since=timestamp` para sincronización incremental.
      - Endpoints de administración (futuro) para CRUD de parámetros.
      - Migración Flyway que inserta los parámetros iniciales.
    - **Tipos de parámetros**:
      - `EXPENSE_CATEGORY`: categorías de gastos.
      - `INCOME_CATEGORY`: categorías de ingresos.
      - `UNIT`: unidades de medida (kg, tonelada, arroba, bulto, ha, m², L, unidad).
      - `CROP_TYPE`: tipos de cultivo.
      - `ACTIVITY_TYPE`: tipos de actividad productiva.
      - `RESOURCE_TYPE`: tipos de recurso.
    - **Frontend (React Native)**:
      - Tabla `parameters` en SQLite con las mismas columnas.
      - Sincronización al arrancar la app y al recuperar conexión.
      - Uso offline desde la caché.
      - Función `getParametersByType(type)` que lee de SQLite.
    - **Sincronización**:
      - Al arrancar, el frontend consulta `GET /api/v1/parameters?since=lastSync`.
      - Actualiza la caché local con los cambios.
      - Si no hay conexión, usa la caché existente.
    - **Consistencia**:
      - Los códigos son estables y no cambian.
      - Las etiquetas pueden cambiar sin afectar los datos.
      - Los parámetros se desactivan (no se eliminan) para no romper datos históricos.
    - **Pruebas**:
      - Verificar que los parámetros se cargan correctamente.
      - Verificar que el frontend funciona offline con la caché.
      - Verificar que los cambios en backend se propagan al frontend.
      - Verificar que los parámetros desactivados no se muestran en el frontend.
      - Verificar que los datos históricos no se rompen al desactivar un parámetro.
    - **Documentación**:
      - Lista de tipos de parámetros.
      - Códigos estables.
      - Procedimiento para añadir un nuevo parámetro.

    Se descartan los parámetros hardcodeados por falta de consistencia y los múltiples endpoints por ineficiencia. El catálogo centralizado con API única y caché local es la opción que garantiza consistencia, actualización sin recompilar y funcionamiento offline en AgroTrack.