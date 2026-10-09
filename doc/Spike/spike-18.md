# SPIKE-018: Validar monolito modular por capas con patrón Repository

## Información general

- **ID:** SPIKE-018
- **Nombre:** Validar monolito modular por capas con módulos por dominio y patrón Repository
- **ADR relacionado:** ADR-018 — Usar monolito modular por capas con arquitectura offline-first y patrón Repository
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-013 (Base de datos relacional SQL), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles
## 1. Objetivo

Validar técnicamente que el monolito modular por capas con módulos por dominio y patrón Repository es mantenible, testeable, evolutivo y aplicable tanto en el backend (Spring Boot) como en el frontend móvil (React Native), sin degradar el rendimiento ni la claridad del código.

El Spike busca comprobar que el estilo arquitectónico seleccionado en ADR-018 permite separar claramente las responsabilidades, facilitar las pruebas por capa y por módulo, y mantener la puerta abierta a una futura extracción de microservicios si el proyecto escala.

## 2. Problema que se busca validar

AgroTrack requiere una arquitectura que soporte un dominio relacional con múltiples módulos (fincas, cultivos, transacciones, sincronización, usuarios) y una lógica offline-first con sincronización diferida. Existen riesgos de que:

- El monolito tradicional mezcle responsabilidades y dificulte el mantenimiento.
- Los microservicios introduzcan complejidad operativa y costos desproporcionados para el equipo.
- El patrón Repository no se implemente correctamente y el dominio quede acoplado a la base de datos.
- La separación por capas se degrade con el tiempo y el código se vuelva un "big ball of mud".
- Las pruebas no se puedan ejecutar de forma aislada por capa o por módulo.
- La integración entre backend y frontend no respete las interfaces definidas.
- El rendimiento se degrade por la cantidad de capas o abstracciones.
- La evolución a microservicios sea imposible sin reescribir todo.

Por esta razón, se necesita un prototipo que implemente el monolito modular en un alcance mínimo, con al menos dos módulos de dominio, y valide su mantenibilidad, testabilidad y evolución.

## 3. Pregunta principal del Spike

¿El monolito modular por capas con módulos por dominio y patrón Repository permite separar claramente las responsabilidades, probar cada capa y módulo de forma aislada, integrar backend y frontend mediante interfaces, y mantener el rendimiento dentro de los umbrales definidos, sin requerir infraestructura distribuida?

## 4. Hipótesis

Si implementamos:

- **Backend (Spring Boot)**:
  - Capas: presentación (controladores REST), aplicación (servicios de caso de uso), dominio (entidades y reglas), infraestructura (repositorios JPA, seguridad, caché).
  - Módulos por dominio: al menos `fincas` y `transacciones`.
  - Patrón Repository: interfaces en dominio, implementaciones JPA en infraestructura.
- **Frontend (React Native + TypeScript)**:
  - Capas: presentación (componentes y pantallas), aplicación (hooks y casos de uso), dominio (entidades y reglas), infraestructura (SQLite, Axios, SecureStore, NetInfo).
  - Módulos por dominio: al menos `fincas` y `transacciones`.
  - Patrón Repository: interfaces en dominio, implementaciones que combinan SQLite local y Axios remoto.

Entonces:

- El código estará claramente separado por capas y módulos.
- Cada capa y módulo podrá probarse de forma aislada.
- El dominio no dependerá de la base de datos ni del framework.
- La integración backend-frontend respetará las interfaces definidas.
- El rendimiento se mantendrá dentro de los umbrales definidos (≤ 3 s consultas, ≤ 5 s resúmenes).
- La extracción futura de un módulo a microservicio será viable sin reescribir el resto.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot)**:
  - Estructura de paquetes por capa y por módulo.
  - Dos módulos de dominio: `fincas` y `transacciones`.
  - Entidades de dominio (sin dependencias de JPA).
  - DTOs de presentación (request/response).
  - Servicios de aplicación (casos de uso).
  - Repositorios: interfaces en dominio, implementaciones JPA en infraestructura.
  - Controladores REST para `fincas` y `transacciones`.
  - Configuración de seguridad y JWT (mínima).
  - Pruebas unitarias por capa y por módulo.
  - Pruebas de integración con Spring Boot Test.
- **Frontend (React Native + TypeScript)**:
  - Estructura de carpetas por capa y por módulo.
  - Dos módulos de dominio: `fincas` y `transacciones`.
  - Entidades de dominio (sin dependencias de SQLite ni Axios).
  - Componentes y pantallas para listar y registrar.
  - Hooks y casos de uso.
  - Repositorios: interfaces en dominio, implementaciones que combinan SQLite y Axios.
  - Pruebas unitarias por capa y por módulo con Jest.
  - Pruebas de integración del repositorio.
- **Integración**:
  - Contratos claros entre backend y frontend (OpenAPI).
  - Verificación de que el frontend consume los endpoints REST correctamente.
- **Métricas**:
  - Tiempo de compilación y ejecución de pruebas.
  - Tiempo de respuesta de endpoints.
  - Facilidad de incorporar un nuevo módulo (simulada).
  - Facilidad de cambiar la implementación de un repositorio (simulada).

### 5.2 No incluye

El Spike no implementará:

- Todos los módulos de AgroTrack (solo `fincas` y `transacciones`).
- La lógica completa de sincronización (solo la estructura de repositorios).
- La interfaz definitiva de la aplicación (solo pantallas mínimas).
- Pruebas E2E completas (solo pruebas unitarias e integración).
- Optimización avanzada de rendimiento (solo mediciones básicas).
- Pruebas en iOS (solo Android).
- Publicación en Google Play ni despliegue en producción.
- Seguridad avanzada más allá de JWT mínimo.
- Internacionalización ni accesibilidad avanzada.

## 6. Caso de prueba principal

**Módulos a implementar:**

1. **Farms**:
   - Backend: CRUD básico de fincas.
   - Frontend: listado y registro de fincas.
2. **Transactions**:
   - Backend: CRUD básico de transacciones y resumen económico.
   - Frontend: listado y registro de transacciones, y visualización de resumen.

**Estructura de capas en backend:**

- `com.agrotrack.fincas`
  - `dominio` (entidades, repositorios interfaces, reglas)
  - `aplicacion` (servicios de caso de uso)
  - `infraestructura` (implementaciones JPA)
  - `presentacion` (controladores REST, DTOs)
- `com.agrotrack.transacciones` (misma estructura)

**Estructura de capas en frontend:**

- `src/fincas`
  - `dominio` (entidades, repositorios interfaces)
  - `aplicacion` (hooks, casos de uso)
  - `infraestructura` (implementaciones SQLite y Axios)
  - `presentacion` (componentes, pantallas)
- `src/transacciones` (misma estructura)

**Datos de prueba:**

- 20 fincas.
- 100 transacciones (50 ingresos, 50 gastos).
- Usuario mock autenticado.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Estructura de capas y módulos

**Objetivo:** Validar que la estructura de paquetes respeta las capas y los módulos definidos.

#### Procedimiento
1. Revisar la estructura de paquetes del backend.
2. Verificar que cada módulo tiene sus capas `dominio`, `aplicacion`, `infraestructura`, `presentacion`.
3. Verificar que las dependencias entre capas respetan la dirección: presentación → aplicación → dominio ← infraestructura.
4. Revisar la estructura de carpetas del frontend.
5. Verificar que cada módulo tiene sus capas `dominio`, `aplicacion`, `infraestructura`, `presentacion`.
6. Verificar que las dependencias entre capas respetan la dirección definida.

#### Resultado esperado
- La estructura respeta las capas y los módulos.
- Las dependencias son correctas (el dominio no depende de infraestructura ni de presentación).
- No hay dependencias cíclicas.
- La estructura es consistente entre backend y frontend.

---

### 7.2 Prueba 2 — Testabilidad por capa y por módulo

**Objetivo:** Validar que cada capa y módulo puede probarse de forma aislada.

#### Procedimiento
1. Escribir pruebas unitarias para el dominio (reglas de negocio).
2. Escribir pruebas unitarias para los servicios de aplicación (con repositorios mockeados).
3. Escribir pruebas de integración para los repositorios JPA (con Testcontainers o H2).
4. Escribir pruebas de controladores REST con MockMvc.
5. Repetir para el frontend: pruebas unitarias de dominio, aplicación y repositorios.
6. Medir el tiempo de ejecución de cada suite de pruebas.

#### Resultado esperado
- Cada capa y módulo tiene pruebas unitarias.
- Las pruebas de dominio no dependen de frameworks ni bases de datos.
- Las pruebas de aplicación usan mocks de repositorios.
- Las pruebas de integración validan la persistencia real.
- El tiempo de ejecución de las pruebas es razonable (< 2 minutos por suite).

---

### 7.3 Prueba 3 — Patrón Repository en backend

**Objetivo:** Validar que el patrón Repository abstrae correctamente el acceso a datos.

#### Procedimiento
1. Definir la interfaz `FincaRepository` en el dominio.
2. Implementar `JpaFincaRepository` en infraestructura.
3. Definir la interfaz `TransaccionRepository` en el dominio.
4. Implementar `JpaTransaccionRepository` en infraestructura.
5. Inyectar los repositorios en los servicios de aplicación.
6. Simular el cambio de implementación (ej. usar un repositorio en memoria) sin afectar el dominio.
7. Verificar que el dominio no importa clases de JPA ni de Spring.

#### Resultado esperado
- El dominio define interfaces de repositorio.
- La infraestructura implementa las interfaces.
- Los servicios de aplicación dependen de las interfaces, no de las implementaciones.
- Cambiar la implementación no afecta al dominio.
- El dominio no tiene dependencias de JPA ni Spring.

---

### 7.4 Prueba 4 — Patrón Repository en frontend

**Objetivo:** Validar que el patrón Repository abstrae correctamente el acceso a datos en el cliente.

#### Procedimiento
1. Definir la interfaz `FincaRepository` en el dominio.
2. Implementar `FincaRepositoryImpl` que combina SQLite local y Axios remoto.
3. Definir la interfaz `TransaccionRepository` en el dominio.
4. Implementar `TransaccionRepositoryImpl` que combina SQLite local y Axios remoto.
5. Inyectar los repositorios en los hooks y casos de uso.
6. Simular el cambio de implementación (ej. usar solo SQLite) sin afectar el dominio.
7. Verificar que el dominio no importa SQLite ni Axios.

#### Resultado esperado
- El dominio define interfaces de repositorio.
- La infraestructura implementa las interfaces combinando SQLite y Axios.
- Los hooks y casos de uso dependen de las interfaces.
- Cambiar la implementación no afecta al dominio.
- El dominio no tiene dependencias de SQLite ni Axios.

---

### 7.5 Prueba 5 — Integración backend-frontend mediante contratos

**Objetivo:** Validar que el frontend consume los endpoints REST correctamente y que los contratos se respetan.

#### Procedimiento
1. Generar el contrato OpenAPI desde el backend.
2. Generar un cliente TypeScript a partir del contrato.
3. Consumir los endpoints de `fincas` y `transacciones` desde el frontend.
4. Verificar que los DTOs de request/response coinciden.
5. Verificar que los errores se manejan correctamente.
6. Verificar que la autenticación JWT se inyecta correctamente.

#### Resultado esperado
- El contrato OpenAPI se genera sin errores.
- El cliente TypeScript compila y consume los endpoints.
- Los DTOs coinciden entre backend y frontend.
- Los errores se manejan correctamente.
- La autenticación JWT funciona.

---

### 7.6 Prueba 6 — Facilidad de añadir un nuevo módulo

**Objetivo:** Validar que añadir un nuevo módulo de dominio es sencillo y no afecta a los existentes.

#### Procedimiento
1. Simular la incorporación de un nuevo módulo `cultivos`.
2. Crear la estructura de capas en backend y frontend.
3. Implementar un CRUD básico.
4. Verificar que no se modifica ningún archivo de `fincas` ni de `transacciones`.
5. Verificar que las pruebas existentes siguen pasando.
6. Medir el tiempo de implementación.

#### Resultado esperado
- El nuevo módulo se añade sin modificar los existentes.
- Las pruebas existentes siguen pasando.
- El tiempo de implementación es razonable (< 4 horas para un CRUD básico).
- La estructura es consistente con los módulos existentes.

---

### 7.7 Prueba 7 — Facilidad de cambiar la implementación de un repositorio

**Objetivo:** Validar que cambiar la implementación de un repositorio no afecta al dominio ni a la aplicación.

#### Procedimiento
1. En backend, cambiar `JpaFincaRepository` por una implementación en memoria.
2. Verificar que el dominio y la aplicación no se modifican.
3. Verificar que las pruebas de aplicación siguen pasando.
4. En frontend, cambiar `FincaRepositoryImpl` para que use solo SQLite (sin Axios).
5. Verificar que el dominio y la aplicación no se modifican.
6. Verificar que las pruebas de aplicación siguen pasando.

#### Resultado esperado
- Cambiar la implementación no afecta al dominio ni a la aplicación.
- Las pruebas de aplicación siguen pasando.
- El cambio es localizado en infraestructura.
- El principio de inversión de dependencias se respeta.

---

### 7.8 Prueba 8 — Rendimiento del backend con capas

**Objetivo:** Medir el impacto de las capas en el rendimiento del backend.

#### Procedimiento
1. Consumir `GET /api/v1/fincas` con 20 fincas.
2. Consumir `GET /api/v1/transacciones` con 100 transacciones.
3. Consumir `GET /api/v1/resumen` con 100 transacciones.
4. Medir los tiempos de respuesta.
5. Comparar con un endpoint sin capas (monolítico).
6. Repetir 3 veces y promediar.

#### Resultado esperado
- Los tiempos de respuesta se mantienen dentro de los umbrales (≤ 3 s consultas, ≤ 5 s resúmenes).
- La diferencia con el endpoint sin capas es mínima (< 10 %).
- Las capas no degradan el rendimiento significativamente.

---

### 7.9 Prueba 9 — Facilidad de extraer un módulo a microservicio

**Objetivo:** Validar que un módulo podría extraerse a microservicio sin reescribir el resto.

#### Procedimiento
1. Seleccionar el módulo `fincas`.
2. Simular su extracción a un servicio independiente (solo análisis).
3. Verificar que las interfaces de repositorio y los contratos REST permiten la extracción.
4. Documentar los cambios necesarios (configuración de red, descubrimiento, etc.).
5. Evaluar el esfuerzo estimado.

#### Resultado esperado
- El módulo puede extraerse sin modificar el dominio ni la aplicación de otros módulos.
- Los contratos REST se mantienen.
- El esfuerzo estimado es razonable (no requiere reescribir todo).
- La arquitectura permite la evolución a microservicios.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Estructura**: La estructura de capas y módulos se respeta en backend y frontend.
2. **Testabilidad**: Cada capa y módulo tiene pruebas unitarias e integración.
3. **Patrón Repository (backend)**: El dominio define interfaces y la infraestructura las implementa.
4. **Patrón Repository (frontend)**: El dominio define interfaces y la infraestructura combina SQLite y Axios.
5. **Integración**: El frontend consume los endpoints REST correctamente mediante contratos OpenAPI.
6. **Nuevo módulo**: Añadir un módulo no afecta a los existentes y es rápido.
7. **Cambio de repositorio**: Cambiar la implementación no afecta al dominio ni a la aplicación.
8. **Rendimiento**: Las capas no degradan el rendimiento significativamente (< 10 %).
9. **Evolución**: Un módulo puede extraerse a microservicio sin reescribir el resto.

El Spike se considerará **RECHAZADO** si:

- La estructura de capas no se respeta o hay dependencias cíclicas.
- Alguna capa o módulo no puede probarse de forma aislada.
- El patrón Repository no abstrae correctamente el acceso a datos.
- El frontend no consume los endpoints correctamente.
- Añadir un módulo requiere modificar los existentes.
- Cambiar la implementación de un repositorio afecta al dominio.
- Las capas degradan el rendimiento significativamente.
- La extracción a microservicio requiere reescribir todo.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Persistencia**: Spring Data JPA + PostgreSQL (o H2 en memoria para pruebas).
- **Seguridad**: Spring Security + JWT (mínimo).
- **Documentación**: SpringDoc OpenAPI.
- **Pruebas backend**: JUnit 5, Mockito, Spring Boot Test, Testcontainers (o H2).
- **Frontend**: React Native + TypeScript.
- **Persistencia local**: SQLite (`@op-engineering/op-sqlite`).
- **HTTP**: Axios.
- **Almacenamiento seguro**: SecureStore.
- **Conectividad**: NetInfo.
- **Pruebas frontend**: Jest, React Native Testing Library.
- **Medición**: `console.time`, React Native DevTools, Postman, JMeter o k6.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La separación por capas puede parecer sobre-ingeniería al inicio.
  - **Mitigación**: Documentar el propósito de cada capa y mantener las capas mínimas necesarias.

- **Riesgo**: El patrón Repository puede añadir complejidad si se abusa de abstracciones.
  - **Mitigación**: Definir repositorios solo donde sea necesario y evitar interfaces innecesarias.

- **Riesgo**: La estructura de carpetas puede volverse inconsistente entre backend y frontend.
  - **Mitigación**: Definir una convención clara y documentarla.

- **Riesgo**: Las pruebas de integración pueden ser lentas si se usa PostgreSQL real.
  - **Mitigación**: Usar H2 en memoria para pruebas rápidas y Testcontainers para pruebas de integración reales.

- **Riesgo**: El tiempo de implementación de un nuevo módulo puede ser mayor al esperado.
  - **Mitigación**: Documentar el proceso de creación de un módulo y usar plantillas.

- **Riesgo**: La extracción a microservicio puede requerir cambios en la configuración de red.
  - **Mitigación**: Documentar los pasos necesarios y evaluar el esfuerzo sin implementar la extracción completa.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 9 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6, 7, 8 y 9 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Backend Spring Boot con estructura de capas y módulos `fincas` y `transacciones`.
   - Frontend React Native con estructura de capas y módulos `fincas` y `transacciones`.
   - Patrón Repository implementado en backend y frontend.
   - Contratos OpenAPI generados.
   - Pruebas unitarias e integración.
2. **Reporte de métricas**:
   - Tiempo de ejecución de cada suite de pruebas.
   - Tiempo de respuesta de endpoints con capas vs sin capas.
   - Tiempo de implementación de un nuevo módulo.
   - Tiempo de cambio de implementación de un repositorio.
   - Esfuerzo estimado para extraer un módulo a microservicio.
3. **Evidencia**:
   - Diagrama de arquitectura de capas y módulos.
   - Capturas de la estructura de paquetes y carpetas.
   - Capturas de las pruebas ejecutándose.
   - Capturas de los endpoints respondiendo.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿La estructura de capas y módulos se respetó?
  - ✅ / ❌ ¿Cada capa y módulo tuvo pruebas unitarias e integración?
  - ✅ / ❌ ¿El patrón Repository en backend abstrajo correctamente el acceso a datos?
  - ✅ / ❌ ¿El patrón Repository en frontend combinó SQLite y Axios correctamente?
  - ✅ / ❌ ¿El frontend consumió los endpoints mediante contratos OpenAPI?
  - ✅ / ❌ ¿Añadir un nuevo módulo no afectó a los existentes?
  - ✅ / ❌ ¿Cambiar la implementación de un repositorio no afectó al dominio?
  - ✅ / ❌ ¿Las capas no degradaron el rendimiento significativamente?
  - ✅ / ❌ ¿Un módulo podría extraerse a microservicio sin reescribir todo?

- **Lecciones aprendidas**:
  - (Ejemplo: "Definir las interfaces de repositorio en el dominio es clave para la inversión de dependencias.")
  - (Ejemplo: "La estructura de carpetas consistente entre backend y frontend facilita la navegación del código.")
  - (Ejemplo: "Usar H2 en memoria para pruebas rápidas y Testcontainers para integración real es un buen equilibrio.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Documentar la arquitectura con un diagrama de capas y módulos.")
  - (Ejemplo: "Definir una plantilla para crear nuevos módulos.")
  - (Ejemplo: "Mantener las interfaces de repositorio en el dominio y las implementaciones en infraestructura.")
  - (Ejemplo: "No caer en la tentación de microservicios prematuros.")
  - (Ejemplo: "Revisar periódicamente que las dependencias entre capas se respeten.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)