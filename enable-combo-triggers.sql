-- Habilitar todos los triggers relacionados con combos

-- 1. Verificar estado actual de todos los triggers
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled_status,
    CASE 
        WHEN t.tgenabled = 'O' THEN 'ENABLED'
        WHEN t.tgenabled = 'D' THEN 'DISABLED'
        WHEN t.tgenabled = 'R' THEN 'REPLICA'
        WHEN t.tgenabled = 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
    END as status_description,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('productos', 'combo_productos', 'combos')
ORDER BY c.relname, t.tgname;

-- 2. Habilitar específicamente los triggers de combos
ALTER TABLE productos ENABLE TRIGGER trigger_producto_precio_cambio;
ALTER TABLE combo_productos ENABLE TRIGGER trigger_combo_productos_cambios;
ALTER TABLE combos ENABLE TRIGGER trigger_combo_descuento_cambio;

-- También habilitar el trigger de updated_at si existe
ALTER TABLE combos ENABLE TRIGGER update_combos_updated_at;

-- 3. Verificar que ahora están habilitados
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled_status,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ ENABLED'
        WHEN t.tgenabled = 'D' THEN '❌ DISABLED'
        WHEN t.tgenabled = 'R' THEN 'REPLICA'
        WHEN t.tgenabled = 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
    END as status_description,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('productos', 'combo_productos', 'combos')
ORDER BY c.relname, t.tgname;

-- 4. Actualizar manualmente todos los combos existentes para que tengan precios correctos
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

-- 5. Mostrar resultado final
SELECT 
    c.id,
    c.nombre,
    c.precio_original,
    c.precio_combo,
    c.descuento_porcentaje,
    'Precios actualizados' as status
FROM combos c
WHERE c.precio_original > 0
ORDER BY c.id;