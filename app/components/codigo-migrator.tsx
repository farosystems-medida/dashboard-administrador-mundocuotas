"use client"

import React, { useState } from "react"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase, Producto } from "@/lib/supabase"
import * as XLSX from 'xlsx'

interface CodigoMigratorProps {
  productos: Producto[]
  onProductoUpdated?: () => void
}

interface CodigoExcel {
  descripcion: string
  codigo: string
}

interface MigrationResult {
  row: number
  descripcion: string
  codigo: string
  status: 'updated' | 'not_found' | 'error' | 'no_change'
  message: string
}

export const CodigoMigrator = ({ productos, onProductoUpdated }: CodigoMigratorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<MigrationResult[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<CodigoExcel[]>([])
  const [totalValidRows, setTotalValidRows] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const downloadTemplate = () => {
    const templateData = [
      {
        descripcion: "Ejemplo: Notebook HP 15.6",
        codigo: "NB-HP-001"
      },
      {
        descripcion: "Ejemplo: Mouse Logitech",
        codigo: "MS-LG-001"
      },
      {
        descripcion: "Ejemplo: Teclado Mecánico",
        codigo: "KB-MECH-001"
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Codigos")
    XLSX.writeFile(workbook, "plantilla_codigos.xlsx")
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

      const processedData: CodigoExcel[] = data.map(row => ({
        descripcion: String(row.descripcion || '').trim(),
        codigo: String(row.codigo || '').trim()
      })).filter(item => item.descripcion && item.codigo)

      setTotalValidRows(processedData.length)
      setPreviewData(processedData.slice(0, 10)) // Mostrar solo las primeras 10 filas como preview (el procesamiento será de todos)
    } catch (error) {
      console.error('Error processing Excel file:', error)
      alert('Error al procesar el archivo Excel')
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
          const codigoData: CodigoExcel = {
            descripcion: String(rowData.descripcion || '').trim(),
            codigo: String(rowData.codigo || '').trim()
          }

          // Validaciones básicas
          if (!codigoData.descripcion) {
            results.push({
              row: rowNumber,
              descripcion: 'Sin descripción',
              codigo: codigoData.codigo || '',
              status: 'error',
              message: 'La descripción es requerida'
            })
            continue
          }

          if (!codigoData.codigo) {
            results.push({
              row: rowNumber,
              descripcion: codigoData.descripcion,
              codigo: '',
              status: 'error',
              message: 'El código es requerido'
            })
            continue
          }

          // Buscar producto por descripción exacta
          const productoExistente = productos.find(p => 
            p.descripcion.toLowerCase().trim() === codigoData.descripcion.toLowerCase().trim()
          )

          if (!productoExistente) {
            results.push({
              row: rowNumber,
              descripcion: codigoData.descripcion,
              codigo: codigoData.codigo,
              status: 'not_found',
              message: 'Producto no encontrado'
            })
            setProgress((i + 1) / totalRows * 100)
            continue
          }

          // Verificar si ya tiene el mismo código
          if (productoExistente.codigo === codigoData.codigo) {
            results.push({
              row: rowNumber,
              descripcion: codigoData.descripcion,
              codigo: codigoData.codigo,
              status: 'no_change',
              message: `Ya tiene el código "${codigoData.codigo}"`
            })
            setProgress((i + 1) / totalRows * 100)
            continue
          }

          // Actualizar el producto con el nuevo código
          const { error } = await supabase
            .from('productos')
            .update({ codigo: codigoData.codigo })
            .eq('id', productoExistente.id)

          if (error) throw error

          results.push({
            row: rowNumber,
            descripcion: codigoData.descripcion,
            codigo: codigoData.codigo,
            status: 'updated',
            message: `Código actualizado de "${productoExistente.codigo || 'sin código'}" a "${codigoData.codigo}"`
          })

        } catch (error: any) {
          results.push({
            row: i + 2,
            descripcion: String(rowData?.descripcion || 'Desconocido'),
            codigo: String(rowData?.codigo || ''),
            status: 'error',
            message: error.message || 'Error desconocido'
          })
        }

        setProgress((i + 1) / totalRows * 100)
      }

      setResults(results)
      setShowResults(true)

      // Notificar al componente padre que se actualizaron productos
      if (onProductoUpdated) {
        onProductoUpdated()
      }

    } catch (error: any) {
      alert(`Error procesando el archivo: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'updated': return 'bg-green-100 text-green-800'
      case 'no_change': return 'bg-blue-100 text-blue-800'
      case 'not_found': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'updated': return <CheckCircle className="h-4 w-4" />
      case 'no_change': return <AlertCircle className="h-4 w-4" />
      case 'not_found': return <XCircle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'updated': return 'Actualizado'
      case 'no_change': return 'Sin cambios'
      case 'not_found': return 'No encontrado'
      case 'error': return 'Error'
      default: return status
    }
  }

  const resetMigration = () => {
    setFile(null)
    setPreviewData([])
    setTotalValidRows(0)
    setResults([])
    setProgress(0)
    setShowResults(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Hash className="h-4 w-4 mr-2" />
          Migrar Códigos
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Migración de Códigos desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Instrucciones:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• El archivo debe tener las columnas: <strong>descripcion</strong> y <strong>codigo</strong></li>
              <li>• Se buscarán productos que coincidan exactamente con la descripción</li>
              <li>• Solo se actualizarán los productos encontrados</li>
              <li>• Se mostrará el estado de cada fila procesada</li>
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
                  id="codigo-excel-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="codigo-excel-upload" className="cursor-pointer">
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
                    <CardTitle>
                      Vista previa (mostrando {previewData.length} de {totalValidRows} filas válidas)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Descripción</th>
                            <th className="text-left p-2">Código</th>
                            <th className="text-left p-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((item, index) => {
                            const productoExiste = productos.find(p => 
                              p.descripcion.toLowerCase().trim() === item.descripcion.toLowerCase().trim()
                            )
                            return (
                              <tr key={index} className="border-b">
                                <td className="p-2">{item.descripcion}</td>
                                <td className="p-2">
                                  <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                                    {item.codigo}
                                  </span>
                                </td>
                                <td className="p-2">
                                  {productoExiste ? (
                                    <Badge variant="default" className="text-xs">
                                      Encontrado
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">
                                      No encontrado
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
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
                  {isProcessing ? "Procesando..." : `Iniciar Migración${totalValidRows > 0 ? ` (${totalValidRows} registros)` : ''}`}
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
                      {results.filter(r => r.status === 'updated').length}
                    </div>
                    <div className="text-sm text-green-700">Actualizados</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.filter(r => r.status === 'no_change').length}
                    </div>
                    <div className="text-sm text-blue-700">Sin cambios</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.filter(r => r.status === 'not_found').length}
                    </div>
                    <div className="text-sm text-yellow-700">No encontrados</div>
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
                              {result.codigo && (
                                <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                                  {result.codigo}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge className={`${getStatusColor(result.status)} flex items-center gap-1`}>
                                {getStatusIcon(result.status)}
                                {getStatusText(result.status)}
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