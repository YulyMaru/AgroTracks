# SPIKE-029: Validar catálogo centralizado de parámetros con caché local

## Información general

- **ID:** SPIKE-029
- **Nombre:** Validar catálogo centralizado de parámetros con API única y caché local en SQLite
- **ADR relacionado:** ADR-029 — Centralizar parámetros no sensibles en un catálogo compartido
- **ADR complementarios:** ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad), ADR-013 (Usar base de datos relacional SQL para backend y almacenamiento local), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil), ADR-019 (Versionar el esquema de base de datos con migraciones automáticas)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media-Alta
- **Timebox estimado:** 3 días hábiles 

## 1. Objetivo

Validar técnicamente que un catálogo centralizado de parámetros no sensibles, expuesto mediante una API única en el backend y cacheado localmente en SQLite en el frontend, permite que backend y frontend compartan categorías, unidades y tipos de forma consistente, con funcionamiento offline y actualización sin recompilar la app.

El Spike busca comprobar que la estrategia seleccionada en ADR-029 es viable antes de implementarla en la primera versión de AgroTrack.

## 2. Problema que se busca validar

AgroTrack necesita que backend y frontend compartan parámetros (categorías de gastos, unidades, tipos de cultivo, etc.), pero existen riesgos de que:

- Los parámetros estén hardcodeados y requieran recompilar la app para cambiarlos.
- Backend y frontend tengan parámetros diferentes (divergencia).
- El frontend no pueda usar parámetros sin conexión.
- Los cambios en parámetros no se propaguen al frontend.
- Múltiples endpoints generen tráfico y latencia.
- Desactivar un parámetro rompa los datos históricos.
- No haya trazabilidad de cambios en los parámetros.

Por esta razón, se necesita un prototipo que implemente el catálogo centralizado, lo sincronice con el frontend y valide su comportamiento en condiciones reales.

## 3. Pregunta principal del Spike

¿Un catálogo centralizado de parámetros con API única y caché local en SQLite permite que backend y frontend compartan categorías, unidades y tipos de forma consistente, funcione offline, se actualice sin recompilar la app y no rompa los datos históricos al desactivar un parámetro?

## 4. Hipótesis

Si implementamos:

- **Backend**:
  - Tabla `parameters` en PostgreSQL con columnas: `id`, `type`, `code`, `label`, `description`, `sort_order`, `active`, `created_at`, `updated_at`.
  - Restricción única en `(type, code)`.
  - Endpoint `GET /api/v1/parameters` que devuelve todos los parámetros activos.
  - Parámetro opcional `?since=timestamp` para sincronización incremental.
  - Migración Flyway que inserta los parámetros iniciales.
- **Frontend**:
  - Tabla `parameters` en SQLite.
  - Sincronización al arrancar la app y al recuperar conexión.
  - Función `getParametersByType(type)` que lee de SQLite.
  - Uso offline desde la caché.

Entonces:

- El frontend obtendrá todos los parámetros con una sola llamada.
- Los parámetros se cachearán en SQLite.
- El frontend funcionará offline con la caché.
- Los cambios en backend se propagarán al frontend.
- Los parámetros desactivados no se mostrarán en el frontend.
- Los datos históricos no se romperán al desactivar un parámetro.
- Habrá trazabilidad de cambios.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot)**:
  - Migración Flyway que crea la tabla `parameters` y carga los parámetros iniciales.
  - Entidad JPA `Parameter`.
  - Repositorio `ParameterRepository`.
  - Servicio `ParameterService`.
  - Controlador `ParameterController` con `GET /api/v1/parameters`.
  - Soporte para `?since=timestamp`.
  - Pruebas unitarias e integración.
- **Frontend (React Native)**:
  - Migración SQLite que crea la tabla `parameters`.
  - Repositorio local `ParameterRepository`.
  - Servicio `ParameterService` que sincroniza con el backend.
  - Función `getParametersByType(type)`.
  - Uso de parámetros en el formulario de registro de gastos.
  - Pruebas unitarias e integración.
- **Sincronización**:
  - Lógica para sincronizar parámetros al arrancar y al recuperar conexión.
  - Uso de `?since=lastSync` para traer solo cambios.
- **Tipos de parámetros iniciales**:
  - `EXPENSE_CATEGORY`.
  - `INCOME_CATEGORY`.
  - `UNIT`.
  - `CROP_TYPE`.
  - `ACTIVITY_TYPE`.
  - `RESOURCE_TYPE`.
- **Pruebas**:
  - Carga inicial de parámetros.
  - Funcionamiento offline.
  - Propagación de cambios.
  - Desactivación de parámetros sin romper datos históricos.
  - Sincronización incremental con `?since`.
- **Métricas**:
  - Tiempo de carga de parámetros.
  - Tamaño de la respuesta.
  - Tasa de actualización exitosa.

### 5.2 No incluye

El Spike no implementará:

- Panel administrativo para gestionar parámetros (futuro).
- Parámetros personalizados por usuario.
- Traducciones (solo español).
- Configuración remota (Firebase Remote Config).
- Sincronización bidireccional de parámetros (solo backend → frontend).
- Pruebas en iOS.
- Publicación en producción.

## 6. Caso de prueba principal

**Tipos de parámetros a cargar:**

| Tipo | Ejemplos |
|------|----------|
| `EXPENSE_CATEGORY` | Abonos y semillas, Mano de obra, Transporte, Otros |
| `INCOME_CATEGORY` | Venta de café, Venta de plátano, Otros ingresos |
| `UNIT` | kg, tonelada, arroba, bulto, ha, m², L, unidad |
| `CROP_TYPE` | Café, Plátano, Maíz, Frijol, Yuca |
| `ACTIVITY_TYPE` | Siembra, Riego, Fertilización, Cosecha |
| `RESOURCE_TYPE` | Fertilizante, Semilla, Agua, Pesticida |

**Estructura del parámetro:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `type` | Texto | Tipo de parámetro |
| `code` | Texto | Código estable (ej. `FERTILIZER`) |
| `label` | Texto | Etiqueta visible (ej. "Fertilizante") |
| `description` | Texto | Descripción opcional |
| `sortOrder` | Int | Orden de visualización |
| `active` | Boolean | Si está activo |
| `createdAt` | Timestamp | Fecha de creación |
| `updatedAt` | Timestamp | Fecha de última modificación |

**Datos de prueba:**

- 6 tipos de parámetros.
- ~30 parámetros en total.
- Usuario mock autenticado.
- 20 fincas.
- 100 transacciones.

**Dispositivos de prueba:**

- Samsung Galaxy A12 (Android 11, RAM 4 GB).
- Xiaomi Redmi Note 10 (Android 12, RAM 6 GB).
- Samsung Galaxy S22 (Android 13, RAM 8 GB).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Carga inicial de parámetros

**Objetivo:** Validar que el frontend obtiene todos los parámetros del backend.

#### Procedimiento
1. Arrancar el backend con la migración Flyway que carga los parámetros iniciales.
2. Consumir `GET /api/v1/parameters` con Postman.
3. Verificar que devuelve todos los parámetros activos.
4. Abrir la app en un dispositivo limpio.
5. Verificar que el frontend sincroniza los parámetros.
6. Verificar que la tabla `parameters` en SQLite contiene los parámetros.

#### Resultado esperado
- El backend devuelve todos los parámetros activos.
- El frontend los sincroniza correctamente.
- La tabla `parameters` en SQLite contiene los parámetros.
- El tiempo de sincronización es < 3 s.
- No hay errores.

---

### 7.2 Prueba 2 — Funcionamiento offline

**Objetivo:** Validar que el frontend funciona sin conexión usando la caché local.

#### Procedimiento
1. Sincronizar parámetros con conexión.
2. Desactivar la conexión a Internet.
3. Abrir la app.
4. Navegar al formulario de registro de gastos.
5. Verificar que las categorías de gastos se muestran desde la caché local.
6. Registrar un gasto sin conexión.
7. Verificar que el gasto se guarda correctamente con la categoría seleccionada.

#### Resultado esperado
- El frontend usa la caché local sin conexión.
- Las categorías se muestran correctamente.
- El registro offline funciona con los parámetros cacheados.
- No hay errores.

---

### 7.3 Prueba 3 — Propagación de cambios

**Objetivo:** Validar que los cambios en backend se propagan al frontend.

#### Procedimiento
1. Añadir una nueva categoría de gastos en el backend (ej. "Herramientas").
2. Verificar que el backend devuelve la nueva categoría.
3. Recuperar conexión en el frontend.
4. Verificar que el frontend sincroniza los parámetros.
5. Verificar que la nueva categoría aparece en el formulario de registro.
6. Repetir con una modificación de etiqueta y una desactivación.

#### Resultado esperado
- Los cambios en backend se propagan al frontend.
- La nueva categoría aparece en el formulario.
- La modificación de etiqueta se refleja.
- La desactivación se refleja (el parámetro no se muestra).
- No hay errores.

---

### 7.4 Prueba 4 — Sincronización incremental con `?since`

**Objetivo:** Validar que la sincronización incremental funciona.

#### Procedimiento
1. Sincronizar parámetros con `GET /api/v1/parameters`.
2. Guardar el timestamp de la última sincronización.
3. Añadir un nuevo parámetro en el backend.
4. Consumir `GET /api/v1/parameters?since=timestamp`.
5. Verificar que solo devuelve el parámetro nuevo o modificado.
6. Verificar que el frontend actualiza la caché correctamente.

#### Resultado esperado
- La sincronización incremental devuelve solo los cambios.
- El frontend actualiza la caché correctamente.
- El tráfico se reduce significativamente.
- No hay errores.

---

### 7.5 Prueba 5 — Desactivación sin romper datos históricos

**Objetivo:** Validar que desactivar un parámetro no rompe los datos históricos.

#### Procedimiento
1. Registrar un gasto con la categoría "Transporte".
2. Desactivar la categoría "Transporte" en el backend.
3. Sincronizar parámetros en el frontend.
4. Verificar que "Transporte" no aparece en el formulario de nuevo gasto.
5. Verificar que el gasto histórico con "Transporte" sigue mostrando la etiqueta correcta.
6. Verificar que el análisis de gastos por categoría sigue incluyendo "Transporte".

#### Resultado esperado
- El parámetro desactivado no se muestra en formularios nuevos.
- El dato histórico sigue mostrando la etiqueta correcta.
- Los análisis siguen funcionando.
- No hay errores.

---

### 7.6 Prueba 6 — Consistencia entre backend y frontend

**Objetivo:** Validar que backend y frontend usan los mismos códigos y etiquetas.

#### Procedimiento
1. Comparar los códigos y etiquetas del backend con los del frontend.
2. Verificar que coinciden exactamente.
3. Verificar que no hay parámetros huérfanos.
4. Verificar que no hay parámetros duplicados.
5. Verificar que el orden (`sortOrder`) se respeta.

#### Resultado esperado
- Los códigos y etiquetas coinciden.
- No hay parámetros huérfanos ni duplicados.
- El orden se respeta.
- No hay errores.

---

### 7.7 Prueba 7 — Rendimiento de la carga de parámetros

**Objetivo:** Medir el impacto de la carga de parámetros en el rendimiento.

#### Procedimiento
1. Medir el tiempo de carga inicial de parámetros.
2. Medir el tamaño de la respuesta.
3. Medir el tiempo de sincronización incremental.
4. Repetir 3 veces y promediar.
5. Repetir en los 3 dispositivos.

#### Resultado esperado
- Tiempo de carga inicial < 3 s.
- Tamaño de la respuesta < 50 KB.
- Tiempo de sincronización incremental < 1 s.
- El rendimiento no se degrada.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Carga inicial**: El frontend obtiene todos los parámetros del backend.
2. **Offline**: El frontend funciona sin conexión con la caché local.
3. **Propagación**: Los cambios en backend se propagan al frontend.
4. **Incremental**: La sincronización incremental con `?since` funciona.
5. **Desactivación**: Desactivar un parámetro no rompe datos históricos.
6. **Consistencia**: Backend y frontend usan los mismos códigos y etiquetas.
7. **Rendimiento**: La carga de parámetros no degrada el rendimiento.

El Spike se considerará **RECHAZADO** si:

- El frontend no obtiene los parámetros.
- El frontend no funciona offline.
- Los cambios no se propagan.
- La sincronización incremental no funciona.
- Desactivar un parámetro rompe datos históricos.
- Hay divergencias entre backend y frontend.
- El rendimiento se degrada significativamente.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Base de datos backend**: PostgreSQL 15+ con migraciones Flyway.
- **API**: REST (ADR-015).
- **Frontend**: React Native + TypeScript.
- **Base de datos local**: SQLite.
- **Sincronización**: motor de sincronización (ADR-001) y NetInfo (ADR-006).
- **Pruebas backend**: JUnit 5, Spring Boot Test, Testcontainers.
- **Pruebas frontend**: Jest, React Native Testing Library.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: `console.time`, Postman, logs.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La sincronización incremental con `?since` puede fallar si el reloj del servidor y del cliente no están sincronizados.
  - **Mitigación**: Usar timestamps del servidor como referencia. Documentar la limitación.

- **Riesgo**: La caché local puede quedar desactualizada si la sincronización falla.
  - **Mitigación**: Reintentar la sincronización con backoff. Mostrar indicador de última sincronización.

- **Riesgo**: Desactivar un parámetro puede romper datos históricos si no se maneja correctamente.
  - **Mitigación**: No eliminar parámetros, solo desactivarlos. Mantener la etiqueta en los datos históricos.

- **Riesgo**: El tamaño de la respuesta puede crecer con muchos parámetros.
  - **Mitigación**: Usar sincronización incremental. Paginar si es necesario.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 7 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3 y 5. Si el tiempo no alcanza, documentar 4, 6 y 7 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Migración Flyway con la tabla `parameters` y los parámetros iniciales.
   - Endpoint `GET /api/v1/parameters` con soporte para `?since`.
   - Migración SQLite con la tabla `parameters`.
   - Servicio de sincronización en el frontend.
   - Uso de parámetros en el formulario de registro.
   - Pruebas unitarias e integración.
2. **Reporte de métricas**:
   - Tiempo de carga inicial.
   - Tamaño de la respuesta.
   - Tiempo de sincronización incremental.
   - Resultados de las pruebas en los 3 dispositivos.
3. **Evidencia**:
   - Capturas de la tabla `parameters` en PostgreSQL.
   - Capturas de la tabla `parameters` en SQLite.
   - Capturas del formulario con parámetros.
   - Capturas de la sincronización incremental.
   - Capturas de la desactivación sin romper datos históricos.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El frontend obtuvo todos los parámetros del backend?
  - ✅ / ❌ ¿El frontend funcionó offline con la caché local?
  - ✅ / ❌ ¿Los cambios se propagaron al frontend?
  - ✅ / ❌ ¿La sincronización incremental con `?since` funcionó?
  - ✅ / ❌ ¿Desactivar un parámetro no rompió datos históricos?
  - ✅ / ❌ ¿Backend y frontend usaron los mismos códigos y etiquetas?
  - ✅ / ❌ ¿La carga de parámetros no degradó el rendimiento?

- **Lecciones aprendidas**:
  - (Ejemplo: "La sincronización incremental con `?since` reduce el tráfico significativamente.")
  - (Ejemplo: "Desactivar parámetros en lugar de eliminarlos evita romper datos históricos.")
  - (Ejemplo: "Los códigos estables son clave para la consistencia entre backend y frontend.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir los tipos de parámetros desde el día 1.")
  - (Ejemplo: "Usar códigos estables (ej. `EXPENSE_CATEGORY_FERTILIZER`) en lugar de IDs numéricos.")
  - (Ejemplo: "Incluir `updatedAt` para sincronización incremental.")
  - (Ejemplo: "Permitir desactivar parámetros sin eliminarlos.")
  - (Ejemplo: "Cachear en SQLite desde la primera versión.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)