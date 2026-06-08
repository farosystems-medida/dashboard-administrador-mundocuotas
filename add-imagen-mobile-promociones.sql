-- Agrega el campo de imagen para el banner mobile de las promociones
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE public.promociones
    ADD COLUMN IF NOT EXISTS imagen_mobile TEXT;

COMMENT ON COLUMN promociones.imagen_mobile IS 'URL del banner de la promoción para vista mobile (opcional, usa el banner desktop como fallback si está vacío)';
