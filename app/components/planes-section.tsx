"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { PlanFinanciacion } from "@/lib/supabase"

interface PlanesSectionProps {
  planes: PlanFinanciacion[]
  onCreatePlan: (plan: Omit<PlanFinanciacion, 'id' | 'created_at' | 'updated_at'>) => Promise<PlanFinanciacion | undefined>
  onUpdatePlan: (id: number, updates: Partial<PlanFinanciacion>) => Promise<PlanFinanciacion | undefined>
  onDeletePlan: (id: number) => Promise<void>
}

export function PlanesSection({ planes, onCreatePlan, onUpdatePlan, onDeletePlan }: PlanesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanFinanciacion | null>(null)
  const [editingPlan, setEditingPlan] = useState<PlanFinanciacion | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    cuotas: "",
    recargo_porcentual: "",
    recargo_fijo: "",
    monto_minimo: "",
    monto_maximo: "",
    activo: true,
  })

  const resetForm = () => {
    setFormData({
      nombre: "",
      cuotas: "",
      recargo_porcentual: "",
      recargo_fijo: "",
      monto_minimo: "",
      monto_maximo: "",
      activo: true,
    })
    setEditingPlan(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const planData = {
      nombre: formData.nombre,
      cuotas: Number.parseInt(formData.cuotas),
      recargo_porcentual: Number.parseFloat(formData.recargo_porcentual),
      recargo_fijo: Number.parseFloat(formData.recargo_fijo),
      monto_minimo: Number.parseFloat(formData.monto_minimo),
      monto_maximo: formData.monto_maximo ? Number.parseFloat(formData.monto_maximo) : null,
      activo: formData.activo,
    }

    try {
      if (editingPlan) {
        await onUpdatePlan(editingPlan.id, planData)
      } else {
        await onCreatePlan(planData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error al guardar plan:', error)
    }
  }

  const handleEdit = (plan: PlanFinanciacion) => {
    setEditingPlan(plan)
    setFormData({
      nombre: plan.nombre,
      cuotas: plan.cuotas.toString(),
      recargo_porcentual: plan.recargo_porcentual.toString(),
      recargo_fijo: plan.recargo_fijo.toString(),
      monto_minimo: plan.monto_minimo.toString(),
      monto_maximo: plan.monto_maximo?.toString() || "",
      activo: plan.activo,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (plan: PlanFinanciacion) => {
    setPlanToDelete(plan)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return
    try {
      await onDeletePlan(planToDelete.id)
      setIsDeleteDialogOpen(false)
      setPlanToDelete(null)
    } catch (error) {
      console.error('Error al eliminar plan:', error)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setPlanToDelete(null)
  }

  return (
    <>
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Planes de Financiación</CardTitle>
                                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  if (open) {
                    setIsDialogOpen(true)
                  }
                  // No permitir cerrar con clic fuera o ESC
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
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
                <Label htmlFor="nombre">Nombre del Plan</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cuotas">Número de Cuotas</Label>
                <Input
                  id="cuotas"
                  type="number"
                  value={formData.cuotas}
                  onChange={(e) => setFormData({ ...formData, cuotas: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="recargo_porcentual">Recargo Porcentual (%)</Label>
                <Input
                  id="recargo_porcentual"
                  type="number"
                  step="0.01"
                  value={formData.recargo_porcentual}
                  onChange={(e) => setFormData({ ...formData, recargo_porcentual: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="recargo_fijo">Recargo Fijo ($)</Label>
                <Input
                  id="recargo_fijo"
                  type="number"
                  step="0.01"
                  value={formData.recargo_fijo}
                  onChange={(e) => setFormData({ ...formData, recargo_fijo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="monto_minimo">Monto Mínimo ($)</Label>
                <Input
                  id="monto_minimo"
                  type="number"
                  step="0.01"
                  value={formData.monto_minimo}
                  onChange={(e) => setFormData({ ...formData, monto_minimo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="monto_maximo">Monto Máximo ($) (opcional)</Label>
                <Input
                  id="monto_maximo"
                  type="number"
                  step="0.01"
                  value={formData.monto_maximo}
                  onChange={(e) => setFormData({ ...formData, monto_maximo: e.target.value })}
                />
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
                {editingPlan ? "Actualizar" : "Crear"} Plan
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
              <TableHead>Nombre</TableHead>
              <TableHead>Cuotas</TableHead>
              <TableHead>Recargo %</TableHead>
              <TableHead>Recargo Fijo</TableHead>
              <TableHead>Monto Mín</TableHead>
              <TableHead>Monto Máx</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planes.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.id}</TableCell>
                <TableCell className="font-medium">{plan.nombre}</TableCell>
                <TableCell>{plan.cuotas}</TableCell>
                <TableCell>{plan.recargo_porcentual}%</TableCell>
                <TableCell>${plan.recargo_fijo}</TableCell>
                <TableCell>${plan.monto_minimo}</TableCell>
                <TableCell>{plan.monto_maximo ? `$${plan.monto_maximo}` : '-'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      plan.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {plan.activo ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(plan)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {/* Modal de confirmación de eliminación */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 text-sm">
              ¿Estás seguro de que quieres eliminar el plan <strong>"{planToDelete?.nombre}"</strong>?
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="text-yellow-600 text-lg mr-2">⚠️</span>
              <span className="font-medium text-yellow-800 text-sm">Atención</span>
            </div>
            <p className="text-yellow-700 text-xs mt-1">
              Esta acción no se puede deshacer. El plan será eliminado permanentemente.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleDeleteCancel} size="sm">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDeleteConfirm} size="sm">
            Eliminar
          </Button>
        </div>
      </DialogContent>
         </Dialog>
   </>
  )
}
