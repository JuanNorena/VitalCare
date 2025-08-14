import { useState } from "react";
import { useSurveys, type SurveyQuestion } from "@/hooks/use-surveys";
import { useBranches } from "@/hooks/use-branches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Clock, 
  Star,
  Plus,
  Edit,
  Trash2,
  Mail,
  Eye,
  Building2,
  Filter
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuestionDialog } from "@/components/surveys/question-dialog";
import { QuestionsList } from "@/components/surveys/questions-list";
import { SurveysList } from "@/components/surveys/surveys-list";

/**
 * Componente principal para la gestión completa del sistema de encuestas de satisfacción.
 * 
 * Esta página de administración proporciona una interfaz completa para:
 * - Visualizar analytics y métricas de las encuestas
 * - Gestionar preguntas de encuesta (crear, editar, eliminar)
 * - Administrar encuestas enviadas y reenviar emails
 * 
 * La interfaz está organizada en tres pestañas principales:
 * 1. **Analytics**: Dashboards con gráficos y métricas de satisfacción
 * 2. **Preguntas**: CRUD completo para gestionar las preguntas de las encuestas
 * 3. **Encuestas**: Lista de encuestas enviadas con opciones de reenvío de email
 * 
 * @returns Componente React que renderiza la página completa de gestión de encuestas
 * 
 * @example
 * ```tsx
 * import SurveysManagement from "@/pages/admin/surveys";
 * 
 * function AdminLayout() {
 *   return (
 *     <div>
 *       <SurveysManagement />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * ### Funcionalidades Principales:
 * 
 * **📊 Analytics Dashboard:**
 * - Métricas generales (total encuestas, tasa de completación, rating promedio)
 * - Gráficos de respuestas por servicio y por sede (Bar Charts, layout 2 columnas)
 * - Lista de respuestas recientes con detalles (ancha, debajo de los gráficos)
 * 
 * **❓ Gestión de Preguntas:**
 * - Crear nuevas preguntas con diferentes tipos (rating, texto, múltiple opción)
 * - Editar preguntas existentes
 * - Configurar orden y requerimiento de preguntas
 * - Activar/desactivar preguntas
 * 
 * **📋 Gestión de Encuestas:**
 * - Ver lista completa de encuestas enviadas
 * - Filtrar por estado (pendiente, completada, expirada)
 * - Reenviar emails de encuesta cuando sea necesario
 * - Ver detalles de respuestas individuales
 * 
 * ### Dependencias:
 * - `useSurveys`: Hook personalizado para todas las operaciones de encuestas
 * - `Recharts`: Biblioteca para gráficos interactivos
 * - `date-fns`: Formateo de fechas con soporte de localización
 * - `react-i18next`: Internacionalización completa
 * 
 * ### Estados de Carga:
 * El componente maneja múltiples estados de carga simultáneos para:
 * - Datos de analytics
 * - Lista de preguntas
 * - Lista de encuestas
 * - Operaciones de reenvío de email
 * 
 * ### Responsive Design:
 * - Diseño adaptativo usando CSS Grid
 * - Gráficos responsivos con ResponsiveContainer
 * - Layout optimizado para dispositivos móviles y desktop
 */
export default function SurveysManagement() {
  /** Hook personalizado que proporciona todas las operaciones relacionadas con encuestas */
  const { 
    questions,           // Lista de preguntas de encuesta disponibles
    surveys,             // Lista de encuestas enviadas
    analytics,           // Datos de métricas y analytics
    isQuestionsLoading,  // Estado de carga para preguntas
    isSurveysLoading,    // Estado de carga para encuestas
    isAnalyticsLoading,  // Estado de carga para analytics
    resendEmail,         // Función para reenviar emails de encuesta
    isResendingEmail,    // Estado de carga para reenvío de emails
    getQuestionsByBranch // Función helper para filtrar preguntas por sede
  } = useSurveys();
  
  /** Hook para obtener lista de sedes disponibles */
  const { branches } = useBranches();
  
  /** Estado para controlar la visibilidad del modal de creación/edición de preguntas */
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  
  /** Estado para almacenar la pregunta que se está editando (null para crear nueva) */
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  
  /** Estado para filtrar preguntas por sede */
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  /** Hook de traducción para internacionalización */
  const { t } = useTranslation();

  /**
   * Datos formateados para el gráfico de respuestas por servicio.
   * Muestra los 5 servicios con más respuestas.
   */
  const serviceData = analytics?.responsesByService?.slice(0, 5).map(item => ({
    name: item.serviceName,
    responses: item.count,
    rating: item.averageRating
  })) || [];

  /**
   * Datos formateados para el gráfico de respuestas por sede.
   * Muestra las 5 sedes con más respuestas.
   */
  const branchData = analytics?.responsesByBranch?.slice(0, 5).map(item => ({
    name: item.branchName,
    responses: item.count,
    rating: item.averageRating
  })) || [];

  /**
   * Obtiene las preguntas filtradas por sede si hay una seleccionada
   */
  const filteredQuestions = selectedBranchId 
    ? getQuestionsByBranch(selectedBranchId)
    : questions || [];

  /**
   * Abre el modal para crear una nueva pregunta.
   * Limpia el estado de edición para asegurar que se cree una pregunta nueva.
   */
  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionDialogOpen(true);
  };

  /**
   * Abre el modal para editar una pregunta existente.
   * 
   * @param question - La pregunta que se va a editar
   */
  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  /**
   * Maneja el cambio de filtro por sede
   */
  const handleBranchFilterChange = (branchId: string) => {
    setSelectedBranchId(branchId === "all" ? null : parseInt(branchId));
  };

  /**
   * Reenvía el email de encuesta a un usuario específico.
   * 
   * @param surveyId - ID de la encuesta para la cual reenviar el email
   */
  const handleResendEmail = (surveyId: number) => {
    resendEmail(surveyId);
  };

  /**
   * Renderiza el estado de carga mientras se obtienen los datos.
   * Muestra un spinner centrado con mensaje de carga internacionalizado.
   */
  if (isQuestionsLoading || isSurveysLoading || isAnalyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Encabezado principal con título y descripción */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('surveys.title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('surveys.description')}
        </p>
      </div>

      {/* Sistema de pestañas principal para organizar las diferentes secciones */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger 
            value="analytics" 
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('surveys.analyticsTitle')}</span>
              <span className="sm:hidden text-xs">{t('surveys.analyticsShort')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="questions" 
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('surveys.questionsTitle')}</span>
              <span className="sm:hidden text-xs">{t('surveys.questionsShort')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="surveys" 
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('surveys.surveysTitle')}</span>
              <span className="sm:hidden text-xs">{t('surveys.surveysShort')}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: Analytics Dashboard con métricas y gráficos */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          {/* Tarjetas de métricas generales: total, completación, rating, pendientes */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">
                  {t('surveys.totalSurveys')}
                </CardTitle>
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{analytics?.totalSurveys || 0}</div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">
                  {t('surveys.completionRate')}
                </CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {analytics?.completionRate ? `${analytics.completionRate.toFixed(1)}%` : t('common.noData')}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">
                  {t('surveys.averageRating')}
                </CardTitle>
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold flex items-center">
                  {analytics?.averageRating ? analytics.averageRating.toFixed(1) : t('common.noData')}
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 ml-1 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">
                  {t('surveys.pendingSurveys')}
                </CardTitle>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{analytics?.pendingSurveys || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Sección de gráficos con respuestas por servicio y sede */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Gráfico de barras: Respuestas agrupadas por servicio (top 5) */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">{t('surveys.responsesByService')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={serviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de barras: Respuestas agrupadas por sede (top 5) */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">{t('surveys.responsesByBranch')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={branchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Lista de respuestas recientes: Muestra las últimas 5 respuestas con detalles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('surveys.recentResponses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {analytics?.recentResponses?.slice(0, 5).map((response) => (
                  <div key={response.id} className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium">
                        <span className="truncate">{response.survey.user.username}</span>
                        <span className="text-muted-foreground mx-2">•</span>
                        <span className="text-muted-foreground text-xs sm:text-sm">{response.survey.service.name}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {response.question.question}
                      </p>
                      <p className="text-sm">
                        {response.rating ? (
                          <span className="flex items-center">
                            {response.rating} <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                          </span>
                        ) : (
                          <span className="break-words">{response.answer}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(response.createdAt), 'PPp', { locale: es })}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    {t('surveys.noAnalytics')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 2: Gestión de Preguntas con CRUD completo */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold">{t('surveys.questionsTitle')}</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Filtro por sede */}
              <Select
                value={selectedBranchId ? selectedBranchId.toString() : "all"}
                onValueChange={handleBranchFilterChange}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('surveys.allBranches')}</SelectItem>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Botón para crear nueva pregunta */}
              <Button onClick={handleCreateQuestion} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('surveys.createQuestion')}</span>
                <span className="sm:hidden">{t('surveys.createQuestionShort')}</span>
              </Button>
            </div>
          </div>

          {/* Lista de preguntas existentes con opciones de edición */}
          <QuestionsList 
            questions={filteredQuestions}
            onEdit={handleEditQuestion}
          />

          {/* Modal para crear/editar preguntas */}
          <QuestionDialog
            open={isQuestionDialogOpen}
            onOpenChange={setIsQuestionDialogOpen}
            question={editingQuestion}
          />
        </TabsContent>

        {/* PESTAÑA 3: Gestión de Encuestas enviadas con reenvío de emails */}
        <TabsContent value="surveys" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold">{t('surveys.surveysTitle')}</h2>
          </div>

          {/* Lista de encuestas enviadas con funcionalidad de reenvío */}
          <SurveysList 
            surveys={surveys || []}
            onResendEmail={handleResendEmail}
            isResending={isResendingEmail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}