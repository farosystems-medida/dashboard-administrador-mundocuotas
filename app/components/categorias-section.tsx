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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Categoria, Linea } from "@/lib/supabase"

interface CategoriasSectionProps {
  categorias: Categoria[]
  lineas: Linea[]
  onCreateCategoria: (categoria: Omit<Categoria, 'id' | 'created_at'>) => Promise<Categoria | undefined>
  onUpdateCategoria: (id: number, updates: Partial<Categoria>) => Promise<Categoria | undefined>
  onDeleteCategoria: (id: number) => Promise<void>
}

export function CategoriasSection({ categorias, lineas, onCreateCategoria, onUpdateCategoria, onDeleteCategoria }: CategoriasSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [formData, setFormData] = useState({
    descripcion: "",
    fk_id_linea: undefined as number | undefined,
    imagen_url: "",
  })

  const resetForm = () => {
    setFormData({
      descripcion: "",
      fk_id_linea: undefined,
      imagen_url: "",
    })
    setEditingCategoria(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const categoriaData = {
      descripcion: formData.descripcion,
      fk_id_linea: formData.fk_id_linea,
      imagen_url: formData.imagen_url || undefined,
    }

    try {
      if (editingCategoria) {
        await onUpdateCategoria(editingCategoria.id, categoriaData)
      } else {
        await onCreateCategoria(categoriaData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error al guardar categoría:', error)
    }
  }

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setFormData({
      descripcion: categoria.descripcion,
      fk_id_linea: categoria.fk_id_linea,
      imagen_url: categoria.imagen_url || "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (categoria: Categoria) => {
    setCategoriaToDelete(categoria)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoriaToDelete) return
    try {
      await onDeleteCategoria(categoriaToDelete.id)
      setIsDeleteDialogOpen(false)
      setCategoriaToDelete(null)
    } catch (error) {
      console.error('Error al eliminar categoría:', error)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setCategoriaToDelete(null)
  }

  return (
    <>
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Categorías</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open) {
            setIsDialogOpen(true)
          }
          // No permitir cerrar con clic fuera o ESC
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
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
                <Label htmlFor="linea">Línea (Opcional)</Label>
                <Select
                  value={formData.fk_id_linea?.toString() || "none"}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    fk_id_linea: value === "none" ? undefined : parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar línea..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin línea</SelectItem>
                    {lineas.map((linea) => (
                      <SelectItem key={linea.id} value={linea.id.toString()}>
                        {linea.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="imagen_url">URL de Imagen (Opcional)</Label>
                <Input
                  id="imagen_url"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCategoria ? "Actualizar" : "Crear"} Categoría
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
              <TableHead>Imagen</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Línea</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell>{categoria.id}</TableCell>
                <TableCell>
                  {categoria.imagen_url ? (
                    <img
                      src={categoria.imagen_url}
                      alt={categoria.descripcion}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{categoria.descripcion}</TableCell>
                <TableCell>{categoria.linea?.descripcion || "Sin línea"}</TableCell>
                <TableCell>{new Date(categoria.created_at).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(categoria)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(categoria)}>
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
              ¿Estás seguro de que quieres eliminar la categoría <strong>"{categoriaToDelete?.descripcion}"</strong>?
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="text-yellow-600 text-lg mr-2">⚠️</span>
              <span className="font-medium text-yellow-800 text-sm">Atención</span>
            </div>
            <p className="text-yellow-700 text-xs mt-1">
              Esta acción no se puede deshacer. La categoría será eliminada permanentemente.
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