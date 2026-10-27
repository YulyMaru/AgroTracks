# ADR-032: Arquitectura hexagonal dentro del monolito modular

- **Estado:** Aceptado
- **Fecha:** 2026-10-22
- **Complementa a:** ADR-018 (monolito modular, se mantiene) y ADR-016 (Spring Boot 4.1 + Java 27)
- **Nota de numeración:** este ADR se creó como "ADR-031" y se renumeró a ADR-032 porque ese número ya lo usaba la decisión de despliegue (ADR-031: Desplegar el backend en Google Cloud con Cloud Run y Cloud SQL).

## Contexto

El backend de AgroTrack es un monolito modular: un solo despliegue y una sola base de datos, dividido en
módulos (`autenticacion`, `catalogo`, `registros`, `sincronizacion`). Dentro de cada módulo, el código
estaba organizado por tipo técnico (`controller`, `service`, `repository`, `model`), y las reglas del
negocio dependían directamente de Spring y de JPA. Las entidades del dominio eran a la vez tablas, y un
módulo podía usar cualquier clase de otro.

Eso hacía difícil:

- probar las reglas sin levantar Spring ni una base de datos;
- cambiar una tecnología (por ejemplo, la base de datos o el formato del token) sin tocar la lógica;
- saber qué puede usar un módulo de otro.

Se descartaron los microservicios: la sincronización offline necesita guardar en **una sola
transacción** el cambio, el historial y el registro de idempotencia. Repartido en varios servicios
haría falta coordinación distribuida (sagas), y un equipo pequeño no puede sostener varios despliegues.

## Decisión

Se mantiene el **monolito modular** y, dentro de cada módulo, se aplica **arquitectura hexagonal
(puertos y adaptadores)**. Cada módulo tiene la misma estructura:

```
modulos/<modulo>/
  dominio/                         Reglas y modelos del negocio. Java puro.
  aplicacion/
    puerto/entrada/                Lo que el módulo ofrece (casos de uso). Es su API pública.
    puerto/salida/                 Lo que el módulo necesita (guardar, cifrar, otro módulo...).
    servicio/                      Implementación de los casos de uso. Sin Spring.
  infraestructura/
    entrada/web/                   Controladores REST (adaptadores de entrada).
    salida/persistencia/           JPA y Spring Data (adaptadores de salida).
    salida/<otro>/                 Adaptadores hacia otros módulos, seguridad, métricas.
    configuracion/                 Clases @Configuration que arman los casos de uso con sus adaptadores.
compartido/
  dominio/                         Errores del negocio (CodigoError, ExcepcionAgroTrack).
  aplicacion/puerto/               Puertos comunes: Transacciones, ConversorJson.
  infraestructura/                 Web (errores, traza), seguridad JWT, JSON, transacciones.
```

### Reglas (las verifica `ArquitecturaHexagonalTest`)

1. **El dominio es Java puro.** No importa Spring, JPA, Jackson, la web, ni otras capas.
2. **La aplicación solo habla con puertos.** No importa Spring, JPA, Jackson ni la infraestructura.
   Las transacciones llegan por el puerto `Transacciones`.
3. **Un módulo solo usa otro desde un adaptador de su infraestructura**, y solo el **puerto de entrada**
   o el **dominio** del otro. Ejemplos:
   - `registros` valida códigos con `CatalogoPuerto`; su adaptador `CatalogoAdaptador` llama a
     `ConsultarCatalogo` (puerto de entrada de `catalogo`).
   - `sincronizacion` aplica cambios con `RegistrosPuerto`; su adaptador `RegistrosAdaptador` llama a
     `GestionarRegistros` (puerto de entrada de `registros`). La sincronización tiene su propio
     `TipoRegistro` y no depende del dominio de registros.

### Flujo de una petición

```
Controlador (entrada/web) -> Puerto de entrada -> Servicio (aplicacion) -> Dominio
                                                      |
                                                      v
                                              Puerto de salida -> Adaptador JPA -> PostgreSQL
```

## La app móvil sigue la misma arquitectura

La app Android (React Native) usa la misma forma por módulos (`autenticacion`, `registros`,
`sincronizacion`), con `dominio/`, `aplicacion/` (casos de uso y puertos) e `infraestructura/`
(SQLite, HTTP, Keychain, NetInfo). `src/composicion.ts` es el único lugar que conecta los adaptadores, y
las pantallas solo lo usan a él. `__tests__/arquitectura.test.ts` verifica las mismas reglas que el
backend, más una: las pantallas y la navegación nunca tocan la infraestructura.

El paquete de Android pasa de `com.agrotrackmovil` a `co.edu.uco.agrotrack`, el mismo dominio
institucional que usa el backend (`co.edu.uco.agrotrack`).

## Consecuencias

**Positivas**

- Las reglas del negocio (versión, borrado lógico, dependencias, idempotencia) se pueden probar sin
  Spring.
- Cambiar PostgreSQL, el JWT o las métricas solo toca un adaptador.
- Lo que un módulo expone a los demás queda explícito, y una prueba lo hace cumplir.

**Negativas**

- Hay más archivos: cada registro tiene su clase de dominio y su fila JPA, con traducción entre ambas.
- Los casos de uso se arman a mano en las clases `@Configuration`.

**Sin cambios**

- La API REST, el formato JSON, las tablas, las migraciones Flyway (V1–V4) y la app móvil siguen
  iguales. Las mismas pruebas de integración pasan antes y después del cambio.
