"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Plus, Edit, Trash2, Grid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "./image-upload"
import { ExcelGenerator } from "./excel-generator"
import { PriceUpdater } from "./price-updater"
import { ImageImporter } from "./image-importer"
import { Producto, Categoria, Marca } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"

interface ProductosSectionProps {
  productos: Producto[]
  categorias: Categoria[]
  marcas: Marca[]
  onCreateProducto: (producto: Omit<Producto, 'id' | 'created_at' | 'categoria' | 'marca'>) => Promise<Producto | undefined>
  onUpdateProducto: (id: number, producto: Partial<Producto>) => Promise<Producto | undefined>
  onDeleteProducto: (id: number) => Promise<void>
}

export const ProductosSection = React.memo(({
  productos,
  categorias,
  marcas,
  onCreateProducto,
  onUpdateProducto,
  onDeleteProducto
}: ProductosSectionProps) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("all")
  const [filterMarca, setFilterMarca] = useState("all")
  const [filterEstado, setFilterEstado] = useState("all")
  const itemsPerPage = 15
  const [formData, setFormData] = useState({
    descripcion: "",
    descripcion_detallada: "",
    precio: "",
    fk_id_categoria: undefined as string | undefined,
    fk_id_marca: undefined as string | undefined,
    imagenes: [] as string[],
    destacado: false,
    activo: true,
    aplica_todos_plan: false,
    aplica_solo_categoria: false,
    aplica_plan_especial: false
  })

  // Filtrado de productos por búsqueda y filtros
  const filteredProductos = useMemo(() => {
    let filtered = productos

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(producto => {
        const descripcion = producto.descripcion?.toLowerCase() || ""
        const descripcionDetallada = producto.descripcion_detallada?.toLowerCase() || ""
        const categoria = producto.categoria?.descripcion?.toLowerCase() || ""
        const marca = producto.marca?.descripcion?.toLowerCase() || ""
        const precio = producto.precio?.toString() || ""
        
        return (
          descripcion.includes(term) ||
          descripcionDetallada.includes(term) ||
          categoria.includes(term) ||
          marca.includes(term) ||
          precio.includes(term)
        )
      })
    }

    // Filtro por categoría
    if (filterCategoria !== "all") {
      filtered = filtered.filter(producto => 
        producto.fk_id_categoria?.toString() === filterCategoria
      )
    }

    // Filtro por marca
    if (filterMarca !== "all") {
      filtered = filtered.filter(producto => 
        producto.fk_id_marca?.toString() === filterMarca
      )
    }

    // Filtro por estado (activo/inactivo)
    if (filterEstado !== "all") {
      const isActive = filterEstado === "activo"
      filtered = filtered.filter(producto => producto.activo === isActive)
    }

    return filtered
  }, [productos, searchTerm, filterCategoria, filterMarca, filterEstado])

  // Funciones de paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProductos = filteredProductos.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear página cuando cambie la vista, el número de productos, el término de búsqueda o los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, filteredProductos.length, searchTerm, filterCategoria, filterMarca, filterEstado])

  // Componente de paginación
  const Pagination = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const maxVisiblePages = 5
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        }
      }
      
      return pages
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProductos.length)} de {filteredProductos.length} productos
            {searchTerm && ` (filtrados de ${productos.length} total)`}
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
          
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-sm text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
          
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

  // Función helper para obtener todas las imágenes de un producto (memoizada)
  const getAllProductImages = React.useCallback((producto: Producto): string[] => {
    return [
      producto.imagen,
      producto.imagen_2,
      producto.imagen_3,
      producto.imagen_4,
      producto.imagen_5
    ].filter(img => img) as string[]
  }, [])

  const formatPrice = React.useCallback((price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price)
  }, [])

  const resetForm = () => {
    setFormData({
      descripcion: "",
      descripcion_detallada: "",
      precio: "",
      fk_id_categoria: undefined,
      fk_id_marca: undefined,
      imagenes: [],
      destacado: false,
      activo: true,
      aplica_todos_plan: false,
      aplica_solo_categoria: false,
      aplica_plan_especial: false
    })
    setEditingProduct(null)
  }

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    // Recopilar todas las URLs de imagen en un array, filtrando nulos/indefinidos/cadenas vacías
    const productImages = [
      producto.imagen,
      producto.imagen_2,
      producto.imagen_3,
      producto.imagen_4,
      producto.imagen_5,
    ].filter(Boolean) as string[];

    setFormData({
      descripcion: producto.descripcion || "",
      descripcion_detallada: producto.descripcion_detallada || "",
      precio: producto.precio?.toString() || "",
      fk_id_categoria: producto.fk_id_categoria?.toString(),
      fk_id_marca: producto.fk_id_marca?.toString(),
      imagenes: productImages,
      destacado: producto.destacado || false,
      activo: producto.activo ?? true,
      aplica_todos_plan: producto.aplica_todos_plan || false,
      aplica_solo_categoria: producto.aplica_solo_categoria || false,
      aplica_plan_especial: producto.aplica_plan_especial || false
    })
    setTimeout(() => setIsDialogOpen(true), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Si estamos editando, eliminar imágenes que ya no están en el array
      if (editingProduct) {
        const originalImages = [
          editingProduct.imagen,
          editingProduct.imagen_2,
          editingProduct.imagen_3,
          editingProduct.imagen_4,
          editingProduct.imagen_5
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

          const productoData = {
        descripcion: formData.descripcion,
        descripcion_detallada: formData.descripcion_detallada || undefined,
        precio: parseFloat(formData.precio),
        fk_id_categoria: formData.fk_id_categoria ? parseInt(formData.fk_id_categoria) : undefined,
        fk_id_marca: formData.fk_id_marca ? parseInt(formData.fk_id_marca) : undefined,
        // Mapear el array de imágenes a los campos individuales de la base de datos
        // Asegurar que los campos se limpien cuando no hay imágenes
        imagen: formData.imagenes[0] && formData.imagenes[0].trim() !== '' ? formData.imagenes[0] : undefined,
        imagen_2: formData.imagenes[1] && formData.imagenes[1].trim() !== '' ? formData.imagenes[1] : undefined,
        imagen_3: formData.imagenes[2] && formData.imagenes[2].trim() !== '' ? formData.imagenes[2] : undefined,
        imagen_4: formData.imagenes[3] && formData.imagenes[3].trim() !== '' ? formData.imagenes[3] : undefined,
        imagen_5: formData.imagenes[4] && formData.imagenes[4].trim() !== '' ? formData.imagenes[4] : undefined,
        destacado: formData.destacado,
        activo: formData.activo,
        aplica_todos_plan: formData.aplica_todos_plan,
        aplica_solo_categoria: formData.aplica_solo_categoria,
        aplica_plan_especial: formData.aplica_plan_especial
      }

      console.log('Guardando producto con imágenes:', {
        imagenes: formData.imagenes,
        imagen: productoData.imagen,
        imagen_2: productoData.imagen_2,
        imagen_3: productoData.imagen_3,
        imagen_4: productoData.imagen_4,
        imagen_5: productoData.imagen_5
      })
      
      // Verificar si se están limpiando los campos
      const camposLimpios = Object.entries(productoData)
        .filter(([key, value]) => key.startsWith('imagen') && value === undefined)
        .map(([key]) => key)
      
      if (camposLimpios.length > 0) {
        console.log('✅ Campos de imagen que se van a limpiar en la BD:', camposLimpios)
      }


      
      if (editingProduct) {
        await onUpdateProducto(editingProduct.id, productoData)
      } else {
        await onCreateProducto(productoData)
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar producto:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteClick = (producto: Producto) => {
    setProductToDelete(producto)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      // Eliminar todas las imágenes del producto del storage
      const productImages = [
        productToDelete.imagen,
        productToDelete.imagen_2,
        productToDelete.imagen_3,
        productToDelete.imagen_4,
        productToDelete.imagen_5
      ].filter(Boolean) as string[]

            for (const imageUrl of productImages) {
        try {
          // Verificar si la imagen es de Supabase o externa
          const isSupabaseImage = imageUrl.includes('supabase.co')
          
          if (isSupabaseImage) {
            const filePath = extractFilePathFromUrl(imageUrl)
            console.log('Eliminando imagen de Supabase del producto:', { imageUrl, filePath })
            
            const { error } = await supabase.storage
              .from('imagenes')
              .remove([filePath])
            
            if (error) {
              console.error('Error eliminando imagen del storage:', error)
            } else {
              console.log('Imagen eliminada exitosamente del storage:', filePath)
            }
          } else {
            console.log('Imagen externa del producto (no se puede eliminar del servidor externo):', imageUrl)
          }
        } catch (error) {
          console.error('Error al eliminar imagen:', error)
        }
      }

      await onDeleteProducto(productToDelete.id)
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  // Función para limpiar todas las imágenes de un producto
  const handleClearImages = async (producto: Producto) => {
    try {
      console.log('Limpiando todas las imágenes del producto:', producto.id)
      
      // Obtener todas las imágenes del producto
      const productImages = [
        producto.imagen,
        producto.imagen_2,
        producto.imagen_3,
        producto.imagen_4,
        producto.imagen_5
      ].filter(Boolean) as string[]

      // Eliminar imágenes de Supabase storage si existen
      for (const imageUrl of productImages) {
        try {
          const isSupabaseImage = imageUrl.includes('supabase.co')
          
          if (isSupabaseImage) {
            const filePath = extractFilePathFromUrl(imageUrl)
            console.log('Eliminando imagen de Supabase:', filePath)
            
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

      // Limpiar todos los campos de imagen en la base de datos
      const updates = {
        imagen: undefined,
        imagen_2: undefined,
        imagen_3: undefined,
        imagen_4: undefined,
        imagen_5: undefined
      }

      console.log('Limpiando campos de imagen en la BD:', updates)
      await onUpdateProducto(producto.id, updates)
      console.log('✅ Imágenes eliminadas exitosamente del producto:', producto.id)
      
    } catch (error) {
      console.error('Error al limpiar imágenes del producto:', error)
    }
  }

  // Función helper para extraer el path del archivo de una URL de Supabase
  const extractFilePathFromUrl = (imageUrl: string): string => {
    try {
      // Las URLs de Supabase tienen formato: https://xxx.supabase.co/storage/v1/object/public/imagenes/productos/filename.jpg
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      
      // Buscar el índice de 'imagenes' en el path
      const imagenesIndex = pathParts.findIndex(part => part === 'imagenes')
      if (imagenesIndex !== -1 && imagenesIndex + 2 < pathParts.length) {
        // Tomar todo después de 'imagenes' (incluyendo 'productos/filename.jpg')
        const filePath = pathParts.slice(imagenesIndex + 1).join('/')
        return filePath
      }
      
      // Fallback: extraer solo el nombre del archivo
      const fileName = pathParts[pathParts.length - 1]
      return `productos/${fileName}`
    } catch (error) {
      console.error('Error extrayendo path de URL:', error)
      // Fallback: extraer solo el nombre del archivo
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      return `productos/${fileName}`
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
        <CardTitle>Gestión de Productos</CardTitle>
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
          <ExcelGenerator productos={productos} />
          <PriceUpdater productos={productos} onUpdateProducto={onUpdateProducto} />
              <ImageImporter productos={productos} onUpdateProducto={onUpdateProducto} />
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
                        Nuevo Producto
                      </Button>
                    </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[100vh] overflow-y-auto" showCloseButton={false}>
                  <div className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
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
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    required
                    disabled={isCreating}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="descripcion_detallada">Descripción Detallada (opcional)</Label>
                <Textarea
                  id="descripcion_detallada"
                  value={formData.descripcion_detallada}
                  onChange={(e) => setFormData({ ...formData, descripcion_detallada: e.target.value })}
                  disabled={isCreating}
                          rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.fk_id_categoria}
                    onValueChange={(value) => setFormData({ ...formData, fk_id_categoria: value })}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Select
                    value={formData.fk_id_marca}
                    onValueChange={(value) => setFormData({ ...formData, fk_id_marca: value })}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id.toString()}>
                          {marca.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Imágenes del Producto</Label>
                          {formData.imagenes.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('Eliminando todas las imágenes del formulario')
                                setFormData({ ...formData, imagenes: [] })
                              }}
                              disabled={isCreating}
                            >
                              Eliminar todas las imágenes
                            </Button>
                          )}
                        </div>
                        <ImageUpload
                          images={formData.imagenes}
                          onImagesChange={(newImages) => setFormData({ ...formData, imagenes: newImages })}
                          maxImages={5}
                          disabled={isCreating}
                          label="Imágenes"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>Configuración</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                      disabled={isCreating}
                    />
                    <Label htmlFor="destacado">Destacado</Label>
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aplica_todos_plan"
                      checked={formData.aplica_todos_plan}
                      onCheckedChange={(checked) => setFormData({ ...formData, aplica_todos_plan: checked })}
                      disabled={isCreating}
                    />
                    <Label htmlFor="aplica_todos_plan">Aplica a todos los planes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aplica_solo_categoria"
                      checked={formData.aplica_solo_categoria}
                      onCheckedChange={(checked) => setFormData({ ...formData, aplica_solo_categoria: checked })}
                      disabled={isCreating}
                    />
                    <Label htmlFor="aplica_solo_categoria">Aplica solo a categoría</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aplica_plan_especial"
                      checked={formData.aplica_plan_especial}
                      onCheckedChange={(checked) => setFormData({ ...formData, aplica_plan_especial: checked })}
                      disabled={isCreating}
                    />
                            <Label htmlFor="aplica_plan_especial">Aplica a plan especial</Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creando..." : editingProduct ? "Actualizar" : "Crear"} Producto
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
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterMarca} onValueChange={setFilterMarca}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id.toString()}>
                      {marca.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
              <TableHead>ID</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Desc. Det.</TableHead>
              <TableHead>Imágenes</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Destacado</TableHead>
                    <TableHead>Activo</TableHead>
              <TableHead>Aplica Planes</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
                  {currentProductos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>{producto.id}</TableCell>
                  <TableCell className="font-medium">{producto.descripcion}</TableCell>
                  <TableCell>
                    {producto.descripcion_detallada ? (
                        <div className="text-sm text-gray-600">
                          {producto.descripcion_detallada.length > 50 
                            ? `${producto.descripcion_detallada.substring(0, 50)}...` 
                              : producto.descripcion_detallada}
                      </div>
                    ) : (
                          <span className="text-gray-400 text-xs">Sin descripción</span>
                    )}
                  </TableCell>
                  <TableCell>
                        <div className="flex gap-1">
                      {getAllProductImages(producto).map((img, index) => (
                            <div key={index} className="w-8 h-8 border rounded overflow-hidden relative">
                            <img
                              src={img}
                              alt={`${producto.descripcion} - Imagen ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.jpg'
                              }}
                              />
                          </div>
                        ))}
                      {getAllProductImages(producto).length === 0 && (
                        <span className="text-gray-400 text-xs">Sin imágenes</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{producto.categoria?.descripcion || '-'}</TableCell>
                  <TableCell>{producto.marca?.descripcion || '-'}</TableCell>
                  <TableCell>{formatPrice(producto.precio)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        producto.destacado ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {producto.destacado ? "Destacado" : "Normal"}
                    </span>
                  </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            producto.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {producto.aplica_todos_plan && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Todos
                        </span>
                      )}
                      {producto.aplica_solo_categoria && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Categoría
                        </span>
                      )}
                      {producto.aplica_plan_especial && (
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          Especial
                        </span>
                      )}
                      {!producto.aplica_todos_plan && !producto.aplica_solo_categoria && !producto.aplica_plan_especial && (
                        <span className="text-gray-400 text-xs">Ninguno</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {getAllProductImages(producto).length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleClearImages(producto)}
                          title="Limpiar todas las imágenes"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(producto)}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {currentProductos.map((producto) => (
              <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.descripcion}
                        className="w-full h-full object-cover"
                          loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg'
                        }}
                      />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-gray-400 text-center">
                        <div className="text-2xl mb-2">📷</div>
                        <div className="text-xs">Sin imagen</div>
                      </div>
                    </div>
                  )}
                  {producto.destacado && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        ⭐
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm line-clamp-2 flex-1">
                        {producto.descripcion}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">#{producto.id}</span>
                    </div>
                    
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(producto.precio)}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 text-xs">
                      {producto.categoria && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {producto.categoria.descripcion}
                        </span>
                      )}
                      {producto.marca && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {producto.marca.descripcion}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 text-xs">
                      {producto.aplica_todos_plan && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                          Todos
                        </span>
                      )}
                      {producto.aplica_solo_categoria && (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                          Categoría
                        </span>
                      )}
                      {producto.aplica_plan_especial && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                          Especial
                        </span>
                      )}
                      {!producto.aplica_todos_plan && !producto.aplica_solo_categoria && !producto.aplica_plan_especial && (
                        <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-200">
                          Sin planes
                        </span>
                      )}
                    </div>
                    
                    {producto.descripcion_detallada && (
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {producto.descripcion_detallada}
                      </div>
                    )}
                    
                    <div className="flex gap-1 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(producto)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteClick(producto)}
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

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 text-sm">
              ¿Estás seguro de que quieres eliminar el producto <strong>"{productToDelete?.descripcion}"</strong>?
            </p>
          </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                <span className="font-medium text-yellow-800 text-sm">Atención</span>
              </div>
              <p className="text-yellow-700 text-xs mt-1">
                Esta acción no se puede deshacer. El producto será eliminado permanentemente.
              </p>
            </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleDeleteCancel} size="sm">
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
