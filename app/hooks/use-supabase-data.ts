"use client"

import { useState, useEffect } from 'react'
import { supabase, Producto, PlanFinanciacion, ProductoPlan, ProductoPlanDefault, Categoria, Marca, Zona, Configuracion, ConfiguracionZona, PlanCategoria } from '@/lib/supabase'
import { testSupabaseConnection } from '@/lib/supabase-debug'
import { setupSupabaseAuth } from '@/lib/supabase-auth'
import { useUser } from '@clerk/nextjs'

export function useSupabaseData() {
  const { user, isLoaded } = useUser()
  const [productos, setProductos] = useState<Producto[]>([])
  const [planes, setPlanes] = useState<PlanFinanciacion[]>([])
  const [productosPorPlan, setProductosPorPlan] = useState<ProductoPlan[]>([])
  const [productosPorPlanDefault, setProductosPorPlanDefault] = useState<ProductoPlanDefault[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [planesCategorias, setPlanesCategorias] = useState<PlanCategoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
  const [configuracionZonas, setConfiguracionZonas] = useState<ConfiguracionZona[]>([])
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

  // Cargar relaciones planes-categorías
  const loadPlanesCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('planes_categorias')
        .select(`
          *,
          plan:fk_id_plan(*),
          categoria:fk_id_categoria(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlanesCategorias(data || [])
    } catch (err) {
      setError('Error al cargar relaciones planes-categorías')
      console.error('Error loading planes_categorias:', err)
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

  // Cargar productos por plan por defecto
  const loadProductosPorPlanDefault = async () => {
    try {
      const { data, error } = await supabase
        .from('producto_planes_default')
        .select(`
          *,
          producto:fk_id_producto(*),
          plan:fk_id_plan(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProductosPorPlanDefault(data || [])
    } catch (err) {
      setError('Error al cargar productos por plan por defecto')
      console.error('Error loading productos_plan_default:', err)
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

  // Cargar zonas
  const loadZonas = async () => {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setZonas(data || [])
    } catch (err) {
      setError('Error al cargar zonas')
      console.error('Error loading zonas:', err)
    }
  }

  // Cargar configuración de zonas
  const loadConfiguracionZonas = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_zonas')
        .select(`
          *,
          zona:fk_id_zona(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConfiguracionZonas(data || [])
    } catch (err) {
      setError('Error al cargar configuración de zonas')
      console.error('Error loading configuracion_zonas:', err)
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
      
      // Crear asociaciones por defecto para el nuevo producto
      if (data?.[0]) {
        try {
          await createDefaultAssociationsForProduct(data[0])
        } catch (defaultError) {
          console.warn('Error creating default associations:', defaultError)
          // No fallar la creación del producto si fallan las asociaciones por defecto
        }
      }
      
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

      // Si se actualizaron los booleanos de aplicación de planes, actualizar las asociaciones por defecto
      if (data?.[0] && (updates.aplica_todos_plan !== undefined || updates.aplica_solo_categoria !== undefined || updates.aplica_plan_especial !== undefined)) {
        try {
          // Eliminar asociaciones por defecto existentes
          await supabase
            .from('producto_planes_default')
            .delete()
            .eq('fk_id_producto', id)

          // Crear nuevas asociaciones por defecto según los booleanos actualizados
          await createDefaultAssociationsForProduct(data[0])
        } catch (defaultError) {
          console.warn('Error updating default associations:', defaultError)
          // No fallar la actualización del producto si fallan las asociaciones por defecto
        }
      }

      await loadProductos()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar producto')
      console.error('Error updating producto:', err)
      throw err
    }
  }

  // Obtener planes asociados a un producto (combinando específicos y por defecto)
  const getPlanesAsociados = async (productoId: number) => {
    try {
      console.log('Buscando planes asociados para producto ID:', productoId)
      
      // Obtener asociaciones específicas
      const { data: specificData, error: specificError } = await supabase
        .from('producto_planes')
        .select(`
          *,
          plan:fk_id_plan(*)
        `)
        .eq('fk_id_producto', productoId)

      if (specificError) {
        console.error('Error en consulta Supabase:', specificError)
        throw specificError
      }

      // Si hay asociaciones específicas, devolverlas
      if (specificData && specificData.length > 0) {
        console.log('Datos específicos obtenidos de Supabase:', specificData)
        return specificData
      }

      // Si no hay asociaciones específicas, obtener las por defecto
      const { data: defaultData, error: defaultError } = await supabase
        .from('producto_planes_default')
        .select(`
          *,
          plan:fk_id_plan(*)
        `)
        .eq('fk_id_producto', productoId)

      if (defaultError) {
        console.error('Error en consulta por defecto:', defaultError)
        throw defaultError
      }

      // Convertir las asociaciones por defecto al formato esperado
      const convertedData = defaultData?.map(item => ({
        ...item,
        activo: true,
        destacado: false
      })) || []

      console.log('Datos por defecto convertidos:', convertedData)
      return convertedData
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
  const createPlan = async (plan: Omit<PlanFinanciacion, 'id' | 'created_at' | 'updated_at'>, categoriasIds?: number[]) => {
    try {
      const { data, error } = await supabase
        .from('planes_financiacion')
        .insert([plan])
        .select()

      if (error) throw error
      
      // Si se especificaron categorías, crear las relaciones
      if (data?.[0] && categoriasIds && categoriasIds.length > 0) {
        const relaciones = categoriasIds.map(categoriaId => ({
          fk_id_plan: data[0].id,
          fk_id_categoria: categoriaId
        }))
        
        const { error: relacionesError } = await supabase
          .from('planes_categorias')
          .insert(relaciones)
        
        if (relacionesError) {
          console.error('Error creating plan-category relations:', relacionesError)
        }
      }
      
      await loadPlanes()
      await loadPlanesCategorias()
      return data?.[0]
    } catch (err) {
      setError('Error al crear plan')
      console.error('Error creating plan:', err)
      throw err
    }
  }

  // Actualizar plan
  const updatePlan = async (id: number, updates: Partial<PlanFinanciacion>, categoriasIds?: number[]) => {
    try {
      const { data, error } = await supabase
        .from('planes_financiacion')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()

      if (error) throw error
      
      // Si se especificaron categorías, actualizar las relaciones
      if (categoriasIds !== undefined) {
        // Eliminar relaciones existentes
        await supabase
          .from('planes_categorias')
          .delete()
          .eq('fk_id_plan', id)
        
        // Crear nuevas relaciones
        if (categoriasIds.length > 0) {
          const relaciones = categoriasIds.map(categoriaId => ({
            fk_id_plan: id,
            fk_id_categoria: categoriaId
          }))
          
          const { error: relacionesError } = await supabase
            .from('planes_categorias')
            .insert(relaciones)
          
          if (relacionesError) {
            console.error('Error updating plan-category relations:', relacionesError)
          }
        }
      }
      
      await loadPlanes()
      await loadPlanesCategorias()
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
      await loadPlanesCategorias()
    } catch (err) {
      setError('Error al eliminar plan')
      console.error('Error deleting plan:', err)
      throw err
    }
  }

  // Obtener categorías de un plan
  const getCategoriasDePlan = (planId: number): Categoria[] => {
    return planesCategorias
      .filter(pc => pc.fk_id_plan === planId)
      .map(pc => pc.categoria!)
      .filter(Boolean)
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

  // Crear zona
  const createZona = async (zona: Omit<Zona, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .insert([zona])
        .select()

      if (error) throw error
      await loadZonas()
      return data?.[0]
    } catch (err) {
      setError('Error al crear zona')
      console.error('Error creating zona:', err)
      throw err
    }
  }

  // Actualizar zona
  const updateZona = async (id: number, updates: Partial<Zona>) => {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      await loadZonas()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar zona')
      console.error('Error updating zona:', err)
      throw err
    }
  }

  // Eliminar zona
  const deleteZona = async (id: number) => {
    try {
      const { error } = await supabase
        .from('zonas')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadZonas()
    } catch (err) {
      setError('Error al eliminar zona')
      console.error('Error deleting zona:', err)
      throw err
    }
  }

  // Crear configuración de zona
  const createConfiguracionZona = async (configuracionZona: Omit<ConfiguracionZona, 'id' | 'created_at' | 'zona'>) => {
    try {
      const { data, error } = await supabase
        .from('configuracion_zonas')
        .insert([configuracionZona])
        .select()

      if (error) throw error
      await loadConfiguracionZonas()
      return data?.[0]
    } catch (err) {
      setError('Error al crear configuración de zona')
      console.error('Error creating configuracion_zona:', err)
      throw err
    }
  }

  // Actualizar configuración de zona
  const updateConfiguracionZona = async (id: number, updates: Partial<ConfiguracionZona>) => {
    try {
      const { data, error } = await supabase
        .from('configuracion_zonas')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      await loadConfiguracionZonas()
      return data?.[0]
    } catch (err) {
      setError('Error al actualizar configuración de zona')
      console.error('Error updating configuracion_zona:', err)
      throw err
    }
  }

  // Eliminar configuración de zona
  const deleteConfiguracionZona = async (id: number) => {
    try {
      const { error } = await supabase
        .from('configuracion_zonas')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadConfiguracionZonas()
    } catch (err) {
      setError('Error al eliminar configuración de zona')
      console.error('Error deleting configuracion_zona:', err)
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

  // Crear asociación por defecto
  const createProductoPlanDefault = async (productoPlanDefault: Omit<ProductoPlanDefault, 'id' | 'created_at' | 'producto' | 'plan'>) => {
    try {
      const { data, error } = await supabase
        .from('producto_planes_default')
        .insert([productoPlanDefault])
        .select()

      if (error) throw error
      await loadProductosPorPlanDefault()
      return data?.[0]
    } catch (err) {
      setError('Error al crear asociación por defecto')
      console.error('Error creating producto_plan_default:', err)
      throw err
    }
  }

  // Eliminar asociación por defecto
  const deleteProductoPlanDefault = async (productoId: number, planId: number) => {
    try {
      const { error } = await supabase
        .from('producto_planes_default')
        .delete()
        .eq('fk_id_producto', productoId)
        .eq('fk_id_plan', planId)

      if (error) throw error
      await loadProductosPorPlanDefault()
    } catch (err) {
      setError('Error al eliminar asociación por defecto')
      console.error('Error deleting producto_plan_default:', err)
      throw err
    }
  }

  // Crear asociaciones por defecto para un producto según los booleanos
  const createDefaultAssociationsForProduct = async (producto: Producto) => {
    try {
      console.log('Creando asociaciones por defecto para producto:', producto.id, 'con booleanos:', {
        aplica_todos_plan: producto.aplica_todos_plan,
        aplica_solo_categoria: producto.aplica_solo_categoria,
        aplica_plan_especial: producto.aplica_plan_especial
      })

      // Si solo aplica plan especial, no crear asociaciones por defecto
      if (producto.aplica_plan_especial && !producto.aplica_todos_plan && !producto.aplica_solo_categoria) {
        console.log('Producto solo aplica plan especial, no se crean asociaciones por defecto')
        return
      }

      // Obtener todos los planes activos
      const { data: todosLosPlanes, error: planesError } = await supabase
        .from('planes_financiacion')
        .select('id')
        .eq('activo', true)

      if (planesError) throw planesError

      // Obtener las categorías de cada plan
      const { data: planesCategorias, error: categoriasError } = await supabase
        .from('planes_categorias')
        .select('fk_id_plan, fk_id_categoria')

      if (categoriasError) throw categoriasError

      // Crear un mapa de planes con sus categorías
      const planesConCategorias = new Map()
      planesCategorias?.forEach(pc => {
        if (!planesConCategorias.has(pc.fk_id_plan)) {
          planesConCategorias.set(pc.fk_id_plan, [])
        }
        planesConCategorias.get(pc.fk_id_plan).push(pc.fk_id_categoria)
      })

      // Separar planes con y sin categorías
      const planesConCategoria = todosLosPlanes?.filter(plan => planesConCategorias.has(plan.id)) || []
      const planesSinCategoria = todosLosPlanes?.filter(plan => !planesConCategorias.has(plan.id)) || []

      let planesParaAsociar: any[] = []

      // Lógica según los booleanos
      if (producto.aplica_todos_plan) {
        // Aplica a todos los planes que NO tengan categoría definida
        console.log('Producto aplica a todos los planes (sin categoría):', producto.id)
        console.log('Planes sin categoría disponibles:', planesSinCategoria)
        planesParaAsociar = planesSinCategoria
      } else if (producto.aplica_solo_categoria && producto.fk_id_categoria) {
        // Aplica solo a planes de su categoría
        console.log('Filtrando planes para categoría del producto:', producto.fk_id_categoria)
        console.log('Planes con categorías disponibles:', planesConCategoria.map(p => ({ id: p.id, categorias: planesConCategorias.get(p.id) })))
        
        const planesDeCategoria = planesConCategoria.filter(plan => {
          const categoriasDelPlan = planesConCategorias.get(plan.id) || []
          const incluyeCategoria = categoriasDelPlan.includes(producto.fk_id_categoria!)
          console.log(`Plan ${plan.id} tiene categorías: [${categoriasDelPlan.join(', ')}], incluye ${producto.fk_id_categoria}: ${incluyeCategoria}`)
          return incluyeCategoria
        })
        planesParaAsociar = planesDeCategoria
        console.log('Planes filtrados por categoría:', planesDeCategoria)
      }

      console.log('Planes seleccionados para asociar:', planesParaAsociar)

      // Crear asociaciones por defecto
      if (planesParaAsociar.length > 0) {
        const defaultAssociations = planesParaAsociar.map(plan => ({
          fk_id_producto: producto.id,
          fk_id_plan: plan.id
        }))

        const { error } = await supabase
          .from('producto_planes_default')
          .insert(defaultAssociations)

        if (error) throw error
        console.log('Asociaciones por defecto creadas:', defaultAssociations.length)
      }

      await loadProductosPorPlanDefault()
    } catch (err) {
      setError('Error al crear asociaciones por defecto para el producto')
      console.error('Error creating default associations:', err)
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
            loadProductosPorPlanDefault(),
            loadCategorias(),
            loadPlanesCategorias(),
            loadMarcas(),
            loadZonas(),
            loadConfiguracionZonas(),
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
    productosPorPlanDefault,
    categorias,
    marcas,
    zonas,
    configuracionZonas,
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
    createZona,
    updateZona,
    deleteZona,
    createConfiguracionZona,
    updateConfiguracionZona,
    deleteConfiguracionZona,
    createProductoPlan,
    updateProductoPlan,
    deleteProductoPlan,
    createProductoPlanDefault,
    deleteProductoPlanDefault,
    createDefaultAssociationsForProduct,
    getCategoriasDePlan,
    configuracion,
    updateConfiguracion,
    refreshData: () => {
      setLoading(true)
      Promise.all([
        loadProductos(),
        loadPlanes(),
        loadProductosPorPlan(),
        loadProductosPorPlanDefault(),
        loadCategorias(),
        loadPlanesCategorias(),
        loadMarcas(),
        loadZonas(),
        loadConfiguracionZonas(),
        loadConfiguracion()
      ]).finally(() => setLoading(false))
    }
  }
} 