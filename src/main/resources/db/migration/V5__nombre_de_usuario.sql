-- Nombre de usuario para entrar sin escribir el correo (mejor experiencia en el campo).
-- Sigue siendo obligatorio y unico (R1). Las cuentas que ya existian usan su correo como nombre de
-- usuario, asi pueden seguir entrando igual que antes.
ALTER TABLE usuarios ADD COLUMN nombre_usuario VARCHAR(150);
UPDATE usuarios SET nombre_usuario = LOWER(correo);
ALTER TABLE usuarios ALTER COLUMN nombre_usuario SET NOT NULL;
CREATE UNIQUE INDEX ux_usuarios_nombre_usuario ON usuarios (nombre_usuario);
