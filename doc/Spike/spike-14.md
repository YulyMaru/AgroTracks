# SPIKE-014: Validar reactividad basada en componentes en la UI móvil

## Información general

- **ID:** SPIKE-014
- **Nombre:** Validar reactividad basada en componentes (hooks/estado) en React Native
- **ADR relacionado:** ADR-014 — Aplicación móvil reactiva basada en componentes
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad), ADR-010 (Estandarizar táctil y valores con unidades), ADR-013 (Base de datos relacional SQL), ADR-017 (Stack frontend móvil)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles

## 1. Objetivo

Validar técnicamente que la reactividad basada en componentes (React Native + hooks/estado local y compartido) es suficiente para construir una interfaz fluida, mantenible y con buen rendimiento en dispositivos de gama baja, sin necesidad de adoptar programación reactiva pura (RxJS) ni enfoques imperativos.

El Spike busca comprobar que el paradigma seleccionado en ADR-014 permite cumplir con los escenarios de usabilidad (ESC-CAL-US-01, ESC-CAL-US-03, ESC-CAL-US-06, ESC-CAL-US-13) y accesibilidad (ESC-CAL-ACC-02), integrando sin fricción el repositorio local (SQLite), el motor de sincronización y las validaciones centralizadas.

## 2. Problema que se busca validar

AgroTrack debe ofrecer una interfaz sencilla, rápida y clara para campesinos, pero existen riesgos de que:

- La UI se vuelva lenta o se congele al renderizar listas con cientos de registros.
- El manejo de estado se complique y genere re-renderizados innecesarios.
- La integración con SQLite y el motor de sincronización provoque condiciones de carrera o estados inconsistentes.
- El equipo adopte un paradigma (RxJS) que retrase el desarrollo y aumente la deuda técnica.
- El estado global se disperse y dificulte el testing y la mantenibilidad.
- La UI no responda de forma inmediata a las acciones del usuario en dispositivos de gama baja.

Por esta razón, se necesita un prototipo que implemente las pantallas principales de AgroTrack con reactividad basada en componentes y mida su comportamiento real en dispositivos de gama baja, media y alta.

## 3. Pregunta principal del Spike

¿La reactividad basada en componentes (React Native + hooks/estado) permite construir una UI fluida (≤ 16 ms por frame), con listas de hasta 500 ítems sin re-renderizados innecesarios, integrada con SQLite y el motor de sincronización, y con un tiempo de desarrollo menor que una implementación equivalente con RxJS?

## 4. Hipótesis

Si implementamos:

- Componentes funcionales con `useState`, `useReducer` y `useContext`.
- Efectos secundarios con `useEffect` para NetInfo, carga inicial y sincronización.
- Listas con `FlatList` y `React.memo` para evitar re-renderizados.
- Optimización con `useMemo` y `useCallback`.
- Estado global con Context para autenticación y tema.
- Operaciones asíncronas con async/await para SQLite y HTTP.

Entonces:

- La UI responderá en ≤ 16 ms por frame en los tres dispositivos de prueba.
- Las listas de 100, 300 y 500 ítems se renderizarán sin bloqueos perceptibles.
- El número de re-renderizados será mínimo y controlado.
- La integración con SQLite y el motor de sincronización será estable y sin condiciones de carrera.
- El tiempo de desarrollo será menor que con RxJS (medido en horas de implementación de las mismas pantallas).
- El código será más legible y fácil de probar.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Implementación de tres pantallas representativas:
  1. **Lista de transacciones** con paginación y filtros por tipo.
  2. **Resumen económico** con tarjetas diferenciadas (ADR-003).
  3. **Formulario de registro de gasto** con validación (ADR-002) y guardado offline.
- Manejo de estado local con `useState` y `useReducer`.
- Manejo de estado compartido con `useContext` para autenticación y tema.
- Listas con `FlatList` y `React.memo`.
- Optimización con `useMemo` y `useCallback`.
- Integración con SQLite (a través de un repositorio mock o real).
- Integración con NetInfo para detectar conectividad.
- Integración con el motor de sincronización (mock).
- Medición de tiempos de renderizado y número de re-renderizados.
- Pruebas de usabilidad básicas con 3 participantes.
- Comparación cualitativa con una pequeña implementación con RxJS (opcional, si el tiempo lo permite).

### 5.2 No incluye

El Spike no implementará:

- Todas las pantallas de AgroTrack (solo las tres representativas).
- La interfaz definitiva ni el sistema de diseño completo.
- La lógica completa de sincronización (solo un mock).
- El modelo de datos definitivo de SQLite (se usará un repositorio simplificado).
- Autenticación real (se usará un mock de usuario).
- Pruebas en iOS (solo Android).
- Internacionalización ni accesibilidad avanzada.
- Pruebas de carga con más de 500 ítems.

## 6. Caso de prueba principal

**Pantallas a implementar:**

1. **Lista de transacciones**: muestra 500 transacciones con paginación (20 por página), filtro por tipo (ingreso/gasto) y fecha.
2. **Resumen económico**: tres tarjetas diferenciadas (Ingresos, Gastos, Resultado) con datos de 500 transacciones.
3. **Formulario de gasto**: campos descripción, valor, fecha y categoría, con validación offline y guardado en repositorio local.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

**Datos de prueba:**

- 500 transacciones (250 ingresos, 250 gastos).
- 20 fincas, 100 lotes, 50 cultivos.
- Usuario mock autenticado.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Rendimiento de renderizado de listas

**Objetivo:** Medir el tiempo de renderizado y la fluidez de la lista de transacciones con diferentes volúmenes.

#### Procedimiento
1. Cargar la lista de transacciones con 100, 300 y 500 ítems.
2. Medir el tiempo desde que se abre la pantalla hasta que se renderizan los primeros 20 ítems.
3. Hacer scroll hasta el final de la lista y medir la fluidez (FPS).
4. Repetir 3 veces por volumen y promediar.
5. Repetir en los tres dispositivos.

#### Resultado esperado
- Renderizado inicial ≤ 300 ms para 100 ítems.
- Renderizado inicial ≤ 500 ms para 500 ítems (con paginación).
- Fluidez ≥ 55 FPS durante el scroll.
- Sin bloqueos perceptibles ni frames congelados.
- La lista no se re-renderiza completa al cambiar un solo ítem.

---

### 7.2 Prueba 2 — Re-renderizados innecesarios

**Objetivo:** Validar que los componentes no se re-renderizan sin necesidad.

#### Procedimiento
1. Instrumentar los componentes con un contador de renders (usando `useEffect` o `console.log`).
2. Abrir la lista de transacciones.
3. Cambiar el filtro de tipo (ingreso/gasto).
4. Verificar cuántos componentes se re-renderizan.
5. Seleccionar una transacción y verificar que solo se re-renderiza el ítem afectado.

#### Resultado esperado
- Al cambiar el filtro, solo se re-renderiza la lista y los ítems visibles, no todos los 500.
- Al seleccionar un ítem, solo se re-renderiza ese ítem.
- El uso de `React.memo`, `useMemo` y `useCallback` reduce los re-renderizados a lo mínimo.

---

### 7.3 Prueba 3 — Integración con SQLite y sincronización

**Objetivo:** Validar que la reactividad basada en componentes se integra sin fricción con el repositorio local y el motor de sincronización.

#### Procedimiento
1. Abrir el formulario de gasto.
2. Llenar los campos y guardar (sin conexión).
3. Verificar que el gasto se guarda en el repositorio local (mock o SQLite).
4. Verificar que la lista de transacciones se actualiza automáticamente.
5. Simular recuperación de conexión y verificar que el motor de sincronización procesa el gasto.
6. Verificar que la UI refleja el cambio de estado (pendiente → sincronizado).

#### Resultado esperado
- El gasto se guarda correctamente sin conexión.
- La lista se actualiza automáticamente al guardar.
- El estado del gasto cambia de pendiente a sincronizado sin intervención manual.
- No hay condiciones de carrera ni estados inconsistentes.

---

### 7.4 Prueba 4 — Renderizado del resumen económico

**Objetivo:** Validar que el panel de resultados económicos se renderiza en el tiempo definido (ADR-003).

#### Procedimiento
1. Cargar 500 transacciones.
2. Abrir el resumen económico.
3. Medir el tiempo desde que se solicita el resumen hasta que se renderizan las tres tarjetas.
4. Repetir 3 veces y promediar.
5. Repetir en los tres dispositivos.

#### Resultado esperado
- Tiempo de cálculo y renderizado ≤ 300 ms para 500 movimientos.
- Las tarjetas se muestran correctamente diferenciadas.
- La UI no se congela durante el cálculo.

---

### 7.5 Prueba 5 — Validación offline en formulario

**Objetivo:** Validar que la validación centralizada (ADR-002) funciona sin conexión y muestra mensajes claros.

#### Procedimiento
1. Desactivar la conexión.
2. Abrir el formulario de gasto.
3. Ingresar una descripción de 150 caracteres (excede el máximo).
4. Salir del campo y verificar el mensaje de error.
5. Corregir la descripción.
6. Dejar el valor vacío y verificar el mensaje.
7. Llenar todos los campos correctamente y guardar.

#### Resultado esperado
- Los mensajes de error aparecen en ≤ 50 ms.
- Los datos válidos se conservan al corregir un campo.
- El formulario se guarda correctamente sin conexión.
- La UI no se bloquea durante la validación.

---

### 7.6 Prueba 6 — Comparación cualitativa con RxJS (opcional)

**Objetivo:** Comparar la facilidad de implementación y la legibilidad del código entre el enfoque de componentes y una implementación mínima con RxJS.

#### Procedimiento
1. Implementar la misma pantalla de lista de transacciones con RxJS (solo si el tiempo lo permite).
2. Medir el tiempo de desarrollo en horas.
3. Comparar la cantidad de líneas de código.
4. Comparar la facilidad de debugging.
5. Documentar conclusiones cualitativas.

#### Resultado esperado
- El enfoque de componentes requiere menos código y menos tiempo de desarrollo.
- El código es más legible y fácil de probar.
- RxJS añade complejidad innecesaria para este dominio.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Renderizado de listas**: ≤ 300 ms para 100 ítems y ≤ 500 ms para 500 ítems (con paginación).
2. **Fluidez**: ≥ 55 FPS durante el scroll en los tres dispositivos.
3. **Re-renderizados**: mínimos y controlados; solo se re-renderizan los componentes afectados.
4. **Integración**: la UI se actualiza automáticamente al guardar en SQLite y al sincronizar.
5. **Resumen económico**: ≤ 300 ms para 500 movimientos.
6. **Validación offline**: mensajes de error en ≤ 50 ms y conservación de datos válidos.
7. **Comparación con RxJS**: el enfoque de componentes es más simple y rápido de implementar (si se ejecuta la prueba 6).

El Spike se considerará **RECHAZADO** si:

- El renderizado de listas supera los 500 ms para 500 ítems.
- La fluidez cae por debajo de 40 FPS durante el scroll.
- Se detectan re-renderizados innecesarios masivos.
- La UI no se actualiza automáticamente al guardar o sincronizar.
- El resumen económico supera los 500 ms para 500 movimientos.
- La validación offline tarda más de 100 ms.

## 9. Entorno técnico del spike

- **Cliente móvil**: React Native + TypeScript.
- **Navegación**: React Navigation.
- **Estado**: `useState`, `useReducer`, `useContext`.
- **Listas**: `FlatList` con `React.memo`.
- **Optimización**: `useMemo`, `useCallback`.
- **Repositorio local**: mock o SQLite (según ADR-013).
- **Conectividad**: `@react-native-community/netinfo`.
- **Motor de sincronización**: mock (log en consola).
- **Medición**: React DevTools Profiler, React Native DevTools, `console.time` / `console.timeEnd`.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: `FlatList` puede no ser suficiente para listas muy largas.
  - **Mitigación**: Usar `getItemLayout` y `windowSize` para optimizar. Si es necesario, evaluar `FlashList`.

- **Riesgo**: El estado global con Context puede provocar re-renderizados masivos.
  - **Mitigación**: Dividir el Context en varios (autenticación, tema, datos) y usar `useMemo` en el provider.

- **Riesgo**: La integración con SQLite puede introducir latencia en la UI.
  - **Mitigación**: Ejecutar consultas en segundo plano y actualizar el estado al recibir la respuesta.

- **Riesgo**: La comparación con RxJS puede consumir demasiado tiempo.
  - **Mitigación**: Hacerla solo si las pruebas 1–5 se completan antes del timebox.

- **Riesgo**: Los dispositivos de gama baja pueden no alcanzar los FPS esperados.
  - **Mitigación**: Reducir la complejidad visual, usar `memo` y evitar animaciones pesadas.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Tres pantallas implementadas (lista, resumen, formulario).
   - Componentes optimizados con `memo`, `useMemo` y `useCallback`.
   - Integración con repositorio local (mock o SQLite).
   - Integración con NetInfo y motor de sincronización mock.
2. **Reporte de métricas**:
   - Tiempos de renderizado de listas (100, 300, 500 ítems).
   - FPS durante el scroll en los tres dispositivos.
   - Número de re-renderizados por interacción.
   - Tiempo de renderizado del resumen económico.
   - Tiempo de validación offline.
3. **Evidencia**:
   - Capturas o video del flujo completo.
   - Capturas del React DevTools Profiler mostrando los re-renderizados.
   - Comparación cualitativa con RxJS (si se ejecutó la prueba 6).
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El renderizado de listas cumplió ≤ 300 ms para 100 ítems?
  - ✅ / ❌ ¿El renderizado de listas cumplió ≤ 500 ms para 500 ítems?
  - ✅ / ❌ ¿La fluidez se mantuvo ≥ 55 FPS durante el scroll?
  - ✅ / ❌ ¿Los re-renderizados fueron mínimos y controlados?
  - ✅ / ❌ ¿La UI se actualizó automáticamente al guardar y sincronizar?
  - ✅ / ❌ ¿El resumen económico se renderizó en ≤ 300 ms para 500 movimientos?
  - ✅ / ❌ ¿La validación offline respondió en ≤ 50 ms?
  - ✅ / ❌ ¿La comparación con RxJS confirmó menor complejidad (si se ejecutó)?

- **Lecciones aprendidas**:
  - (Ejemplo: "`FlatList` con `getItemLayout` mejora significativamente el rendimiento en listas largas.")
  - (Ejemplo: "Dividir el Context en varios providers evita re-renderizados masivos.")
  - (Ejemplo: "`useCallback` es esencial en callbacks pasados a `FlatList` para evitar re-renderizados.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar `FlashList` si el volumen de datos crece más allá de 500 ítems.")
  - (Ejemplo: "Instrumentar el número de re-renderizados desde el día 1 para detectar regresiones.")
  - (Ejemplo: "Evitar RxJS a menos que aparezcan flujos en tiempo real.")
  - (Ejemplo: "Definir una guía de estilo para el manejo de estado (local vs global).")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)
