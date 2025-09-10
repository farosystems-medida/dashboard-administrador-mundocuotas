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
    mobile_appbar_height: configuracionWeb?.mobile_appbar_height || 56,
    mobile_section_title_size: configuracionWeb?.mobile_section_title_size || 20,
    mobile_section_subtitle_size: configuracionWeb?.mobile_section_subtitle_size || 16,
    mobile_section_text_size: configuracionWeb?.mobile_section_text_size || 14,
    mobile_search_box_width: configuracionWeb?.mobile_search_box_width || 300,
    mobile_search_box_height: configuracionWeb?.mobile_search_box_height || 36,
    mobile_home_section_height: configuracionWeb?.mobile_home_section_height || 300,
    
    // Colores
    primary_color: configuracionWeb?.primary_color || "#0066cc",
    secondary_color: configuracionWeb?.secondary_color || "#f8f9fa",
    accent_color: configuracionWeb?.accent_color || "#ff6b35",
    
    // Tipografías
    font_family_primary: configuracionWeb?.font_family_primary || "Inter, sans-serif",
    font_family_secondary: configuracionWeb?.font_family_secondary || "Roboto, sans-serif"
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
      mobile_appbar_height: 56,
      mobile_section_title_size: 20,
      mobile_section_subtitle_size: 16,
      mobile_section_text_size: 14,
      mobile_search_box_width: 300,
      mobile_search_box_height: 36,
      mobile_home_section_height: 300,
      primary_color: "#0066cc",
      secondary_color: "#f8f9fa",
      accent_color: "#ff6b35",
      font_family_primary: "Inter, sans-serif",
      font_family_secondary: "Roboto, sans-serif"
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colores
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tipografías
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

              <Separator />

              {/* Typography Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tamaños de Texto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="section_title_size">Títulos de Sección (px)</Label>
                    <Input
                      id="section_title_size"
                      type="number"
                      value={formData.section_title_size}
                      onChange={(e) => handleInputChange('section_title_size', parseInt(e.target.value) || 0)}
                      min={12}
                      max={48}
                    />
                  </div>
                  <div>
                    <Label htmlFor="section_subtitle_size">Subtítulos (px)</Label>
                    <Input
                      id="section_subtitle_size"
                      type="number"
                      value={formData.section_subtitle_size}
                      onChange={(e) => handleInputChange('section_subtitle_size', parseInt(e.target.value) || 0)}
                      min={10}
                      max={32}
                    />
                  </div>
                  <div>
                    <Label htmlFor="section_text_size">Texto Normal (px)</Label>
                    <Input
                      id="section_text_size"
                      type="number"
                      value={formData.section_text_size}
                      onChange={(e) => handleInputChange('section_text_size', parseInt(e.target.value) || 0)}
                      min={8}
                      max={24}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Search & Home Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Elementos Principales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Caja de Búsqueda</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="search_box_width">Ancho (px)</Label>
                        <Input
                          id="search_box_width"
                          type="number"
                          value={formData.search_box_width}
                          onChange={(e) => handleInputChange('search_box_width', parseInt(e.target.value) || 0)}
                          min={200}
                          max={800}
                        />
                      </div>
                      <div>
                        <Label htmlFor="search_box_height">Alto (px)</Label>
                        <Input
                          id="search_box_height"
                          type="number"
                          value={formData.search_box_height}
                          onChange={(e) => handleInputChange('search_box_height', parseInt(e.target.value) || 0)}
                          min={30}
                          max={80}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Sección Principal</h4>
                    <div>
                      <Label htmlFor="home_section_height">Altura (px)</Label>
                      <Input
                        id="home_section_height"
                        type="number"
                        value={formData.home_section_height}
                        onChange={(e) => handleInputChange('home_section_height', parseInt(e.target.value) || 0)}
                        min={200}
                        max={1000}
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

              <Separator />

              {/* Mobile Typography */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tamaños de Texto Móvil</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="mobile_section_title_size">Títulos (px)</Label>
                    <Input
                      id="mobile_section_title_size"
                      type="number"
                      value={formData.mobile_section_title_size}
                      onChange={(e) => handleInputChange('mobile_section_title_size', parseInt(e.target.value) || 0)}
                      min={10}
                      max={32}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_section_subtitle_size">Subtítulos (px)</Label>
                    <Input
                      id="mobile_section_subtitle_size"
                      type="number"
                      value={formData.mobile_section_subtitle_size}
                      onChange={(e) => handleInputChange('mobile_section_subtitle_size', parseInt(e.target.value) || 0)}
                      min={8}
                      max={24}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_section_text_size">Texto Normal (px)</Label>
                    <Input
                      id="mobile_section_text_size"
                      type="number"
                      value={formData.mobile_section_text_size}
                      onChange={(e) => handleInputChange('mobile_section_text_size', parseInt(e.target.value) || 0)}
                      min={8}
                      max={20}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mobile Elements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Elementos Móviles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Búsqueda Móvil</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="mobile_search_box_width">Ancho (px)</Label>
                        <Input
                          id="mobile_search_box_width"
                          type="number"
                          value={formData.mobile_search_box_width}
                          onChange={(e) => handleInputChange('mobile_search_box_width', parseInt(e.target.value) || 0)}
                          min={200}
                          max={400}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mobile_search_box_height">Alto (px)</Label>
                        <Input
                          id="mobile_search_box_height"
                          type="number"
                          value={formData.mobile_search_box_height}
                          onChange={(e) => handleInputChange('mobile_search_box_height', parseInt(e.target.value) || 0)}
                          min={30}
                          max={50}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Home Móvil</h4>
                    <div>
                      <Label htmlFor="mobile_home_section_height">Altura (px)</Label>
                      <Input
                        id="mobile_home_section_height"
                        type="number"
                        value={formData.mobile_home_section_height}
                        onChange={(e) => handleInputChange('mobile_home_section_height', parseInt(e.target.value) || 0)}
                        min={200}
                        max={600}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Paleta de Colores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="primary_color">Color Primario</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="w-16"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        placeholder="#0066cc"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Botones principales, enlaces</p>
                  </div>
                  <div>
                    <Label htmlFor="secondary_color">Color Secundario</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-16"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        placeholder="#f8f9fa"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Fondos, áreas secundarias</p>
                  </div>
                  <div>
                    <Label htmlFor="accent_color">Color de Acento</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="accent_color"
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        className="w-16"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        placeholder="#ff6b35"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Destacados, ofertas</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="h-20 rounded-lg flex items-center justify-center text-white font-medium" style={{ backgroundColor: formData.primary_color }}>
                    Primario
                  </div>
                  <div className="h-20 rounded-lg flex items-center justify-center border font-medium" style={{ backgroundColor: formData.secondary_color }}>
                    Secundario
                  </div>
                  <div className="h-20 rounded-lg flex items-center justify-center text-white font-medium" style={{ backgroundColor: formData.accent_color }}>
                    Acento
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fonts" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Familias Tipográficas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="font_family_primary">Tipografía Principal</Label>
                    <Input
                      id="font_family_primary"
                      value={formData.font_family_primary}
                      onChange={(e) => handleInputChange('font_family_primary', e.target.value)}
                      placeholder="Inter, sans-serif"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Para títulos y elementos principales</p>
                    <div 
                      className="mt-3 p-3 border rounded text-lg"
                      style={{ fontFamily: formData.font_family_primary }}
                    >
                      Ejemplo de texto principal
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="font_family_secondary">Tipografía Secundaria</Label>
                    <Input
                      id="font_family_secondary"
                      value={formData.font_family_secondary}
                      onChange={(e) => handleInputChange('font_family_secondary', e.target.value)}
                      placeholder="Roboto, sans-serif"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Para texto de contenido y descripciones</p>
                    <div 
                      className="mt-3 p-3 border rounded"
                      style={{ fontFamily: formData.font_family_secondary }}
                    >
                      Ejemplo de texto secundario con más contenido
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Tipografías Recomendadas</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Para títulos:</strong>
                      <ul className="mt-1 space-y-1">
                        <li>Inter, sans-serif</li>
                        <li>Poppins, sans-serif</li>
                        <li>Montserrat, sans-serif</li>
                        <li>Raleway, sans-serif</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Para contenido:</strong>
                      <ul className="mt-1 space-y-1">
                        <li>Roboto, sans-serif</li>
                        <li>Open Sans, sans-serif</li>
                        <li>Lato, sans-serif</li>
                        <li>Source Sans Pro, sans-serif</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}