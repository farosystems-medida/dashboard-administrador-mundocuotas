"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Grid, List, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductSearch } from "./product-search"
import { ExcelGenerator } from "./excel-generator"
import { PriceUpdater } from "./price-updater"
import { openWhatsApp } from "@/lib/whatsapp-utils"
import type { Producto, Categoria, Marca } from "@/lib/supabase"

interface ProductosSectionProps {
  productos: Producto[]
  categorias: Categoria[]
  marcas: Marca[]
  productosPorPlan: any[]
  configuracion: any
  onCreateProducto: (producto: Omit<Producto, 'id' | 'created_at' | 'categoria' | 'marca'>) => Promise<Producto | undefined>
  onUpdateProducto: (id: number, updates: Partial<Producto>) => Promise<Producto | undefined>
  onDeleteProducto: (id: number) => Promise<void>
  getPlanesAsociados: (productoId: number) => Promise<any[]>
}

export function ProductosSection({ productos, categorias, marcas, productosPorPlan, configuracion, onCreateProducto, onUpdateProducto, onDeleteProducto, getPlanesAsociados }: ProductosSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null)
  const [planesAsociados, setPlanesAsociados] = useState<any[]>([])
  const [isLoadingPlanes, setIsLoadingPlanes] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    descripcion: "",
    descripcion_detallada: "",
    precio: "",
    imagen: "",
    imagen_2: "",
    imagen_3: "",
    imagen_4: "",
    imagen_5: "",
    destacado: false,
    fk_id_categoria: "none",
    fk_id_marca: "none",
  })

  const resetForm = () => {
    setFormData({
      descripcion: "",
      descripcion_detallada: "",
      precio: "",
      imagen: "",
      imagen_2: "",
      imagen_3: "",
      imagen_4: "",
      imagen_5: "",
      destacado: false,
      fk_id_categoria: "none",
      fk_id_marca: "none",
    })
    setEditingProduct(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const productoData = {
      descripcion: formData.descripcion,
      descripcion_detallada: formData.descripcion_detallada || null,
      precio: Number.parseFloat(formData.precio),
      imagen: formData.imagen || null,
      imagen_2: formData.imagen_2 || null,
      imagen_3: formData.imagen_3 || null,
      imagen_4: formData.imagen_4 || null,
      imagen_5: formData.imagen_5 || null,
      destacado: formData.destacado,
      fk_id_categoria: formData.fk_id_categoria && formData.fk_id_categoria !== "none" ? Number.parseInt(formData.fk_id_categoria) : null,
      fk_id_marca: formData.fk_id_marca && formData.fk_id_marca !== "none" ? Number.parseInt(formData.fk_id_marca) : null,
    }

    try {
      console.log('Submitting producto data:', productoData)
      
      if (editingProduct) {
        await onUpdateProducto(editingProduct.id, productoData)
      } else {
        setIsCreating(true)
        await onCreateProducto(productoData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error al guardar producto:', errorMessage)
      alert(`Error al guardar producto: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({
      descripcion: producto.descripcion,
      descripcion_detallada: producto.descripcion_detallada || "",
      precio: producto.precio.toString(),
      imagen: producto.imagen || "",
      imagen_2: producto.imagen_2 || "",
      imagen_3: producto.imagen_3 || "",
      imagen_4: producto.imagen_4 || "",
      imagen_5: producto.imagen_5 || "",
      destacado: producto.destacado || false,
      fk_id_categoria: producto.fk_id_categoria?.toString() || "none",
      fk_id_marca: producto.fk_id_marca?.toString() || "none",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = async (producto: Producto) => {
    setProductToDelete(producto)
    setIsLoadingPlanes(true)
    
    try {
      // Usar datos ya cargados en lugar de hacer nueva consulta
      const planesAsociados = productosPorPlan.filter(item => item.fk_id_producto === producto.id)
      console.log('Planes asociados encontrados:', planesAsociados)
      setPlanesAsociados(planesAsociados)
    } catch (error) {
      console.error('Error al obtener planes asociados:', error)
      setPlanesAsociados([])
    } finally {
      setIsLoadingPlanes(false)
    }
    
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    
    try {
      await onDeleteProducto(productToDelete.id)
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      setPlanesAsociados([])
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar producto. Verifica que no esté asociado a ningún plan de financiación.')
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setProductToDelete(null)
    setPlanesAsociados([])
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Productos</CardTitle>
        <div className="flex items-center space-x-2">
          {/* Botón de cambio de vista */}
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
                                              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    if (open) {
                      setIsDialogOpen(true)
                    }
                    // No permitir cerrar con clic fuera o ESC
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Producto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" showCloseButton={false}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                          <Label htmlFor="descripcion_detallada">Descripción Detallada (opcional)</Label>
                          <Textarea
                            id="descripcion_detallada"
                            value={formData.descripcion_detallada}
                            onChange={(e) => setFormData({ ...formData, descripcion_detallada: e.target.value })}
                            className="max-h-32 overflow-y-auto resize-none"
                            placeholder="Escribe la descripción detallada del producto..."
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
              <div>
                <Label htmlFor="imagen">URL de Imagen Principal (opcional)</Label>
                <Input
                  id="imagen"
                  type="url"
                  value={formData.imagen}
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="imagen_2">URL de Imagen 2 (opcional)</Label>
                <Input
                  id="imagen_2"
                  type="url"
                  value={formData.imagen_2}
                  onChange={(e) => setFormData({ ...formData, imagen_2: e.target.value })}
                  placeholder="https://ejemplo.com/imagen2.jpg"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="imagen_3">URL de Imagen 3 (opcional)</Label>
                <Input
                  id="imagen_3"
                  type="url"
                  value={formData.imagen_3}
                  onChange={(e) => setFormData({ ...formData, imagen_3: e.target.value })}
                  placeholder="https://ejemplo.com/imagen3.jpg"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="imagen_4">URL de Imagen 4 (opcional)</Label>
                <Input
                  id="imagen_4"
                  type="url"
                  value={formData.imagen_4}
                  onChange={(e) => setFormData({ ...formData, imagen_4: e.target.value })}
                  placeholder="https://ejemplo.com/imagen4.jpg"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="imagen_5">URL de Imagen 5 (opcional)</Label>
                <Input
                  id="imagen_5"
                  type="url"
                  value={formData.imagen_5}
                  onChange={(e) => setFormData({ ...formData, imagen_5: e.target.value })}
                  placeholder="https://ejemplo.com/imagen5.jpg"
                  disabled={isCreating}
                />
              </div>
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
                    <SelectItem value="none">Sin categoría</SelectItem>
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
                    <SelectItem value="none">Sin marca</SelectItem>
                    {marcas.map((marca) => (
                      <SelectItem key={marca.id} value={marca.id.toString()}>
                        {marca.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="destacado"
                  checked={formData.destacado}
                  onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  disabled={isCreating}
                />
                <Label htmlFor="destacado">Destacado</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creando..." : editingProduct ? "Actualizar" : "Crear"} Producto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Descripción Detallada</TableHead>
                <TableHead>Imágenes</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Destacado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>{producto.id}</TableCell>
                  <TableCell className="font-medium">{producto.descripcion}</TableCell>
                  <TableCell>
                    {producto.descripcion_detallada ? (
                      <div 
                        className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onDoubleClick={() => {
                          const modal = document.createElement('div')
                          modal.className = 'fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out'
                          modal.style.opacity = '0'
                          modal.innerHTML = `
                            <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/20 transform transition-all duration-300 ease-out scale-95" style="opacity: 0; transform: scale(0.95) translateY(20px);">
                              <div class="flex justify-between items-center p-6 border-b border-gray-100">
                                <div class="flex items-center gap-3">
                                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <h3 class="text-lg font-semibold text-gray-800">Descripción Detallada</h3>
                                </div>
                                <button onclick="closeModal(this)" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group">
                                  <svg class="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                              <div class="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                                <div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 bg-gray-50/50 p-4 rounded-lg border border-gray-100">${producto.descripcion_detallada}</div>
                              </div>
                            </div>
                          `
                          
                          // Función para cerrar el modal con animación
                          window.closeModal = function(button) {
                            const modal = button.closest('.fixed')
                            const content = modal.querySelector('div > div')
                            
                            content.style.transform = 'scale(0.95) translateY(20px)'
                            content.style.opacity = '0'
                            modal.style.opacity = '0'
                            
                            setTimeout(() => {
                              modal.remove()
                            }, 300)
                          }
                          
                          document.body.appendChild(modal)
                          
                          // Animar entrada
                          setTimeout(() => {
                            modal.style.opacity = '1'
                            const content = modal.querySelector('div > div')
                            content.style.opacity = '1'
                            content.style.transform = 'scale(1) translateY(0)'
                          }, 10)
                          
                          // Cerrar al hacer clic fuera del modal
                          modal.addEventListener('click', (e) => {
                            if (e.target === modal) {
                              window.closeModal(e.target.querySelector('button'))
                            }
                          })
                          
                          // Cerrar con ESC
                          const handleEsc = (e) => {
                            if (e.key === 'Escape') {
                              const button = modal.querySelector('button')
                              window.closeModal(button)
                              document.removeEventListener('keydown', handleEsc)
                            }
                          }
                          document.addEventListener('keydown', handleEsc)
                        }}
                        title="Doble clic para ver completo"
                      >
                        <div className="text-sm text-gray-600">
                          {producto.descripcion_detallada.length > 50 
                            ? `${producto.descripcion_detallada.substring(0, 50)}...` 
                            : producto.descripcion_detallada
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin descripción detallada</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {[producto.imagen, producto.imagen_2, producto.imagen_3, producto.imagen_4, producto.imagen_5]
                        .filter(img => img)
                        .map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`${producto.descripcion} - Imagen ${index + 1}`}
                              className="w-8 h-8 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.jpg'
                              }}
                              onClick={() => {
                                const modal = document.createElement('div')
                                modal.className = 'fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4'
                                modal.innerHTML = `
                                  <div class="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
                                    <div class="flex justify-between items-center p-4 border-b">
                                      <h3 class="text-lg font-semibold">${producto.descripcion} - Imagen ${index + 1}</h3>
                                      <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
                                    </div>
                                    <div class="p-4">
                                      <img src="${img}" alt="${producto.descripcion}" class="max-w-full max-h-[70vh] object-contain mx-auto">
                                    </div>
                                  </div>
                                `
                                document.body.appendChild(modal)
                                modal.addEventListener('click', (e) => {
                                  if (e.target === modal) modal.remove()
                                })
                              }}
                            />
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      {![producto.imagen, producto.imagen_2, producto.imagen_3, producto.imagen_4, producto.imagen_5].some(img => img) && (
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
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openWhatsApp(producto.descripcion, configuracion)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(producto)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          // Vista de cuadrícula
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productos.map((producto) => (
              <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {producto.imagen ? (
                    <div className="relative w-full h-full">
                      <img
                        src={producto.imagen}
                        alt={producto.descripcion}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg'
                        }}
                      />
                      {/* Indicador de múltiples imágenes */}
                      {[producto.imagen_2, producto.imagen_3, producto.imagen_4, producto.imagen_5].some(img => img) && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          +{[producto.imagen_2, producto.imagen_3, producto.imagen_4, producto.imagen_5].filter(img => img).length}
                        </div>
                      )}
                      {/* Galería de imágenes en hover */}
                      {[producto.imagen_2, producto.imagen_3, producto.imagen_4, producto.imagen_5].some(img => img) && (
                        <div className="absolute inset-0 bg-black/80 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-lg font-semibold mb-2">Galería de Imágenes</div>
                            <div className="flex gap-2 justify-center">
                              {[producto.imagen, producto.imagen_2, producto.imagen_3, producto.imagen_4, producto.imagen_5]
                                .filter(img => img)
                                .map((img, index) => (
                                  <div key={index} className="w-12 h-12 border-2 border-white rounded overflow-hidden">
                                    <img
                                      src={img}
                                      alt={`${producto.descripcion} - Imagen ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = '/placeholder.jpg'
                                      }}
                                    />
                                  </div>
                                ))}
                            </div>
                            <div className="text-sm mt-2">Haz clic para ver en grande</div>
                          </div>
                        </div>
                      )}
                    </div>
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
                        onClick={() => openWhatsApp(producto.descripcion, configuracion)}
                        className="flex-1 text-xs text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
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
        )}
      </CardContent>
    </Card>

    {/* Popup de confirmación de eliminación */}
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

          {isLoadingPlanes ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Verificando planes asociados...</span>
            </div>
          ) : planesAsociados.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-red-600 text-lg mr-2">⚠️</span>
                <span className="font-medium text-red-800 text-sm">No se puede eliminar</span>
              </div>
              <p className="text-red-700 text-xs mb-3">
                Este producto está asociado a los siguientes planes de financiación:
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {planesAsociados.map((item, index) => (
                  <div key={index} className="bg-white border border-red-200 rounded p-2">
                    <div className="font-medium text-xs">
                      {item.plan?.nombre || `Plan ID: ${item.fk_id_plan}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      Cuotas: {item.plan?.cuotas || 'N/A'} • Interés: {item.plan?.recargo_porcentual || 'N/A'}%
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-red-700 text-xs mt-3">
                Primero debes eliminar estas asociaciones en la sección "Productos por Plan".
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                <span className="font-medium text-yellow-800 text-sm">Atención</span>
              </div>
              <p className="text-yellow-700 text-xs mt-1">
                Esta acción no se puede deshacer. El producto será eliminado permanentemente.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleDeleteCancel} size="sm">
            Cancelar
          </Button>
          {planesAsociados.length === 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isLoadingPlanes}
              size="sm"
            >
              Eliminar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
