-- Reiniciar la secuencia de IDs para la tabla zonas
-- Esto sincroniza la secuencia con el último ID existente

SELECT setval('zonas_id_seq', COALESCE((SELECT MAX(id) FROM zonas), 1), true);