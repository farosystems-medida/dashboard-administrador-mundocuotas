-- Agregar campo titulo_seccion_combos a la tabla configuracion_web
ALTER TABLE configuracion_web
ADD COLUMN titulo_seccion_combos TEXT DEFAULT 'Combos Especiales';

-- Actualizar el comentario de la tabla
COMMENT ON COLUMN configuracion_web.titulo_seccion_combos IS 'Título personalizable para la sección de combos';

-- Actualizar configuración existente con el título por defecto
UPDATE configuracion_web
SET titulo_seccion_combos = 'Combos Especiales'
WHERE titulo_seccion_combos IS NULL;