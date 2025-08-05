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
import type { Marca } from "@/lib/supabase"

interface MarcasSectionProps {
  marcas: Marca[]
  onCreateMarca: (marca: Omit<Marca, 'id' | 'created_at'>) => Promise<Marca | undefined>
  onUpdateMarca: (id: number, updates: Partial<Marca>) => Promise<Marca | undefined>
  onDeleteMarca: (id: number) => Promise<void>
}

export function MarcasSection({ marcas, onCreateMarca, onUpdateMarca, onDeleteMarca }: MarcasSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null)
  const [formData, setFormData] = useState({
    descripcion: "",
  })

  const resetForm = () => {
    setFormData({
      descripcion: "",
    })
    setEditingMarca(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const marcaData = {
      descripcion: formData.descripcion,
    }

    try {
      if (editingMarca) {
        await onUpdateMarca(editingMarca.id, marcaData)
      } else {
        await onCreateMarca(marcaData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error al guardar marca:', error)
    }
  }

  const handleEdit = (marca: Marca) => {
    setEditingMarca(marca)
    setFormData({
      descripcion: marca.descripcion,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await onDeleteMarca(id)
    } catch (error) {
      console.error('Error al eliminar marca:', error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Marcas</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open) {
            setIsDialogOpen(true)
          }
          // No permitir cerrar con clic fuera o ESC
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Marca
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{editingMarca ? "Editar Marca" : "Nueva Marca"}</DialogTitle>
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
              <Button type="submit" className="w-full">
                {editingMarca ? "Actualizar" : "Crear"} Marca
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
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marcas.map((marca) => (
              <TableRow key={marca.id}>
                <TableCell>{marca.id}</TableCell>
                <TableCell className="font-medium">{marca.descripcion}</TableCell>
                <TableCell>{new Date(marca.created_at).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(marca)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(marca.id)}>
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
  )
} 