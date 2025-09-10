-- Crear tabla para configuración web
CREATE TABLE configuracion_web (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Configuraciones Desktop
    logo_url TEXT,
    logo_width INTEGER DEFAULT 200,
    logo_height INTEGER DEFAULT 60,
    
    appbar_height INTEGER DEFAULT 64,
    appbar_background_color VARCHAR(7) DEFAULT '#ffffff',
    appbar_text_color VARCHAR(7) DEFAULT '#000000',
    
    section_title_size INTEGER DEFAULT 24,
    section_subtitle_size INTEGER DEFAULT 18,
    section_text_size INTEGER DEFAULT 16,
    
    search_box_width INTEGER DEFAULT 400,
    search_box_height INTEGER DEFAULT 40,
    
    home_section_height INTEGER DEFAULT 500,
    
    -- Configuraciones Mobile
    mobile_logo_width INTEGER DEFAULT 150,
    mobile_logo_height INTEGER DEFAULT 45,
    
    mobile_appbar_height INTEGER DEFAULT 56,
    
    mobile_section_title_size INTEGER DEFAULT 20,
    mobile_section_subtitle_size INTEGER DEFAULT 16,
    mobile_section_text_size INTEGER DEFAULT 14,
    
    mobile_search_box_width INTEGER DEFAULT 300,
    mobile_search_box_height INTEGER DEFAULT 36,
    
    mobile_home_section_height INTEGER DEFAULT 300,
    
    -- Colores generales
    primary_color VARCHAR(7) DEFAULT '#0066cc',
    secondary_color VARCHAR(7) DEFAULT '#f8f9fa',
    accent_color VARCHAR(7) DEFAULT '#ff6b35',
    
    -- Tipografías
    font_family_primary VARCHAR(100) DEFAULT 'Inter, sans-serif',
    font_family_secondary VARCHAR(100) DEFAULT 'Roboto, sans-serif'
);

-- Insertar configuración por defecto
INSERT INTO configuracion_web (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Comentarios sobre la tabla
COMMENT ON TABLE configuracion_web IS 'Configuración visual para la aplicación web';
COMMENT ON COLUMN configuracion_web.logo_url IS 'URL del logo principal';
COMMENT ON COLUMN configuracion_web.logo_width IS 'Ancho del logo en desktop (px)';
COMMENT ON COLUMN configuracion_web.logo_height IS 'Alto del logo en desktop (px)';
COMMENT ON COLUMN configuracion_web.appbar_height IS 'Altura de la barra de navegación en desktop (px)';
COMMENT ON COLUMN configuracion_web.home_section_height IS 'Altura de la sección principal del home (px)';