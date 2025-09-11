"use client"

import React, { useState } from "react"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase, Producto, Categoria, Marca, Linea } from "@/lib/supabase"
import * as XLSX from 'xlsx'

interface ExcelMigratorProps {
  productos: Producto[]
  categorias: Categoria[]
  marcas: Marca[]
  lineas: Linea[]
  onProductoCreated?: (producto: Producto) => void
}

interface ProductoExcel {
  descripcion: string
  descripcion_detallada?: string
  precio: number
  codigo?: string
  categoria: string
  marca: string
  linea: string
  aplica_todos_plan: boolean
}

interface MigrationResult {
  row: number
  descripcion: string
  codigo?: string
  status: 'created' | 'updated' | 'skipped' | 'error'
  message: string
  data?: ProductoExcel
}

export const ExcelMigrator = ({ productos, categorias, marcas, lineas, onProductoCreated }: ExcelMigratorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<MigrationResult[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ProductoExcel[]>([])
  const [showResults, setShowResults] = useState(false)

  const downloadTemplate = () => {
    const templateData = [
      {
        descripcion: "Ejemplo: Notebook HP 15.6",
        descripcion_detallada: "Ejemplo: Procesador Intel i5, 8GB RAM, 256GB SSD",
        precio: 150000.00,
        codigo: "NB-HP-001",
        categoria: "Notebooks",
        marca: "HP", 
        linea: "Tecnología",
        aplica_todos_plan: true
      },
      {
        descripcion: "Ejemplo: Mouse Logitech",
        descripcion_detallada: "Mouse óptico inalámbrico",
        precio: 5000.00,
        codigo: "MS-LG-001",
        categoria: "Accesorios",
        marca: "Logitech",
        linea: "Tecnología", 
        aplica_todos_plan: false
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos")
    XLSX.writeFile(workbook, "plantilla_productos.xlsx")
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      processExcelPreview(selectedFile)
    }
  }

  const processExcelPreview = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet) as any[]

      const processedData: ProductoExcel[] = data.map(row => ({
        descripcion: String(row.descripcion || '').trim(),
        descripcion_detallada: row.descripcion_detallada ? String(row.descripcion_detallada).trim() : undefined,
        precio: parseFloat(row.precio) || 0,
        codigo: row.codigo ? String(row.codigo).trim() : undefined,
        categoria: String(row.categoria || '').trim(),
        marca: String(row.marca || '').trim(),
        linea: String(row.linea || '').trim(),
        aplica_todos_plan: Boolean(row.aplica_todos_plan)
      }))

      setPreviewData(processedData.slice(0, 5)) // Mostrar solo las primeras 5 filas como preview
    } catch (error) {
      console.error('Error processing Excel file:', error)
      alert('Error al procesar el archivo Excel')
    }
  }

  const findOrCreateCategoria = async (nombreCategoria: string, nombreLinea: string): Promise<number | null> => {
    try {
      // Buscar categoría existente
      let categoria = categorias.find(c => c.descripcion.toLowerCase() === nombreCategoria.toLowerCase())
      
      if (categoria) {
        return categoria.id
      }

      // Buscar o crear línea
      let linea = lineas.find(l => l.descripcion.toLowerCase() === nombreLinea.toLowerCase())
      
      if (!linea) {
        const { data: nuevaLinea, error } = await supabase
          .from('lineas')
          .insert([{ descripcion: nombreLinea }])
          .select()
          .single()

        if (error) throw error
        linea = nuevaLinea
      }

      // Crear nueva categoría
      const { data: nuevaCategoria, error } = await supabase
        .from('categorias')
        .insert([{ descripcion: nombreCategoria, fk_id_linea: linea.id }])
        .select()
        .single()

      if (error) throw error
      return nuevaCategoria.id
    } catch (error) {
      console.error('Error finding/creating categoria:', error)
      return null
    }
  }

  const findOrCreateMarca = async (nombreMarca: string): Promise<number | null> => {
    try {
      // Buscar marca existente
      let marca = marcas.find(m => m.descripcion.toLowerCase() === nombreMarca.toLowerCase())
      
      if (marca) {
        return marca.id
      }

      // Crear nueva marca
      const { data: nuevaMarca, error } = await supabase
        .from('marcas')
        .insert([{ descripcion: nombreMarca }])
        .select()
        .single()

      if (error) throw error
      return nuevaMarca.id
    } catch (error) {
      console.error('Error finding/creating marca:', error)
      return null
    }
  }

  const createDefaultAssociations = async (productoId: number, aplicaTodosPlan: boolean) => {
    try {
      if (aplicaTodosPlan) {
        // Obtener todos los planes activos
        const { data: planesActivos, error } = await supabase
          .from('planes_financiacion')
          .select('id')
          .eq('activo', true)

        if (error) throw error

        if (planesActivos && planesActivos.length > 0) {
          const associations = planesActivos.map(plan => ({
            fk_id_producto: productoId,
            fk_id_plan: plan.id,
            activo: true
          }))

          const { error: insertError } = await supabase
            .from('producto_planes_default')
            .insert(associations)

          if (insertError) throw insertError
        }
      }
    } catch (error) {
      console.error('Error creating default associations:', error)
    }
  }

  const processMigration = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setResults([])
    setShowResults(false)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet) as any[]

      const results: MigrationResult[] = []
      const totalRows = data.length

      for (let i = 0; i < data.length; i++) {
        const rowData = data[i]
        const rowNumber = i + 2 // Excel rows start at 1, plus header row

        try {
          const productoData: ProductoExcel = {
            descripcion: String(rowData.descripcion || '').trim(),
            descripcion_detallada: rowData.descripcion_detallada ? String(rowData.descripcion_detallada).trim() : undefined,
            precio: parseFloat(rowData.precio) || 0,
            codigo: rowData.codigo ? String(rowData.codigo).trim() : undefined,
            categoria: String(rowData.categoria || '').trim(),
            marca: String(rowData.marca || '').trim(),
            linea: String(rowData.linea || '').trim(),
            aplica_todos_plan: Boolean(rowData.aplica_todos_plan)
          }

          // Validaciones básicas
          if (!productoData.descripcion) {
            results.push({
              row: rowNumber,
              descripcion: 'Sin descripción',
              status: 'error',
              message: 'La descripción es requerida',
              data: productoData
            })
            continue
          }

          if (productoData.precio <= 0) {
            results.push({
              row: rowNumber,
              descripcion: productoData.descripcion,
              status: 'error',
              message: 'El precio debe ser mayor a 0',
              data: productoData
            })
            continue
          }

          // Lógica de búsqueda y procesamiento mejorada
          let productoExistente = null
          let accionARealizar = 'create'
          
          // Primero buscar por código si existe
          if (productoData.codigo) {
            productoExistente = productos.find(p => 
              p.codigo && p.codigo.toLowerCase().trim() === productoData.codigo.toLowerCase().trim()
            )
            if (productoExistente) {
              accionARealizar = 'update_by_codigo'
            }
          }
          
          // Si no se encontró por código, buscar por descripción
          if (!productoExistente) {
            productoExistente = productos.find(p => 
              p.descripcion.toLowerCase().trim() === productoData.descripcion.toLowerCase().trim()
            )
            if (productoExistente) {
              accionARealizar = 'skip_by_description'
            }
          }

          // Procesar según la acción determinada
          if (accionARealizar === 'skip_by_description') {
            results.push({
              row: rowNumber,
              descripcion: productoData.descripcion,
              codigo: productoData.codigo,
              status: 'skipped',
              message: `Ya existe producto con esta descripción (ID: ${productoExistente.id})`,
              data: productoData
            })
            setProgress((i + 1) / totalRows * 100)
            continue
          }

          if (accionARealizar === 'update_by_codigo') {
            // Actualizar solo la descripción del producto encontrado por código
            try {
              const { error } = await supabase
                .from('productos')
                .update({ descripcion: productoData.descripcion })
                .eq('id', productoExistente.id)

              if (error) throw error

              results.push({
                row: rowNumber,
                descripcion: productoData.descripcion,
                codigo: productoData.codigo,
                status: 'updated',
                message: `Descripción actualizada para código "${productoData.codigo}" (ID: ${productoExistente.id})`,
                data: productoData
              })

            } catch (error: any) {
              results.push({
                row: rowNumber,
                descripcion: productoData.descripcion,
                codigo: productoData.codigo,
                status: 'error',
                message: `Error actualizando producto: ${error.message}`,
                data: productoData
              })
            }
            setProgress((i + 1) / totalRows * 100)
            continue
          }

          // Buscar o crear categoría
          const categoriaId = await findOrCreateCategoria(productoData.categoria, productoData.linea)
          if (!categoriaId) {
            results.push({
              row: rowNumber,
              descripcion: productoData.descripcion,
              status: 'error',
              message: 'Error al obtener/crear categoría',
              data: productoData
            })
            continue
          }

          // Buscar o crear marca
          const marcaId = await findOrCreateMarca(productoData.marca)
          if (!marcaId) {
            results.push({
              row: rowNumber,
              descripcion: productoData.descripcion,
              status: 'error',
              message: 'Error al obtener/crear marca',
              data: productoData
            })
            continue
          }

          // Crear el producto
          const nuevoProducto = {
            descripcion: productoData.descripcion,
            descripcion_detallada: productoData.descripcion_detallada,
            precio: productoData.precio,
            codigo: productoData.codigo,
            fk_id_categoria: categoriaId,
            fk_id_marca: marcaId,
            aplica_todos_plan: productoData.aplica_todos_plan,
            activo: true
          }

          const { data: productoCreado, error } = await supabase
            .from('productos')
            .insert([nuevoProducto])
            .select()
            .single()

          if (error) throw error

          // Crear asociaciones por defecto si aplica_todos_plan es true
          if (productoData.aplica_todos_plan) {
            await createDefaultAssociations(productoCreado.id, true)
          }

          results.push({
            row: rowNumber,
            descripcion: productoData.descripcion,
            codigo: productoData.codigo,
            status: 'created',
            message: `Producto creado exitosamente (ID: ${productoCreado.id})${productoData.codigo ? ` con código "${productoData.codigo}"` : ''}`,
            data: productoData
          })

          // Notificar al componente padre si se proporciona callback
          if (onProductoCreated) {
            onProductoCreated(productoCreado)
          }

        } catch (error: any) {
          results.push({
            row: i + 2,
            descripcion: String(rowData?.descripcion || 'Desconocido'),
            status: 'error',
            message: error.message || 'Error desconocido',
            data: rowData
          })
        }

        setProgress((i + 1) / totalRows * 100)
      }

      setResults(results)
      setShowResults(true)

    } catch (error: any) {
      alert(`Error procesando el archivo: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-green-100 text-green-800'
      case 'updated': return 'bg-blue-100 text-blue-800'
      case 'skipped': return 'bg-yellow-100 text-yellow-800' 
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return <CheckCircle className="h-4 w-4" />
      case 'updated': return <CheckCircle className="h-4 w-4" />
      case 'skipped': return <AlertCircle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const resetMigration = () => {
    setFile(null)
    setPreviewData([])
    setResults([])
    setProgress(0)
    setShowResults(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Migrar desde Excel
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Migración de Productos desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Instrucciones:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• El archivo debe tener las columnas: descripcion, descripcion_detallada, precio, codigo, categoria, marca, linea, aplica_todos_plan</li>
              <li>• <strong>Búsqueda inteligente:</strong> Primero busca por código, luego por descripción</li>
              <li>• <strong>Si encuentra por código:</strong> Actualiza solo la descripción del producto existente</li>
              <li>• <strong>Si encuentra por descripción:</strong> Se omite (ya existe)</li>
              <li>• <strong>Si no encuentra:</strong> Crea un nuevo producto</li>
              <li>• Las categorías, marcas y líneas nuevas se crearán automáticamente</li>
              <li>• Si aplica_todos_plan=TRUE, se creará la asociación con todos los planes activos</li>
            </ul>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
            </div>
          </div>

          {!showResults ? (
            <>
              {/* Subida de archivo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    {file ? file.name : 'Seleccionar archivo Excel'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Formatos soportados: .xlsx, .xls
                  </div>
                </label>
              </div>

              {/* Preview de datos */}
              {previewData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vista previa (primeras 5 filas)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Descripción</th>
                            <th className="text-left p-2">Código</th>
                            <th className="text-left p-2">Precio</th>
                            <th className="text-left p-2">Categoría</th>
                            <th className="text-left p-2">Marca</th>
                            <th className="text-left p-2">Línea</th>
                            <th className="text-left p-2">Todos Planes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{item.descripcion}</td>
                              <td className="p-2">
                                {item.codigo ? (
                                  <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                                    {item.codigo}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-2">${item.precio.toLocaleString()}</td>
                              <td className="p-2">{item.categoria}</td>
                              <td className="p-2">{item.marca}</td>
                              <td className="p-2">{item.linea}</td>
                              <td className="p-2">
                                <Badge variant={item.aplica_todos_plan ? "default" : "secondary"}>
                                  {item.aplica_todos_plan ? "Sí" : "No"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progreso */}
              {isProcessing && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Procesando...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex space-x-4">
                <Button 
                  onClick={processMigration} 
                  disabled={!file || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? "Procesando..." : "Iniciar Migración"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetMigration}
                  disabled={isProcessing}
                >
                  Limpiar
                </Button>
              </div>
            </>
          ) : (
            /* Resultados */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Resultados de la Migración</h3>
                <Button variant="outline" onClick={resetMigration}>
                  Nueva Migración
                </Button>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.status === 'created').length}
                    </div>
                    <div className="text-sm text-green-700">Creados</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.filter(r => r.status === 'updated').length}
                    </div>
                    <div className="text-sm text-blue-700">Actualizados</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.filter(r => r.status === 'skipped').length}
                    </div>
                    <div className="text-sm text-yellow-700">Omitidos</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => r.status === 'error').length}
                    </div>
                    <div className="text-sm text-red-700">Errores</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detalle de resultados */}
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-3">Fila</th>
                          <th className="text-left p-3">Descripción</th>
                          <th className="text-left p-3">Código</th>
                          <th className="text-left p-3">Estado</th>
                          <th className="text-left p-3">Mensaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{result.row}</td>
                            <td className="p-3 max-w-xs truncate" title={result.descripcion}>
                              {result.descripcion}
                            </td>
                            <td className="p-3">
                              {result.codigo ? (
                                <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                                  {result.codigo}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge className={`${getStatusColor(result.status)} flex items-center gap-1`}>
                                {getStatusIcon(result.status)}
                                {result.status}
                              </Badge>
                            </td>
                            <td className="p-3">{result.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}