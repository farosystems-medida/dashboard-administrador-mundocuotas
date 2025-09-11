-- Script para agregar columnas de configuración de la sección home
-- Se ejecuta sobre la tabla configuracion_web existente

-- Agregar columnas para configuración de home section
ALTER TABLE configuracion_web 
ADD COLUMN IF NOT EXISTS home_display_plan_id INTEGER REFERENCES planes_financiacion(id),
ADD COLUMN IF NOT EXISTS home_display_products_count INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS home_display_category_filter INTEGER REFERENCES categorias(id),
ADD COLUMN IF NOT EXISTS home_display_brand_filter INTEGER REFERENCES marcas(id),
ADD COLUMN IF NOT EXISTS home_display_featured_only BOOLEAN DEFAULT false;

-- Comentarios sobre las nuevas columnas
COMMENT ON COLUMN configuracion_web.home_display_plan_id IS 'ID del plan de financiación a mostrar en home (NULL para mostrar precios base)';
COMMENT ON COLUMN configuracion_web.home_display_products_count IS 'Cantidad de productos a mostrar en la sección home';
COMMENT ON COLUMN configuracion_web.home_display_category_filter IS 'ID de categoría para filtrar productos en home (NULL para todas las categorías)';
COMMENT ON COLUMN configuracion_web.home_display_brand_filter IS 'ID de marca para filtrar productos en home (NULL para todas las marcas)';
COMMENT ON COLUMN configuracion_web.home_display_featured_only IS 'Si solo mostrar productos destacados en home';

-- Actualizar el registro existente con valores por defecto si no tiene valores
UPDATE configuracion_web 
SET 
  home_display_products_count = COALESCE(home_display_products_count, 12),
  home_display_featured_only = COALESCE(home_display_featured_only, false)
WHERE id = 1;

-- Mostrar el estado actual de la configuración
SELECT 
  id,
  home_display_plan_id,
  home_display_products_count,
  home_display_category_filter,
  home_display_brand_filter,
  home_display_featured_only,
  created_at
FROM configuracion_web;