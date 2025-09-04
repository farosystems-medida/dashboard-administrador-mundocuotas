-- Script para reiniciar todas las secuencias de IDs en las tablas
-- Esto sincroniza las secuencias con los últimos IDs existentes para evitar errores de clave duplicada

-- Tabla categorias
SELECT setval('categorias_id_seq', COALESCE((SELECT MAX(id) FROM categorias), 1), true);

-- Tabla marcas
SELECT setval('marcas_id_seq', COALESCE((SELECT MAX(id) FROM marcas), 1), true);

-- Tabla productos
SELECT setval('productos_id_seq', COALESCE((SELECT MAX(id) FROM productos), 1), true);

-- Tabla planes_financiacion
SELECT setval('planes_financiacion_id_seq', COALESCE((SELECT MAX(id) FROM planes_financiacion), 1), true);

-- Tabla planes_categorias
SELECT setval('planes_categorias_id_seq', COALESCE((SELECT MAX(id) FROM planes_categorias), 1), true);

-- Tabla productos_planes (si existe - puede ser producto_planes)
SELECT setval('producto_planes_id_seq', COALESCE((SELECT MAX(id) FROM producto_planes), 1), true);

-- Tabla productos_planes_default (si existe - puede ser producto_planes_default)
SELECT setval('producto_planes_default_id_seq', COALESCE((SELECT MAX(id) FROM producto_planes_default), 1), true);

-- Tabla zonas
SELECT setval('zonas_id_seq', COALESCE((SELECT MAX(id) FROM zonas), 1), true);

-- Tabla configuracion
SELECT setval('configuracion_id_seq', COALESCE((SELECT MAX(id) FROM configuracion), 1), true);

-- Tabla configuracion_zonas
SELECT setval('configuracion_zonas_id_seq', COALESCE((SELECT MAX(id) FROM configuracion_zonas), 1), true);

-- Verificar el estado de las secuencias después del reinicio
SELECT 
    schemaname,
    sequencename, 
    last_value,
    is_called
FROM pg_sequences 
WHERE schemaname = 'public' 
ORDER BY sequencename;