"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Link, Percent, Upload } from "lucide-react"
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
import { Promocion, Producto } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"

type ImageField = "imagen" | "imagen_mobile" | "imagen_banner"

interface PromocionesSectionProps {
  productos: Producto[]
}

export const PromocionesSection = React.memo(({ productos }: PromocionesSectionProps) => {
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromocion, setEditingPromocion] = useState<Promocion | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [promocionToDelete, setPromocionToDelete] = useState<Promocion | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("all")
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [showProductSuggestions, setShowProductSuggestions] = useState(false)
  const [uploadingField, setUploadingField] = useState<null | ImageField>(null)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    slug: "",
    imagen: "",
    imagen_mobile: "",
    imagen_banner: "",
    fecha_vigencia_inicio: "",
    fecha_vigencia_fin: "",
    activo: true,
  })

  // selectedItems: lista de productos en la promo con descuento opcional
  const [selectedItems, setSelectedItems] = useState<{ id: number; descuento_porcentaje: string }[]>([])

  useEffect(() => { loadPromociones() }, [])

  const loadPromociones = async () => {
    try {
      const { data, error } = await supabase
        .from("promociones")
        .select(`
          *,
          items:promociones_items(
            id,
            fk_id_producto,
            descuento_porcentaje,
            precio_promocional,
            producto:productos(*)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPromociones(data || [])
    } catch (error) {
      console.error("Error loading promociones:", error)
    }
  }

  const filteredPromociones = useMemo(() => {
    let filtered = promociones

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(term) ||
          p.slug?.toLowerCase().includes(term) ||
          p.descripcion?.toLowerCase().includes(term)
      )
    }

    if (filterEstado !== "all") {
      const isActive = filterEstado === "activo"
      filtered = filtered.filter((p) => p.activo === isActive)
    }

    return filtered
  }, [promociones, searchTerm, filterEstado])

  const totalPages = Math.ceil(filteredPromociones.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPromociones = filteredPromociones.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterEstado])

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-AR")
  }, [])

  const formatPrice = useCallback((price?: number | null) => {
    if (price == null) return "-"
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(price)
  }, [])

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "", slug: "", imagen: "", imagen_mobile: "", imagen_banner: "", fecha_vigencia_inicio: "", fecha_vigencia_fin: "", activo: true })
    setSelectedItems([])
    setEditingPromocion(null)
    setProductSearchTerm("")
    setShowProductSuggestions(false)
  }

  const handleEdit = (promocion: Promocion) => {
    setEditingPromocion(promocion)
    setFormData({
      nombre: promocion.nombre || "",
      descripcion: promocion.descripcion || "",
      slug: promocion.slug || "",
      imagen: promocion.imagen || "",
      imagen_mobile: promocion.imagen_mobile || "",
      imagen_banner: promocion.imagen_banner || "",
      fecha_vigencia_inicio: promocion.fecha_vigencia_inicio || "",
      fecha_vigencia_fin: promocion.fecha_vigencia_fin || "",
      activo: promocion.activo ?? true,
    })
    setSelectedItems(
      (promocion.items || []).map((item) => ({
        id: item.fk_id_producto,
        descuento_porcentaje: item.descuento_porcentaje?.toString() ?? "",
      }))
    )
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const promoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        slug: formData.slug || null,
        imagen: formData.imagen || null,
        imagen_mobile: formData.imagen_mobile || null,
        imagen_banner: formData.imagen_banner || null,
        fecha_vigencia_inicio: formData.fecha_vigencia_inicio || null,
        fecha_vigencia_fin: formData.fecha_vigencia_fin || null,
        activo: formData.activo,
      }

      let promoId: number

      if (editingPromocion) {
        // Si cambió alguna imagen, eliminar la anterior del storage
        if (editingPromocion.imagen && editingPromocion.imagen !== formData.imagen) {
          await deleteImageFromStorage(editingPromocion.imagen)
        }
        if (editingPromocion.imagen_mobile && editingPromocion.imagen_mobile !== formData.imagen_mobile) {
          await deleteImageFromStorage(editingPromocion.imagen_mobile)
        }
        if (editingPromocion.imagen_banner && editingPromocion.imagen_banner !== formData.imagen_banner) {
          await deleteImageFromStorage(editingPromocion.imagen_banner)
        }

        const { error } = await supabase
          .from("promociones")
          .update(promoData)
          .eq("id", editingPromocion.id)
        if (error) throw error
        promoId = editingPromocion.id

        // Eliminar items existentes para reinsertarlos
        await supabase.from("promociones_items").delete().eq("fk_id_promocion", promoId)
      } else {
        const { data, error } = await supabase
          .from("promociones")
          .insert(promoData)
          .select()
          .single()
        if (error) throw error
        promoId = data.id
      }

      if (selectedItems.length > 0) {
        const items = selectedItems.map((item) => ({
          fk_id_promocion: promoId,
          fk_id_producto: item.id,
          descuento_porcentaje: item.descuento_porcentaje !== "" ? parseFloat(item.descuento_porcentaje) : null,
        }))

        const { error: itemsError } = await supabase.from("promociones_items").insert(items)
        if (itemsError) throw itemsError
      }

      await loadPromociones()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error al guardar promoción:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!promocionToDelete) return
    try {
      if (promocionToDelete.imagen) {
        await deleteImageFromStorage(promocionToDelete.imagen)
      }
      if (promocionToDelete.imagen_mobile) {
        await deleteImageFromStorage(promocionToDelete.imagen_mobile)
      }
      if (promocionToDelete.imagen_banner) {
        await deleteImageFromStorage(promocionToDelete.imagen_banner)
      }
      const { error } = await supabase.from("promociones").delete().eq("id", promocionToDelete.id)
      if (error) throw error
      await loadPromociones()
    } catch (error) {
      console.error("Error al eliminar promoción:", error)
    }
    setIsDeleteDialogOpen(false)
    setPromocionToDelete(null)
  }

  const extractFilePathFromUrl = (imageUrl: string): string => {
    try {
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split("/")
      const imagenesIndex = pathParts.findIndex((part) => part === "imagenes")
      if (imagenesIndex !== -1 && imagenesIndex + 2 < pathParts.length) {
        return pathParts.slice(imagenesIndex + 1).join("/")
      }
      return `promociones/${pathParts[pathParts.length - 1]}`
    } catch {
      const parts = imageUrl.split("/")
      return `promociones/${parts[parts.length - 1]}`
    }
  }

  const deleteImageFromStorage = async (imageUrl: string) => {
    if (!imageUrl.includes("supabase.co")) return
    try {
      await supabase.storage.from("imagenes").remove([extractFilePathFromUrl(imageUrl)])
    } catch (error) {
      console.error("Error eliminando imagen del storage:", error)
    }
  }

  const handleImageUpload = async (file: File, field: ImageField) => {
    if (!file.type.startsWith("image/")) { alert("Solo se permiten imágenes"); return }
    if (file.size > 5 * 1024 * 1024) { alert("El archivo supera el límite de 5MB"); return }
    setUploadingField(field)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `promociones/${fileName}`
      const { error } = await supabase.storage.from("imagenes").upload(filePath, file, { cacheControl: "3600", upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("imagenes").getPublicUrl(filePath)
      setFormData((prev) => ({ ...prev, [field]: publicUrl }))
    } catch (error) {
      console.error("Error al subir imagen:", error)
      alert("Error al subir la imagen")
    } finally {
      setUploadingField(null)
    }
  }

  const addProductToPromo = (productId: number) => {
    if (!selectedItems.find((i) => i.id === productId)) {
      setSelectedItems([...selectedItems, { id: productId, descuento_porcentaje: "" }])
    }
    setProductSearchTerm("")
    setShowProductSuggestions(false)
  }

  const removeProductFromPromo = (productId: number) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== productId))
  }

  const updateItemDiscount = (productId: number, value: string) => {
    setSelectedItems(selectedItems.map((i) => (i.id === productId ? { ...i, descuento_porcentaje: value } : i)))
  }

  const renderImageUploader = (
    field: ImageField,
    label: string,
    inputId: string,
    placeholder: string
  ) => {
    const value = formData[field]
    const isUploading = uploadingField === field

    return (
      <div className="space-y-3">
        <Label>{label}</Label>

        {/* Vista previa + botón quitar */}
        {value && (
          <div className="relative w-full max-w-sm">
            <div className="h-40 rounded-lg overflow-hidden border">
              <img
                src={value}
                alt="Vista previa"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/placeholder.jpg" }}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-7 w-7 p-0"
              onClick={async () => {
                await deleteImageFromStorage(value)
                setFormData((prev) => ({ ...prev, [field]: "" }))
              }}
              disabled={isSaving || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* URL manual */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Pegar URL de imagen</Label>
          <Input
            value={value}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            disabled={isSaving || isUploading}
            placeholder={placeholder}
          />
        </div>

        {/* Upload desde PC */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">O subir desde tu computadora</Label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
            onDrop={async (e) => {
              e.preventDefault()
              if (isSaving || isUploading) return
              const file = e.dataTransfer.files[0]
              if (file) await handleImageUpload(file, field)
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept="image/*"
              id={inputId}
              className="hidden"
              disabled={isSaving || isUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) await handleImageUpload(file, field)
                e.target.value = ""
              }}
            />
            <label htmlFor={inputId} className="cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    <p className="text-sm text-gray-500">Subiendo imagen...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      Arrastrá una imagen o hacé clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF — máx. 5MB</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>
    )
  }

  const filteredProductSuggestions = useMemo(() => {
    if (!productSearchTerm.trim()) return []
    const term = productSearchTerm.toLowerCase()
    return productos
      .filter((p) => !selectedItems.find((i) => i.id === p.id))
      .filter((p) => p.descripcion?.toLowerCase().includes(term) || p.id.toString().includes(term))
      .slice(0, 10)
  }, [productos, selectedItems, productSearchTerm])

  const Pagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <p className="text-sm text-gray-700">
          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredPromociones.length)} de {filteredPromociones.length} promociones
        </p>
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-sm">{currentPage} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
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
            <CardTitle>Gestión de Promociones</CardTitle>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (open) setIsDialogOpen(true) }}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Promoción
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                <div>
                  <DialogHeader>
                    <DialogTitle>{editingPromocion ? "Editar Promoción" : "Nueva Promoción"}</DialogTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-4"
                      onClick={() => { setIsDialogOpen(false); resetForm() }}
                      disabled={isSaving}
                    >
                      ✕
                    </Button>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Nombre + Slug */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre de la Promoción</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                          disabled={isSaving}
                          placeholder="ej: Día del Padre"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <p className="text-xs text-gray-500 mb-1">Auto-generado si se deja vacío</p>
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            disabled={isSaving}
                            placeholder="dia-del-padre"
                            className="font-mono text-sm"
                          />
                        </div>
                        {formData.slug && (
                          <p className="text-xs text-blue-600 mt-1">/promociones/{formData.slug}</p>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        disabled={isSaving}
                        placeholder="Descripción de la promoción..."
                        rows={3}
                      />
                    </div>

                    {/* Imagen banner desktop */}
                    {renderImageUploader("imagen", "Imagen (banner desktop)", "promo-image-upload", "https://ejemplo.com/banner-promo.jpg")}

                    {/* Imagen banner mobile */}
                    {renderImageUploader("imagen_mobile", "Imagen (banner mobile)", "promo-image-mobile-upload", "https://ejemplo.com/banner-promo-mobile.jpg")}

                    {/* Imagen del encabezado de la página de la promoción */}
                    <div className="space-y-1">
                      {renderImageUploader("imagen_banner", "Imagen de la página de la promoción", "promo-image-banner-upload", "https://ejemplo.com/dia-del-padre.jpg")}
                      <p className="text-xs text-gray-500">
                        Se muestra arriba de todo en /promociones/{formData.slug || "slug"}. Si se deja vacía se usa el banner por defecto de Configuración Web.
                      </p>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fecha_inicio">Fecha Inicio Vigencia</Label>
                        <Input
                          id="fecha_inicio"
                          type="date"
                          value={formData.fecha_vigencia_inicio}
                          onChange={(e) => setFormData({ ...formData, fecha_vigencia_inicio: e.target.value })}
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fecha_fin">Fecha Fin Vigencia</Label>
                        <Input
                          id="fecha_fin"
                          type="date"
                          value={formData.fecha_vigencia_fin}
                          onChange={(e) => setFormData({ ...formData, fecha_vigencia_fin: e.target.value })}
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="min-w-0">Productos de la Promoción</Label>
                        <Badge variant="outline" className="flex-shrink-0">
                          {selectedItems.length} producto{selectedItems.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      {/* Lista de productos seleccionados */}
                      {selectedItems.length > 0 && (
                        <div className="space-y-2 p-3 border rounded-lg bg-gray-50 overflow-hidden">
                          {selectedItems.map((item) => {
                            const producto = productos.find((p) => p.id === item.id)
                            if (!producto) return null
                            const descuento = item.descuento_porcentaje !== "" ? parseFloat(item.descuento_porcentaje) : null
                            const precioPromo = descuento != null ? producto.precio * (1 - descuento / 100) : null
                            return (
                              <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border min-w-0">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{producto.descripcion}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {formatPrice(producto.precio)}
                                    {precioPromo != null && (
                                      <span className="ml-1 text-green-600 font-medium">
                                        → {formatPrice(precioPromo)} ({descuento}% off)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={item.descuento_porcentaje}
                                    onChange={(e) => updateItemDiscount(item.id, e.target.value)}
                                    placeholder="% desc."
                                    className="w-20 text-sm"
                                    disabled={isSaving}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeProductFromPromo(item.id)}
                                    disabled={isSaving}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Buscador de productos */}
                      <div className="space-y-1">
                        <Label>Buscar y agregar productos</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por nombre o ID..."
                            value={productSearchTerm}
                            onChange={(e) => { setProductSearchTerm(e.target.value); setShowProductSuggestions(e.target.value.trim().length > 0) }}
                            onFocus={() => setShowProductSuggestions(productSearchTerm.trim().length > 0)}
                            onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                            className="pl-10"
                            disabled={isSaving}
                          />
                          {showProductSuggestions && filteredProductSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {filteredProductSuggestions.map((producto) => (
                                <div
                                  key={producto.id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                  onClick={() => addProductToPromo(producto.id)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="text-sm font-medium">{producto.descripcion}</div>
                                      <div className="text-xs text-gray-500">ID: {producto.id}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-green-600">{formatPrice(producto.precio)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {showProductSuggestions && productSearchTerm.trim().length > 0 && filteredProductSuggestions.length === 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Sin resultados para "{productSearchTerm}"</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Activo */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                        disabled={isSaving}
                      />
                      <Label htmlFor="activo">Activo</Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSaving}>
                      {isSaving ? "Guardando..." : editingPromocion ? "Actualizar Promoción" : "Crear Promoción"}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {/* Filtros */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar promociones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>URL (slug)</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPromociones.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="w-16">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {promo.imagen ? (
                        <img
                          src={promo.imagen}
                          alt={promo.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = "/placeholder.jpg" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {promo.nombre}
                    {promo.descripcion && (
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{promo.descripcion}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/promociones/{promo.slug}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {promo.items && promo.items.length > 0 ? (
                        promo.items.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.producto?.descripcion}
                            {item.descuento_porcentaje != null && (
                              <span className="ml-1 text-red-500">-{item.descuento_porcentaje}%</span>
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">Sin productos</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>{formatDate(promo.fecha_vigencia_inicio)}</div>
                      <div>{formatDate(promo.fecha_vigencia_fin)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={promo.activo}
                      onCheckedChange={async (checked) => {
                        try {
                          await supabase.from("promociones").update({ activo: checked }).eq("id", promo.id)
                          await loadPromociones()
                        } catch (error) {
                          console.error("Error al actualizar estado:", error)
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(promo)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setPromocionToDelete(promo); setIsDeleteDialogOpen(true) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {currentPromociones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay promociones{searchTerm ? ` que coincidan con "${searchTerm}"` : ""}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination />
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
              ¿Estás seguro de que querés eliminar la promoción <strong>"{promocionToDelete?.nombre}"</strong>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                <span className="font-medium text-yellow-800 text-sm">Atención</span>
              </div>
              <p className="text-yellow-700 text-xs mt-1">
                Esta acción no se puede deshacer. Los productos asociados también serán desvinculados.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} size="sm">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} size="sm">Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})

PromocionesSection.displayName = "PromocionesSection"
