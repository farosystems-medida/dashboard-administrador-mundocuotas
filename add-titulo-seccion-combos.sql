-- Agregar campos de títulos para secciones a la tabla configuracion_web
ALTER TABLE configuracion_web
ADD COLUMN titulo_seccion_combos TEXT DEFAULT 'Combos Especiales',
ADD COLUMN titulo_seccion_promos TEXT DEFAULT 'Promociones',
ADD COLUMN titulo_seccion_destacados TEXT DEFAULT 'Productos Destacados';

-- Actualizar los comentarios de la tabla
COMMENT ON COLUMN configuracion_web.titulo_seccion_combos IS 'Título personalizable para la sección de combos';
COMMENT ON COLUMN configuracion_web.titulo_seccion_promos IS 'Título personalizable para la sección de promociones';
COMMENT ON COLUMN configuracion_web.titulo_seccion_destacados IS 'Título personalizable para la sección de productos destacados';

-- Actualizar configuración existente con los títulos por defecto
UPDATE configuracion_web
SET titulo_seccion_combos = 'Combos Especiales',
    titulo_seccion_promos = 'Promociones',
    titulo_seccion_destacados = 'Productos Destacados'
WHERE titulo_seccion_combos IS NULL
   OR titulo_seccion_promos IS NULL
   OR titulo_seccion_destacados IS NULL;