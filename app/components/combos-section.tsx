"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Edit, Trash2, Grid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X, Calendar, Percent, Package, PackageOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combo, ComboProducto, Producto } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"

interface CombosSectionProps {
  productos: Producto[]
}

export const CombosSection = React.memo(({
  productos
}: CombosSectionProps) => {
  // Debug temporal - vamos a ver qué productos llegan
  useEffect(() => {
    console.log('🔍 Productos recibidos en CombosSection:')
    console.log('Total productos:', productos.length)
    console.log('Primeros 3 productos:', productos.slice(0, 3).map(p => ({
      id: p.id,
      descripcion: p.descripcion,
      precio: p.precio,
      tipo_precio: typeof p.precio
    })))
  }, [productos])
  const [combos, setCombos] = useState<Combo[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("all")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<{id: number, cantidad: number, precio_unitario?: number}[]>([])
  const itemsPerPage = 10
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_vigencia_inicio: "",
    fecha_vigencia_fin: "",
    descuento_porcentaje: "0",
    imagenes: [] as string[],
    activo: true
  })

  // Cargar combos al montar el componente
  useEffect(() => {
    loadCombos()
  }, [])

  const loadCombos = async () => {
    try {
      const { data, error } = await supabase
        .from('combos')
        .select(`
          *,
          productos:combo_productos(
            id,
            fk_id_producto,
            cantidad,
            precio_unitario,
            producto:productos(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('🔍 Combos cargados desde BD:', data)
      if (data && data.length > 0) {
        console.log('🔍 Primer combo con productos:', data[0])
        if (data[0].productos) {
          console.log('🔍 Productos del primer combo:', data[0].productos)
        }
      }
      setCombos(data || [])
    } catch (error) {
      console.error('Error loading combos:', error)
    }
  }

  // Filtrado de combos
  const filteredCombos = useMemo(() => {
    let filtered = combos

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(combo => {
        const nombre = combo.nombre?.toLowerCase() || ""
        const descripcion = combo.descripcion?.toLowerCase() || ""
        
        return nombre.includes(term) || descripcion.includes(term)
      })
    }

    // Filtro por estado
    if (filterEstado !== "all") {
      const isActive = filterEstado === "activo"
      filtered = filtered.filter(combo => combo.activo === isActive)
    }

    return filtered
  }, [combos, searchTerm, filterEstado])

  // Paginación
  const totalPages = Math.ceil(filteredCombos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCombos = filteredCombos.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear página cuando cambie la vista o filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, filteredCombos.length, searchTerm, filterEstado])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-AR')
  }, [])

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      fecha_vigencia_inicio: "",
      fecha_vigencia_fin: "",
      descuento_porcentaje: "0",
      imagenes: [],
      activo: true
    })
    setSelectedProducts([])
    setEditingCombo(null)
    setCurrentImageIndex(0)
    console.log('✅ Formulario reseteado')
  }

  const handleEdit = (combo: Combo) => {
    setEditingCombo(combo)
    
    const comboImages = [
      combo.imagen,
      combo.imagen_2,
      combo.imagen_3,
      combo.imagen_4,
      combo.imagen_5,
    ].filter(Boolean) as string[]

    setFormData({
      nombre: combo.nombre || "",
      descripcion: combo.descripcion || "",
      fecha_vigencia_inicio: combo.fecha_vigencia_inicio || "",
      fecha_vigencia_fin: combo.fecha_vigencia_fin || "",
      descuento_porcentaje: combo.descuento_porcentaje?.toString() || "0",
      imagenes: comboImages,
      activo: combo.activo ?? true
    })

    // Cargar productos del combo con sus precios
    if (combo.productos) {
      console.log('🔍 Productos del combo en handleEdit:', combo.productos)
      const productosValidos = combo.productos
        .filter(p => p.fk_id_producto) // Solo productos con ID válido
        .map(p => {
          console.log('Procesando producto combo:', p)
          return {
            id: p.fk_id_producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario
          }
        })
      console.log('🔍 Productos válidos para selectedProducts:', productosValidos)
      setSelectedProducts(productosValidos)
    }

    setCurrentImageIndex(0)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Si estamos editando, eliminar imágenes que ya no están en el array
      if (editingCombo) {
        const originalImages = [
          editingCombo.imagen,
          editingCombo.imagen_2,
          editingCombo.imagen_3,
          editingCombo.imagen_4,
          editingCombo.imagen_5
        ].filter(Boolean) as string[]

        const imagesToRemove = originalImages.filter(img => !formData.imagenes.includes(img))
        
        // Eliminar imágenes del storage que ya no están en el array
        for (const imageUrl of imagesToRemove) {
          try {
            // Verificar si la imagen es de Supabase o externa
            const isSupabaseImage = imageUrl.includes('supabase.co')
            
            if (isSupabaseImage) {
              const filePath = extractFilePathFromUrl(imageUrl)
              console.log('Eliminando imagen de Supabase:', { imageUrl, filePath })
              
              const { error } = await supabase.storage
                .from('imagenes')
                .remove([filePath])
              
              if (error) {
                console.error('Error eliminando imagen del storage:', error)
              } else {
                console.log('Imagen eliminada exitosamente del storage:', filePath)
              }
            } else {
              console.log('Imagen externa (no se puede eliminar del servidor externo):', imageUrl)
            }
          } catch (error) {
            console.error('Error al eliminar imagen:', error)
          }
        }
      }

      const comboData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        fecha_vigencia_inicio: formData.fecha_vigencia_inicio || undefined,
        fecha_vigencia_fin: formData.fecha_vigencia_fin || undefined,
        descuento_porcentaje: parseFloat(formData.descuento_porcentaje),
        imagen: formData.imagenes[0] || undefined,
        imagen_2: formData.imagenes[1] || undefined,
        imagen_3: formData.imagenes[2] || undefined,
        imagen_4: formData.imagenes[3] || undefined,
        imagen_5: formData.imagenes[4] || undefined,
        activo: formData.activo
      }

      let comboId: number

      if (editingCombo) {
        const { data, error } = await supabase
          .from('combos')
          .update(comboData)
          .eq('id', editingCombo.id)
          .select()
          .single()

        if (error) throw error
        comboId = editingCombo.id

        // Eliminar productos existentes del combo
        await supabase
          .from('combo_productos')
          .delete()
          .eq('fk_id_combo', comboId)
      } else {
        const { data, error } = await supabase
          .from('combos')
          .insert(comboData)
          .select()
          .single()

        if (error) throw error
        comboId = data.id
      }

      // Agregar productos seleccionados al combo
      if (selectedProducts.length > 0) {
        // Filtrar productos con IDs válidos
        const productosValidos = selectedProducts.filter(sp => sp.id && sp.id !== undefined)
        console.log('🔍 Productos válidos para guardar:', productosValidos)
        
        if (productosValidos.length === 0) {
          throw new Error('No hay productos válidos para guardar')
        }
        
        const comboProductos = productosValidos.map(sp => {
          // Siempre usar el precio actual del producto al guardar
          const precioActual = productos.find(p => p.id === sp.id)?.precio || 0
          console.log('Guardando producto combo:', { 
            fk_id_combo: comboId, 
            fk_id_producto: sp.id, 
            cantidad: sp.cantidad, 
            precio_unitario: precioActual
          })
          return {
            fk_id_combo: comboId,
            fk_id_producto: sp.id,
            cantidad: sp.cantidad,
            precio_unitario: precioActual
          }
        })

        const { error: productError } = await supabase
          .from('combo_productos')
          .insert(comboProductos)

        if (productError) throw productError
      }

      // Ejecutar función de cálculo de precios manualmente
      if (comboId) {
        const { error: calcError } = await supabase.rpc('calcular_precio_combo', {
          combo_id: comboId
        })
        if (calcError) {
          console.error('Error calculando precios:', calcError)
        }
      }

      await loadCombos()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar combo:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteClick = (combo: Combo) => {
    setComboToDelete(combo)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (comboToDelete) {
      try {
        // Eliminar todas las imágenes del combo del storage
        const comboImages = [
          comboToDelete.imagen,
          comboToDelete.imagen_2,
          comboToDelete.imagen_3,
          comboToDelete.imagen_4,
          comboToDelete.imagen_5
        ].filter(Boolean) as string[]

        for (const imageUrl of comboImages) {
          try {
            // Verificar si la imagen es de Supabase o externa
            const isSupabaseImage = imageUrl.includes('supabase.co')
            
            if (isSupabaseImage) {
              const filePath = extractFilePathFromUrl(imageUrl)
              console.log('Eliminando imagen de Supabase del combo:', { imageUrl, filePath })
              
              const { error } = await supabase.storage
                .from('imagenes')
                .remove([filePath])
              
              if (error) {
                console.error('Error eliminando imagen del storage:', error)
              } else {
                console.log('Imagen eliminada exitosamente del storage:', filePath)
              }
            } else {
              console.log('Imagen externa del combo (no se puede eliminar del servidor externo):', imageUrl)
            }
          } catch (error) {
            console.error('Error al eliminar imagen:', error)
          }
        }

        const { error } = await supabase
          .from('combos')
          .delete()
          .eq('id', comboToDelete.id)

        if (error) throw error
        await loadCombos()
      } catch (error) {
        console.error("Error al eliminar combo:", error)
      }
      setIsDeleteDialogOpen(false)
      setComboToDelete(null)
    }
  }

  const addProductToCombo = (productId: number) => {
    if (!selectedProducts.find(p => p.id === productId)) {
      const producto = productos.find(p => p.id === productId)
      const precioActual = producto?.precio || 0
      console.log(`Agregando producto ${productId} con precio actual ${precioActual}`)
      setSelectedProducts([...selectedProducts, { 
        id: productId, 
        cantidad: 1
        // No guardamos precio_unitario aquí, se calculará en tiempo real
      }])
    }
  }

  const removeProductFromCombo = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const updateProductQuantity = (productId: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeProductFromCombo(productId)
      return
    }
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, cantidad } : p
    ))
    console.log('Cantidad actualizada para producto', productId, ':', cantidad)
  }

  const calculateComboPrice = () => {
    console.log('=== Calculando precio combo ===')
    console.log('selectedProducts:', selectedProducts)
    
    const totalPrice = selectedProducts.reduce((sum, sp) => {
      // Siempre usar el precio actual del producto para mostrar en la UI
      const producto = productos.find(p => p.id === sp.id)
      const precioActual = producto?.precio || 0
      console.log(`Producto ID ${sp.id}: precio_actual=${precioActual}, cantidad=${sp.cantidad}, subtotal=${precioActual * sp.cantidad}`)
      return sum + precioActual * sp.cantidad
    }, 0)

    console.log('Precio total calculado:', totalPrice)
    const discount = parseFloat(formData.descuento_porcentaje) || 0
    const finalPrice = totalPrice * (1 - discount / 100)
    console.log('Descuento:', discount, '% - Precio final:', finalPrice)
    
    return { totalPrice, finalPrice }
  }

  const { totalPrice, finalPrice } = calculateComboPrice()

  // Función helper para extraer el path del archivo de una URL de Supabase
  const extractFilePathFromUrl = (imageUrl: string): string => {
    try {
      // Las URLs de Supabase tienen formato: https://xxx.supabase.co/storage/v1/object/public/imagenes/combos/filename.jpg
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      
      // Buscar el índice de 'imagenes' en el path
      const imagenesIndex = pathParts.findIndex(part => part === 'imagenes')
      if (imagenesIndex !== -1 && imagenesIndex + 2 < pathParts.length) {
        // Tomar todo después de 'imagenes' (incluyendo 'combos/filename.jpg')
        const filePath = pathParts.slice(imagenesIndex + 1).join('/')
        return filePath
      }
      
      // Fallback: extraer solo el nombre del archivo
      const fileName = pathParts[pathParts.length - 1]
      return `combos/${fileName}`
    } catch (error) {
      console.error('Error extrayendo path de URL:', error)
      // Fallback: extraer solo el nombre del archivo
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      return `combos/${fileName}`
    }
  }

  // Componente de paginación
  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCombos.length)} de {filteredCombos.length} combos
            {searchTerm && ` (filtrados de ${combos.length} total)`}
          </p>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm">
            {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Combos</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-2"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (open) {
                  setIsDialogOpen(true)
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetForm()
                    setIsDialogOpen(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Combo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                  <div>
                    <DialogHeader>
                      <DialogTitle>{editingCombo ? "Editar Combo" : "Nuevo Combo"}</DialogTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-4 top-4"
                        onClick={() => {
                          setIsDialogOpen(false)
                          resetForm()
                        }}
                        disabled={isCreating}
                      >
                        ✕
                      </Button>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nombre">Nombre del Combo</Label>
                          <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            disabled={isCreating}
                            placeholder="ej: Colchón + Soporte Premium"
                          />
                        </div>
                        <div>
                          <Label htmlFor="descuento_porcentaje">Descuento (%)</Label>
                          <Input
                            id="descuento_porcentaje"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.descuento_porcentaje}
                            onChange={(e) => setFormData({ ...formData, descuento_porcentaje: e.target.value })}
                            disabled={isCreating}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          disabled={isCreating}
                          placeholder="Descripción del combo..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fecha_vigencia_inicio">Fecha Inicio Vigencia</Label>
                          <Input
                            id="fecha_vigencia_inicio"
                            type="date"
                            value={formData.fecha_vigencia_inicio}
                            onChange={(e) => setFormData({ ...formData, fecha_vigencia_inicio: e.target.value })}
                            disabled={isCreating}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fecha_vigencia_fin">Fecha Fin Vigencia</Label>
                          <Input
                            id="fecha_vigencia_fin"
                            type="date"
                            value={formData.fecha_vigencia_fin}
                            onChange={(e) => setFormData({ ...formData, fecha_vigencia_fin: e.target.value })}
                            disabled={isCreating}
                          />
                        </div>
                      </div>

                      {/* Sección de productos */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Productos del Combo</Label>
                          <Badge variant="outline">
                            {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''} seleccionado{selectedProducts.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {/* Lista de productos seleccionados */}
                        {selectedProducts.length > 0 && (
                          <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                            <h4 className="text-sm font-medium">Productos seleccionados:</h4>
                            {selectedProducts.map((sp) => {
                              const producto = productos.find(p => p.id === sp.id)
                              console.log(`Renderizando producto ${sp.id}:`, { producto, precio: producto?.precio })
                              if (!producto) {
                                console.log(`❌ Producto ${sp.id} no encontrado en la lista`)
                                return null
                              }
                              return (
                                <div key={sp.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{producto.descripcion}</span>
                                    <div className="text-xs text-gray-500">
                                      {formatPrice(producto.precio)} × {sp.cantidad} = {formatPrice(producto.precio * sp.cantidad)}
                                      {sp.precio_unitario && sp.precio_unitario !== producto.precio && (
                                        <div className="text-xs text-orange-600 mt-1">
                                          Precio original: {formatPrice(sp.precio_unitario)} (actualizado)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={sp.cantidad}
                                      onChange={(e) => updateProductQuantity(sp.id, parseInt(e.target.value) || 1)}
                                      className="w-16 text-center"
                                      disabled={isCreating}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeProductFromCombo(sp.id)}
                                      disabled={isCreating}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                            
                            {/* Resumen de precios */}
                            <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Precio original:</span>
                                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Descuento ({formData.descuento_porcentaje}%):</span>
                                  <span className="text-red-600">-{formatPrice(totalPrice - finalPrice)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Precio final:</span>
                                  <span className="text-green-600">{formatPrice(finalPrice)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Selector de productos */}
                        <div className="space-y-2">
                          <Label>Agregar productos</Label>
                          <Select onValueChange={(value) => addProductToCombo(parseInt(value))} disabled={isCreating}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto para agregar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {productos
                                .filter(p => !selectedProducts.find(sp => sp.id === p.id))
                                .map((producto) => (
                                  <SelectItem key={producto.id} value={producto.id.toString()}>
                                    {producto.descripcion} - {formatPrice(producto.precio)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Sección de imágenes del combo */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Imágenes del Combo</Label>
                          {formData.imagenes.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('Eliminando todas las imágenes del formulario')
                                setFormData({ ...formData, imagenes: [] })
                                setCurrentImageIndex(0)
                              }}
                              disabled={isCreating}
                            >
                              Eliminar todas las imágenes
                            </Button>
                          )}
                        </div>
                        
                        {/* Vista previa de imágenes con navegación */}
                        {formData.imagenes.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Vista previa de imágenes</span>
                              <span>{currentImageIndex + 1} de {formData.imagenes.length}</span>
                            </div>
                            
                            <div className="relative">
                              <div className="aspect-square w-full max-w-xs mx-auto bg-gray-100 rounded-lg overflow-hidden border">
                                <img
                                  src={formData.imagenes[currentImageIndex]}
                                  alt={`Imagen ${currentImageIndex + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.jpg'
                                  }}
                                />
                              </div>
                              
                              {/* Botón eliminar imagen actual */}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0"
                                onClick={async () => {
                                  const imageUrl = formData.imagenes[currentImageIndex]
                                  
                                  // Eliminar imagen del storage si es de Supabase
                                  if (imageUrl.includes('supabase.co')) {
                                    try {
                                      const filePath = extractFilePathFromUrl(imageUrl)
                                      console.log('Eliminando imagen de Supabase:', filePath)
                                      
                                      const { error } = await supabase.storage
                                        .from('imagenes')
                                        .remove([filePath])
                                      
                                      if (error) {
                                        console.error('Error eliminando imagen del storage:', error)
                                      }
                                    } catch (error) {
                                      console.error('Error al eliminar imagen:', error)
                                    }
                                  }
                                  
                                  // Eliminar de la lista
                                  const newImages = formData.imagenes.filter((_, i) => i !== currentImageIndex)
                                  setFormData({ ...formData, imagenes: newImages })
                                  
                                  // Ajustar índice
                                  if (currentImageIndex >= newImages.length && newImages.length > 0) {
                                    setCurrentImageIndex(newImages.length - 1)
                                  } else if (newImages.length === 0) {
                                    setCurrentImageIndex(0)
                                  }
                                }}
                                disabled={isCreating}
                                title="Eliminar imagen actual"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              
                              {formData.imagenes.length > 1 && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                    onClick={() => {
                                      setCurrentImageIndex(prev => 
                                        prev === 0 ? formData.imagenes.length - 1 : prev - 1
                                      )
                                    }}
                                    disabled={isCreating}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                    onClick={() => {
                                      setCurrentImageIndex(prev => 
                                        prev === formData.imagenes.length - 1 ? 0 : prev + 1
                                      )
                                    }}
                                    disabled={isCreating}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                            
                            {formData.imagenes.length > 1 && (
                              <div className="flex justify-center space-x-1">
                                {formData.imagenes.map((_, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className={`w-2 h-2 rounded-full ${
                                      index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                    onClick={() => setCurrentImageIndex(index)}
                                    disabled={isCreating}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Sección de subida de imágenes */}
                        <div className="space-y-3">
                          <Label>Subir nuevas imágenes</Label>
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
                            onDrop={async (e) => {
                              e.preventDefault()
                              if (isCreating) return
                              
                              const files = e.dataTransfer.files
                              if (files.length === 0) return
                              
                              const remainingSlots = 5 - formData.imagenes.length
                              if (remainingSlots <= 0) {
                                alert('Ya tienes el máximo de 5 imágenes')
                                return
                              }
                              
                              const filesToUpload = Array.from(files).slice(0, remainingSlots)
                              
                              try {
                                const uploadPromises = filesToUpload.map(async (file) => {
                                  if (!file.type.startsWith('image/')) {
                                    throw new Error('Solo se permiten archivos de imagen')
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    throw new Error('El archivo es demasiado grande. Máximo 5MB')
                                  }
                                  
                                  const fileExt = file.name.split('.').pop()
                                  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                                  const filePath = `combos/${fileName}`
                                  
                                  const { data, error } = await supabase.storage
                                    .from('imagenes')
                                    .upload(filePath, file, {
                                      cacheControl: '3600',
                                      upsert: false
                                    })
                                  
                                  if (error) throw error
                                  
                                  const { data: { publicUrl } } = supabase.storage
                                    .from('imagenes')
                                    .getPublicUrl(filePath)
                                  
                                  return publicUrl
                                })
                                
                                const uploadedUrls = await Promise.all(uploadPromises)
                                setFormData({ ...formData, imagenes: [...formData.imagenes, ...uploadedUrls] })
                              } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen'
                                alert(errorMessage)
                              }
                            }}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={async (e) => {
                                if (isCreating) return
                                
                                const files = e.target.files
                                if (!files || files.length === 0) return
                                
                                const remainingSlots = 5 - formData.imagenes.length
                                if (remainingSlots <= 0) {
                                  alert('Ya tienes el máximo de 5 imágenes')
                                  return
                                }
                                
                                const filesToUpload = Array.from(files).slice(0, remainingSlots)
                                
                                try {
                                  const uploadPromises = filesToUpload.map(async (file) => {
                                    if (!file.type.startsWith('image/')) {
                                      throw new Error('Solo se permiten archivos de imagen')
                                    }
                                    if (file.size > 5 * 1024 * 1024) {
                                      throw new Error('El archivo es demasiado grande. Máximo 5MB')
                                    }
                                    
                                    const fileExt = file.name.split('.').pop()
                                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                                    const filePath = `combos/${fileName}`
                                    
                                    const { data, error } = await supabase.storage
                                      .from('imagenes')
                                      .upload(filePath, file, {
                                        cacheControl: '3600',
                                        upsert: false
                                      })
                                    
                                    if (error) throw error
                                    
                                    const { data: { publicUrl } } = supabase.storage
                                      .from('imagenes')
                                      .getPublicUrl(filePath)
                                    
                                    return publicUrl
                                  })
                                  
                                  const uploadedUrls = await Promise.all(uploadPromises)
                                  setFormData({ ...formData, imagenes: [...formData.imagenes, ...uploadedUrls] })
                                } catch (error) {
                                  const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen'
                                  alert(errorMessage)
                                }
                                
                                e.target.value = ''
                              }}
                              className="hidden"
                              id="image-upload-combo"
                              disabled={isCreating}
                            />
                            <label htmlFor="image-upload-combo" className="cursor-pointer">
                              <div className="flex flex-col items-center space-y-2">
                                <Plus className="h-8 w-8 text-gray-400" />
                                <p className="text-sm font-medium text-gray-700">
                                  Arrastra imágenes aquí o haz clic para seleccionar
                                </p>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG, GIF hasta 5MB. Tienes {formData.imagenes.length}/5 imágenes
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="activo"
                          checked={formData.activo}
                          onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                          disabled={isCreating}
                        />
                        <Label htmlFor="activo">Activo</Label>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isCreating || selectedProducts.length === 0}
                      >
                        {isCreating ? "Guardando..." : editingCombo ? "Actualizar" : "Crear"} Combo
                      </Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        {/* Filtros */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar combos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <CardContent>
          {viewMode === 'table' ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Precio Original</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Precio Final</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCombos.map((combo) => (
                    <TableRow key={combo.id}>
                      <TableCell className="w-16">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                          {combo.imagen ? (
                            <img
                              src={combo.imagen}
                              alt={combo.nombre}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.jpg'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <PackageOpen className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {combo.nombre}
                        {combo.descripcion && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {combo.descripcion}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {combo.productos?.map((cp) => (
                            <Badge key={cp.id} variant="secondary" className="text-xs">
                              {cp.producto?.descripcion} ({cp.cantidad})
                            </Badge>
                          )) || <span className="text-gray-400 text-xs">Sin productos</span>}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(combo.precio_original)}</TableCell>
                      <TableCell>
                        {combo.descuento_porcentaje > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            -{combo.descuento_porcentaje}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatPrice(combo.precio_combo)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{formatDate(combo.fecha_vigencia_inicio)}</div>
                          <div>{formatDate(combo.fecha_vigencia_fin)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={combo.activo}
                          onCheckedChange={async (checked) => {
                            try {
                              await supabase
                                .from('combos')
                                .update({ activo: checked })
                                .eq('id', combo.id)
                              await loadCombos()
                            } catch (error) {
                              console.error('Error al actualizar estado:', error)
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(combo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteClick(combo)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentCombos.map((combo) => (
                  <Card key={combo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {combo.imagen ? (
                        <img
                          src={combo.imagen}
                          alt={combo.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.jpg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <div className="text-gray-400 text-center">
                            <PackageOpen className="h-8 w-8 mx-auto mb-2" />
                            <div className="text-xs">Sin imagen</div>
                          </div>
                        </div>
                      )}
                      {combo.descuento_porcentaje > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500 text-white">
                            -{combo.descuento_porcentaje}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {combo.nombre}
                        </h3>
                        
                        {combo.precio_original !== combo.precio_combo && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(combo.precio_original)}
                          </div>
                        )}
                        
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(combo.precio_combo)}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {combo.productos?.length || 0} producto{(combo.productos?.length || 0) !== 1 ? 's' : ''}
                        </div>
                        
                        {combo.descripcion && (
                          <div className="text-xs text-gray-600 line-clamp-2">
                            {combo.descripcion}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-gray-600">Activo:</span>
                          <Switch
                            size="sm"
                            checked={combo.activo}
                            onCheckedChange={async (checked) => {
                              try {
                                await supabase
                                  .from('combos')
                                  .update({ activo: checked })
                                  .eq('id', combo.id)
                                await loadCombos()
                              } catch (error) {
                                console.error('Error al actualizar estado:', error)
                              }
                            }}
                          />
                        </div>
                        
                        <div className="flex gap-1 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(combo)}
                            className="flex-1 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteClick(combo)}
                            className="flex-1 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Pagination />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              ¿Estás seguro de que quieres eliminar el combo <strong>"{comboToDelete?.nombre}"</strong>?
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                <span className="font-medium text-yellow-800 text-sm">Atención</span>
              </div>
              <p className="text-yellow-700 text-xs mt-1">
                Esta acción no se puede deshacer. El combo será eliminado permanentemente.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} size="sm">
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              size="sm"
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})