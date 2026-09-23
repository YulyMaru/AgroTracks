# ADR-022: Garantizar seguridad en tránsito y en reposo

- **Título**: Implementar TLS obligatorio para todas las comunicaciones, almacenamiento seguro de tokens con SecureStore, y cifrado de la base de datos local SQLite con SQLCipher, descartando almacenamiento en texto plano y comunicaciones sin cifrar.

- **Estado**: Propuesto.

- **Criterios de evaluación**:

  - **Resumen**: Evaluar la estrategia de seguridad que garantice la confidencialidad, integridad y disponibilidad de la información sensible (económica, productiva, personal) tanto en tránsito (comunicaciones cliente-servidor) como en reposo (almacenamiento local en el dispositivo), considerando el cumplimiento de la Ley 1581 de 2012 (Habeas Data), el contexto rural con redes inestables, y el impacto en el rendimiento de dispositivos de gama baja.

  - **Detalles**:

    - **Confidencialidad en tránsito**: todas las comunicaciones deben viajar cifradas con TLS 1.2+; no se permite tráfico en texto plano (ESC-CAL-SEG-01).
    - **Confidencialidad en reposo**: el token de autenticación debe almacenarse en SecureStore (Keychain/Keystore); la base de datos SQLite debe estar cifrada con SQLCipher (ESC-CAL-SEG-01, ESC-CAL-DP-06).
    - **Integridad**: los datos no deben ser alterados en tránsito ni en reposo; se deben usar mecanismos de verificación (HMAC, firmas) cuando aplique.
    - **Cumplimiento legal**: la solución debe cumplir con la Ley 1581 de 2012 (Habeas Data) y garantizar el consentimiento explícito del usuario.
    - **Rendimiento**: el cifrado no debe degradar significativamente la experiencia del usuario en dispositivos de gama baja (≤ 10 % de overhead).
    - **Costo de implementación y operación**: la solución debe ser viable con el stack actual sin infraestructura adicional costosa.
    - **Mantenibilidad**: las claves y certificados deben ser gestionables y rotables.
    - **Escenarios de calidad relacionados**: ESC-CAL-SEG-01, ESC-CAL-DP-01, ESC-CAL-DP-06, ESC-CAL-CF-05, ESC-CAL-INT-03.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres estrategias de seguridad para tránsito y reposo.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Sin cifrado (texto plano)**: comunicaciones HTTP sin TLS y almacenamiento local sin cifrar (AsyncStorage, SQLite en texto plano).
    2. **Cifrado estándar (TLS + SecureStore + SQLite sin cifrar)**: TLS obligatorio en tránsito, token en SecureStore, pero base de datos local sin cifrar.
    3. **Cifrado completo (TLS + SecureStore + SQLCipher + certificate pinning opcional)**: TLS obligatorio, token en SecureStore, base de datos SQLite cifrada con SQLCipher, y opcionalmente certificate pinning para mayor seguridad.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de seguridad en aplicaciones móviles con datos sensibles, considerando las recomendaciones de OWASP MASVS, las restricciones de la Ley 1581 de 2012, y el impacto del cifrado en el rendimiento de dispositivos de gama baja. Se revisaron experiencias de aplicaciones financieras y agrícolas.

  - **1. Sin cifrado (texto plano)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple con ningún criterio de seguridad. Es inaceptable.

      - **Detalles**:
        - Las comunicaciones HTTP pueden ser interceptadas (man-in-the-middle).
        - El token en AsyncStorage es vulnerable en dispositivos rooteados.
        - La base de datos SQLite en texto plano puede ser leída por cualquier app con acceso al almacenamiento.
        - Viola la Ley 1581 de 2012.
        - Expone información económica y personal del campesino.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación nulo, pero costo reputacional y legal altísimo.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: no requiere.
        - **Operación**: riesgo de brechas de seguridad.
        - **Medición**: no aplica.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Sin inversión.
      - **Debilidades**:
        - Inseguro.
        - Viola la ley.
      - **Oportunidades**:
        - Ninguna.
      - **Amenazas**:
        - Brechas de seguridad.
        - Sanciones legales.
        - Pérdida de confianza.

    - **Opiniones y comentarios internos**:

      - "Es inaceptable. No podemos exponer los datos del campesino."
      - "La ley nos obliga a proteger la información."

  - **2. Cifrado estándar (TLS + SecureStore + SQLite sin cifrar)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente. Protege en tránsito y el token, pero deja la base de datos local expuesta.

      - **Detalles**:
        - TLS protege las comunicaciones.
        - SecureStore protege el token.
        - Pero SQLite en texto plano puede ser leído si el dispositivo es comprometido.
        - Los datos económicos y productivos quedan expuestos.
        - No cumple completamente con la Ley 1581 de 2012.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero riesgo de brecha de datos.

      - **Ejemplos**:
        - **Licencias**: TLS es gratuito, SecureStore es nativo.
        - **Capacitación**: el equipo debe configurar TLS y SecureStore.
        - **Operación**: riesgo de exposición de datos locales.
        - **Medición**: no hay cifrado local.

    - **Análisis FODA**:

      - **Fortalezas**:
        - TLS y SecureStore son estándar.
        - Fácil de implementar.
      - **Debilidades**:
        - SQLite sin cifrar.
        - Datos expuestos en el dispositivo.
      - **Oportunidades**:
        - Añadir SQLCipher después.
      - **Amenazas**:
        - Brecha de datos local.
        - Incumplimiento legal.

    - **Opiniones y comentarios internos**:

      - "TLS y SecureStore son el mínimo, pero no son suficientes."
      - "Los datos financieros del campesino no pueden quedar en texto plano."

  - **3. Cifrado completo (TLS + SecureStore + SQLCipher + certificate pinning opcional)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios. Es la opción que garantiza seguridad en tránsito y en reposo.

      - **Detalles**:
        - **TLS 1.2+ obligatorio**: todas las comunicaciones cifradas.
        - **SecureStore**: token en Keychain (iOS) / Keystore (Android).
        - **SQLCipher**: base de datos SQLite cifrada con AES-256.
        - **Certificate pinning (opcional)**: previene ataques man-in-the-middle con certificados falsos.
        - **Gestión de claves**: la clave de SQLCipher se deriva de una clave maestra almacenada en SecureStore.
        - **Consentimiento explícito**: se solicita al usuario aceptar la política de privacidad.
        - **Cumplimiento legal**: cumple con la Ley 1581 de 2012.
        - **Rendimiento**: overhead de SQLCipher ~5-10 % en lectura/escritura, aceptable en gama baja.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, costo operativo bajo, retorno alto en seguridad y cumplimiento.

      - **Ejemplos**:
        - **Licencias**: SQLCipher es open source (Community Edition). TLS y SecureStore son nativos.
        - **Capacitación**: el equipo debe aprender a usar SQLCipher y gestionar claves.
        - **Operación**: monitoreo de seguridad.
        - **Medición**: overhead de cifrado.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Seguridad completa en tránsito y reposo.
        - Cumplimiento legal.
        - Protección de datos sensibles.
        - Estándar en aplicaciones financieras.
      - **Debilidades**:
        - Mayor complejidad de implementación.
        - Overhead de rendimiento en SQLCipher.
        - Gestión de claves requiere cuidado.
      - **Oportunidades**:
        - Certificate pinning como capa adicional.
        - Rotación de claves.
      - **Amenazas**:
        - Pérdida de la clave de cifrado si SecureStore falla.
        - Incompatibilidad de SQLCipher en algunos dispositivos.

    - **Opiniones y comentarios internos**:

      - "SQLCipher es el estándar para cifrar SQLite en móviles."
      - "El overhead es aceptable; la seguridad no es negociable."
      - "La clave de SQLCipher debe guardarse en SecureStore, nunca en el código."

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene de los spikes técnicos planificados para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-022 — Validará que TLS, SecureStore y SQLCipher protegen los datos sin degradar el rendimiento — Propuesto.
    - SPIKE-011 — Validará que el token se almacena de forma segura en SecureStore — Propuesto.
    - SPIKE-013 — Validará que SQLCipher cifra la base local sin afectar las consultas — Propuesto.
    - SPIKE-016 — Validará que TLS se configura correctamente en Spring Boot — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Sin cifrado — descartado por inseguro e ilegal.
    - Cifrado estándar sin SQLCipher — descartado por dejar datos locales expuestos.
    - Certificate pinning obligatorio — considerado, pero se deja como opcional para no complicar la primera versión.
    - Cifrado de campos específicos en SQLite — descartado por complejidad y menor cobertura.

  - **¿Qué estás creando?**:

    - Backend y frontend móvil para aplicación B2C para campesinos, con datos económicos, productivos y personales sensibles.
    - **B2B o B2C**: B2C, orientada al usuario final.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: monolito modular inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante SPIKE-022 (seguridad completa), SPIKE-011 (SecureStore), SPIKE-013 (SQLCipher) y SPIKE-016 (TLS).

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó el **cifrado completo (TLS + SecureStore + SQLCipher + certificate pinning opcional)** porque:
    - Protege los datos en tránsito y en reposo.
    - Cumple con la Ley 1581 de 2012.
    - Es el estándar en aplicaciones financieras.
    - El overhead de SQLCipher es aceptable.
    - SecureStore es nativo y seguro.
    - TLS es obligatorio y ampliamente soportado.
    - Certificate pinning se puede añadir después si se requiere.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se espera que TLS, SecureStore y SQLCipher protejan los datos sin degradar el rendimiento más del 10 %.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las comunicaciones y el 100 % del almacenamiento local.
    - **¿Qué tipos de integraciones están involucradas?**: TLS (Spring Boot y Axios), SecureStore (React Native), SQLCipher (SQLite local), gestión de claves, y el sistema de autenticación JWT (ADR-011).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: Configurar TLS desde el día 1. Nunca almacenar tokens en AsyncStorage. Usar SQLCipher desde el inicio; migrar después es costoso. Gestionar la clave de SQLCipher en SecureStore. Considerar certificate pinning si el presupuesto lo permite.

  - **Anécdotas**:

    - En el diseño del SPIKE-011 se confirmó que SecureStore es seguro y fácil de usar.
    - Durante el análisis se concluyó que dejar SQLite sin cifrar habría sido un riesgo inaceptable para datos financieros.
    - En el diseño del SPIKE-013 se confirmó que SQLCipher añade un overhead aceptable.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar **TLS 1.2+ obligatorio**, **SecureStore para tokens**, **SQLCipher para la base de datos local** y **certificate pinning opcional**, cumpliendo con los escenarios ESC-CAL-SEG-01, ESC-CAL-DP-01, ESC-CAL-DP-06, ESC-CAL-CF-05 y ESC-CAL-INT-03.

  - **Detalles**:

    Esta alternativa ofrece el mejor equilibrio entre seguridad, cumplimiento legal y rendimiento.

    La implementación deberá considerar como mínimo:

    - **Tránsito (TLS)**:
      - Configurar Spring Boot con TLS 1.2+ (certificado SSL/TLS).
      - Configurar Axios para usar HTTPS exclusivamente.
      - Deshabilitar tráfico en texto plano en Android (`android:usesCleartextTraffic="false"`).
      - Opcional: certificate pinning con `react-native-ssl-pinning` o similar.
    - **Reposo (SecureStore + SQLCipher)**:
      - Almacenar el token JWT en SecureStore (Keychain/Keystore).
      - Cifrar SQLite con SQLCipher (AES-256).
      - Derivar la clave de SQLCipher de una clave maestra almacenada en SecureStore.
      - Nunca hardcodear claves en el código.
    - **Gestión de claves**:
      - Generar una clave maestra aleatoria en el primer arranque.
      - Almacenarla en SecureStore.
      - Rotarla periódicamente (opcional).
    - **Cumplimiento legal**:
      - Solicitar consentimiento explícito al usuario para el tratamiento de datos.
      - Mostrar política de privacidad.
    - **Pruebas**:
      - Verificar que TLS está configurado correctamente.
      - Verificar que SecureStore almacena y recupera el token.
      - Verificar que SQLCipher cifra la base.
      - Medir el overhead de SQLCipher.
      - Verificar que los datos no son legibles sin la clave.

    Se descarta el cifrado en texto plano por inseguro e ilegal, y el cifrado estándar sin SQLCipher por dejar datos locales expuestos. El cifrado completo es la opción que garantiza seguridad y cumplimiento en AgroTrack.