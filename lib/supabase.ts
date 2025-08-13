import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las categorías
export interface Categoria {
  id: number
  descripcion: string
  created_at: string
}

// Tipos para las marcas
export interface Marca {
  id: number
  descripcion: string
  created_at: string
}

// Tipos para los productos
export interface Producto {
  id: number
  created_at: string
  descripcion: string
  descripcion_detallada?: string
  precio: number
  imagen?: string
  destacado?: boolean
  fk_id_categoria?: number
  fk_id_marca?: number
  categoria?: Categoria
  marca?: Marca
}

// Tipos para los planes de financiación
export interface PlanFinanciacion {
  id: number
  nombre: string
  cuotas: number
  recargo_porcentual: number
  recargo_fijo: number
  monto_minimo: number
  monto_maximo?: number
  activo: boolean
  created_at: string
  updated_at: string
}

// Tipos para productos por plan
export interface ProductoPlan {
  id: number
  fk_id_producto: number
  fk_id_plan: number
  activo: boolean
  created_at: string
  producto?: Producto
  plan?: PlanFinanciacion
}

// Tipo para la configuración
export interface Configuracion {
  id: number
  created_at: string
  telefono: string | null
} 