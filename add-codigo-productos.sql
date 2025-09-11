-- Agregar campo codigo a la tabla productos
DO $$ 
BEGIN
    -- Verificar si el campo codigo ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'codigo'
        AND table_schema = 'public'
    ) THEN
        -- Agregar el campo codigo
        ALTER TABLE public.productos 
        ADD COLUMN codigo VARCHAR(50);
        
        -- Crear índice para búsquedas rápidas por código
        CREATE INDEX productos_codigo_idx ON public.productos (codigo);
        
        -- Agregar constraint de unicidad (opcional - códigos únicos)
        -- ALTER TABLE public.productos 
        -- ADD CONSTRAINT productos_codigo_unique UNIQUE (codigo);
        
        RAISE NOTICE 'Campo codigo agregado exitosamente a productos';
    ELSE
        RAISE NOTICE 'El campo codigo ya existe en productos';
    END IF;
END $$;