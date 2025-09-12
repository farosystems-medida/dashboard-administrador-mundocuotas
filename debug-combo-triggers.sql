-- Script para debuggear y arreglar los triggers de combos

-- 1. Verificar si las funciones existen
SELECT 
    proname as function_name,
    prosrc as function_code
FROM pg_proc 
WHERE proname IN ('calcular_precio_combo', 'trigger_actualizar_combos_por_producto')
ORDER BY proname;

-- 2. Verificar si los triggers existen
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('productos', 'combo_productos', 'combos')
ORDER BY c.relname, t.tgname;

-- 3. Si los triggers no existen o no funcionan, recrearlos
DROP TRIGGER IF EXISTS trigger_producto_precio_cambio ON productos;
DROP TRIGGER IF EXISTS trigger_combo_productos_cambios ON combo_productos;
DROP TRIGGER IF EXISTS trigger_combo_descuento_cambio ON combos;

-- Recrear la función para actualizar combos cuando cambia precio de producto
CREATE OR REPLACE FUNCTION trigger_actualizar_combos_por_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si cambió el precio
    IF NEW.precio != OLD.precio THEN
        RAISE NOTICE 'Precio del producto % cambió de % a %', NEW.id, OLD.precio, NEW.precio;
        
        -- Actualizar todos los combos que contengan este producto
        UPDATE combos 
        SET 
            precio_original = (
                SELECT COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0)
                FROM combo_productos cp 
                WHERE cp.fk_id_combo = combos.id
            ),
            precio_combo = (
                SELECT COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0) * (1 - combos.descuento_porcentaje / 100)
                FROM combo_productos cp 
                WHERE cp.fk_id_combo = combos.id
            ),
            updated_at = NOW()
        WHERE id IN (
            SELECT DISTINCT cp.fk_id_combo 
            FROM combo_productos cp 
            WHERE cp.fk_id_producto = NEW.id
        );
        
        RAISE NOTICE 'Combos actualizados para producto %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear la función para actualizar cuando se modifican productos del combo
CREATE OR REPLACE FUNCTION trigger_actualizar_precio_combo()
RETURNS TRIGGER AS $$
DECLARE
    combo_id_to_update INTEGER;
BEGIN
    -- Determinar qué combo actualizar
    IF TG_OP = 'DELETE' THEN
        combo_id_to_update := OLD.fk_id_combo;
    ELSE
        combo_id_to_update := NEW.fk_id_combo;
    END IF;
    
    RAISE NOTICE 'Actualizando precios del combo %', combo_id_to_update;
    
    -- Actualizar el combo
    UPDATE combos 
    SET 
        precio_original = (
            SELECT COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0)
            FROM combo_productos cp 
            WHERE cp.fk_id_combo = combo_id_to_update
        ),
        precio_combo = (
            SELECT COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0) * (1 - combos.descuento_porcentaje / 100)
            FROM combo_productos cp 
            WHERE cp.fk_id_combo = combo_id_to_update
        ),
        updated_at = NOW()
    WHERE id = combo_id_to_update;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recrear triggers
CREATE TRIGGER trigger_producto_precio_cambio
    AFTER UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_combos_por_producto();

CREATE TRIGGER trigger_combo_productos_cambios
    AFTER INSERT OR UPDATE OR DELETE ON combo_productos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_precio_combo();

-- Test: actualizar manualmente todos los combos existentes
UPDATE combos 
SET 
    precio_original = (
        SELECT COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0)
        FROM combo_productos cp 
        WHERE cp.fk_id_combo = combos.id
    ),
    precio_combo = (
        SELECT COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0) * (1 - combos.descuento_porcentaje / 100)
        FROM combo_productos cp 
        WHERE cp.fk_id_combo = combos.id
    ),
    updated_at = NOW()
WHERE id IN (SELECT DISTINCT fk_id_combo FROM combo_productos);

-- Verificar que todo funciona
SELECT 
    c.id,
    c.nombre,
    c.precio_original,
    c.precio_combo,
    c.descuento_porcentaje,
    c.updated_at
FROM combos c
WHERE c.precio_original > 0
ORDER BY c.id;