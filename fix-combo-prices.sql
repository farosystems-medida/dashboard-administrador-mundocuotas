-- Script para arreglar y verificar precios de combos

-- 1. Verificar estado actual de combos y sus productos
SELECT 
    c.id,
    c.nombre,
    c.precio_original,
    c.precio_combo,
    c.descuento_porcentaje,
    COUNT(cp.id) as productos_count
FROM combos c
LEFT JOIN combo_productos cp ON c.id = cp.fk_id_combo
GROUP BY c.id, c.nombre, c.precio_original, c.precio_combo, c.descuento_porcentaje
ORDER BY c.id;

-- 2. Ver detalle de productos por combo
SELECT 
    c.id as combo_id,
    c.nombre as combo_nombre,
    cp.fk_id_producto,
    cp.cantidad,
    cp.precio_unitario,
    (cp.cantidad * cp.precio_unitario) as subtotal
FROM combos c
INNER JOIN combo_productos cp ON c.id = cp.fk_id_combo
ORDER BY c.id, cp.id;

-- 3. Ejecutar manualmente la función calcular_precio_combo para todos los combos
DO $$
DECLARE
    combo_record RECORD;
BEGIN
    FOR combo_record IN SELECT id FROM combos LOOP
        PERFORM calcular_precio_combo(combo_record.id);
        RAISE NOTICE 'Precios actualizados para combo ID: %', combo_record.id;
    END LOOP;
END $$;

-- 4. Verificar que los precios se actualizaron correctamente
SELECT 
    c.id,
    c.nombre,
    c.precio_original,
    c.precio_combo,
    c.descuento_porcentaje,
    -- Cálculo manual para verificar
    COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0) as precio_manual,
    COALESCE(SUM(cp.cantidad * cp.precio_unitario), 0) * (1 - c.descuento_porcentaje / 100) as precio_final_manual
FROM combos c
LEFT JOIN combo_productos cp ON c.id = cp.fk_id_combo
GROUP BY c.id, c.nombre, c.precio_original, c.precio_combo, c.descuento_porcentaje
ORDER BY c.id;

-- 5. Si los triggers no funcionan, actualizar manualmente todos los combos
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

-- 6. Verificar el resultado final
SELECT 
    c.id,
    c.nombre,
    c.precio_original,
    c.precio_combo,
    c.descuento_porcentaje,
    c.updated_at
FROM combos c
WHERE c.precio_original > 0 OR c.precio_combo > 0
ORDER BY c.id;