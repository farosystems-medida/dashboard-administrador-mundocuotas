-- Sistema de Combos
-- Script para crear tablas y funciones automáticas de combos

-- Tabla principal de combos
CREATE TABLE IF NOT EXISTS public.combos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_vigencia_inicio DATE,
    fecha_vigencia_fin DATE,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    precio_combo DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_original DECIMAL(10,2) NOT NULL DEFAULT 0, -- Suma de precios sin descuento
    imagen TEXT,
    imagen_2 TEXT,
    imagen_3 TEXT,
    imagen_4 TEXT,
    imagen_5 TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación N:N entre combos y productos
CREATE TABLE IF NOT EXISTS public.combo_productos (
    id SERIAL PRIMARY KEY,
    fk_id_combo INTEGER REFERENCES combos(id) ON DELETE CASCADE,
    fk_id_producto INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2), -- Precio del producto al momento de agregarlo al combo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fk_id_combo, fk_id_producto) -- Un producto no puede estar duplicado en el mismo combo
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_combos_activo ON combos(activo);
CREATE INDEX IF NOT EXISTS idx_combos_vigencia ON combos(fecha_vigencia_inicio, fecha_vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_combo_productos_combo ON combo_productos(fk_id_combo);
CREATE INDEX IF NOT EXISTS idx_combo_productos_producto ON combo_productos(fk_id_producto);

-- Función para calcular el precio de un combo automáticamente
CREATE OR REPLACE FUNCTION calcular_precio_combo(combo_id INTEGER)
RETURNS VOID AS $$
DECLARE
    precio_total DECIMAL(10,2) := 0;
    descuento DECIMAL(5,2);
    precio_final DECIMAL(10,2);
BEGIN
    -- Obtener el descuento del combo
    SELECT descuento_porcentaje INTO descuento
    FROM combos 
    WHERE id = combo_id;
    
    -- Calcular precio total sumando los precios actuales de los productos
    SELECT COALESCE(SUM(p.precio * cp.cantidad), 0) INTO precio_total
    FROM combo_productos cp
    INNER JOIN productos p ON cp.fk_id_producto = p.id
    WHERE cp.fk_id_combo = combo_id;
    
    -- Aplicar descuento
    precio_final := precio_total * (1 - descuento / 100);
    
    -- Actualizar el combo
    UPDATE combos 
    SET 
        precio_original = precio_total,
        precio_combo = precio_final,
        updated_at = NOW()
    WHERE id = combo_id;
    
END;
$$ LANGUAGE plpgsql;

-- Función trigger para actualizar precios cuando se modifica un combo_producto
CREATE OR REPLACE FUNCTION trigger_actualizar_precio_combo()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar precio del combo afectado
    IF TG_OP = 'DELETE' THEN
        PERFORM calcular_precio_combo(OLD.fk_id_combo);
        RETURN OLD;
    ELSE
        PERFORM calcular_precio_combo(NEW.fk_id_combo);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función trigger para actualizar precios cuando se modifica el precio de un producto
CREATE OR REPLACE FUNCTION trigger_actualizar_combos_por_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si cambió el precio
    IF NEW.precio != OLD.precio THEN
        -- Actualizar todos los combos que contengan este producto
        PERFORM calcular_precio_combo(cp.fk_id_combo)
        FROM combo_productos cp
        WHERE cp.fk_id_producto = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función trigger para actualizar precios cuando se modifica el descuento del combo
CREATE OR REPLACE FUNCTION trigger_actualizar_precio_por_descuento()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si cambió el descuento
    IF NEW.descuento_porcentaje != OLD.descuento_porcentaje THEN
        PERFORM calcular_precio_combo(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
-- Trigger para actualizar precios cuando se agregan/quitan/modifican productos en combos
DROP TRIGGER IF EXISTS trigger_combo_productos_cambios ON combo_productos;
CREATE TRIGGER trigger_combo_productos_cambios
    AFTER INSERT OR UPDATE OR DELETE ON combo_productos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_precio_combo();

-- Trigger para actualizar precios de combos cuando cambia el precio de un producto
DROP TRIGGER IF EXISTS trigger_producto_precio_cambio ON productos;
CREATE TRIGGER trigger_producto_precio_cambio
    AFTER UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_combos_por_producto();

-- Trigger para actualizar precios cuando cambia el descuento del combo
DROP TRIGGER IF EXISTS trigger_combo_descuento_cambio ON combos;
CREATE TRIGGER trigger_combo_descuento_cambio
    AFTER UPDATE ON combos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_precio_por_descuento();

-- Trigger para updated_at automático en combos
DROP TRIGGER IF EXISTS update_combos_updated_at ON combos;
CREATE TRIGGER update_combos_updated_at 
    BEFORE UPDATE ON combos
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de documentación
COMMENT ON TABLE combos IS 'Tabla principal de combos de productos con precios calculados automáticamente';
COMMENT ON COLUMN combos.precio_combo IS 'Precio final del combo con descuento aplicado (calculado automáticamente)';
COMMENT ON COLUMN combos.precio_original IS 'Suma de precios de productos sin descuento (calculado automáticamente)';
COMMENT ON COLUMN combos.descuento_porcentaje IS 'Porcentaje de descuento aplicado al combo (0-100)';

COMMENT ON TABLE combo_productos IS 'Relación N:N entre combos y productos con cantidad';
COMMENT ON COLUMN combo_productos.cantidad IS 'Cantidad del producto en el combo';
COMMENT ON COLUMN combo_productos.precio_unitario IS 'Precio del producto al momento de agregarlo (histórico)';

-- Habilitar RLS si está configurado
DO $$ 
BEGIN
    -- Verificar si RLS está habilitado en productos antes de aplicarlo a combos
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE n.nspname = 'public' AND c.relname = 'productos' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE combo_productos ENABLE ROW LEVEL SECURITY;
        
        -- Políticas básicas (igual que productos)
        CREATE POLICY "Combos son visibles para todos" ON combos FOR SELECT USING (true);
        CREATE POLICY "Combos pueden ser creados por usuarios autenticados" ON combos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Combos pueden ser actualizados por usuarios autenticados" ON combos FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Combos pueden ser eliminados por usuarios autenticados" ON combos FOR DELETE USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Combo_productos son visibles para todos" ON combo_productos FOR SELECT USING (true);
        CREATE POLICY "Combo_productos pueden ser creados por usuarios autenticados" ON combo_productos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Combo_productos pueden ser actualizados por usuarios autenticados" ON combo_productos FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Combo_productos pueden ser eliminados por usuarios autenticados" ON combo_productos FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Datos de ejemplo (opcional - comentar si no se desea)
-- INSERT INTO combos (nombre, descripcion, descuento_porcentaje, fecha_vigencia_inicio, fecha_vigencia_fin) 
-- VALUES ('Combo Colchón + Soporte', 'Colchón Memory Foam con soporte básico', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- INSERT INTO combo_productos (fk_id_combo, fk_id_producto, cantidad)
-- SELECT 1, id, 1 FROM productos WHERE descripcion ILIKE '%colchón%' LIMIT 1;

-- INSERT INTO combo_productos (fk_id_combo, fk_id_producto, cantidad)
-- SELECT 1, id, 1 FROM productos WHERE descripcion ILIKE '%soporte%' LIMIT 1;