"use client"

import { useState, useEffect } from 'react'
import { supabase, Producto, PlanFinanciacion, ProductoPlan, Categoria, Marca, Configuracion } from '@/lib/supabase'
import { testSupabaseConnection } from '@/lib/supabase-debug'
import { setupSupabaseAuth } from '@/lib/supabase-auth'
import { useUser } from '@clerk/nextjs'

export function useSupabaseData() {
  const { user, isLoaded } = useUser()
  const [productos, setProductos] = useState<Producto[]>([])
  const [planes, setPlanes] = useState<PlanFinanciacion[]>([])
  const [productosPorPlan, setProductosPorPlan] = useState<ProductoPlan[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar productos
  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categoria:fk_id_categoria(*),
          marca:fk_id_marca(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProductos(data || [])
    } catch (err) {
      setError('Error al cargar productos')
      console.error('Error loading productos:', err)
    }
  }

  // Cargar planes
  const loadPlanes = async () => {
    try {
      const { data, error } = await supabase
        .from('planes_financiacion')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlanes(data || [])
    } catch (err) {
      setError('Error al cargar planes')
      console.error('Error loading planes:', err)
    }
  }

  // Cargar productos por plan
  const loadProductosPorPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('producto_planes')
        .select(`
          *,
          producto:fk_id_producto(*),
          plan:fk_id_plan(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProductosPorPlan(data || [])
    } catch (err) {
      setError('Error al cargar productos por plan')
      console.error('Error loading productos_plan:', err)
    }
  }

  // Cargar categorías
  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categoria')
        .select('*')
        .order('descripcion', { ascending: true })

      if (error) throw error
      setCategorias(data || [])
    } catch (err) {
      setError('Error al cargar categorías')
      console.error('Error loading categorias:', err)
    }
  }

  // Cargar marcas
  const loadMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .order('descripcion', { ascending: true })

      if (error) throw error
      setMarcas(data || [])
    } catch (err) {
      setError('Error al cargar marcas')
      console.error('Error loading marcas:', err)
    }
  }

  // Crear producto
  const createProducto = async (producto: Omit<Producto, 'id' | 'created_at' | 'categoria' | 'marca'>) => {
    try {
      console.log('Creating producto with data:', producto)
      
      const { data, error } = await supabase
        .from('productos')
        .insert([producto])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Error de Supabase: ${error.message}`)
      }
      
      console.log('Producto created successfully:', data)
      await loadProductos()
      return data?.[0]
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear producto'
      setError(`Error al crear producto: ${errorMessage}`)
      console.error('Error creating producto:', err)
      throw err
    }
  }

  // Actualizar producto
  const updateProducto = async (id: number, updates: Partial<Producto>) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      await loadProductos()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar producto')
      console.error('Error updating producto:', err)
      throw err
    }
  }

  // Obtener planes asociados a un producto
  const getPlanesAsociados = async (productoId: number) => {
    try {
      console.log('Buscando planes asociados para producto ID:', productoId)
      
      const { data, error } = await supabase
        .from('producto_planes')
        .select(`
          *,
          plan:fk_id_plan(*)
        `)
        .eq('fk_id_producto', productoId)

      if (error) {
        console.error('Error en consulta Supabase:', error)
        throw error
      }
      
      console.log('Datos obtenidos de Supabase:', data)
      return data || []
    } catch (err) {
      console.error('Error getting planes asociados:', err)
      return []
    }
  }

  // Eliminar producto
  const deleteProducto = async (id: number) => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadProductos()
    } catch (err) {
      setError('Error al eliminar producto')
      console.error('Error deleting producto:', err)
      throw err
    }
  }

  // Crear plan
  const createPlan = async (plan: Omit<PlanFinanciacion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('planes_financiacion')
        .insert([plan])
        .select()

      if (error) throw error
      await loadPlanes()
      return data?.[0]
    } catch (err) {
      setError('Error al crear plan')
      console.error('Error creating plan:', err)
      throw err
    }
  }

  // Actualizar plan
  const updatePlan = async (id: number, updates: Partial<PlanFinanciacion>) => {
    try {
      const { data, error } = await supabase
        .from('planes_financiacion')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()

      if (error) throw error
      await loadPlanes()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar plan')
      console.error('Error updating plan:', err)
      throw err
    }
  }

  // Eliminar plan
  const deletePlan = async (id: number) => {
    try {
      const { error } = await supabase
        .from('planes_financiacion')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPlanes()
    } catch (err) {
      setError('Error al eliminar plan')
      console.error('Error deleting plan:', err)
      throw err
    }
  }

  // Crear categoría
  const createCategoria = async (categoria: Omit<Categoria, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('categoria')
        .insert([categoria])
        .select()

      if (error) throw error
      await loadCategorias()
      return data?.[0]
    } catch (err) {
      setError('Error al crear categoría')
      console.error('Error creating categoria:', err)
      throw err
    }
  }

  // Actualizar categoría
  const updateCategoria = async (id: number, updates: Partial<Categoria>) => {
    try {
      const { data, error } = await supabase
        .from('categoria')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      await loadCategorias()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar categoría')
      console.error('Error updating categoria:', err)
      throw err
    }
  }

  // Eliminar categoría
  const deleteCategoria = async (id: number) => {
    try {
      const { error } = await supabase
        .from('categoria')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadCategorias()
    } catch (err) {
      setError('Error al eliminar categoría')
      console.error('Error deleting categoria:', err)
      throw err
    }
  }

  // Crear marca
  const createMarca = async (marca: Omit<Marca, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .insert([marca])
        .select()

      if (error) throw error
      await loadMarcas()
      return data?.[0]
    } catch (err) {
      setError('Error al crear marca')
      console.error('Error creating marca:', err)
      throw err
    }
  }

  // Actualizar marca
  const updateMarca = async (id: number, updates: Partial<Marca>) => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      await loadMarcas()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar marca')
      console.error('Error updating marca:', err)
      throw err
    }
  }

  // Eliminar marca
  const deleteMarca = async (id: number) => {
    try {
      const { error } = await supabase
        .from('marcas')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadMarcas()
    } catch (err) {
      setError('Error al eliminar marca')
      console.error('Error deleting marca:', err)
      throw err
    }
  }

  // Crear producto por plan
  const createProductoPlan = async (productoPlan: Omit<ProductoPlan, 'id' | 'created_at' | 'producto' | 'plan'>) => {
    try {
      const { data, error } = await supabase
        .from('producto_planes')
        .insert([productoPlan])
        .select()

      if (error) throw error
      await loadProductosPorPlan()
      return data?.[0]
    } catch (err) {
      setError('Error al crear producto por plan')
      console.error('Error creating producto_plan:', err)
      throw err
    }
  }

  // Actualizar producto por plan
  const updateProductoPlan = async (id: number, updates: Partial<ProductoPlan>) => {
    try {
      const { data, error } = await supabase
        .from('producto_planes')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      await loadProductosPorPlan()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar producto por plan')
      console.error('Error updating producto_plan:', err)
      throw err
    }
  }

  // Eliminar producto por plan
  const deleteProductoPlan = async (id: number) => {
    try {
      const { error } = await supabase
        .from('producto_planes')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadProductosPorPlan()
    } catch (err) {
      setError('Error al eliminar producto por plan')
      console.error('Error deleting producto_plan:', err)
      throw err
    }
  }

  // Cargar configuración
  const loadConfiguracion = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error
      setConfiguracion(data)
    } catch (err) {
      setError('Error al cargar configuración')
      console.error('Error loading configuracion:', err)
    }
  }

  // Actualizar configuración
  const updateConfiguracion = async (telefono: string) => {
    try {
      let { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code === 'PGRST116') {
        // Si no existe, crear el registro
        const { data: newData, error: insertError } = await supabase
          .from('configuracion')
          .insert([{ telefono }])
          .select()
          .single()

        if (insertError) throw insertError
        setConfiguracion(newData)
        return newData
      } else if (error) {
        throw error
      } else {
        // Si existe, actualizar
        const { data: updatedData, error: updateError } = await supabase
          .from('configuracion')
          .update({ telefono })
          .eq('id', data.id)
          .select()
          .single()

        if (updateError) throw updateError
        setConfiguracion(updatedData)
        return updatedData
      }
    } catch (err) {
      setError('Error al actualizar configuración')
      console.error('Error updating configuracion:', err)
      throw err
    }
  }

  // Cargar todos los datos cuando el usuario esté autenticado
  useEffect(() => {
    if (isLoaded && user) {
      setLoading(true)
      
      // Configurar autenticación de Supabase con Clerk
      setupSupabaseAuth().then(authSuccess => {
        if (!authSuccess) {
          console.warn('⚠️ No se pudo configurar la autenticación de Supabase, intentando sin autenticación...')
        }
        
        // Probar conexión a Supabase
        testSupabaseConnection().then(isConnected => {
          if (!isConnected) {
            setError('No se pudo conectar a la base de datos')
            setLoading(false)
            return
          }
          
          Promise.all([
            loadProductos(),
            loadPlanes(),
            loadProductosPorPlan(),
            loadCategorias(),
            loadMarcas(),
            loadConfiguracion()
          ]).finally(() => setLoading(false))
        })
      })
    }
  }, [isLoaded, user])

  return {
    productos,
    planes,
    productosPorPlan,
    categorias,
    marcas,
    loading,
    error,
    createProducto,
    updateProducto,
    deleteProducto,
    getPlanesAsociados,
    createPlan,
    updatePlan,
    deletePlan,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    createMarca,
    updateMarca,
    deleteMarca,
    createProductoPlan,
    updateProductoPlan,
    deleteProductoPlan,
    configuracion,
    updateConfiguracion,
    refreshData: () => {
      setLoading(true)
      Promise.all([
        loadProductos(),
        loadPlanes(),
        loadProductosPorPlan(),
        loadCategorias(),
        loadMarcas(),
        loadConfiguracion()
      ]).finally(() => setLoading(false))
    }
  }
} 