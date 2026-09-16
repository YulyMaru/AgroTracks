# ADR-002: Validar formularios con reglas centralizadas

- **Título**: Validar formularios en cliente y servidor con reglas centralizadas para garantizar consistencia y buena experiencia de corrección de errores.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones que permitan al usuario identificar y corregir errores en formularios de manera clara y eficiente, garantizando que los datos válidos se conserven y que el flujo de trabajo no se interrumpa innecesariamente.

  - **Detalles**:

    - **Usabilidad**: el sistema debe indicar el campo incorrecto, explicar el error con un mensaje comprensible y permitir continuar sin perder los datos ya ingresados.
    - **Consistencia de validación**: las reglas deben ser idénticas en el cliente y en el servidor; un dato aceptado en el móvil no puede ser rechazado en el backend, ni viceversa.
    - **Respuesta inmediata**: los errores de formato o campos obligatorios deben detectarse en < 50 ms tras perder el foco, para reducir la frustración.
    - **Mantenibilidad**: las reglas deben ser fáciles de modificar, probar y extender cuando cambian los requisitos de negocio.
    - **Rendimiento**: la validación en cliente no debe degradar la experiencia; la validación en servidor debe ser eficiente y escalable.
    - **Costo de implementación**: la solución debe ser viable para el alcance actual de AgroTrack, evitando infraestructura innecesaria.
    - **Escenario de calidad relacionado**: ESC-CAL-US-05 (validación de formularios).

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para la validación de formularios en aplicaciones móviles con requisitos de usabilidad y consistencia.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Validación únicamente en el servidor**: el cliente envía todos los datos del formulario; el servidor valida y devuelve una lista de errores; el cliente los muestra sin validación previa.
    2. **Validación en cliente y servidor con reglas duplicadas**: se implementan validaciones por separado en el frontend y el backend, manteniendo las reglas en ambos lugares.
    3. **Validación en cliente y servidor con reglas centralizadas**: se define un conjunto único de reglas de validación (por ejemplo, en un módulo compartido o mediante una API de reglas) que es utilizado tanto por el cliente como por el servidor. El cliente puede realizar validaciones inmediatas consultando estas reglas o usando una librería que las interprete.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de validación en aplicaciones móviles, considerando la experiencia de usuario, la consistencia de datos y la mantenibilidad. Se revisaron prácticas recomendadas como la validación en tiempo real, mensajes de error específicos y la reutilización de reglas de negocio.

  - **1. Validación únicamente en el servidor**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple completamente con los criterios de usabilidad y respuesta inmediata.

      - **Detalles**:
        - El usuario debe esperar a enviar el formulario para conocer los errores, lo que genera una experiencia lenta y frustrante.
        - No permite la validación inmediata de campos (por ejemplo, al salir de un campo), lo que retrasa la corrección.
        - Los datos válidos pueden perderse si el envío falla o si el usuario cierra la aplicación.
        - La dependencia de la red para la validación introduce latencia y problemas en modo offline.
        - Aunque la consistencia está garantizada (el servidor es la fuente de verdad), la usabilidad se ve gravemente afectada.

    - **Análisis de costos**:
      - **Resumen**: Bajo costo de implementación inicial, pero alto costo de soporte y posible pérdida de confianza del usuario.
      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere, pero el usuario se enfrenta a una experiencia pobre.
        - **Operación**: se requieren logs de errores de validación, pero la carga en el servidor aumenta con cada envío.
        - **Medición**: tiempo de respuesta del servidor, tasa de errores de validación.

    - **Análisis FODA**:
      - **Fortalezas**: simplicidad, única fuente de verdad en el servidor.
      - **Debilidades**: mala usabilidad, dependencia de red, pérdida de datos válidos en caso de error de envío, latencia.
      - **Oportunidades**: podría complementarse con validación en cliente más adelante.
      - **Amenazas**: rechazo del usuario por la experiencia, incremento de tickets de soporte.

    - **Opiniones y comentarios internos**:
      - "Nuestros usuarios necesitan retroalimentación inmediata, no pueden esperar a enviar para saber que un campo está mal".
      - "Además, en zonas sin conexión, esto simplemente no funciona".

  - **2. Validación en cliente y servidor con reglas duplicadas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente con la usabilidad y la respuesta inmediata, pero introduce un alto riesgo de inconsistencias y duplicación de esfuerzos.

      - **Detalles**:
        - El cliente puede validar campos al vuelo, mejorando la experiencia.
        - El servidor refuerza la validación para garantizar la integridad.
        - Sin embargo, las reglas deben mantenerse en dos lugares, lo que duplica el trabajo y aumenta la probabilidad de divergencia.
        - Un cambio en una regla requiere actualizar ambos lados, con el riesgo de que uno quede desactualizado.
        - Los mensajes de error pueden variar entre cliente y servidor, confundiendo al usuario.
        - La conservación de datos válidos es posible en cliente, pero si el servidor rechaza un dato por una regla desactualizada, se pierde la consistencia.

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación medio, pero costo de mantenimiento alto debido a la duplicación.
      - **Ejemplos**:
        - **Licencias**: puede requerir librerías de validación tanto en frontend como en backend.
        - **Capacitación**: el equipo debe coordinar cambios en ambos lados.
        - **Operación**: se requiere monitoreo de discrepancias y pruebas de integración continuas.
        - **Medición**: tiempo de validación en cliente, tiempo de validación en servidor, tasa de errores inconsistentes.

    - **Análisis FODA**:
      - **Fortalezas**: buena usabilidad, validación inmediata, respaldo en servidor.
      - **Debilidades**: duplicación de reglas, riesgo de inconsistencias, mayor esfuerzo de mantenimiento.
      - **Oportunidades**: se puede usar una herramienta de generación de código para sincronizar reglas, pero añade complejidad.
      - **Amenazas**: divergencia de reglas que provoca errores en producción y pérdida de confianza.

    - **Opiniones y comentarios internos**:
      - "Duplicar la lógica de validación es una fuente conocida de bugs".
      - "Si cambiamos una regla de negocio, tendremos que actualizar dos veces y probar en ambos entornos".

  - **3. Validación en cliente y servidor con reglas centralizadas**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios, ofreciendo la mejor experiencia de usuario, consistencia y mantenibilidad.

      - **Detalles**:
        - Se define un repositorio único de reglas de validación (por ejemplo, un módulo compartido en un monorepo, o una API de reglas que el cliente consume).
        - El cliente utiliza estas reglas para validar campos en tiempo real (al perder el foco, al escribir, etc.) y mostrar mensajes de error específicos.
        - El servidor aplica las mismas reglas para validar los datos finales, garantizando consistencia.
        - Las reglas se mantienen en un solo lugar; cualquier cambio se propaga automáticamente a ambos lados.
        - Los mensajes de error se definen junto con las reglas, asegurando uniformidad.
        - El cliente conserva los datos válidos y solo resalta los campos incorrectos, permitiendo al usuario corregir y reenviar sin perder información.
        - Se puede implementar validación inmediata y también al enviar, cumpliendo con el escenario de calidad.
        - La solución es compatible con modo offline: el cliente puede validar localmente; al recuperar la conexión, el servidor valida nuevamente (reforzando la idempotencia).

    - **Análisis de costos**:
      - **Resumen**: Costo de implementación inicial moderado, pero costos operativos y de mantenimiento reducidos a largo plazo.
      - **Ejemplos**:
        - **Licencias**: se puede implementar con librerías open source (ej. JSON Schema, Joi, etc.) y compartir el esquema.
        - **Capacitación**: el equipo debe aprender a gestionar el repositorio central de reglas.
        - **Operación**: monitoreo de errores de validación en ambos lados, pero con la ventaja de que las reglas son consistentes.
        - **Medición**: se puede medir el tiempo de validación en cliente, la tasa de errores capturados en cliente vs servidor, y la efectividad de los mensajes.

    - **Análisis FODA**:
      - **Fortalezas**:
        - Excelente experiencia de usuario con validación inmediata y mensajes claros.
        - Consistencia garantizada entre cliente y servidor.
        - Fácil mantenimiento y evolución de reglas.
        - Permite pruebas unitarias de las reglas de forma centralizada.
        - Reducción de errores de producción por divergencia.
      - **Debilidades**:
        - Requiere una infraestructura para compartir las reglas (ej. un paquete npm, un repositorio de esquemas, o una API).
        - El cliente debe poder consumir las reglas sin depender de la red (para modo offline), lo que implica empaquetar las reglas en la aplicación o cachearlas.
        - La complejidad de definir reglas complejas (ej. dependientes entre campos) puede ser mayor.
      - **Oportunidades**:
        - Las reglas centralizadas pueden reutilizarse en otros clientes (ej. web, API para terceros).
        - Se puede incorporar un motor de reglas que permita cambios dinámicos sin actualizar la app (mediante una API, pero considerando offline).
      - **Amenazas**:
        - Si las reglas se actualizan con frecuencia, el cliente podría tener una versión desactualizada; se necesita un mecanismo de versionado o actualización.
        - La implementación de la centralización puede ser compleja si no se diseña cuidadosamente.

    - **Opiniones y comentarios internos**:
      - "Esta es la solución que mejor se alinea con nuestros principios de calidad y mantenibilidad".
      - "Podemos comenzar con un esquema JSON compartido y luego evolucionar a un motor de reglas si es necesario".
      - "Además, los mensajes de error pueden estar internacionalizados fácilmente si están asociados a las reglas".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-002 — Validará que las reglas centralizadas son idénticas en cliente y servidor — Propuesto.
    - SPIKE-005 — Validará que la validación offline funciona con reglas empaquetadas — Propuesto.
    - SPIKE-008 — Validará que la detección de datos insuficientes se apoya en las reglas — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Validación solo en servidor, validación duplicada en cliente y servidor. Descartados por latencia offline y riesgo de divergencia.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, con formularios críticos para el registro de información económica y productiva.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante los spikes SPIKE-002, SPIKE-005 y SPIKE-008, que probarán la consistencia de las reglas, la validación offline y la detección de datos insuficientes.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **validación en cliente y servidor con reglas centralizadas** porque:
    - Proporciona la mejor experiencia de usuario (validación inmediata y mensajes claros).
    - Garantiza la consistencia de datos evitando inconsistencias entre cliente y servidor.
    - Reduce el costo de mantenimiento al tener un único punto de definición de reglas.
    - Facilita la evolución y prueba de las reglas de negocio.
    - Los spikes demostrarán consistencia sin duplicar lógica.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: En la implementación inicial se creará un repositorio de reglas de validación (posiblemente como un paquete npm compartido entre el backend y el frontend móvil). El cliente consumirá estas reglas para validar campos en tiempo real. El servidor aplicará las mismas reglas en los endpoints correspondientes. Se espera que los usuarios reciban retroalimentación inmediata al salir de cada campo, y que los mensajes de error sean específicos y comprensibles. Pendiente de ejecución de los spikes.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de los envíos de formularios utilizará la validación centralizada, ya que es un requisito transversal.
    - **¿Qué tipos de integraciones están involucradas?**: Repositorio central de reglas (paquete compartido o API), frontend móvil (React Native / Flutter), backend (Spring Boot / Node.js), motor de sincronización offline (ADR-001) y sistema de internacionalización de mensajes (si aplica).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Comenzar con un esquema de validación simple y compartido, y no intentar construir un motor de reglas complejo desde el principio. Asegurarse de que los mensajes de error sean claros y accionables. Implementar pruebas spike que verifiquen que las reglas en cliente y servidor son idénticas. Si el número de reglas crece, considerar el uso de un lenguaje de definición de reglas más expresivo (ej. JSON Schema con extensiones).

  - **Anécdotas**:

    - En un proyecto anterior, la duplicación de reglas de validación provocó un incidente donde un campo aceptaba un formato en la app pero era rechazado en el servidor, causando la pérdida de datos de varios usuarios. Esto reforzó la necesidad de centralizar las reglas.
    - También se identificó que los mensajes de error genéricos ("Dato inválido") no ayudan al usuario; es fundamental que el mensaje indique el campo y la acción correctiva.
    - En el diseño del SPIKE-002 se confirmó que los mensajes deben ser específicos al campo y contener la acción a realizar (ej. "Ingrese un número mayor a 0").

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar la **validación en cliente y servidor con reglas centralizadas** como la estrategia para manejar la corrección de errores en formularios.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre usabilidad, consistencia, mantenibilidad y costo.

    La implementación deberá considerar como mínimo:

    - Un repositorio único de reglas de validación, accesible tanto para el cliente móvil como para el servidor.
    - Mecanismo para empaquetar las reglas en la aplicación móvil (para validación offline) y, opcionalmente, actualizarlas mediante una API si cambian sin necesidad de actualizar la app.
    - Validación inmediata en el cliente (al perder el foco, al cambiar el valor) usando las reglas centralizadas, mostrando mensajes de error específicos junto al campo correspondiente.
    - Validación en el servidor utilizando las mismas reglas al recibir los datos, devolviendo errores estructurados que el cliente pueda mostrar de manera consistente.
    - Conservación de los datos válidos: el cliente no debe descartar la información ingresada, solo resaltar los campos con errores y permitir la corrección.
    - Definición de mensajes de error claros y accionables, asociados a cada regla y, si es necesario, internacionalizados.
    - Pruebas automatizadas que verifiquen la consistencia de las reglas entre cliente y servidor.
    - Registro de errores de validación para monitorear problemas comunes y mejorar los mensajes.

    Se descarta la validación únicamente en el servidor por su mala usabilidad y dependencia de la red, y la validación con reglas duplicadas por su alto riesgo de divergencia y mantenimiento. La centralización es la que mejor se adapta a las necesidades de AgroTrack y su contexto de conectividad intermitente.



    Node.js