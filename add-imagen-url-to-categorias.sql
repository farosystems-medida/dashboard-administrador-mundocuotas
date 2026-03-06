-- Agregar campo imagen_url a la tabla categorias
ALTER TABLE public.categorias
ADD COLUMN imagen_url TEXT;

-- Agregar comentario para documentación
COMMENT ON COLUMN public.categorias.imagen_url IS 'URL de la imagen de la categoría';
