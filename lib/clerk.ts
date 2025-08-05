import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Configuración de rutas protegidas
export const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/productos(.*)',
  '/planes(.*)',
  '/productos-plan(.*)',
])

// Middleware de Clerk
export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
} 