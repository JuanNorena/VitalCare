/**
 * @fileoverview Página de autenticación con formularios de login y registro
 * 
 * Este componente implementa una página de autenticación completa que permite
 * a los usuarios iniciar sesión o registrarse en el sistema. Incluye validación
 * de errores, animaciones suaves, y una experiencia de usuario optimizada.
 * 
 * **Características principales:**
 * - Formularios de login y registro con transiciones animadas
 * - Validación de errores internacionalizada
 * - Campos de contraseña con visibilidad toggleable
 * - Estados de carga con feedback visual
 * - Diseño responsive y accesible
 * - Altura fija para evitar saltos de layout
 * 
 * @version 2.0.0
 * @since 1.0.0
 * @lastModified 2025-06-24
 */

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Tipos de formulario disponibles en la página de autenticación.
 * @typedef {("login" | "register")} AuthFormType
 */
type AuthFormType = "login" | "register";

/**
 * Página principal de autenticación con formularios animados de login y registro.
 * 
 * Este componente proporciona una experiencia de autenticación completa con
 * transiciones suaves entre formularios, validación de errores, y estados
 * de carga optimizados para una mejor experiencia de usuario.
 * 
 * **Funcionalidades principales:**
 * 
 * **🔐 Autenticación Dual:**
 * - Formulario de inicio de sesión para usuarios existentes
 * - Formulario de registro para nuevos usuarios
 * - Transición animada entre ambos modos sin saltos de layout
 * 
 * **👁️ Contraseñas Seguras:**
 * - Campos de contraseña con visibilidad toggleable
 * - Estados separados para login y registro
 * - Iconos intuitivos para mostrar/ocultar contraseña
 * 
 * **⚠️ Manejo de Errores:**
 * - Validación de errores del servidor internacionalizada
 * - Mensajes específicos según el tipo de error
 * - Alertas visuales con iconografía apropiada
 * 
 * **🎨 UX Optimizada:**
 * - Altura fija del contenedor para evitar saltos
 * - Animaciones CSS para transiciones suaves
 * - Estados de carga con spinners y feedback visual
 * - Diseño responsive y accesible
 * 
 * @component
 * @example
 * ```tsx
 * // Uso en el router principal
 * <Route path="/auth" component={AuthPage} />
 * 
 * // Redirección automática si no está autenticado
 * const ProtectedRoute = ({ children }) => {
 *   const { user } = useUser();
 *   return user ? children : <Navigate to="/auth" />;
 * };
 * ```
 * 
 * @returns {JSX.Element} Página completa de autenticación con formularios animados
 * 
 * @see {@link useUser} Para gestión de autenticación y registro
 * @see {@link useTranslation} Para internacionalización de mensajes
 * 
 * @accessibility
 * - Labels asociados correctamente con inputs
 * - Screen reader support para botones de visibilidad
 * - Navegación por teclado funcional
 * - Contraste de colores apropiado
 * 
 * @responsive
 * - Layout adaptable para móviles y desktop
 * - Máximo ancho controlado en pantallas grandes
 * - Padding responsivo para diferentes tamaños
 */
export default function AuthPage() {
  // Estados principales del componente
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthFormType>("login");
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Hooks para autenticación y traducción
  const { login, register } = useUser();
  const { t } = useTranslation();

  /**
   * Maneja el cambio de tabs con animación suave.
   * 
   * Implementa una transición animada entre los formularios de login y registro,
   * evitando cambios abruptos y mejorando la experiencia visual del usuario.
   * 
   * @function handleTabChange
   * @param {AuthFormType} newTab - El tab de destino ("login" o "register")
   * @returns {void}
   * 
   * @since 2.0.0
   */
  const handleTabChange = (newTab: AuthFormType): void => {
    if (newTab === activeTab || isAnimating) return;
    
    setIsAnimating(true);
    setError(null); // Limpiar errores al cambiar de tab
    
    // Pequeño delay para la animación de salida
    setTimeout(() => {
      setActiveTab(newTab);
      setIsAnimating(false);
    }, 150);
  };

  /**
   * Efecto para resetear estados al cambiar de tab.
   * 
   * Limpia los estados de visibilidad de contraseñas y errores cuando
   * el usuario cambia entre formularios para una experiencia más limpia.
   * 
   * @effect
   * @since 2.0.0
   */
  useEffect(() => {
    // Reset password visibility states when changing tabs
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
  }, [activeTab]);

  /**
   * Maneja el envío de formularios de autenticación (login y registro).
   * 
   * Procesa tanto el inicio de sesión como el registro de usuarios, incluyendo
   * validación de errores, estados de carga, y traducción de mensajes de error
   * del servidor para proporcionar feedback claro al usuario.
   * 
   * @function handleSubmit
   * @param {React.FormEvent<HTMLFormElement>} e - Evento del formulario
   * @param {AuthFormType} type - Tipo de autenticación ("login" o "register")
   * @returns {Promise<void>}
   * 
   * @example
   * ```tsx
   * <form onSubmit={(e) => handleSubmit(e, "login")}>
   *   // campos del formulario
   * </form>
   * ```
   * 
   * @since 2.0.0
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    type: "login" | "register"
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        email: formData.get("email") as string,
      };

      if (type === "login") {
        await login(data);
      } else {
        await register(data);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      
      let errorMessage: string;
      if (error instanceof Error) {
        // Traducir mensajes de error comunes que podrían venir del servidor
        switch (error.message) {
          case "User not found":
            errorMessage = t("auth.errors.userNotFound");
            break;
          case "Incorrect password":
            errorMessage = t("auth.errors.incorrectPassword");
            break;
          case "Invalid credentials":
            errorMessage = t("auth.errors.invalidCredentials");
            break;
          case "Account is inactive":
            errorMessage = t("auth.errors.accountInactive");
            break;
          case "Username already exists":
            errorMessage = t("auth.errors.usernameExists");
            break;
          case "Email already exists":
            errorMessage = t("auth.errors.emailExists");
            break;
          case "Invalid email format":
            errorMessage = t("auth.errors.invalidEmail");
            break;
          case "Password too weak":
            errorMessage = t("auth.errors.passwordTooWeak");
            break;
          case "Username too short":
            errorMessage = t("auth.errors.usernameTooShort");
            break;
          case "Too many login attempts":
            errorMessage = t("auth.errors.tooManyAttempts");
            break;
          case "Network error":
            errorMessage = t("auth.errors.networkError");
            break;
          default:
            // Si no es un error específico, usar un mensaje genérico
            errorMessage = type === "login" 
              ? t("auth.errors.loginFailed") 
              : t("auth.errors.registerFailed");
        }
      } else {
        errorMessage = type === "login" 
          ? t("auth.errors.loginFailed") 
          : t("auth.errors.registerFailed");
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 rounded-xl overflow-hidden">
        {/* Header con branding y título */}
        <CardHeader className="text-center pb-4 px-6 pt-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {t("common.appTitle")}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {activeTab === "login" 
              ? t("auth.welcomeBack") 
              : t("auth.createAccount")
            }
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <div className="space-y-6">
            {/* Alert de error con animación */}
            {error && (
              <Alert 
                variant="destructive" 
                className="animate-in slide-in-from-top-2 duration-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Tab triggers con indicador animado */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleTabChange("login")}
                  disabled={isAnimating}
                  className={`relative z-10 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    activeTab === "login"
                      ? "text-gray-900 bg-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("auth.login")}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("register")}
                  disabled={isAnimating}
                  className={`relative z-10 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    activeTab === "register"
                      ? "text-gray-900 bg-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("auth.register")}
                </button>
              </div>
            </div>

            {/* Contenedor con altura adaptable para evitar saltos */}
            <div className="relative">
              <div className={`transition-all duration-300 ${activeTab === "register" ? "min-h-[320px]" : "min-h-[240px]"}`}>
                {/* Formulario de Login */}
                <div 
                  className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                    activeTab === "login"
                      ? "opacity-100 translate-x-0 pointer-events-auto"
                      : "opacity-0 -translate-x-4 pointer-events-none"
                  }`}
                >
                  <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-5">
                    {/* Campo Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        {t("auth.username")}
                      </Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        required
                        autoComplete="username"
                        disabled={isLoading}
                        className="h-11 px-3 border-gray-300 focus:border-primary focus:ring-primary/20"
                        placeholder={t("auth.usernamePlaceholder")}
                      />
                    </div>

                    {/* Campo Password con toggle de visibilidad */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        {t("auth.password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="h-11 px-3 pr-11 border-gray-300 focus:border-primary focus:ring-primary/20"
                          placeholder={t("auth.passwordPlaceholder")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 hover:bg-gray-100"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          disabled={isLoading}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="sr-only">
                            {showLoginPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {/* Botón de submit */}
                    <Button 
                      type="submit" 
                      className="w-full h-11 mt-8 bg-primary hover:bg-primary/90 text-white font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t("auth.loggingIn")}
                        </>
                      ) : (
                        t("auth.login")
                      )}
                    </Button>
                  </form>
                </div>

                {/* Formulario de Register */}
                <div 
                  className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                    activeTab === "register"
                      ? "opacity-100 translate-x-0 pointer-events-auto"
                      : "opacity-0 translate-x-4 pointer-events-none"
                  }`}
                >
                  <form onSubmit={(e) => handleSubmit(e, "register")} className="space-y-4">
                    {/* Campo Username */}
                    <div className="space-y-2">
                      <Label htmlFor="r-username" className="text-sm font-medium text-gray-700">
                        {t("auth.username")}
                      </Label>
                      <Input
                        id="r-username"
                        name="username"
                        type="text"
                        required
                        autoComplete="username"
                        disabled={isLoading}
                        className="h-11 px-3 border-gray-300 focus:border-primary focus:ring-primary/20"
                        placeholder={t("auth.usernamePlaceholder")}
                      />
                    </div>

                    {/* Campo Email */}
                    <div className="space-y-2">
                      <Label htmlFor="r-email" className="text-sm font-medium text-gray-700">
                        {t("auth.email")}
                      </Label>
                      <Input
                        id="r-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        disabled={isLoading}
                        className="h-11 px-3 border-gray-300 focus:border-primary focus:ring-primary/20"
                        placeholder={t("auth.emailPlaceholder")}
                      />
                    </div>

                    {/* Campo Password con toggle de visibilidad */}
                    <div className="space-y-2">
                      <Label htmlFor="r-password" className="text-sm font-medium text-gray-700">
                        {t("auth.password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="r-password"
                          name="password"
                          type={showRegisterPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          disabled={isLoading}
                          className="h-11 px-3 pr-11 border-gray-300 focus:border-primary focus:ring-primary/20"
                          placeholder={t("auth.passwordPlaceholder")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 hover:bg-gray-100"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          disabled={isLoading}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="sr-only">
                            {showRegisterPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {/* Botón de submit */}
                    <Button 
                      type="submit" 
                      className="w-full h-11 mt-6 bg-primary hover:bg-primary/90 text-white font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t("auth.registering")}
                        </>
                      ) : (
                        t("auth.registerButton")
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}