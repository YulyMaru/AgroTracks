# ADR-011: Bloquear acceso no autenticado con middleware

- **Título**: Bloquear acceso no autenticado a pantallas, funciones e información protegida con middleware de navegación, almacenamiento seguro y manejo de expiración, cumpliendo con el escenario ESC-CAL-SEG-01.

- **Estado**: Propuesto

- **Criterios de evaluación**:

  - **Resumen**: Evaluar soluciones para garantizar que el 100 % de los intentos de acceso sin autenticación válida sea rechazado y que el usuario sea redirigido al mecanismo de autenticación (login) sin entregar información protegida, ni siquiera en estado de caché local o pantallas en blanco que puedan dar pistas sobre la estructura de la aplicación.

  - **Detalles**:

    - **Verificación de autenticación**: el sistema debe verificar que el usuario tiene una sesión válida antes de mostrar cualquier pantalla, función o dato protegido.
    - **Almacenamiento seguro**: el token de autenticación (ej. JWT) debe almacenarse de forma segura (ej. SecureStore en React Native, Keychain en iOS, Keystore en Android) para evitar vulnerabilidades de extracción.
    - **Redirección inmediata**: el sistema debe redirigir al mecanismo de autenticación (pantalla de login) cuando el token no sea válido, haya expirado o simplemente no exista.
    - **Protección de datos**: no debe entregar información protegida a usuarios no autenticados, ni siquiera en respuestas de API o en caché local (ADR-006).
    - **Manejo de expiración y refresco**: el sistema debe manejar la expiración del token, refrescándolo silenciosamente si es posible (mediante refresh token) o cerrando la sesión y redirigiendo al login si no es posible.
    - **Costo de implementación**: la solución debe ser viable con el stack actual y basarse en patrones estándar de autenticación en aplicaciones móviles.
    - **Escenario de calidad relacionado**: ESC-CAL-SEG-01.

- **Candidatos a considerar**:

  - **Resumen**: Se evaluaron tres enfoques para el control de acceso en aplicaciones móviles, considerando la seguridad, la experiencia de usuario y el costo de implementación.

  - **Enumerar todos los candidatos y opciones relacionadas**:

    1. **Validación solo en el servidor (sin bloqueo en cliente)**: cada solicitud al backend verifica el token, pero las pantallas locales pueden ser accesibles sin autenticación (el usuario ve la UI, aunque los datos no se carguen o se muestren errores).
    2. **Validación en cliente y servidor (sin middleware centralizado)**: se verifica el token localmente antes de renderizar pantallas en cada componente o vista de forma aislada, y el backend refuerza la autenticación en cada solicitud.
    3. **Validación con middleware de navegación + almacenamiento seguro + manejo de expiración**: se usa un middleware que intercepta la navegación hacia rutas protegidas, verifica el token de forma centralizada, lo almacena de forma segura y maneja la expiración con refresco o redirección.

- **Investigación y análisis de cada candidato**:

  - **Resumen**: Se investigaron patrones de autenticación y control de acceso en aplicaciones móviles, así como prácticas de seguridad para almacenamiento de tokens y manejo de sesiones. Se identificó que la centralización y el almacenamiento seguro son los dos puntos críticos.

  - **1. Validación solo en el servidor**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: No cumple completamente con los criterios de protección de UI y datos locales, porque el usuario puede ver pantallas protegidas sin datos, lo que genera confusión y puede exponer metadata de la aplicación (nombres de pantallas, estructura de navegación).

      - **Detalles**:
        - El usuario puede navegar a cualquier pantalla de la aplicación, incluso sin haber iniciado sesión.
        - Las pantallas se renderizan vacías o con errores de "No autorizado" al intentar cargar datos.
        - Esto es confuso: el usuario podría pensar que la aplicación está rota en lugar de entender que debe iniciar sesión.
        - No protege la información local (SQLite) porque el repositorio local podría ser accedido si no se verifica el token antes de las consultas.
        - La superficie de ataque es mayor, ya que un atacante podría ver la estructura de la app.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación bajo, pero alto costo de soporte y mala experiencia de usuario.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el usuario debe aprender a ignorar los errores y navegar al login.
        - **Operación**: alta tasa de tickets de soporte ("La app muestra error en todas las pantallas").
        - **Medición**: se puede medir la cantidad de usuarios que navegan a pantallas protegidas sin login.

    - **Análisis FODA**:

      - **Fortalezas**: implementación trivial, el backend sigue siendo seguro.
      - **Debilidades**: expone la estructura de la app, confunde al usuario, no protege datos locales.
      - **Oportunidades**: ninguna.
      - **Amenazas**: pérdida de confianza del usuario, mala calificación en tiendas de aplicaciones.

    - **Opiniones y comentarios internos**:

      - "Ver pantallas vacías con errores de autenticación es una experiencia horrible. El usuario no sabe si la app está rota o si es un problema de permisos".
      - "Además, si no bloqueamos el acceso local, un usuario no autenticado podría ver datos de sesiones anteriores si el repositorio local no está aislado".

  - **2. Validación en cliente y servidor (sin middleware centralizado)**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple parcialmente, pero es propenso a errores de implementación (duplicación de lógica) y puede haber desincronización entre la validación local y la del servidor.

      - **Detalles**:
        - Cada pantalla o componente verifica el token localmente antes de renderizarse.
        - El servidor también verifica el token en cada solicitud.
        - Es más seguro que la opción 1, porque las pantallas no se renderizan si no hay token.
        - Sin embargo, la lógica de verificación está duplicada en muchos lugares, lo que aumenta el riesgo de olvidar una verificación en alguna pantalla nueva.
        - El manejo de expiración de token es complejo y puede ser inconsistente entre pantallas.
        - No hay un punto único de control, lo que dificulta auditorías y mantenimiento.

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio, pero alto costo de mantenimiento y riesgo de errores.

      - **Ejemplos**:
        - **Licencias**: ninguna.
        - **Capacitación**: el equipo debe recordar añadir la verificación en cada nueva pantalla.
        - **Operación**: difícil de auditar, fácil de olvidar.
        - **Medición**: se requiere monitoreo de cobertura de verificación.

    - **Análisis FODA**:

      - **Fortalezas**: protege pantallas localmente y en servidor.
      - **Debilidades**: lógica duplicada, inconsistente, difícil de mantener, propenso a errores humanos.
      - **Oportunidades**: se puede mejorar con un servicio centralizado de autenticación.
      - **Amenazas**: una nueva pantalla sin verificación queda expuesta.

    - **Opiniones y comentarios internos**:

      - "Duplicar la lógica de verificación en 20 pantallas es un desastre asegurado. Alguien va a olvidar una".
      - "Necesitamos un punto único de control, como un middleware o un guard de navegación".

  - **3. Validación con middleware de navegación + almacenamiento seguro + manejo de expiración**:

    - **Cumple/no cumple con los criterios y por qué**:

      - **Resumen**: Cumple plenamente con todos los criterios de seguridad, experiencia de usuario y mantenibilidad.

      - **Detalles**:
        - Se implementa un middleware que intercepta cada intento de navegación a una ruta protegida.
        - El middleware verifica la existencia y validez del token de forma sincrónica y centralizada.
        - Si el token es válido, permite la navegación.
        - Si no es válido o no existe, redirige inmediatamente a la pantalla de login.
        - El token se almacena de forma segura usando `SecureStore` (React Native) o `flutter_secure_storage`.
        - Se implementa un mecanismo de "refresco de token" silencioso (usando un refresh token) para evitar redirigir al usuario al login cada vez que el access token expira. Si el refresh falla, se cierra la sesión.
        - Todas las solicitudes al backend incluyen el token y el servidor lo valida (doble capa de seguridad).
        - El repositorio local (SQLite) solo es accesible si el usuario está autenticado (se verifica el token antes de inicializar el repositorio o en cada consulta).

    - **Análisis de costos**:

      - **Resumen**: Costo de implementación medio-alto (requiere configuración de middleware y almacenamiento seguro), pero el mayor retorno en seguridad y mantenibilidad.

      - **Ejemplos**:
        - **Licencias**: ninguna (SecureStore, Keychain, Keystore son nativos).
        - **Capacitación**: el equipo debe aprender a usar el middleware y el servicio de autenticación.
        - **Operación**: fácil de mantener, un solo punto de control para toda la autenticación.
        - **Medición**: se puede medir la cantidad de redirecciones a login por token expirado.

    - **Análisis FODA**:

      - **Fortalezas**:
        - Punto único de control para toda la autenticación.
        - Almacenamiento seguro de credenciales.
        - Manejo centralizado de expiración y refresco.
        - Protege tanto la UI como los datos locales.
        - Fácil de auditar y mantener.
        - Mejora la experiencia del usuario con refresco silencioso.
      - **Debilidades**:
        - Mayor complejidad inicial (implementación del middleware y manejo de refresco).
        - Requiere pruebas exhaustivas de los flujos de expiración y refresco.
      - **Oportunidades**:
        - El mismo middleware puede usarse para autorización basada en roles (ej. permisos de administrador).
        - Se puede extender para autenticación con proveedores externos.
      - **Amenazas**:
        - Si el token de refresco se almacena de forma insegura, se pierde la seguridad.
        - Si el servidor de autenticación cae, los usuarios no podrán iniciar sesión ni refrescar.

    - **Opiniones y comentarios internos**:

      - "El middleware de navegación es el estándar en frameworks modernos. Es fácil de implementar y muy efectivo".
      - "Almacenar el token en SecureStore es obligatorio. No podemos guardarlo en AsyncStorage".
      - "El refresco silencioso es clave para que el usuario no tenga que iniciar sesión cada hora. Es una mejora enorme de UX".

- **Opiniones y comentarios externos**:

  - **Resumen**: La validación proviene del spike técnico planificado para esta decisión.

  - **¿Quién da la opinión?**:

    - SPIKE-011 — Validará que el middleware bloquea el 100 % de accesos sin token, que el token se guarda en SecureStore y que la sesión persiste — Propuesto.

  - **¿Cuáles son otros candidatos que consideró?**:

    - Uso de autenticación biométrica (huella, Face ID) como segundo factor — se considera un complemento futuro, pero no reemplaza el control de acceso por token.
    - Validación solo en servidor — descartada por exponer la UI.
    - Validación descentralizada — descartada por riesgo de olvidos.

  - **¿Qué estás creando?**:

    - Aplicación móvil B2C para campesinos, que maneja información sensible (económica, productiva) que debe protegerse de accesos no autorizados.
    - **Orientado al exterior o solo para empleados**: orientado al usuario final.
    - **Computadora de escritorio o móvil**: aplicación móvil.
    - **Piloto o producción**: primera versión funcional con criterios de calidad para producción.
    - **Monolito o microservicios**: arquitectura monolítica inicial.

  - **¿Cómo evaluó a los candidatos?**:

    Mediante el SPIKE-011, que probará el bloqueo de accesos sin token, el almacenamiento seguro y la persistencia de sesión.

  - **¿Por qué elegiste al ganador?**:

    Se seleccionó la **opción 3 (middleware de navegación + almacenamiento seguro + manejo de expiración)** porque:
    - Es la única que combina seguridad robusta con una excelente experiencia de usuario (refresco silencioso, redirección inmediata).
    - Centraliza la lógica de autenticación en un solo punto, facilitando el mantenimiento y reduciendo errores.
    - Protege tanto la UI (pantallas) como los datos locales (repositorio).
    - Es el patrón estándar en frameworks modernos y en prácticas de seguridad móvil.

  - **¿Qué está pasando desde entonces?**:

    - **¿Cómo se desempeña el ganador?**: Pendiente de ejecución del spike. Se implementará un `AuthService` con almacenamiento seguro, un middleware de navegación que verifique el token, y un interceptor HTTP que maneje el refresco silencioso. Se medirá la tasa de bloqueo de accesos no autorizados y la persistencia de sesión.
    - **¿Qué porcentaje del tráfico de usuarios de producción fluye a través del ganador?**: El 100 % de las navegaciones a pantallas protegidas pasarán por el middleware.
    - **¿Qué tipos de integraciones están involucradas?**: Integración con el servicio de autenticación del backend (login, refresh token), con el almacenamiento seguro (`SecureStore` / `Keychain` / `Keystore`), con el sistema de navegación (React Navigation o Flutter Router según el stack de AgroTrack) y con el repositorio local (para verificar autenticación antes de acceder a SQLite).
    - **Sabiendo lo que sabes ahora, ¿qué aconsejarías a las personas que hicieran de manera diferente?**: No esperar a implementar la seguridad. Hacerla desde el día 1 es más fácil que añadirla después. Definir claramente qué rutas son públicas (ej. login, registro, recuperación de contraseña) y cuáles son protegidas (el resto). Incluir un manejo de errores de autenticación global en el cliente (ej. interceptor HTTP) para detectar respuestas 401 y cerrar sesión automáticamente. Realizar pruebas de penetración básicas para validar que no hay fugas de información.

  - **Anécdotas**:

    - En el diseño del SPIKE-011 se aprendió que un usuario puede ver el título de una pantalla protegida sin token; eso confunde y debe bloquearse.
    - También se identificó que un token almacenado en `AsyncStorage` es vulnerable en dispositivos rooteados; al migrar a `SecureStore`, el riesgo se mitiga.
    - Se observó que el refresco silencioso mejora drásticamente la experiencia del usuario, evitando que tenga que iniciar sesión varias veces al día.

- **Recomendación**:

  - **Resumen**:

    Se recomienda implementar un sistema de **control de acceso basado en middleware de navegación con almacenamiento seguro de tokens y manejo de expiración (refresco silencioso)**, cumpliendo con el escenario ESC-CAL-SEG-01.

  - **Detalles**:

    Esta estrategia ofrece el mejor equilibrio entre seguridad, experiencia de usuario y mantenibilidad.

    La implementación deberá considerar como mínimo:

    - **Servicio de autenticación (`AuthService`)**:
      - `login(credentials)`: autentica contra el backend y almacena el token.
      - `logout()`: elimina el token y limpia el estado.
      - `isAuthenticated()`: verifica si el token existe y es válido (localmente).
      - `refreshToken()`: intenta obtener un nuevo access token usando el refresh token.
      - `getToken()`: obtiene el token almacenado.
      - Almacenamiento seguro: usar `SecureStore` (React Native) o `flutter_secure_storage`.
    - **Middleware de navegación**:
      - En React Navigation: usar un `useEffect` en el componente raíz o un `NavigationContainer` con `onStateChange` para verificar autenticación antes de cada cambio de ruta.
      - En Flutter: usar `NavigatorObserver` o `RouterDelegate` con guards.
      - Definir una lista de rutas públicas (login, registro, recuperación) y protegidas (todas las demás).
    - **Manejo de expiración**:
      - En el interceptor de HTTP (axios/fetch), capturar respuestas 401 (token expirado) y automáticamente intentar refrescar el token.
      - Si el refresco es exitoso, reenviar la solicitud original.
      - Si el refresco falla, cerrar sesión y redirigir al login.
    - **Capa de repositorio local**:
      - El repositorio local (SQLite) debe verificar la autenticación antes de ejecutar cualquier consulta.
      - Asociar todos los datos locales al `userId` del usuario autenticado.
    - **Pruebas**:
      - Pruebas unitarias del `AuthService`.
      - Pruebas de integración de los flujos: login exitoso, login fallido, expiración de token, refresco exitoso, refresco fallido.
      - Pruebas de UI: navegación bloqueada sin token, redirección a login, persistencia de sesión al cerrar y abrir la app.

    Se descarta la validación solo en servidor (por su pobre UX y exposición de UI) y la validación descentralizada en componentes (por su alto riesgo de errores y duplicación). El middleware centralizado con almacenamiento seguro es la opción más robusta y profesional para AgroTrack.