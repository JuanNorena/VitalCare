/**
 * Componentes de tarjeta reutilizables para la aplicación VitalCare.
 *
 * Este módulo proporciona un sistema de componentes de tarjeta compuesto que permite
 * crear layouts estructurados y consistentes. Utiliza variables CSS personalizadas
 * para mantener la coherencia con el tema de la aplicación y soporta modo oscuro.
 *
 * @component
 * @example
 * ```tsx
 * import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
 *
 * function MyCard() {
 *   return (
 *     <Card>
 *       <CardHeader>
 *         <CardTitle>Título de la tarjeta</CardTitle>
 *         <CardDescription>Descripción opcional</CardDescription>
 *       </CardHeader>
 *       <CardContent>
 *         <p>Contenido principal de la tarjeta</p>
 *       </CardContent>
 *       <CardFooter>
 *         <Button>Acción</Button>
 *       </CardFooter>
 *     </Card>
 *   );
 * }
 * ```
 *
 * @description
 * Los componentes utilizan React.forwardRef para permitir el acceso directo a los elementos DOM,
 * facilitando el manejo de foco y otras interacciones. Cada componente tiene clases base
 * que se pueden extender mediante la prop className.
 *
 * Componentes disponibles:
 * - Card: Contenedor principal con borde y sombra.
 * - CardHeader: Encabezado con padding y espaciado.
 * - CardTitle: Título con estilos de encabezado.
 * - CardDescription: Descripción con texto gris.
 * - CardContent: Contenido principal con padding.
 * - CardFooter: Pie con flexbox para acciones.
 *
 * @see {@link cn} para la utilidad de combinación de clases CSS.
 */

import * as React from "react"
import { cn } from "@/utils/cn"

/**
 * Componente Card principal que actúa como contenedor base.
 * Renderiza un div con estilos de tarjeta incluyendo borde, fondo y sombra.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props estándar de div.
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div.
 * @returns {JSX.Element} El contenedor de tarjeta renderizado.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-[var(--vc-border)] bg-[var(--vc-card-bg)] text-[var(--vc-text)] shadow-sm transition-all duration-200 hover:shadow-md",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * Componente CardHeader para el encabezado de la tarjeta.
 * Proporciona espaciado y layout vertical para títulos y descripciones.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props estándar de div.
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div.
 * @returns {JSX.Element} El encabezado de tarjeta renderizado.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

/**
 * Componente CardTitle para el título de la tarjeta.
 * Renderiza un h3 con estilos de encabezado semibold y tamaños responsivos.
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - Props estándar de heading.
 * @param {React.Ref<HTMLParagraphElement>} ref - Referencia al elemento h3.
 * @returns {JSX.Element} El título de tarjeta renderizado.
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl sm:text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Componente CardDescription para la descripción de la tarjeta.
 * Renderiza un párrafo con texto gris y tamaños responsivos.
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Props estándar de párrafo.
 * @param {React.Ref<HTMLParagraphElement>} ref - Referencia al elemento p.
 * @returns {JSX.Element} La descripción de tarjeta renderizada.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm sm:text-base text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Componente CardContent para el contenido principal de la tarjeta.
 * Proporciona padding interno con márgenes superiores reducidos.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props estándar de div.
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div.
 * @returns {JSX.Element} El contenido de tarjeta renderizado.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * Componente CardFooter para el pie de la tarjeta.
 * Utiliza flexbox para alinear elementos horizontalmente con padding.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props estándar de div.
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div.
 * @returns {JSX.Element} El pie de tarjeta renderizado.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
