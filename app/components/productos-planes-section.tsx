import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ProductoPlanDefault, Producto, PlanFinanciacion, Combo, Categoria } from "@/lib/supabase"

interface ProductosPlanesSectionProps {
  productosPlanesDefault: ProductoPlanDefault[]
  productos: Producto[]
  planes: PlanFinanciacion[]
  categorias: Categoria[]
  onCreateProductoPlanDefault: (productoPlanDefault: Omit<ProductoPlanDefault, 'id' | 'created_at'>) => Promise<void>
  onUpdateProductoPlanDefault: (id: number, productoPlanDefault: Partial<ProductoPlanDefault>) => Promise<void>
  onDeleteProductoPlanDefault: (id: number) => Promise<void>
}

export const ProductosPlanesSection = React.memo(({
  productosPlanesDefault,
  productos,
  planes,
  categorias,
  onCreateProductoPlanDefault,
  onUpdateProductoPlanDefault,
  onDeleteProductoPlanDefault
}: ProductosPlanesSectionProps) => {
  const [combos, setCombos] = useState<Combo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProductoPlanDefault, setEditingProductoPlanDefault] = useState<ProductoPlanDefault | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productoPlanDefaultToDelete, setProductoPlanDefaultToDelete] = useState<ProductoPlanDefault | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProducto, setFilterProducto] = useState("all")
  const [filterPlan, setFilterPlan] = useState("all")
  const [filterActivo, setFilterActivo] = useState<string>("all")
  const [filterCategoria, setFilterCategoria] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const [formData, setFormData] = useState({
    tipo_asociacion: "producto" as "producto" | "combo",
    fk_id_producto: undefined as string | undefined,
    fk_id_combo: undefined as string | undefined,
    fk_id_plan: undefined as string | undefined,
    activo: true
  })

  // Estados para búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [showProductSuggestions, setShowProductSuggestions] = useState(false)
  const [selectedProductName, setSelectedProductName] = useState("")

  // Cargar combos al montar el componente
  useEffect(() => {
    const loadCombos = async () => {
      try {
        const { data, error } = await supabase
          .from('combos')
          .select('id, nombre, activo')
          .eq('activo', true)
          .order('nombre', { ascending: true })

        if (error) throw error
        setCombos(data || [])
      } catch (error) {
        console.error('Error loading combos:', error)
      }
    }

    loadCombos()
  }, [])

  const resetForm = () => {
    setFormData({
      tipo_asociacion: "producto",
      fk_id_producto: undefined,
      fk_id_combo: undefined,
      fk_id_plan: undefined,
      activo: true
    })
    setProductSearchTerm("")
    setSelectedProductName("")
    setShowProductSuggestions(false)
    setEditingProductoPlanDefault(null)
  }

  const handleEdit = (productoPlanDefault: ProductoPlanDefault) => {
    setEditingProductoPlanDefault(productoPlanDefault)

    // Si es un producto, buscar el nombre para mostrarlo
    let productoNombre = ""
    if (productoPlanDefault.fk_id_producto) {
      const producto = productos.find(p => p.id === productoPlanDefault.fk_id_producto)
      productoNombre = producto?.descripcion || ""
    }

    setFormData({
      tipo_asociacion: productoPlanDefault.fk_id_combo ? "combo" : "producto",
      fk_id_producto: productoPlanDefault.fk_id_producto?.toString(),
      fk_id_combo: productoPlanDefault.fk_id_combo?.toString(),
      fk_id_plan: productoPlanDefault.fk_id_plan.toString(),
      activo: productoPlanDefault.activo
    })

    setSelectedProductName(productoNombre)
    setProductSearchTerm(productoNombre)
    setShowProductSuggestions(false)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que se haya seleccionado plan y producto o combo
    const hasProducto = formData.tipo_asociacion === "producto" && formData.fk_id_producto
    const hasCombo = formData.tipo_asociacion === "combo" && formData.fk_id_combo

    if (!formData.fk_id_plan || (!hasProducto && !hasCombo)) {
      console.error("Debe seleccionar un plan y un producto o combo")
      return
    }

    setIsCreating(true)

    try {
      const productoPlanDefaultData: any = {
        fk_id_plan: parseInt(formData.fk_id_plan),
        activo: formData.activo
      }

      if (formData.tipo_asociacion === "producto" && formData.fk_id_producto) {
        productoPlanDefaultData.fk_id_producto = parseInt(formData.fk_id_producto)
        productoPlanDefaultData.fk_id_combo = undefined
      } else if (formData.tipo_asociacion === "combo" && formData.fk_id_combo) {
        productoPlanDefaultData.fk_id_combo = parseInt(formData.fk_id_combo)
        productoPlanDefaultData.fk_id_producto = undefined
      }

      if (editingProductoPlanDefault) {
        await onUpdateProductoPlanDefault(editingProductoPlanDefault.id, productoPlanDefaultData)
      } else {
        await onCreateProductoPlanDefault(productoPlanDefaultData)
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar asociación:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteClick = (productoPlanDefault: ProductoPlanDefault) => {
    setProductoPlanDefaultToDelete(productoPlanDefault)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (productoPlanDefaultToDelete) {
      await onDeleteProductoPlanDefault(productoPlanDefaultToDelete.id)
      setIsDeleteDialogOpen(false)
      setProductoPlanDefaultToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setProductoPlanDefaultToDelete(null)
  }

  // Filtrar y ordenar datos
  const filteredAndSortedData = productosPlanesDefault
    .filter(item => {
      const producto = productos.find(p => p.id === item.fk_id_producto)
      const combo = combos.find(c => c.id === item.fk_id_combo)
      const plan = planes.find(pl => pl.id === item.fk_id_plan)

      const matchesSearch = searchTerm === "" ||
        producto?.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        combo?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan?.nombre.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesProducto = filterProducto === "all" || item.fk_id_producto?.toString() === filterProducto
      const matchesPlan = filterPlan === "all" || item.fk_id_plan.toString() === filterPlan
      const matchesActivo = filterActivo === "all" ||
        (filterActivo === "active" && item.activo) ||
        (filterActivo === "inactive" && !item.activo)

      // Filtro por categoría - solo aplica a productos, no a combos
      const matchesCategoria = filterCategoria === "all" ||
        (item.fk_id_producto && producto?.fk_id_categoria?.toString() === filterCategoria)

      return matchesSearch && matchesProducto && matchesPlan && matchesActivo && matchesCategoria
    })
    .sort((a, b) => {
      // Ordenar alfabéticamente por producto/combo
      const productoA = productos.find(p => p.id === a.fk_id_producto)
      const comboA = combos.find(c => c.id === a.fk_id_combo)
      const productoB = productos.find(p => p.id === b.fk_id_producto)
      const comboB = combos.find(c => c.id === b.fk_id_combo)

      const nameA = productoA?.descripcion || comboA?.nombre || ""
      const nameB = productoB?.descripcion || comboB?.nombre || ""

      return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
    })

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Resetear página cuando cambie el filtrado
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterProducto, filterPlan, filterActivo, filterCategoria])

  // Cerrar sugerencias al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProductSuggestions) {
        const target = event.target as Element
        if (!target.closest('.relative')) {
          setShowProductSuggestions(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProductSuggestions])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Productos por Planes</CardTitle>
                     <Dialog open={isDialogOpen} onOpenChange={(open) => {
             if (!open) {
               setIsDialogOpen(false)
               resetForm()
             } else {
               setIsDialogOpen(true)
             }
           }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Asociación
              </Button>
            </DialogTrigger>
                         <DialogContent className="max-w-md">
               <DialogHeader>
                 <DialogTitle>
                   {editingProductoPlanDefault ? "Editar Asociación" : "Nueva Asociación"}
                 </DialogTitle>
               </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Tipo de Asociación</Label>
                  <Select
                    value={formData.tipo_asociacion}
                    onValueChange={(value: "producto" | "combo") => {
                      setFormData({
                        ...formData,
                        tipo_asociacion: value,
                        fk_id_producto: undefined,
                        fk_id_combo: undefined
                      })
                      // Limpiar búsqueda de productos al cambiar tipo
                      setProductSearchTerm("")
                      setSelectedProductName("")
                      setShowProductSuggestions(false)
                    }}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="producto">Producto</SelectItem>
                      <SelectItem value="combo">Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_asociacion === "producto" && (
                  <div className="relative">
                    <Label htmlFor="producto">Producto</Label>
                    <Input
                      id="producto"
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value
                        setProductSearchTerm(value)
                        setShowProductSuggestions(value.length > 0)

                        // Si el valor está vacío, limpiar la selección
                        if (!value) {
                          setFormData({ ...formData, fk_id_producto: undefined })
                          setSelectedProductName("")
                        }
                      }}
                      onFocus={() => {
                        if (productSearchTerm.length > 0) {
                          setShowProductSuggestions(true)
                        }
                      }}
                      placeholder="Buscar producto..."
                      disabled={isCreating}
                      className="w-full"
                    />

                    {/* Sugerencias de productos */}
                    {showProductSuggestions && productSearchTerm.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {productos
                          .filter(producto =>
                            producto.descripcion.toLowerCase().includes(productSearchTerm.toLowerCase())
                          )
                          .slice(0, 10) // Limitar a 10 resultados
                          .map((producto) => (
                            <div
                              key={producto.id}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              onClick={() => {
                                setFormData({ ...formData, fk_id_producto: producto.id.toString() })
                                setSelectedProductName(producto.descripcion)
                                setProductSearchTerm(producto.descripcion)
                                setShowProductSuggestions(false)
                              }}
                            >
                              {producto.descripcion}
                            </div>
                          ))}
                        {productos.filter(producto =>
                          producto.descripcion.toLowerCase().includes(productSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No se encontraron productos
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {formData.tipo_asociacion === "combo" && (
                  <div>
                    <Label htmlFor="combo">Combo</Label>
                    <Select
                      value={formData.fk_id_combo}
                      onValueChange={(value) => setFormData({ ...formData, fk_id_combo: value })}
                      disabled={isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar combo" />
                      </SelectTrigger>
                      <SelectContent>
                        {combos.map((combo) => (
                          <SelectItem key={combo.id} value={combo.id.toString()}>
                            {combo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={formData.fk_id_plan}
                    onValueChange={(value) => setFormData({ ...formData, fk_id_plan: value })}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planes.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Guardando..." : editingProductoPlanDefault ? "Actualizar" : "Crear"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por producto o plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={filterProducto} onValueChange={setFilterProducto}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                    {productos.map((producto) => (
                      <SelectItem key={producto.id} value={producto.id.toString()}>
                        {producto.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los planes</SelectItem>
                    {planes.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por categoría" />
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
              </div>
              <div className="flex items-center space-x-2">
                <Select value={filterActivo} onValueChange={setFilterActivo}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Producto/Combo</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((item) => {
                const producto = productos.find(p => p.id === item.fk_id_producto)
                const combo = combos.find(c => c.id === item.fk_id_combo)
                const plan = planes.find(pl => pl.id === item.fk_id_plan)
                const isCombo = item.fk_id_combo !== null && item.fk_id_combo !== undefined

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {isCombo ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Combo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Producto
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {isCombo
                        ? combo?.nombre || `Combo ${item.fk_id_combo}`
                        : producto?.descripcion || `Producto ${item.fk_id_producto}`}
                    </TableCell>
                    <TableCell>{plan?.nombre || `Plan ${item.fk_id_plan}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={item.activo}
                          onCheckedChange={(checked) => {
                            onUpdateProductoPlanDefault(item.id, { activo: checked })
                          }}
                        />
                        <span className="text-sm text-gray-600">
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSortedData.length)} de {filteredAndSortedData.length} asociaciones
                  {(searchTerm || filterProducto !== "all" || filterPlan !== "all" || filterActivo !== "all" || filterCategoria !== "all") &&
                    ` (filtradas de ${productosPlanesDefault.length} total)`}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
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
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-700 text-sm">
                ¿Estás seguro de que quieres eliminar esta asociación?
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                <span className="font-medium text-yellow-800 text-sm">Atención</span>
              </div>
              <p className="text-yellow-700 text-xs mt-1">
                Esta acción no se puede deshacer. La asociación será eliminada permanentemente.
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
