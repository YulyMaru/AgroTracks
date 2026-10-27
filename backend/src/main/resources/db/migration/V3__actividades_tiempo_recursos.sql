-- HU-11, HU-12 y HU-13: actividades productivas, tiempo de trabajo y recursos utilizados.
-- Mismas reglas que V1: ninguna columna admite NULL y la ubicacion va como
-- id_finca + nivel_ubicacion ('LOTE' o 'CULTIVO') + id_ubicacion.

-- HU-11: actividad hecha en un lote o cultivo.
CREATE TABLE actividades (
    id                    UUID PRIMARY KEY,
    id_usuario            UUID          NOT NULL REFERENCES usuarios (id),
    id_finca              UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion       VARCHAR(10)   NOT NULL,
    id_ubicacion          UUID          NOT NULL,
    tipo_actividad        VARCHAR(60)   NOT NULL,
    fecha                 DATE          NOT NULL,
    descripcion           VARCHAR(500)  NOT NULL,
    informacion_adicional VARCHAR(500)  NOT NULL,
    origen                VARCHAR(20)   NOT NULL,
    creado_en             TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en        TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_actividades_usuario_fecha ON actividades (id_usuario, fecha);
CREATE INDEX idx_actividades_ubicacion ON actividades (nivel_ubicacion, id_ubicacion);
CREATE INDEX idx_actividades_usuario_actualizado ON actividades (id_usuario, actualizado_en);

-- HU-12: tiempo dedicado a una actividad; el lugar se copia de la actividad.
CREATE TABLE tiempos_trabajo (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_actividad    UUID          NOT NULL REFERENCES actividades (id),
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion VARCHAR(10)   NOT NULL,
    id_ubicacion    UUID          NOT NULL,
    duracion_horas  NUMERIC(6,2)  NOT NULL,
    fecha           DATE          NOT NULL,
    origen          VARCHAR(20)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_tiempos_actividad ON tiempos_trabajo (id_actividad);
CREATE INDEX idx_tiempos_usuario_actualizado ON tiempos_trabajo (id_usuario, actualizado_en);

-- HU-13: recurso usado en una actividad, con su cantidad y unidad; el lugar se copia de la actividad.
CREATE TABLE recursos_actividad (
    id              UUID PRIMARY KEY,
    id_usuario      UUID          NOT NULL REFERENCES usuarios (id),
    id_actividad    UUID          NOT NULL REFERENCES actividades (id),
    id_finca        UUID          NOT NULL REFERENCES fincas (id),
    nivel_ubicacion VARCHAR(10)   NOT NULL,
    id_ubicacion    UUID          NOT NULL,
    recurso         VARCHAR(60)   NOT NULL,
    cantidad        NUMERIC(14,3) NOT NULL,
    unidad          VARCHAR(30)   NOT NULL,
    origen          VARCHAR(20)   NOT NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_recursos_actividad ON recursos_actividad (id_actividad);
CREATE INDEX idx_recursos_usuario_actualizado ON recursos_actividad (id_usuario, actualizado_en);

-- Catalogo (ADR-029): tipos de actividad productiva y tipos de recurso.
INSERT INTO parametros (id, tipo, codigo, etiqueta, orden, activo, creado_en, actualizado_en) VALUES
    ('00000000-0000-0000-0000-000000000026', 'TIPO_ACTIVIDAD', 'SIEMBRA', 'Siembra', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000027', 'TIPO_ACTIVIDAD', 'FERTILIZACION', 'Fertilización', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000028', 'TIPO_ACTIVIDAD', 'FUMIGACION', 'Fumigación', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000029', 'TIPO_ACTIVIDAD', 'DESYERBE', 'Desyerbe', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000030', 'TIPO_ACTIVIDAD', 'PODA', 'Poda', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000031', 'TIPO_ACTIVIDAD', 'RIEGO', 'Riego', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000032', 'TIPO_ACTIVIDAD', 'COSECHA', 'Cosecha', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000033', 'TIPO_ACTIVIDAD', 'OTRA', 'Otra', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000034', 'TIPO_RECURSO', 'FERTILIZANTE', 'Fertilizante o abono', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000035', 'TIPO_RECURSO', 'HERBICIDA', 'Herbicida', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000036', 'TIPO_RECURSO', 'INSECTICIDA', 'Insecticida', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000037', 'TIPO_RECURSO', 'FUNGICIDA', 'Fungicida', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000038', 'TIPO_RECURSO', 'SEMILLA', 'Semilla', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000039', 'TIPO_RECURSO', 'AGUA', 'Agua', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000040', 'TIPO_RECURSO', 'MAQUINARIA', 'Maquinaria', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000041', 'TIPO_RECURSO', 'HERRAMIENTA', 'Herramienta', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000042', 'TIPO_RECURSO', 'OTRO', 'Otro', 9, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
