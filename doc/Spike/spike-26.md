# SPIKE-026: Validar la distribución de la app con GitHub Releases y Firebase App Distribution

## Información general

- **ID:** SPIKE-026
- **Nombre:** Validar distribución de la app con GitHub Releases y Firebase App Distribution
- **ADR relacionado:** ADR-026 — Definir el canal de distribución de la aplicación móvil
- **ADR complementarios:** ADR-012 (Validar el funcionamiento de la app en dispositivos Android soportados mediante pruebas manuales en dispositivos físicos propios), ADR-021 (Implementar monitoreo y observabilidad en backend y frontend), ADR-025 (Automatizar integración continua y despliegue con GitHub Actions)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media
- **Timebox estimado:** 2 días hábiles

## 1. Objetivo

Validar técnicamente que GitHub Releases y Firebase App Distribution permiten distribuir el APK de AgroTrack a testers y campesinos del piloto de forma sencilla, gratuita y sin fricción, cumpliendo con los escenarios ESC-CAL-POR-01 y ESC-CAL-SEG-01.

El Spike busca comprobar que la estrategia de distribución seleccionada en ADR-026 es viable antes de implementarla en la primera versión de AgroTrack, sin depender de tiendas alternativas ni de Google Play en la fase de piloto.

## 2. Problema que se busca validar

AgroTrack necesita distribuir su APK a testers y campesinos del piloto, pero existen riesgos de que:

- El proceso de instalación sea demasiado complejo para el campesino.
- El usuario no pueda habilitar "fuentes desconocidas".
- El enlace de GitHub Releases no genere confianza.
- Firebase App Distribution no notifique correctamente a los testers.
- El APK no se instale correctamente en los dispositivos objetivo.
- El pipeline de CI/CD (ADR-025) no logre subir el APK automáticamente.
- El APK no esté firmado correctamente.
- No haya trazabilidad entre versión y usuario.
- El usuario no sepa cómo actualizar la app.

Por esta razón, se necesita un prototipo que configure GitHub Releases y Firebase App Distribution, distribuya el APK a testers y campesinos del piloto, y valide su comportamiento en condiciones reales.

## 3. Pregunta principal del Spike

¿GitHub Releases y Firebase App Distribution permiten distribuir el APK de AgroTrack a testers y campesinos del piloto de forma sencilla, gratuita y sin fricción, con trazabilidad de versiones, y el APK se instala y ejecuta correctamente en los 3 dispositivos Android representativos?

## 4. Hipótesis

Si configuramos:

- **GitHub Releases** para publicar el APK como asset en cada release del repositorio.
- **Firebase App Distribution** con grupos de testers y campesinos del piloto.
- **Pipeline de CI/CD** (ADR-025) que sube el APK a GitHub Releases y Firebase App Distribution automáticamente.
- **Instrucciones de instalación** con capturas de pantalla para habilitar "fuentes desconocidas".
- **APK firmado** con clave de release.
- **Canal de soporte** (WhatsApp o email) para resolver dudas de instalación.

Entonces:

- El APK se subirá correctamente a GitHub Releases.
- Firebase App Distribution notificará a los testers.
- Los testers podrán instalar el APK sin fricción.
- Los 3 dispositivos Android representativos instalarán el APK correctamente.
- La app se ejecutará sin errores.
- Habrá trazabilidad entre versión y tester.
- El proceso será gratuito y automatizado.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Configuración de GitHub Releases**:
  - Crear un tag de release (ej. `v0.1.0-piloto`).
  - Subir el APK firmado como asset.
  - Documentar el enlace de descarga.
- **Configuración de Firebase App Distribution**:
  - Crear un proyecto de Firebase.
  - Configurar Firebase App Distribution.
  - Crear grupos de testers (`testers-internos`, `campesinos-piloto`).
  - Subir el APK y notificar a los grupos.
- **Pipeline de CI/CD**:
  - Configurar el workflow de GitHub Actions (ADR-025) para subir el APK a GitHub Releases y Firebase App Distribution.
  - Verificar que el pipeline se ejecuta correctamente.
- **Instrucciones de instalación**:
  - Crear una guía simple con capturas de pantalla para habilitar "fuentes desconocidas" e instalar el APK.
  - Probar las instrucciones con 2-3 testers no técnicos.
- **Pruebas de instalación**:
  - Instalar el APK en los 3 dispositivos Android representativos.
  - Verificar que la app se ejecuta correctamente.
  - Verificar que el APK está firmado correctamente.
- **Trazabilidad**:
  - Verificar que cada APK está asociado a un tag de release.
  - Verificar que Firebase App Distribution registra qué versión recibió cada tester.
- **Canal de soporte**:
  - Configurar un canal de WhatsApp o email para resolver dudas de instalación.
  - Documentar las preguntas frecuentes.

### 5.2 No incluye

El Spike no implementará:

- Publicación en Google Play (fase posterior, ADR-026).
- Publicación en tiendas alternativas (Uptodown, Aptoide, F-Droid).
- Distribución por email o WhatsApp del APK directamente.
- Distribución por USB.
- Actualizaciones automáticas (Firebase App Distribution solo notifica).
- Analytics de instalaciones más allá de lo que ofrece Firebase.
- Pruebas con más de 5 testers.
- Pruebas en iOS.

## 6. Caso de prueba principal

**Canales a configurar:**

| Canal | Uso | Costo |
|-------|-----|-------|
| GitHub Releases | Publicar APK para descarga directa | $0 |
| Firebase App Distribution | Distribuir APK a testers con notificación | $0 |

**Grupos de testers a configurar:**

| Grupo | Cantidad | Perfil |
|-------|----------|--------|
| `testers-internos` | 3 | Equipo de desarrollo |
| `campesinos-piloto` | 5 | Campesinos seleccionados para el piloto |

**Dispositivos de prueba:**

- Samsung Galaxy A12 (Android 11, RAM 4 GB).
- Xiaomi Redmi Note 10 (Android 12, RAM 6 GB).
- Samsung Galaxy S22 (Android 13, RAM 8 GB).

**Datos de prueba:**

- APK firmado con clave de release.
- Tag de release: `v0.1.0-piloto`.
- Instrucciones de instalación con capturas de pantalla.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración de GitHub Releases

**Objetivo:** Validar que el APK se puede publicar en GitHub Releases.

#### Procedimiento
1. Crear un tag de release (`v0.1.0-piloto`).
2. Subir el APK firmado como asset de la release.
3. Verificar que el APK está disponible en la página de la release.
4. Descargar el APK desde el enlace público.
5. Verificar que el APK se descarga correctamente.
6. Verificar que el enlace es accesible sin autenticación.

#### Resultado esperado
- El tag se crea correctamente.
- El APK se sube como asset.
- El APK se descarga desde el enlace público.
- El enlace es accesible sin autenticación.
- No hay errores de subida.

---

### 7.2 Prueba 2 — Configuración de Firebase App Distribution

**Objetivo:** Validar que Firebase App Distribution distribuye el APK a los testers.

#### Procedimiento
1. Crear un proyecto de Firebase.
2. Configurar Firebase App Distribution.
3. Crear los grupos `testers-internos` y `campesinos-piloto`.
4. Agregar testers a los grupos (con emails reales de prueba).
5. Subir el APK a Firebase App Distribution.
6. Verificar que los testers reciben la notificación por email.
7. Verificar que el enlace de instalación funciona.

#### Resultado esperado
- El proyecto de Firebase se crea correctamente.
- Los grupos se configuran.
- Los testers reciben la notificación.
- El enlace de instalación funciona.
- No hay errores de configuración.

---

### 7.3 Prueba 3 — Pipeline de CI/CD integrado

**Objetivo:** Validar que el pipeline de CI/CD sube el APK a GitHub Releases y Firebase App Distribution automáticamente.

#### Procedimiento
1. Configurar el workflow de GitHub Actions (ADR-025) para:
   - Compilar el APK.
   - Subir el APK a GitHub Releases.
   - Subir el APK a Firebase App Distribution.
2. Hacer merge a `main`.
3. Verificar que el pipeline se ejecuta correctamente.
4. Verificar que el APK está en GitHub Releases.
5. Verificar que Firebase App Distribution notifica a los testers.
6. Medir el tiempo total del pipeline.

#### Resultado esperado
- El pipeline se ejecuta sin errores.
- El APK se sube a GitHub Releases.
- Firebase App Distribution notifica a los testers.
- El tiempo del pipeline es razonable (< 15 minutos).
- No hay errores de autenticación.

---

### 7.4 Prueba 4 — Instalación en los 3 dispositivos

**Objetivo:** Validar que el APK se instala y ejecuta correctamente en los 3 dispositivos representativos.

#### Procedimiento
1. Descargar el APK desde GitHub Releases o Firebase App Distribution.
2. Instalar el APK en los 3 dispositivos.
3. Verificar que el APK está firmado correctamente (no aparece "aplicación no firmada").
4. Abrir la app.
5. Verificar que la app se ejecuta sin errores.
6. Navegar por las pantallas principales.
7. Verificar que el login funciona.

#### Resultado esperado
- El APK se instala correctamente en los 3 dispositivos.
- El APK está firmado correctamente.
- La app se ejecuta sin errores.
- Las pantallas principales funcionan.
- No hay errores de compatibilidad.

---

### 7.5 Prueba 5 — Instrucciones de instalación con usuarios no técnicos

**Objetivo:** Validar que las instrucciones de instalación son comprensibles para el campesino.

#### Procedimiento
1. Crear una guía simple con capturas de pantalla para:
   - Descargar el APK.
   - Habilitar "fuentes desconocidas".
   - Instalar el APK.
2. Compartir la guía con 2-3 testers no técnicos (o simuladores).
3. Pedirles que instalen la app siguiendo la guía.
4. Observar si tienen dificultades.
5. Registrar los problemas encontrados.
6. Ajustar la guía según el feedback.

#### Resultado esperado
- Los testers no técnicos pueden instalar la app siguiendo la guía.
- La guía es clara y no genera dudas.
- No hay pasos confusos.
- La guía se ajusta según el feedback.

---

### 7.6 Prueba 6 — Trazabilidad de versiones

**Objetivo:** Validar que hay trazabilidad entre versión y tester.

#### Procedimiento
1. Publicar una nueva versión (`v0.2.0-piloto`).
2. Verificar que GitHub Releases muestra la nueva versión.
3. Verificar que Firebase App Distribution registra qué versión recibió cada tester.
4. Verificar que el APK incluye la versión en el nombre del archivo (ej. `agrotrack-v0.2.0-piloto.apk`).
5. Verificar que la app muestra la versión en algún lugar (ej. pantalla de "Acerca de").

#### Resultado esperado
- GitHub Releases muestra la nueva versión.
- Firebase App Distribution registra la versión recibida.
- El APK incluye la versión en el nombre.
- La app muestra la versión.
- Hay trazabilidad completa.

---

### 7.7 Prueba 7 — Canal de soporte

**Objetivo:** Validar que el canal de soporte funciona para resolver dudas de instalación.

#### Procedimiento
1. Configurar un canal de WhatsApp o email de soporte.
2. Pedir a los testers que reporten cualquier duda al canal.
3. Resolver las dudas que surjan.
4. Documentar las preguntas frecuentes.
5. Crear una sección de FAQ con las respuestas.

#### Resultado esperado
- El canal de soporte funciona.
- Los testers reportan dudas.
- Las dudas se resuelven.
- Se documentan las preguntas frecuentes.
- Se crea la sección de FAQ.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **GitHub Releases**: El APK se publica y descarga correctamente.
2. **Firebase App Distribution**: Los testers reciben la notificación y el enlace funciona.
3. **Pipeline de CI/CD**: El APK se sube automáticamente a ambos canales.
4. **Instalación**: El APK se instala y ejecuta en los 3 dispositivos.
5. **Instrucciones**: Los testers no técnicos pueden instalar la app siguiendo la guía.
6. **Trazabilidad**: Hay trazabilidad entre versión y tester.
7. **Soporte**: El canal de soporte funciona.

El Spike se considerará **RECHAZADO** si:

- El APK no se publica en GitHub Releases.
- Firebase App Distribution no notifica a los testers.
- El pipeline no sube el APK automáticamente.
- El APK no se instala en algún dispositivo.
- Los testers no técnicos no pueden instalar la app.
- No hay trazabilidad de versiones.
- El canal de soporte no funciona.

## 9. Entorno técnico del spike

- **Repositorio**: GitHub.
- **CI/CD**: GitHub Actions (ADR-025).
- **Distribución 1**: GitHub Releases.
- **Distribución 2**: Firebase App Distribution.
- **Proyecto Firebase**: creado en Firebase Console.
- **Grupos de testers**: `testers-internos`, `campesinos-piloto`.
- **APK firmado**: con clave de release generada con `keytool`.
- **Instrucciones de instalación**: guía con capturas de pantalla.
- **Canal de soporte**: WhatsApp o email.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: GitHub Actions UI, Firebase Console.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Los testers no técnicos no saben habilitar "fuentes desconocidas".
  - **Mitigación**: Crear una guía con capturas de pantalla. Probar con 2-3 testers antes de distribuirlo.

- **Riesgo**: Firebase App Distribution puede no notificar a los testers.
  - **Mitigación**: Verificar que los emails están bien configurados. Probar con un grupo pequeño primero.

- **Riesgo**: El APK puede no estar firmado correctamente.
  - **Mitigación**: Generar una clave de release con `keytool` y firmar el APK antes de subirlo.

- **Riesgo**: El pipeline de CI/CD puede fallar al subir el APK.
  - **Mitigación**: Configurar los secretos de Firebase y GitHub correctamente. Probar el pipeline en un entorno de prueba.

- **Riesgo**: El enlace de GitHub Releases puede no ser accesible.
  - **Mitigación**: Verificar que el repositorio es público o que el enlace es accesible sin autenticación.

- **Riesgo**: El timebox de 2 días puede ser insuficiente para las 7 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3 y 4. Si el tiempo no alcanza, documentar 5, 6 y 7 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio configurado** con:
   - Workflow de GitHub Actions que sube el APK a GitHub Releases y Firebase App Distribution.
   - Guía de instalación con capturas de pantalla.
   - FAQ con preguntas frecuentes.
2. **Reporte de métricas**:
   - Tiempo del pipeline de distribución.
   - Tasa de éxito de instalación.
   - Tiempo de instalación por tester.
   - Problemas encontrados y soluciones.
3. **Evidencia**:
   - Capturas de GitHub Releases con el APK.
   - Capturas de Firebase App Distribution con los grupos.
   - Capturas de las notificaciones enviadas a los testers.
   - Capturas de la app instalada en los 3 dispositivos.
   - Capturas de la guía de instalación.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El APK se publicó en GitHub Releases?
  - ✅ / ❌ ¿Firebase App Distribution notificó a los testers?
  - ✅ / ❌ ¿El pipeline de CI/CD subió el APK automáticamente?
  - ✅ / ❌ ¿El APK se instaló en los 3 dispositivos?
  - ✅ / ❌ ¿Los testers no técnicos pudieron instalar la app?
  - ✅ / ❌ ¿Hubo trazabilidad entre versión y tester?
  - ✅ / ❌ ¿El canal de soporte funcionó?

- **Lecciones aprendidas**:
  - (Ejemplo: "Los testers no técnicos necesitan capturas de pantalla para habilitar fuentes desconocidas.")
  - (Ejemplo: "Firebase App Distribution es muy simple de configurar y notifica automáticamente.")
  - (Ejemplo: "El APK debe firmarse con una clave de release, no con la clave de debug.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar GitHub Releases + Firebase App Distribution para el piloto.")
  - (Ejemplo: "Preparar la app para Google Play desde el día 1.")
  - (Ejemplo: "Documentar el proceso de instalación con capturas de pantalla.")
  - (Ejemplo: "Configurar un canal de soporte para resolver dudas de instalación.")
  - (Ejemplo: "Mantener un changelog de versiones.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)