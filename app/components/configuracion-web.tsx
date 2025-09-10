"use client"

import React, { useState } from "react"
import { Monitor, Smartphone, Save, Palette, Type, Layout, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ConfiguracionWeb } from "@/lib/supabase"

interface ConfiguracionWebProps {
  configuracionWeb?: ConfiguracionWeb
  onUpdateConfiguracionWeb: (updates: Partial<ConfiguracionWeb>) => Promise<ConfiguracionWeb | undefined>
}

export function ConfiguracionWebComponent({ 
  configuracionWeb,
  onUpdateConfiguracionWeb 
}: ConfiguracionWebProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Logo
    logo_url: configuracionWeb?.logo_url || "",
    logo_width: configuracionWeb?.logo_width || 200,
    logo_height: configuracionWeb?.logo_height || 60,
    
    // AppBar Desktop
    appbar_height: configuracionWeb?.appbar_height || 64,
    appbar_background_color: configuracionWeb?.appbar_background_color || "#ffffff",
    appbar_text_color: configuracionWeb?.appbar_text_color || "#000000",
    
    // Tipografías Desktop
    section_title_size: configuracionWeb?.section_title_size || 24,
    section_subtitle_size: configuracionWeb?.section_subtitle_size || 18,
    section_text_size: configuracionWeb?.section_text_size || 16,
    
    // Búsqueda Desktop
    search_box_width: configuracionWeb?.search_box_width || 400,
    search_box_height: configuracionWeb?.search_box_height || 40,
    
    // Home Desktop
    home_section_height: configuracionWeb?.home_section_height || 500,
    
    // Mobile
    mobile_logo_width: configuracionWeb?.mobile_logo_width || 150,
    mobile_logo_height: configuracionWeb?.mobile_logo_height || 45,
    mobile_appbar_height: configuracionWeb?.mobile_appbar_height || 56
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onUpdateConfiguracionWeb(formData)
    } catch (error) {
      console.error('Error al actualizar configuración web:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReset = () => {
    setFormData({
      logo_url: "",
      logo_width: 200,
      logo_height: 60,
      appbar_height: 64,
      appbar_background_color: "#ffffff",
      appbar_text_color: "#000000",
      section_title_size: 24,
      section_subtitle_size: 18,
      section_text_size: 16,
      search_box_width: 400,
      search_box_height: 40,
      home_section_height: 500,
      mobile_logo_width: 150,
      mobile_logo_height: 45,
      mobile_appbar_height: 56
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Configuración Web
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Restablecer
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="desktop" className="space-y-6 mt-6">
              {/* Logo Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Logo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="logo_url">URL del Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_width">Ancho (px)</Label>
                    <Input
                      id="logo_width"
                      type="number"
                      value={formData.logo_width}
                      onChange={(e) => handleInputChange('logo_width', parseInt(e.target.value) || 0)}
                      min={50}
                      max={500}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_height">Alto (px)</Label>
                    <Input
                      id="logo_height"
                      type="number"
                      value={formData.logo_height}
                      onChange={(e) => handleInputChange('logo_height', parseInt(e.target.value) || 0)}
                      min={20}
                      max={200}
                    />
                  </div>
                  <div className="flex items-center justify-center border rounded-lg p-4">
                    {formData.logo_url ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Vista previa del logo"
                        style={{
                          width: `${Math.min(formData.logo_width, 100)}px`,
                          height: `${Math.min(formData.logo_height, 50)}px`,
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Vista previa del logo</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* AppBar Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Barra de Navegación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="appbar_height">Altura (px)</Label>
                    <Input
                      id="appbar_height"
                      type="number"
                      value={formData.appbar_height}
                      onChange={(e) => handleInputChange('appbar_height', parseInt(e.target.value) || 0)}
                      min={40}
                      max={120}
                    />
                  </div>
                  <div>
                    <Label htmlFor="appbar_background_color">Color de Fondo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="appbar_background_color"
                        type="color"
                        value={formData.appbar_background_color}
                        onChange={(e) => handleInputChange('appbar_background_color', e.target.value)}
                        className="w-16"
                      />
                      <Input
                        value={formData.appbar_background_color}
                        onChange={(e) => handleInputChange('appbar_background_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="appbar_text_color">Color de Texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="appbar_text_color"
                        type="color"
                        value={formData.appbar_text_color}
                        onChange={(e) => handleInputChange('appbar_text_color', e.target.value)}
                        className="w-16"
                      />
                      <Input
                        value={formData.appbar_text_color}
                        onChange={(e) => handleInputChange('appbar_text_color', e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="mobile" className="space-y-6 mt-6">
              {/* Mobile Logo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Logo Móvil</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mobile_logo_width">Ancho (px)</Label>
                    <Input
                      id="mobile_logo_width"
                      type="number"
                      value={formData.mobile_logo_width}
                      onChange={(e) => handleInputChange('mobile_logo_width', parseInt(e.target.value) || 0)}
                      min={80}
                      max={300}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_logo_height">Alto (px)</Label>
                    <Input
                      id="mobile_logo_height"
                      type="number"
                      value={formData.mobile_logo_height}
                      onChange={(e) => handleInputChange('mobile_logo_height', parseInt(e.target.value) || 0)}
                      min={30}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mobile AppBar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Barra de Navegación Móvil</h3>
                <div>
                  <Label htmlFor="mobile_appbar_height">Altura (px)</Label>
                  <Input
                    id="mobile_appbar_height"
                    type="number"
                    value={formData.mobile_appbar_height}
                    onChange={(e) => handleInputChange('mobile_appbar_height', parseInt(e.target.value) || 0)}
                    min={40}
                    max={80}
                  />
                </div>
              </div>


            </TabsContent>


          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}