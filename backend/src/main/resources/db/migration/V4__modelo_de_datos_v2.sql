-- Modelo de datos v2 (docs/ModeloDeDatos.md). Reemplaza las tablas de registros de V1 y V3.
-- Antes del primer lanzamiento: solo habia datos de prueba, por eso se eliminan.
-- Reglas: ninguna columna admite NULL (R1); el id lo genera el celular (R3); editar sube la
-- version y guarda historial (R4); borrar es logico (R5); el dinero va en pesos enteros (R6).

DROP TABLE recursos_actividad;
DROP TABLE tiempos_trabajo;
DROP TABLE actividades;
DROP TABLE ventas;
DROP TABLE producciones;
DROP TABLE gastos;
DROP TABLE ingresos;
DROP TABLE cultivos;
DROP TABLE lotes;
DROP TABLE fincas;
DROP TABLE operaciones_sincronizadas;

-- 3.1 Finca
CREATE TABLE fincas (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    nombre          VARCHAR(120)  NOT NULL,
    municipio       VARCHAR(80)   NOT NULL,
    vereda          VARCHAR(80)   NOT NULL,
    version         INTEGER       NOT NULL,
    eliminado       BOOLEAN       NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_fincas_usuario ON fincas (id_usuario, actualizado_en);

-- 3.2 Lote
CREATE TABLE lotes (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nombre          VARCHAR(120)  NOT NULL,
    area            NUMERIC(14,4) NOT NULL,
    unidad_area     VARCHAR(30)   NOT NULL,
    version         INTEGER       NOT NULL,
    eliminado       BOOLEAN       NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_lotes_finca ON lotes (id_finca);
CREATE INDEX idx_lotes_usuario ON lotes (id_usuario, actualizado_en);

-- 3.3 Cultivo (siempre dentro de un lote)
CREATE TABLE cultivos (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_lote         UUID          NOT NULL REFERENCES lotes (id),
    tipo_cultivo    VARCHAR(60)   NOT NULL,
    especie         VARCHAR(120)  NOT NULL,
    fecha_siembra   DATE          NOT NULL,
    version         INTEGER       NOT NULL,
    eliminado       BOOLEAN       NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_cultivos_lote ON cultivos (id_lote);
CREATE INDEX idx_cultivos_usuario ON cultivos (id_usuario, actualizado_en);

-- 3.4 Cosecha
CREATE TABLE cosechas (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_cultivo      UUID          NOT NULL REFERENCES cultivos (id),
    fecha           DATE          NOT NULL,
    cantidad        NUMERIC(14,3) NOT NULL,
    unidad          VARCHAR(30)   NOT NULL,
    version         INTEGER       NOT NULL,
    eliminado       BOOLEAN       NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_cosechas_cultivo ON cosechas (id_cultivo);
CREATE INDEX idx_cosechas_usuario ON cosechas (id_usuario, actualizado_en);

-- 3.5 Venta
CREATE TABLE ventas (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_cultivo      UUID          NOT NULL REFERENCES cultivos (id),
    fecha           DATE          NOT NULL,
    cantidad        NUMERIC(14,3) NOT NULL,
    unidad          VARCHAR(30)   NOT NULL,
    valor_total     BIGINT        NOT NULL,
    version         INTEGER       NOT NULL,
    eliminado       BOOLEAN       NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_ventas_cultivo ON ventas (id_cultivo);
CREATE INDEX idx_ventas_usuario ON ventas (id_usuario, actualizado_en);

-- 3.6 Gasto (asignado a la finca, a un lote o a un cultivo)
CREATE TABLE gastos (
    id                UUID PRIMARY KEY,
    id_usuario        UUID          NOT NULL REFERENCES usuarios (id),
    fecha             DATE          NOT NULL,
    categoria         VARCHAR(60)   NOT NULL,
    concepto          VARCHAR(150)  NOT NULL,
    valor             BIGINT        NOT NULL,
    nivel_asignacion  VARCHAR(10)   NOT NULL,
    id_asignacion     UUID          NOT NULL,
    id_finca          UUID          NOT NULL REFERENCES fincas (id),
    version           INTEGER       NOT NULL,
    eliminado         BOOLEAN       NOT NULL,
    creado_en         TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en    TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_gastos_asignacion ON gastos (nivel_asignacion, id_asignacion);
CREATE INDEX idx_gastos_usuario ON gastos (id_usuario, actualizado_en);

-- 3.7 Otro ingreso
CREATE TABLE otros_ingresos (
    id                UUID PRIMARY KEY,
    id_usuario        UUID          NOT NULL REFERENCES usuarios (id),
    fecha             DATE          NOT NULL,
    tipo_ingreso      VARCHAR(60)   NOT NULL,
    concepto          VARCHAR(150)  NOT NULL,
    valor             BIGINT        NOT NULL,
    nivel_asignacion  VARCHAR(10)   NOT NULL,
    id_asignacion     UUID          NOT NULL,
    id_finca          UUID          NOT NULL REFERENCES fincas (id),
    version           INTEGER       NOT NULL,
    eliminado         BOOLEAN       NOT NULL,
    creado_en         TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en    TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_otros_ingresos_asignacion ON otros_ingresos (nivel_asignacion, id_asignacion);
CREATE INDEX idx_otros_ingresos_usuario ON otros_ingresos (id_usuario, actualizado_en);

-- 3.8 Labor (actividad + tiempo) y sus insumos
CREATE TABLE labores (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_cultivo      UUID          NOT NULL REFERENCES cultivos (id),
    tipo_labor      VARCHAR(60)   NOT NULL,
    fecha           DATE          NOT NULL,
    descripcion     VARCHAR(300)  NOT NULL,
    horas           NUMERIC(4,2)  NOT NULL,
    trabajadores    INTEGER       NOT NULL,
    version         INTEGER       NOT NULL,
    eliminado       BOOLEAN       NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_labores_cultivo ON labores (id_cultivo);
CREATE INDEX idx_labores_usuario ON labores (id_usuario, actualizado_en);

CREATE TABLE labor_insumos (
    id              UUID PRIMARY KEY,
    id_labor        UUID          NOT NULL REFERENCES labores (id),
    tipo_insumo     VARCHAR(60)   NOT NULL,
    cantidad        NUMERIC(14,3) NOT NULL,
    unidad          VARCHAR(30)   NOT NULL
);
CREATE INDEX idx_labor_insumos_labor ON labor_insumos (id_labor);

-- 3.9 Historial de cambios (copia completa del registro antes de editar o eliminar)
CREATE TABLE historial_cambios (
    id                UUID PRIMARY KEY,
    id_usuario        UUID          NOT NULL REFERENCES usuarios (id),
    tabla             VARCHAR(40)   NOT NULL,
    id_registro       UUID          NOT NULL,
    version           INTEGER       NOT NULL,
    accion            VARCHAR(10)   NOT NULL,
    datos_anteriores  VARCHAR(4000) NOT NULL,
    fecha             TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_historial_registro ON historial_cambios (tabla, id_registro);

-- Idempotencia de la sincronizacion: una fila por operacion aplicada (R3).
CREATE TABLE operaciones_sincronizadas (
    id_operacion      UUID PRIMARY KEY,
    id_usuario        UUID          NOT NULL REFERENCES usuarios (id),
    entidad           VARCHAR(20)   NOT NULL,
    accion            VARCHAR(10)   NOT NULL,
    id_registro       UUID          NOT NULL,
    version_resultante INTEGER      NOT NULL,
    creado_en_cliente TIMESTAMP WITH TIME ZONE NOT NULL,
    procesado_en      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_operaciones_usuario ON operaciones_sincronizadas (id_usuario, procesado_en);

-- 4. Catalogos iniciales
DELETE FROM parametros;
INSERT INTO parametros (id, tipo, codigo, etiqueta, orden, activo, creado_en, actualizado_en) VALUES
    ('00000000-0000-0000-0001-000000000001', 'UNIDAD_AREA', 'HECTAREA', 'Hectárea', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0001-000000000002', 'UNIDAD_AREA', 'CUADRA', 'Cuadra', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0001-000000000003', 'UNIDAD_AREA', 'METRO_CUADRADO', 'Metro cuadrado', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000001', 'UNIDAD', 'KILOGRAMO', 'Kilogramo', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000002', 'UNIDAD', 'ARROBA', 'Arroba', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000003', 'UNIDAD', 'CARGA', 'Carga', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000004', 'UNIDAD', 'BULTO', 'Bulto', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000005', 'UNIDAD', 'CANASTILLA', 'Canastilla', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000006', 'UNIDAD', 'TONELADA', 'Tonelada', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000007', 'UNIDAD', 'LITRO', 'Litro', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0002-000000000008', 'UNIDAD', 'UNIDAD', 'Unidad', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000001', 'TIPO_CULTIVO', 'CAFE', 'Café', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000002', 'TIPO_CULTIVO', 'PLATANO', 'Plátano', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000003', 'TIPO_CULTIVO', 'MAIZ', 'Maíz', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000004', 'TIPO_CULTIVO', 'YUCA', 'Yuca', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000005', 'TIPO_CULTIVO', 'FRIJOL', 'Fríjol', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000006', 'TIPO_CULTIVO', 'AGUACATE', 'Aguacate', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000007', 'TIPO_CULTIVO', 'CACAO', 'Cacao', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000008', 'TIPO_CULTIVO', 'CANA', 'Caña', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000009', 'TIPO_CULTIVO', 'PAPA', 'Papa', 9, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0003-000000000010', 'TIPO_CULTIVO', 'OTRO', 'Otro', 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000001', 'CATEGORIA_GASTO', 'ABONOS_Y_SEMILLAS', 'Abonos y semillas', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000002', 'CATEGORIA_GASTO', 'MANO_DE_OBRA', 'Mano de obra', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000003', 'CATEGORIA_GASTO', 'TRANSPORTE', 'Transporte', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000004', 'CATEGORIA_GASTO', 'AGROQUIMICOS', 'Agroquímicos', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000005', 'CATEGORIA_GASTO', 'HERRAMIENTAS_Y_EQUIPO', 'Herramientas y equipo', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000006', 'CATEGORIA_GASTO', 'SERVICIOS', 'Servicios', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0004-000000000007', 'CATEGORIA_GASTO', 'OTROS', 'Otros', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0005-000000000001', 'TIPO_INGRESO', 'SUBSIDIO', 'Subsidio', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0005-000000000002', 'TIPO_INGRESO', 'ALQUILER', 'Alquiler', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0005-000000000003', 'TIPO_INGRESO', 'SERVICIO_PRESTADO', 'Servicio prestado', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0005-000000000004', 'TIPO_INGRESO', 'VENTA_SUBPRODUCTO', 'Venta de subproducto', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0005-000000000005', 'TIPO_INGRESO', 'OTRO', 'Otro', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000001', 'TIPO_LABOR', 'PREPARACION_TERRENO', 'Preparación del terreno', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000002', 'TIPO_LABOR', 'SIEMBRA', 'Siembra', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000003', 'TIPO_LABOR', 'FERTILIZACION', 'Fertilización', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000004', 'TIPO_LABOR', 'RIEGO', 'Riego', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000005', 'TIPO_LABOR', 'CONTROL_PLAGAS', 'Control de plagas', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000006', 'TIPO_LABOR', 'DESYERBE', 'Desyerbe', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000007', 'TIPO_LABOR', 'PODA', 'Poda', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000008', 'TIPO_LABOR', 'COSECHA', 'Cosecha', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000009', 'TIPO_LABOR', 'POSCOSECHA', 'Poscosecha', 9, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0006-000000000010', 'TIPO_LABOR', 'OTRA', 'Otra', 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000001', 'TIPO_INSUMO', 'SEMILLA', 'Semilla', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000002', 'TIPO_INSUMO', 'ABONO_FERTILIZANTE', 'Abono o fertilizante', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000003', 'TIPO_INSUMO', 'AGROQUIMICO', 'Agroquímico', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000004', 'TIPO_INSUMO', 'AGUA', 'Agua', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000005', 'TIPO_INSUMO', 'HERRAMIENTA', 'Herramienta', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000006', 'TIPO_INSUMO', 'MAQUINARIA', 'Maquinaria', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0007-000000000007', 'TIPO_INSUMO', 'OTRO', 'Otro', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
