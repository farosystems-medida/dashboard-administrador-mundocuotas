-- Agregar campo combos a la tabla configuracion_web
ALTER TABLE configuracion_web
ADD COLUMN combos BOOLEAN DEFAULT false;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN configuracion_web.combos IS 'Indica si los combos están habilitados en la aplicación web';