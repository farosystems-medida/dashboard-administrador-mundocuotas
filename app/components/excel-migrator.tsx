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
  onMigrationCompleted?: () => void
}

interface ProductoExcel {
  descripcion: string
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

// Función para parsear valores booleanos de Excel
const parseExcelBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim()
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'sí'
  }
  return false
}

export const ExcelMigrator = ({ productos, categorias, marcas, lineas, onProductoCreated, onMigrationCompleted }: ExcelMigratorProps) => {
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
        "Desc. artículo": "Ejemplo: Notebook HP 15.6",
        "Precio": 150000.00,
        "Artículo": "NB-HP-001",
        "Agrupación": "Notebooks",
        "Marca": "HP", 
        "Linea": "Tecnología",
        aplica_todos_plan: true
      },
      {
        "Desc. artículo": "Ejemplo: Mouse Logitech",
        "Precio": 5000.00,
        "Artículo": "MS-LG-001",
        "Agrupación": "Accesorios",
        "Marca": "Logitech",
        "Linea": "Tecnología", 
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
        // Descripción: acepta "descripcion" o "Desc. artículo"
        descripcion: String(row.descripcion || row['Desc. artículo'] || '').trim(),
        // Precio: acepta "precio" o "Precio"
        precio: parseFloat(row.precio || row['Precio']) || 0,
        // Código: acepta "codigo" o "Artículo"
        codigo: row.codigo ? String(row.codigo).trim() : (row['Artículo'] ? String(row['Artículo']).trim() : undefined),
        // Categoría: acepta "categoria" o "Agrupación"
        categoria: String(row.categoria || row['Agrupación'] || '').trim(),
        // Marca: acepta "marca" o "Marca"
        marca: String(row.marca || row['Marca'] || '').trim(),
        // Línea: acepta "linea" o "Linea"
        linea: String(row.linea || row['Linea'] || '').trim(),
        // aplica_todos_plan: convertir correctamente true/false desde Excel
        aplica_todos_plan: parseExcelBoolean(row.aplica_todos_plan)
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
      console.log(`🔄 Creando asociaciones por defecto para producto ${productoId}, aplica_todos_plan: ${aplicaTodosPlan}`)
      
      if (aplicaTodosPlan) {
        // Obtener todos los planes activos
        const { data: planesActivos, error } = await supabase
          .from('planes_financiacion')
          .select('id, nombre')
          .eq('activo', true)

        if (error) {
          console.error('❌ Error obteniendo planes activos:', error)
          throw error
        }

        console.log(`📋 Planes activos encontrados: ${planesActivos?.length || 0}`, planesActivos)

        if (planesActivos && planesActivos.length > 0) {
          const associations = planesActivos.map(plan => ({
            fk_id_producto: productoId,
            fk_id_plan: plan.id,
            activo: true
          }))

          console.log(`📝 Creando ${associations.length} asociaciones:`, associations)

          const { data, error: insertError } = await supabase
            .from('producto_planes_default')
            .insert(associations)
            .select()

          if (insertError) {
            console.error('❌ Error insertando asociaciones:', insertError)
            throw insertError
          }

          console.log(`✅ Asociaciones creadas exitosamente:`, data)
        } else {
          console.log('⚠️ No hay planes activos para asociar')
        }
      } else {
        console.log('ℹ️ Producto no aplica a todos los planes, no se crean asociaciones')
      }
    } catch (error) {
      console.error('❌ Error general creando asociaciones por defecto:', error)
      throw error // Re-lanzar el error para que se capture en el nivel superior
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
            // Descripción: acepta "descripcion" o "Desc. artículo"
            descripcion: String(rowData.descripcion || rowData['Desc. artículo'] || '').trim(),
            // Precio: acepta "precio" o "Precio"
            precio: parseFloat(rowData.precio || rowData['Precio']) || 0,
            // Código: acepta "codigo" o "Artículo"
            codigo: rowData.codigo ? String(rowData.codigo).trim() : (rowData['Artículo'] ? String(rowData['Artículo']).trim() : undefined),
            // Categoría: acepta "categoria" o "Agrupación"
            categoria: String(rowData.categoria || rowData['Agrupación'] || '').trim(),
            // Marca: acepta "marca" o "Marca"
            marca: String(rowData.marca || rowData['Marca'] || '').trim(),
            // Línea: acepta "linea" o "Linea"
            linea: String(rowData.linea || rowData['Linea'] || '').trim(),
            aplica_todos_plan: parseExcelBoolean(rowData.aplica_todos_plan)
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
            // Verificar si la descripción o el precio son diferentes
            const descripcionActual = productoExistente.descripcion.trim()
            const descripcionNueva = productoData.descripcion.trim()
            const precioActual = productoExistente.precio
            const precioNuevo = productoData.precio
            
            const descripcionDiferente = descripcionActual.toLowerCase() !== descripcionNueva.toLowerCase()
            const precioDiferente = Math.abs(precioActual - precioNuevo) > 0.01 // Comparar con tolerancia para decimales
            
            if (!descripcionDiferente && !precioDiferente) {
              // Ni la descripción ni el precio son diferentes, no hacer nada
              results.push({
                row: rowNumber,
                descripcion: productoData.descripcion,
                codigo: productoData.codigo,
                status: 'skipped',
                message: `Producto con código "${productoData.codigo}" ya tiene la misma descripción y precio (ID: ${productoExistente.id})`,
                data: productoData
              })
            } else {
              // Al menos uno es diferente, actualizar SOLO descripción y/o precio
              try {
                const camposAActualizar: any = {}
                const cambios: string[] = []
                
                if (descripcionDiferente) {
                  camposAActualizar.descripcion = productoData.descripcion
                  cambios.push(`descripción: "${descripcionActual}" → "${descripcionNueva}"`)
                  console.log(`🔄 Actualizando descripción: "${descripcionActual}" → "${descripcionNueva}"`)
                }
                
                if (precioDiferente) {
                  camposAActualizar.precio = productoData.precio
                  cambios.push(`precio: $${precioActual.toLocaleString()} → $${precioNuevo.toLocaleString()}`)
                  console.log(`🔄 Actualizando precio: $${precioActual.toLocaleString()} → $${precioNuevo.toLocaleString()}`)
                }
                
                console.log(`🔄 Actualizando producto ${productoExistente.id} con cambios:`, camposAActualizar)
                
                const { error } = await supabase
                  .from('productos')
                  .update(camposAActualizar)
                  .eq('id', productoExistente.id)

                if (error) throw error

                results.push({
                  row: rowNumber,
                  descripcion: productoData.descripcion,
                  codigo: productoData.codigo,
                  status: 'updated',
                  message: `Producto actualizado para código "${productoData.codigo}" (ID: ${productoExistente.id}). Cambios: ${cambios.join(', ')}`,
                  data: productoData
                })

                console.log(`✅ Producto actualizado exitosamente`)

              } catch (error: any) {
                console.error(`❌ Error actualizando producto:`, error)
                results.push({
                  row: rowNumber,
                  descripcion: productoData.descripcion,
                  codigo: productoData.codigo,
                  status: 'error',
                  message: `Error actualizando producto: ${error.message}`,
                  data: productoData
                })
              }
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
            precio: productoData.precio,
            codigo: productoData.codigo,
            fk_id_categoria: categoriaId,
            fk_id_marca: marcaId,
            aplica_todos_plan: productoData.aplica_todos_plan,
            activo: true
          }

          console.log(`🆕 Creando producto:`, nuevoProducto)

          const { data: productoCreado, error } = await supabase
            .from('productos')
            .insert([nuevoProducto])
            .select()
            .single()

          if (error) {
            console.error(`❌ Error creando producto:`, error)
            throw error
          }

          console.log(`✅ Producto creado exitosamente:`, productoCreado)

          // Crear asociaciones por defecto si aplica_todos_plan es true
          let associationMessage = ''
          if (productoData.aplica_todos_plan) {
            try {
              await createDefaultAssociations(productoCreado.id, true)
              associationMessage = ' con asociaciones a todos los planes'
            } catch (associationError) {
              console.error(`❌ Error creando asociaciones para producto ${productoCreado.id}:`, associationError)
              associationMessage = ' (ERROR creando asociaciones a planes)'
            }
          }

          results.push({
            row: rowNumber,
            descripcion: productoData.descripcion,
            codigo: productoData.codigo,
            status: 'created',
            message: `Producto creado exitosamente (ID: ${productoCreado.id})${productoData.codigo ? ` con código "${productoData.codigo}"` : ''}${associationMessage}`,
            data: productoData
          })

          // No notificar durante la migración - solo al final cuando se cierre el popup

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

  const handleCloseDialog = () => {
    const hasChanges = results.some(r => r.status === 'created' || r.status === 'updated')
    
    setIsOpen(false)
    resetMigration()
    
    // Solo ejecutar callback si hubo cambios en la migración
    if (hasChanges && onMigrationCompleted) {
      onMigrationCompleted()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleCloseDialog()
      } else {
        setIsOpen(true)
      }
    }}>
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
              <li>• <strong>Columnas requeridas:</strong> descripción, precio, código, categoría, marca, línea, aplica_todos_plan</li>
              <li>• <strong>Nombres alternativos aceptados:</strong></li>
              <li>&nbsp;&nbsp;- Descripción: "descripcion" o "Desc. artículo"</li>
              <li>&nbsp;&nbsp;- Código: "codigo" o "Artículo"</li>
              <li>&nbsp;&nbsp;- Precio: "precio" o "Precio"</li>
              <li>&nbsp;&nbsp;- Categoría: "categoria" o "Agrupación"</li>
              <li>&nbsp;&nbsp;- Marca: "marca" o "Marca"</li>
              <li>&nbsp;&nbsp;- Línea: "linea" o "Linea"</li>
              <li>• <strong>Búsqueda inteligente:</strong> Primero busca por código, luego por descripción</li>
              <li>• <strong>Si encuentra por código:</strong> 
                <ul className="ml-4 mt-1">
                  <li>- Si la descripción o precio son diferentes: Actualiza SOLO descripción y/o precio</li>
                  <li>- Si descripción y precio son iguales: Se omite (sin cambios)</li>
                  <li>- <em>Otros campos (marca, categoría, etc.) NO se modifican</em></li>
                </ul>
              </li>
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
                <div className="space-x-2">
                  <Button variant="outline" onClick={resetMigration}>
                    Nueva Migración
                  </Button>
                  <Button onClick={handleCloseDialog}>
                    Cerrar
                  </Button>
                </div>
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