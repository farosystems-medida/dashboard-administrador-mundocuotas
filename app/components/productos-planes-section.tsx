import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ProductoPlanDefault, Producto, PlanFinanciacion, Combo } from "@/lib/supabase"

interface ProductosPlanesSectionProps {
  productosPlanesDefault: ProductoPlanDefault[]
  productos: Producto[]
  planes: PlanFinanciacion[]
  onCreateProductoPlanDefault: (productoPlanDefault: Omit<ProductoPlanDefault, 'id' | 'created_at'>) => Promise<void>
  onUpdateProductoPlanDefault: (id: number, productoPlanDefault: Partial<ProductoPlanDefault>) => Promise<void>
  onDeleteProductoPlanDefault: (id: number) => Promise<void>
}

export const ProductosPlanesSection = React.memo(({
  productosPlanesDefault,
  productos,
  planes,
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

  const [formData, setFormData] = useState({
    tipo_asociacion: "producto" as "producto" | "combo",
    fk_id_producto: undefined as string | undefined,
    fk_id_combo: undefined as string | undefined,
    fk_id_plan: undefined as string | undefined,
    activo: true
  })

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
    setEditingProductoPlanDefault(null)
  }

  const handleEdit = (productoPlanDefault: ProductoPlanDefault) => {
    setEditingProductoPlanDefault(productoPlanDefault)
    setFormData({
      tipo_asociacion: productoPlanDefault.fk_id_combo ? "combo" : "producto",
      fk_id_producto: productoPlanDefault.fk_id_producto?.toString(),
      fk_id_combo: productoPlanDefault.fk_id_combo?.toString(),
      fk_id_plan: productoPlanDefault.fk_id_plan.toString(),
      activo: productoPlanDefault.activo
    })
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

  // Filtrar datos
  const filteredData = productosPlanesDefault.filter(item => {
    const producto = productos.find(p => p.id === item.fk_id_producto)
    const plan = planes.find(pl => pl.id === item.fk_id_plan)
    
    const matchesSearch = searchTerm === "" || 
      producto?.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProducto = filterProducto === "all" || item.fk_id_producto.toString() === filterProducto
    const matchesPlan = filterPlan === "all" || item.fk_id_plan.toString() === filterPlan
    const matchesActivo = filterActivo === "all" || 
      (filterActivo === "active" && item.activo) ||
      (filterActivo === "inactive" && !item.activo)

    return matchesSearch && matchesProducto && matchesPlan && matchesActivo
  })

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
                  <div>
                    <Label htmlFor="producto">Producto</Label>
                    <Select
                      value={formData.fk_id_producto}
                      onValueChange={(value) => setFormData({ ...formData, fk_id_producto: value })}
                      disabled={isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((producto) => (
                          <SelectItem key={producto.id} value={producto.id.toString()}>
                            {producto.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {filteredData.map((item) => {
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
