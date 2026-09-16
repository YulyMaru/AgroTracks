# SPIKE-002: Validar reglas centralizadas de formularios

## Información general

- **ID:** SPIKE-002
- **Nombre:** Validar reglas centralizadas de validación en cliente y servidor
- **ADR relacionado:** ADR-002 — Validar formularios con reglas centralizadas
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles (24 horas hombre)

## 1. Objetivo

Validar técnicamente que AgroTrack puede aplicar las mismas reglas de validación en el dispositivo móvil (sin conexión) y en el servidor, garantizando que el usuario reciba retroalimentación inmediata al llenar un formulario y que el backend no acepte datos inválidos, cumpliendo con el escenario ESC-CAL-US-XX (validación de formularios).

El Spike busca comprobar que la estrategia seleccionada en el ADR-002, basada en un repositorio único de reglas (ej. JSON Schema) compartido entre cliente y servidor, es viable antes de implementar la funcionalidad en todos los formularios de la aplicación.

## 2. Problema que se busca validar

AgroTrack debe permitir que el campesino corrija errores en formularios de forma intuitiva, pero actualmente existe el riesgo de que:

- Las reglas de validación en el móvil y en el servidor se desincronicen (un campo válido en el móvil es rechazado en el servidor).
- El usuario no sepa qué campo está mal o por qué, generando frustración.
- Los datos válidos ingresados se pierdan al tener que recargar el formulario tras un error de servidor.
- La validación sea demasiado lenta porque depende de una llamada a la API.
- El esquema de reglas cambie en el servidor y el cliente quede desactualizado sin mecanismo de versionado.

Por esta razón, se necesita una prueba técnica que demuestre que compartir reglas es sencillo, rápido y mejora la experiencia.

## 3. Pregunta principal del Spike

¿Es posible definir un conjunto de reglas de validación (ej. usando JSON Schema) en un solo lugar, empaquetarlas dentro de la aplicación móvil para validación offline instantánea y reutilizarlas en el backend (Node.js/Spring Boot) para validar los datos entrantes, mostrando mensajes de error específicos y conservando los datos válidos?

## 4. Hipótesis

Si definimos las reglas de validación en un archivo JSON centralizado, entonces:

- El cliente móvil podrá parsear ese JSON y validar los campos al vuelo (evento `onBlur`) en < 50 ms, sin necesidad de llamadas a la red.
- El servidor podrá importar el mismo JSON para validar el payload completo del endpoint.
- Si ambos lados usan la misma librería de validación (ej. `ajv` en JS o `everit-json-schema` en Java), la consistencia estará garantizada al 100 %.
- Los mensajes de error estarán predefinidos en el JSON, mostrando texto claro ("El campo 'Valor' debe ser un número positivo") en lugar de errores genéricos.
- El formulario conservará todos los datos válidos, resaltando solo los campos erróneos.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá únicamente los elementos necesarios para validar la estrategia:

- Definición de un esquema JSON con 3 reglas típicas (obligatorio, formato numérico, longitud máxima).
- Una librería validadora en el cliente (ej. `ajv` para React Native / JavaScript).
- Una librería validadora en el servidor (ej. `ajv` o la nativa del framework).
- Un formulario de ejemplo con 3 campos (Descripción, Valor, Fecha).
- Validación en tiempo real al perder el foco (`onBlur`) mostrando mensaje en rojo debajo del campo.
- Validación al enviar el formulario (que ejecuta las mismas reglas localmente antes de llamar al API).
- Endpoint de prueba en el servidor que valida el payload con el mismo esquema.
- Prueba de consistencia: forzar un cambio en el JSON y verificar que ambos lados lo reflejan (o manejo de versiones).
- Logs básicos de validación en cliente y servidor.

### 5.2 No incluye

El Spike no implementará:

- Todos los formularios de AgroTrack (solo un formulario de ejemplo).
- Validaciones con dependencias entre campos (ej. "Si X > 0 entonces Y es obligatorio").
- Sistema de internacionalización de mensajes (solo español).
- Interfaz gráfica definitiva ni estilos pulidos.
- Actualización dinámica de reglas desde el servidor sin actualizar la app (aunque se dejará preparado).
- Integración con el motor de sincronización offline (SPIKE-001).
- Pruebas de rendimiento con miles de reglas.

## 6. Caso de prueba principal

Se utilizará un formulario de ejemplo de AgroTrack (similar al registro de "Gasto") para comprobar todo el ciclo de validación.

**Campos del formulario:**

1. **Descripción**: Texto, obligatorio, máximo 100 caracteres.
   - Ejemplo válido: "Compra de fertilizante"
   - Ejemplo inválido: cadena de 150 caracteres.
2. **Valor**: Número, obligatorio, mayor a 0.
   - Ejemplo válido: 50000
   - Ejemplo inválido: "ABC" o -500
3. **Fecha**: Fecha, obligatorio, formato YYYY-MM-DD.
   - Ejemplo válido: "2026-01-15"
   - Ejemplo inválido: "" (vacío)

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Validación inmediata en cliente (Offline)

**Objetivo:** Comprobar que el cliente valida los campos instantáneamente sin llamar al servidor, mostrando mensajes claros, y conserva los datos válidos.

#### Procedimiento
1. Desactivar la conexión a Internet del dispositivo (modo avión).
2. Abrir el formulario de prueba.
3. Escribir una descripción de 150 caracteres (excede el máximo).
4. Salir del campo (evento `onBlur`).
5. Observar el mensaje de error.
6. Corregir la descripción a 50 caracteres.
7. Dejar el campo "Valor" vacío y salir.
8. Llenar "Valor" con 5000.
9. Enviar el formulario (debería fallar porque la fecha está vacía).
10. Llenar la fecha y enviar nuevamente.

#### Resultado esperado
- Al salir del campo con 150 caracteres, el sistema debe mostrar inmediatamente: *"La descripción no puede superar los 100 caracteres"*.
- Al corregir a 50, el mensaje de error debe desaparecer automáticamente.
- Al dejar "Valor" vacío, debe mostrar: *"El valor es obligatorio"*.
- Al enviar con fecha vacía, el sistema debe detener el envío y resaltar el campo de fecha sin perder la descripción ni el valor ya ingresados.
- Una vez corregido todo, el envío debe ser exitoso (o quedar pendiente en la cola de sincronización).
- El tiempo de validación debe ser < 50 ms.

---

### 7.2 Prueba 2 — Consistencia servidor/cliente (reglas centralizadas)

**Objetivo:** Validar que el servidor rechaza exactamente los mismos datos que el cliente, evitando duplicación de lógica.

#### Procedimiento
1. Con conexión activa, abrir el formulario.
2. Ingresar un valor de texto en el campo "Valor" (ej. "ABC").
3. El cliente debería rechazarlo inmediatamente (no permite enviar).
4. Forzar el envío mediante una herramienta externa (Postman) al endpoint, enviando `{"descripcion": "test", "valor": "ABC", "fecha": "2026-01-15"}`.
5. Verificar la respuesta del servidor.

#### Resultado esperado
- El cliente rechaza el envío y muestra: *"El valor debe ser un número"*.
- El servidor devuelve un error HTTP 400 con el mismo mensaje (o uno estructuralmente idéntico): *"El valor debe ser un número"*.
- **Éxito crítico**: No hay discrepancia entre el mensaje del cliente y el del servidor.

---

### 7.3 Prueba 3 — Evolución de reglas (cambio de requisito)

**Objetivo:** Simular un cambio en una regla de negocio y verificar cómo se maneja hasta que el cliente se actualice.

#### Procedimiento
1. El esquema JSON inicial permite valores hasta 100.000.
2. El negocio cambia y el tope máximo sube a 500.000.
3. Actualizar el esquema en el servidor (sin actualizar la app móvil).
4. Desde un dispositivo con la regla antigua (100.000), enviar un valor de 300.000.
5. Observar el comportamiento del servidor.

#### Resultado esperado
- El cliente (regla antigua) valida 300.000 como correcto y lo envía.
- El servidor (regla nueva) recibe 300.000, lo valida contra el límite de 500.000 y lo acepta.
- **Conclusión**: El servidor siempre es la fuente de verdad final. El cliente mejora la experiencia, pero el servidor garantiza la integridad.
- *Nota*: Si el valor fuera 600.000, el servidor lo rechazaría aunque el cliente lo acepte (lo cual es correcto, pues el cliente está desactualizado temporalmente). Esto demuestra la necesidad de versionado de esquemas en el futuro.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Tiempo de validación**: La validación en cliente (para 3 campos) se ejecuta en menos de **50 ms** (imperceptible para el usuario).
2. **Consistencia**: El backend y el frontend usan el **mismo archivo JSON** (copia estática) para validar, sin necesidad de escribir lógica dos veces.
3. **Mensajes de error**: El 100 % de los mensajes de error son específicos al campo y contienen la acción a realizar (ej. *"Ingrese un número mayor a 0"*).
4. **Persistencia de datos**: Al corregir un error, los datos de los otros campos permanecen intactos en el estado del formulario.
5. **Cobertura offline**: El 100 % de las validaciones (sintácticas y de formato) funcionan sin conexión a Internet.

El Spike se considerará **RECHAZADO** si:

- El cliente y el servidor producen mensajes de error diferentes para el mismo dato inválido.
- La validación en cliente tarda más de 50 ms.
- Los datos válidos se pierden al corregir un campo.
- Alguna validación requiere conexión a Internet.

## 9. Entorno técnico del spike

Para la ejecución de este Spike, se utilizará el siguiente stack mínimo:

- **Cliente móvil**: React Native (o Flutter) con la librería `ajv` (JSON Schema validator).
- **Servidor**: Node.js con Express (o Spring Boot) utilizando la misma librería `ajv` (en Node) o `json-schema-validator` en Java.
- **Almacenamiento del esquema**: Archivo `validation-schema.json` alojado en el repositorio central, copiado manualmente durante el build a las carpetas `assets/` del móvil y `resources/` del backend.
- **Estado del formulario**: `useState` (React) o `setState` gestionando un objeto con los valores y un objeto con los errores.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La librería `ajv` no funciona correctamente en el entorno móvil (React Native) por problemas de polyfills.
  - **Mitigación**: Investigar previamente si `ajv` tiene soporte para RN o usar `zod` (que tiene mejor soporte multiplataforma). Ajustar el stack en el día 1 si es necesario.

- **Riesgo**: El tamaño del JSON de reglas crezca mucho y ralentice la carga inicial.
  - **Mitigación**: Para el spike solo usaremos 3 reglas. Si funciona, en la implementación final se evaluará la compresión o carga diferida.

- **Riesgo**: El esquema de reglas se actualice en el servidor y el cliente quede desactualizado, generando discrepancias.
  - **Mitigación**: Documentar el problema en el spike (Prueba 3) y proponer un mecanismo de versionado de esquemas para la implementación final. No se implementará en el spike.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con el cliente y servidor de prueba.
2. **Evidencia en video** (máx 2 minutos) mostrando las 3 pruebas funcionando (offline, consistencia, cambio de regla).
3. **Capturas de pantalla o logs** que demuestren:
   - Los mensajes de error en cliente y servidor.
   - Los tiempos de validación.
   - La respuesta del servidor al cambio de regla.
4. **Este documento actualizado** con la sección de "Conclusión" llenada (qué funcionó, qué no, y recomendaciones para la implementación final).

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿La validación en cliente se ejecutó en < 50 ms?
  - ✅ / ❌ ¿El cliente y el servidor usaron el mismo archivo JSON?
  - ✅ / ❌ ¿Los mensajes de error fueron idénticos en cliente y servidor?
  - ✅ / ❌ ¿Los datos válidos se conservaron al corregir errores?
  - ✅ / ❌ ¿La validación funcionó sin conexión?

- **Lecciones aprendidas**:
  - (Ejemplo: "El uso de `ajv` en React Native requiere polyfills específicos.")
  - (Ejemplo: "El versionado de esquemas es necesario si las reglas cambian con frecuencia.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Empaquetar el esquema en la app y usar un mecanismo de actualización por API.")
  - (Ejemplo: "Definir un sistema de versionado de esquemas desde el inicio.")
  - (Ejemplo: "Automatizar pruebas que verifiquen consistencia entre cliente y servidor.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)