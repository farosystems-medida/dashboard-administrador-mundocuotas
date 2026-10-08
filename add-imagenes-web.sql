-- Imágenes gestionables desde el dashboard (se guardan en el bucket "imagenes" de Supabase)
-- Ejecutar en el SQL Editor de Supabase

-- Banner que se muestra en la página de la promoción (/promociones/[slug])
ALTER TABLE public.promociones
    ADD COLUMN IF NOT EXISTS imagen_banner TEXT;

COMMENT ON COLUMN promociones.imagen_banner IS 'URL del banner de la página de la promoción (/promociones/[slug]). Si está vacío usa configuracion_web.imagen_banner_promociones';

-- Imágenes generales del sitio
ALTER TABLE public.configuracion_web
    ADD COLUMN IF NOT EXISTS imagen_hero TEXT,
    ADD COLUMN IF NOT EXISTS imagen_destacados TEXT,
    ADD COLUMN IF NOT EXISTS imagen_banner_promociones TEXT;

COMMENT ON COLUMN configuracion_web.imagen_hero IS 'Imagen de fondo de la sección principal (Hero) del home';
COMMENT ON COLUMN configuracion_web.imagen_destacados IS 'Imagen de fondo de la sección de productos destacados';
COMMENT ON COLUMN configuracion_web.imagen_banner_promociones IS 'Banner por defecto de la página de una promoción cuando la promoción no tiene imagen_banner propia';
