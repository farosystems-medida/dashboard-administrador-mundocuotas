-- Agregar campo fk_id_categoria a la tabla combos
ALTER TABLE public.combos
ADD COLUMN fk_id_categoria INTEGER REFERENCES categorias(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_combos_categoria ON combos(fk_id_categoria);

-- Comentario de documentación
COMMENT ON COLUMN combos.fk_id_categoria IS 'Referencia a la categoría del combo (opcional)';