"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "./components/app-sidebar"
import { DashboardSection } from "./components/dashboard-section"
import { ProductosSection } from "./components/productos-section"
import { CategoriasSection } from "./components/categorias-section"
import { MarcasSection } from "./components/marcas-section"
import { PlanesSection } from "./components/planes-section"
import { ProductosPlanSection } from "./components/productos-plan-section"
import { useSupabaseData } from "./hooks/use-supabase-data"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserButton, useUser } from "@clerk/nextjs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function Dashboard() {
  const { user, isLoaded } = useUser()
  const [activeSection, setActiveSection] = useState("dashboard")
  const { 
    productos, 
    planes, 
    productosPorPlan, 
    categorias,
    marcas,
    loading, 
    error,
    createProducto,
    updateProducto,
    deleteProducto,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    createMarca,
    updateMarca,
    deleteMarca,
    createPlan,
    updatePlan,
    deletePlan,
    createProductoPlan,
    updateProductoPlan,
    deleteProductoPlan,
    refreshData
  } = useSupabaseData()

  // Escuchar cambios en los hash de la URL
  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash) {
        setActiveSection(hash)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    handleHashChange() // Ejecutar al cargar

    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Si Clerk aún está cargando, mostrar loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando autenticación...</div>
      </div>
    )
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    // Usar useEffect para redirección del lado del cliente
    useEffect(() => {
      window.location.href = '/sign-in'
    }, [])
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirigiendo al login...</div>
      </div>
    )
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case "productos":
        return "Productos"
      case "categorias":
        return "Categorías"
      case "marcas":
        return "Marcas"
      case "planes":
        return "Planes de Financiación"
      case "productos-plan":
        return "Productos por Plan"
      default:
        return "Dashboard"
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando datos...</div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      )
    }

    switch (activeSection) {
      case "productos":
        return (
          <ProductosSection 
            productos={productos} 
            categorias={categorias}
            marcas={marcas}
            onCreateProducto={createProducto}
            onUpdateProducto={updateProducto}
            onDeleteProducto={deleteProducto}
          />
        )
      case "categorias":
        return (
          <CategoriasSection 
            categorias={categorias} 
            onCreateCategoria={createCategoria}
            onUpdateCategoria={updateCategoria}
            onDeleteCategoria={deleteCategoria}
          />
        )
      case "marcas":
        return (
          <MarcasSection 
            marcas={marcas} 
            onCreateMarca={createMarca}
            onUpdateMarca={updateMarca}
            onDeleteMarca={deleteMarca}
          />
        )
      case "planes":
        return (
          <PlanesSection 
            planes={planes} 
            onCreatePlan={createPlan}
            onUpdatePlan={updatePlan}
            onDeletePlan={deletePlan}
          />
        )
      case "productos-plan":
        return (
          <ProductosPlanSection
            productos={productos}
            planes={planes}
            productosPorPlan={productosPorPlan}
            onCreateProductoPlan={createProductoPlan}
            onUpdateProductoPlan={updateProductoPlan}
            onDeleteProductoPlan={deleteProductoPlan}
          />
        )
      default:
        return <DashboardSection productos={productos} planes={planes} productosPorPlan={productosPorPlan} />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#dashboard">MundoCuotas Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{getSectionTitle()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{renderContent()}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Dashboard
