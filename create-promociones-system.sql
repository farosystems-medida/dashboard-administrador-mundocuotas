-- Sistema de Promociones
-- Ejecutar en el SQL Editor de Supabase

-- ─────────────────────────────────────────────
-- FUNCIÓN: generador de slug desde texto libre
-- "Día del Padre" → "dia-del-padre"
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generar_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                translate(
                    input_text,
                    'áéíóúàèìòùäëïöüñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÑ',
                    'aeiouaeiouaeiounAEIOUAEIOUAEIOUN'
                ),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────
-- TABLA: promociones
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promociones (
    id                      SERIAL PRIMARY KEY,
    nombre                  VARCHAR(255) NOT NULL,
    descripcion             TEXT,
    slug                    VARCHAR(255) UNIQUE,        -- generado automáticamente si no se provee
    imagen                  TEXT,
    fecha_vigencia_inicio   DATE,
    fecha_vigencia_fin      DATE,
    activo                  BOOLEAN DEFAULT true,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  promociones                        IS 'Promociones del catálogo (ej: Día del Padre, Hot Sale)';
COMMENT ON COLUMN promociones.slug                   IS 'URL amigable auto-generada desde el nombre. Acceso: /promociones/{slug}';
COMMENT ON COLUMN promociones.fecha_vigencia_inicio  IS 'Fecha desde la que la promoción está activa (inclusive)';
COMMENT ON COLUMN promociones.fecha_vigencia_fin     IS 'Fecha hasta la que la promoción está activa (inclusive)';

-- ─────────────────────────────────────────────
-- TABLA: promociones_items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promociones_items (
    id                      SERIAL PRIMARY KEY,
    fk_id_promocion         INTEGER NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    fk_id_producto          INTEGER NOT NULL REFERENCES productos(id)   ON DELETE CASCADE,
    descuento_porcentaje    DECIMAL(5,2)  DEFAULT NULL
                                CHECK (descuento_porcentaje IS NULL
                                    OR (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100)),
    precio_promocional      DECIMAL(10,2) DEFAULT NULL,  -- calculado automáticamente si hay descuento
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fk_id_promocion, fk_id_producto)              -- un producto no se repite en la misma promo
);

COMMENT ON TABLE  promociones_items                         IS 'Productos asociados a una promoción, con descuento opcional por item';
COMMENT ON COLUMN promociones_items.descuento_porcentaje    IS 'Porcentaje de descuento sobre el precio base del producto (0-100). NULL = sin descuento específico';
COMMENT ON COLUMN promociones_items.precio_promocional      IS 'Precio resultante con descuento aplicado (calculado automáticamente al insertar/actualizar)';

-- ─────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_promociones_slug     ON promociones(slug);
CREATE INDEX IF NOT EXISTS idx_promociones_activo   ON promociones(activo);
CREATE INDEX IF NOT EXISTS idx_promociones_vigencia ON promociones(fecha_vigencia_inicio, fecha_vigencia_fin);

CREATE INDEX IF NOT EXISTS idx_promo_items_promocion ON promociones_items(fk_id_promocion);
CREATE INDEX IF NOT EXISTS idx_promo_items_producto  ON promociones_items(fk_id_producto);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-generar slug en promociones
-- Si no se provee slug, se genera desde el nombre
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_slug_promocion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generar_slug(NEW.nombre);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_slug_promocion ON promociones;
CREATE TRIGGER trg_slug_promocion
    BEFORE INSERT OR UPDATE ON promociones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_slug_promocion();

-- ─────────────────────────────────────────────
-- TRIGGER: calcular precio_promocional en items
-- Se recalcula al insertar o al cambiar el descuento
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_calcular_precio_promocional()
RETURNS TRIGGER AS $$
DECLARE
    precio_base DECIMAL(10,2);
BEGIN
    IF NEW.descuento_porcentaje IS NOT NULL THEN
        SELECT precio INTO precio_base
        FROM productos
        WHERE id = NEW.fk_id_producto;

        NEW.precio_promocional := ROUND(precio_base * (1 - NEW.descuento_porcentaje / 100), 2);
    ELSE
        NEW.precio_promocional := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_precio_promo_item ON promociones_items;
CREATE TRIGGER trg_calcular_precio_promo_item
    BEFORE INSERT OR UPDATE OF descuento_porcentaje ON promociones_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calcular_precio_promocional();

-- ─────────────────────────────────────────────
-- TRIGGER: updated_at automático en promociones
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_updated_at_promociones ON promociones;
CREATE TRIGGER trg_updated_at_promociones
    BEFORE UPDATE ON promociones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS — Row Level Security
-- Mismo patrón que el resto del proyecto
-- ─────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = 'productos' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE promociones       ENABLE ROW LEVEL SECURITY;
        ALTER TABLE promociones_items ENABLE ROW LEVEL SECURITY;

        -- promociones
        CREATE POLICY "Promociones visibles para todos"
            ON promociones FOR SELECT USING (true);
        CREATE POLICY "Promociones creadas por autenticados"
            ON promociones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Promociones actualizadas por autenticados"
            ON promociones FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Promociones eliminadas por autenticados"
            ON promociones FOR DELETE USING (auth.role() = 'authenticated');

        -- promociones_items
        CREATE POLICY "Promociones_items visibles para todos"
            ON promociones_items FOR SELECT USING (true);
        CREATE POLICY "Promociones_items creados por autenticados"
            ON promociones_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Promociones_items actualizados por autenticados"
            ON promociones_items FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Promociones_items eliminados por autenticados"
            ON promociones_items FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;
