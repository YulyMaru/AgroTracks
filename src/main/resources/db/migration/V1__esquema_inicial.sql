-- AgroTrack - esquema inicial (ADR-013, ADR-019).
-- SQL portable: funciona en PostgreSQL 15+ y en H2 (modo PostgreSQL) para desarrollo.
--
-- REGLA: ninguna columna admite NULL. Todos los datos de los formularios son obligatorios.
-- La ubicacion de un registro se guarda siempre como:
--   id_finca        -> la finca (siempre)
--   nivel_ubicacion -> 'FINCA', 'LOTE' o 'CULTIVO' (lo mas especifico que eligio el usuario)
--   id_ubicacion    -> el id de esa finca, lote o cultivo
-- Asi un gasto puede ir a la finca, a un lote o a un cultivo sin dejar columnas vacias.
-- Las reglas de valores (> 0, tipos, niveles) se validan en la aplicacion: los CHECK de
-- H2 2.4 fallaron de forma intermitente en desarrollo.

CREATE TABLE usuarios (
    id              UUID PRIMARY KEY,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    nombre          VARCHAR(120) NOT NULL,
    clave_hash      VARCHAR(100) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE tokens_renovacion (
    id              UUID PRIMARY KEY,
    id_usuario      UUID         NOT NULL REFERENCES usuarios (id),
    token_hash      VARCHAR(64)  NOT NULL UNIQUE,
    expira_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    revocado        BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_tokens_renovacion_usuario ON tokens_renovacion (id_usuario);

-- Catalogo de parametros no sensibles (ADR-029)
CREATE TABLE parametros (
    id              UUID PRIMARY KEY,
    tipo            VARCHAR(40)  NOT NULL,
    codigo          VARCHAR(60)  NOT NULL,
    etiqueta        VARCHAR(120) NOT NULL,
    orden           INTEGER      NOT NULL DEFAULT 0,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_parametros_tipo_codigo UNIQUE (tipo, codigo)
);
CREATE INDEX idx_parametros_tipo_activo ON parametros (tipo, activo);

-- HU-01. Los id los genera el movil (UUID = idLocal) para que un lote creado sin conexion
-- pueda apuntar a una finca tambien creada sin conexion.
CREATE TABLE fincas (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    nombre          VARCHAR(120)  NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_fincas_usuario_actualizado ON fincas (id_usuario, actualizado_en);

-- HU-02: lote de una finca, con su area y la unidad de medida del area.
CREATE TABLE lotes (
    id              UUID PRIMARY KEY,
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    nombre          VARCHAR(120)  NOT NULL,
    area            NUMERIC(14,4) NOT NULL,
    unidad_area     VARCHAR(30)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_lotes_finca ON lotes (id_finca);
CREATE INDEX idx_lotes_usuario_actualizado ON lotes (id_usuario, actualizado_en);

-- HU-03: cultivo en una finca o en un lote (nivel FINCA o LOTE).
CREATE TABLE cultivos (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion VARCHAR(10)   NOT NULL,
    id_ubicacion    UUID          NOT NULL,
    nombre          VARCHAR(120)  NOT NULL,
    tipo_cultivo    VARCHAR(60)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_cultivos_finca ON cultivos (id_finca);
CREATE INDEX idx_cultivos_ubicacion ON cultivos (nivel_ubicacion, id_ubicacion);
CREATE INDEX idx_cultivos_usuario_actualizado ON cultivos (id_usuario, actualizado_en);

-- HU-08: gasto de una finca (o de un lote o cultivo de ella).
CREATE TABLE gastos (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    concepto        VARCHAR(150)  NOT NULL,
    valor           NUMERIC(15,2) NOT NULL,
    fecha           DATE          NOT NULL,
    categoria       VARCHAR(60)   NOT NULL,
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion VARCHAR(10)   NOT NULL,
    id_ubicacion    UUID          NOT NULL,
    observacion     VARCHAR(500)  NOT NULL,
    origen          VARCHAR(20)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_gastos_usuario_fecha ON gastos (id_usuario, fecha);
CREATE INDEX idx_gastos_finca ON gastos (id_finca);
CREATE INDEX idx_gastos_usuario_actualizado ON gastos (id_usuario, actualizado_en);

-- HU-10: otro ingreso de una finca (o de un lote o cultivo de ella).
CREATE TABLE ingresos (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    concepto        VARCHAR(150)  NOT NULL,
    valor           NUMERIC(15,2) NOT NULL,
    fecha           DATE          NOT NULL,
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion VARCHAR(10)   NOT NULL,
    id_ubicacion    UUID          NOT NULL,
    origen          VARCHAR(20)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_ingresos_usuario_fecha ON ingresos (id_usuario, fecha);
CREATE INDEX idx_ingresos_finca ON ingresos (id_finca);
CREATE INDEX idx_ingresos_usuario_actualizado ON ingresos (id_usuario, actualizado_en);

-- HU-05: produccion de un lote o cultivo; la cantidad siempre con su unidad.
CREATE TABLE producciones (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion VARCHAR(10)   NOT NULL,
    id_ubicacion    UUID          NOT NULL,
    cantidad        NUMERIC(14,3) NOT NULL,
    unidad          VARCHAR(30)   NOT NULL,
    fecha           DATE          NOT NULL,
    origen          VARCHAR(20)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_producciones_usuario_fecha ON producciones (id_usuario, fecha);
CREATE INDEX idx_producciones_usuario_actualizado ON producciones (id_usuario, actualizado_en);

-- HU-07: venta de la produccion de un cultivo.
CREATE TABLE ventas (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_cultivo      UUID          NOT NULL REFERENCES cultivos (id),
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    cantidad        NUMERIC(14,3) NOT NULL,
    unidad          VARCHAR(30)   NOT NULL,
    valor           NUMERIC(15,2) NOT NULL,
    fecha           DATE          NOT NULL,
    origen          VARCHAR(20)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_ventas_usuario_fecha ON ventas (id_usuario, fecha);
CREATE INDEX idx_ventas_usuario_actualizado ON ventas (id_usuario, actualizado_en);

-- Registro de idempotencia de la sincronizacion (ADR-007).
-- La PK sobre id_local garantiza que N reintentos producen exactamente 1 efecto.
CREATE TABLE operaciones_sincronizadas (
    id_local          UUID PRIMARY KEY,
    id_usuario        UUID          NOT NULL REFERENCES usuarios (id),
    tipo_operacion    VARCHAR(20)   NOT NULL,
    id_recurso        UUID          NOT NULL,
    creado_en_cliente TIMESTAMP WITH TIME ZONE NOT NULL,
    procesado_en      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_operaciones_sincronizadas_usuario ON operaciones_sincronizadas (id_usuario, procesado_en);
