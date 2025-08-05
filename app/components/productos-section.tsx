"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Grid, List } from "lucide-react"
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
import type { Producto, Categoria, Marca } from "@/lib/supabase"

interface ProductosSectionProps {
  productos: Producto[]
  categorias: Categoria[]
  marcas: Marca[]
  onCreateProducto: (producto: Omit<Producto, 'id' | 'created_at' | 'categoria' | 'marca'>) => Promise<Producto | undefined>
  onUpdateProducto: (id: number, updates: Partial<Producto>) => Promise<Producto | undefined>
  onDeleteProducto: (id: number) => Promise<void>
}

export function ProductosSection({ productos, categorias, marcas, onCreateProducto, onUpdateProducto, onDeleteProducto }: ProductosSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [formData, setFormData] = useState({
    descripcion: "",
    descripcion_detallada: "",
    precio: "",
    imagen: "",
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
      destacado: formData.destacado,
      fk_id_categoria: formData.fk_id_categoria && formData.fk_id_categoria !== "none" ? Number.parseInt(formData.fk_id_categoria) : null,
      fk_id_marca: formData.fk_id_marca && formData.fk_id_marca !== "none" ? Number.parseInt(formData.fk_id_marca) : null,
    }

    try {
      console.log('Submitting producto data:', productoData)
      
      if (editingProduct) {
        await onUpdateProducto(editingProduct.id, productoData)
      } else {
        await onCreateProducto(productoData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error al guardar producto:', errorMessage)
      alert(`Error al guardar producto: ${errorMessage}`)
    }
  }

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({
      descripcion: producto.descripcion,
      descripcion_detallada: producto.descripcion_detallada || "",
      precio: producto.precio.toString(),
      imagen: producto.imagen || "",
      destacado: producto.destacado || false,
      fk_id_categoria: producto.fk_id_categoria?.toString() || "none",
      fk_id_marca: producto.fk_id_marca?.toString() || "none",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await onDeleteProducto(id)
    } catch (error) {
      console.error('Error al eliminar producto:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price)
  }

  return (
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
                />
              </div>
              <div>
                <Label htmlFor="imagen">URL de Imagen (opcional)</Label>
                <Input
                  id="imagen"
                  type="url"
                  value={formData.imagen}
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.fk_id_categoria}
                  onValueChange={(value) => setFormData({ ...formData, fk_id_categoria: value })}
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
                />
                <Label htmlFor="destacado">Destacado</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? "Actualizar" : "Crear"} Producto
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
                      <Button variant="outline" size="sm" onClick={() => handleDelete(producto.id)}>
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
                    <img
                      src={producto.imagen}
                      alt={producto.descripcion}
                      className="w-full h-full object-cover"
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
                        onClick={() => handleDelete(producto.id)}
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
  )
}
