-- Agregar campo booleano tiene_stock a la tabla productos
ALTER TABLE public.productos 
ADD COLUMN tiene_stock boolean NOT NULL DEFAULT true;

-- Crear índice para mejorar el rendimiento de consultas por este campo
CREATE INDEX productos_tiene_stock_idx ON public.productos (tiene_stock);

-- Agregar comentario para documentación
COMMENT ON COLUMN public.productos.tiene_stock IS 'Indica si el producto tiene stock disponible';