"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductSearch } from "./product-search"
import type { Producto, PlanFinanciacion, ProductoPlan } from "@/lib/supabase"

interface ProductosPlanSectionProps {
  productos: Producto[]
  planes: PlanFinanciacion[]
  productosPorPlan: ProductoPlan[]
  onCreateProductoPlan: (productoPlan: Omit<ProductoPlan, 'id' | 'created_at' | 'producto' | 'plan'>) => Promise<ProductoPlan | undefined>
  onUpdateProductoPlan: (id: number, updates: Partial<ProductoPlan>) => Promise<ProductoPlan | undefined>
  onDeleteProductoPlan: (id: number) => Promise<void>
}

export function ProductosPlanSection({
  productos,
  planes,
  productosPorPlan,
  onCreateProductoPlan,
  onUpdateProductoPlan,
  onDeleteProductoPlan,
}: ProductosPlanSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductoPlan | null>(null)
  const [formData, setFormData] = useState({
    productoId: "",
    planId: "",
    activo: true,
  })
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)

  const resetForm = () => {
    setFormData({
      productoId: "",
      planId: "",
      activo: true,
    })
    setSelectedProduct(null)
    setEditingItem(null)
  }

  const calcularFinanciacion = (precio: number, cuotas: number, interes: number) => {
    const tasaMensual = interes / 100 / 12
    const factor = Math.pow(1 + tasaMensual, cuotas)
    const cuotaMensual = (precio * tasaMensual * factor) / (factor - 1)
    const precioFinal = cuotaMensual * cuotas

    return {
      cuotaMensual: Math.round(cuotaMensual),
      precioFinal: Math.round(precioFinal),
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const plan = planes.find((p) => p.id.toString() === formData.planId)

    if (!selectedProduct || !plan) {
      alert("Por favor selecciona un producto y un plan")
      return
    }

    const itemData = {
      fk_id_producto: selectedProduct.id,
      fk_id_plan: Number.parseInt(formData.planId),
      activo: formData.activo,
    }

    try {
      if (editingItem) {
        await onUpdateProductoPlan(editingItem.id, itemData)
      } else {
        await onCreateProductoPlan(itemData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error al guardar producto por plan:', error)
    }
  }

  const handleEdit = (item: ProductoPlan) => {
    const producto = productos.find(p => p.id === item.fk_id_producto)
    setEditingItem(item)
    setSelectedProduct(producto || null)
    setFormData({
      productoId: item.fk_id_producto.toString(),
      planId: item.fk_id_plan.toString(),
      activo: item.activo,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await onDeleteProductoPlan(id)
    } catch (error) {
      console.error('Error al eliminar producto por plan:', error)
    }
  }

  const getProductoNombre = (id: number) => {
    return productos.find((p) => p.id === id)?.descripcion || "Producto no encontrado"
  }

  const getPlanNombre = (id: number) => {
    return planes.find((p) => p.id === id)?.nombre || "Plan no encontrado"
  }

  const calcularCuotaMensual = (precio: number, cuotas: number, recargoPorcentual: number, recargoFijo: number) => {
    const precioConRecargo = precio * (1 + recargoPorcentual / 100) + recargoFijo
    return Math.round(precioConRecargo / cuotas)
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
        <CardTitle>Gestión de Productos por Plan</CardTitle>
                                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  if (open) {
                    setIsDialogOpen(true)
                  }
                  // No permitir cerrar con clic fuera o ESC
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Asociación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Editar Asociación" : "Nueva Asociación"}</DialogTitle>
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
                <Label htmlFor="producto">Producto</Label>
                <ProductSearch
                  productos={productos}
                  onSelect={(producto) => {
                    setSelectedProduct(producto)
                    setFormData({ ...formData, productoId: producto?.id.toString() || "" })
                  }}
                  placeholder="Buscar producto por nombre o ID..."
                  selectedProduct={selectedProduct}
                />
              </div>
              <div>
                <Label htmlFor="plan">Plan de Financiación</Label>
                <Select value={formData.planId} onValueChange={(value) => setFormData({ ...formData, planId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes
                      .filter((p) => p.activo)
                      .map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.nombre} - {plan.cuotas} cuotas ({plan.recargo_porcentual}% + ${plan.recargo_fijo})
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
                />
                <Label htmlFor="activo">Activo</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Actualizar" : "Crear"} Asociación
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
                <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Precio Original</TableHead>
              <TableHead>Cuota Mensual</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosPorPlan.map((item) => {
              const producto = productos.find(p => p.id === item.fk_id_producto)
              const plan = planes.find(p => p.id === item.fk_id_plan)
              const cuotaMensual = plan && producto ? calcularCuotaMensual(producto.precio, plan.cuotas, plan.recargo_porcentual, plan.recargo_fijo) : 0
              
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">{getProductoNombre(item.fk_id_producto)}</TableCell>
                  <TableCell>{getPlanNombre(item.fk_id_plan)}</TableCell>
                  <TableCell>{producto ? formatPrice(producto.precio) : '-'}</TableCell>
                  <TableCell>{formatPrice(cuotaMensual)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
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
  )
}
