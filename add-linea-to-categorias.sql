-- Agregar campo fk_id_linea a la tabla categorias
-- Ejecuta este script en el SQL Editor de Supabase DESPUÉS de crear la tabla líneas

-- Agregar la columna fk_id_linea a la tabla categorias
ALTER TABLE public.categorias 
ADD COLUMN fk_id_linea bigint null;

-- Crear índice para mejorar el rendimiento de consultas por línea
CREATE INDEX categorias_fk_id_linea_idx ON public.categorias (fk_id_linea) WHERE fk_id_linea IS NOT NULL;

-- Agregar foreign key constraint
ALTER TABLE public.categorias 
ADD CONSTRAINT categorias_fk_id_linea_fkey 
FOREIGN KEY (fk_id_linea) REFERENCES public.lineas (id) ON DELETE SET NULL;

-- Agregar comentario al campo para documentación
COMMENT ON COLUMN public.categorias.fk_id_linea IS 'Línea a la que pertenece esta categoría (opcional)';

-- Actualizar comentario de la tabla para reflejar la nueva jerarquía
COMMENT ON TABLE public.categorias IS 'Tabla de categorías de productos (parte de la jerarquía Línea > Categoría > Producto)';