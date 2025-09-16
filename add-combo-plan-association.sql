-- Agregar campo fk_id_combo a la tabla productos_planes_default
-- para permitir asociar combos a planes de financiación

ALTER TABLE public.productos_planes_default
ADD COLUMN fk_id_combo INTEGER REFERENCES combos(id) ON DELETE CASCADE;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_planes_default_combo ON productos_planes_default(fk_id_combo);

-- Comentario de documentación
COMMENT ON COLUMN productos_planes_default.fk_id_combo IS 'Referencia opcional al combo asociado con este plan de financiación';

-- Agregar restricción para asegurar que se asocie o un producto o un combo, pero no ambos
-- (opcional: puedes comentar esta línea si quieres permitir ambos)
-- ALTER TABLE productos_planes_default
-- ADD CONSTRAINT check_producto_or_combo
-- CHECK ((fk_id_producto IS NOT NULL AND fk_id_combo IS NULL) OR (fk_id_producto IS NULL AND fk_id_combo IS NOT NULL));