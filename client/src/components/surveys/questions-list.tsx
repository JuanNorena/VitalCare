import { useState } from "react";
import { useSurveys, type SurveyQuestion } from "@/hooks/use-surveys";
import { useBranches } from "@/hooks/use-branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Star, MessageSquare, List, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Props para el componente QuestionsList.
 * 
 * @interface QuestionsListProps
 */
interface QuestionsListProps {
  /** Lista de preguntas de encuesta a mostrar */
  questions: SurveyQuestion[];
  /** Función callback para editar una pregunta (null para crear nueva) */
  onEdit: (question: SurveyQuestion) => void;
}

/**
 * Componente que renderiza una lista completa de preguntas de encuesta con funcionalidades CRUD.
 * 
 * Este componente proporciona una interfaz administrativa para gestionar las preguntas
 * que componen las encuestas de satisfacción. Permite visualizar, editar, activar/desactivar
 * y eliminar preguntas, con diferentes tipos de preguntas soportados (rating, texto, múltiple opción).
 * 
 * @param props - Las propiedades del componente
 * @param props.questions - Lista de preguntas a mostrar
 * @param props.onEdit - Función para abrir el diálogo de edición de una pregunta
 * @returns Componente React que renderiza la lista de preguntas
 * 
 * @example
 * ```tsx
 * function SurveysManagement() {
 *   const { questions } = useSurveys();
 *   const [editingQuestion, setEditingQuestion] = useState(null);
 * 
 *   const handleEditQuestion = (question: SurveyQuestion) => {
 *     setEditingQuestion(question);
 *     setIsQuestionDialogOpen(true);
 *   };
 * 
 *   return (
 *     <QuestionsList 
 *       questions={questions || []}
 *       onEdit={handleEditQuestion}
 *     />
 *   );
 * }
 * ```
 * 
 * @remarks
 * ### Funcionalidades principales:
 * 
 * **📋 Visualización de preguntas:**
 * - Lista ordenada por número de orden
 * - Diferentes tipos de pregunta con iconos específicos
 * - Estados visuales (activa/inactiva, requerida/opcional)
 * - Previsualización de opciones para preguntas de múltiple opción
 * 
 * **✏️ Gestión de preguntas:**
 * - Switch para activar/desactivar preguntas
 * - Botón de edición que abre el modal de edición
 * - Eliminación con confirmación via AlertDialog
 * - Indicadores de estado de carga durante operaciones
 * 
 * **🎨 Tipos de pregunta soportados:**
 * - **Rating**: Calificación por estrellas (1-5)
 * - **Text**: Respuesta de texto libre
 * - **Multiple Choice**: Selección entre opciones predefinidas
 * 
 * **🔄 Estados y validaciones:**
 * - Ordenamiento automático por campo `order`
 * - Preguntas inactivas mostradas con opacidad reducida
 * - Badges informativos para estado requerido/opcional
 * - Confirmación obligatoria antes de eliminar
 * 
 * ### Interacciones disponibles:
 * - **Activar/Desactivar**: Switch para cambiar estado activo
 * - **Editar**: Botón que trigerea el callback `onEdit`
 * - **Eliminar**: AlertDialog con confirmación de eliminación
 * 
 * ### Estado vacío:
 * Cuando no hay preguntas, muestra una interfaz amigable con:
 * - Mensaje explicativo sobre la funcionalidad
 * - Botón directo para crear la primera pregunta
 * - Icono representativo y diseño centrado
 * 
 * ### Elementos visuales especiales:
 * - **Número de orden**: Círculo con el orden de la pregunta
 * - **Iconos por tipo**: Star (rating), MessageSquare (text), List (multiple choice)
 * - **Escala de rating**: Visualización de estrellas para preguntas tipo rating
 * - **Opciones**: Tags con las opciones para preguntas de múltiple opción
 */
export function QuestionsList({ questions, onEdit }: QuestionsListProps) {
  /** Hook para operaciones de encuestas (actualizar, eliminar, estados) */
  const { updateQuestion, deleteQuestion, isUpdatingQuestion, isDeletingQuestion } = useSurveys();
  /** Hook para obtener información de las sedes */
  const { branches } = useBranches();
  /** Hook de traducción para internacionalización */
  const { t } = useTranslation();
  /** Estado local para trackear cuál pregunta se está eliminando */
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /** Lista de preguntas ordenadas por el campo 'order' */
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  /**
   * Obtiene el nombre de la sede por su ID
   */
  const getBranchName = (branchId: number) => {
    const branch = branches?.find(b => b.id === branchId);
    return branch?.name || t('surveys.unknownBranch');
  };

  /**
   * Maneja el cambio de estado activo/inactivo de una pregunta.
   * 
   * @param question - La pregunta cuyo estado se va a cambiar
   */
  const handleStatusToggle = (question: SurveyQuestion) => {
    updateQuestion({
      questionId: question.id,
      data: { isActive: !question.isActive }
    });
  };

  /**
   * Maneja la eliminación de una pregunta con confirmación.
   * Establece el ID de la pregunta que se está eliminando para mostrar loading.
   * 
   * @param questionId - ID de la pregunta a eliminar
   */
  const handleDelete = (questionId: number) => {
    setDeletingId(questionId);
    deleteQuestion(questionId);
  };

  /**
   * Retorna el ícono apropiado para cada tipo de pregunta.
   * 
   * @param type - Tipo de pregunta (rating, text, multiple_choice)
   * @returns Componente de ícono correspondiente al tipo
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rating":
        return <Star className="h-4 w-4" />;
      case "text":
        return <MessageSquare className="h-4 w-4" />;
      case "multiple_choice":
        return <List className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  /**
   * Retorna la etiqueta traducida para cada tipo de pregunta.
   * 
   * @param type - Tipo de pregunta
   * @returns Texto traducido del tipo de pregunta
   */
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "rating":
        return t('surveys.rating');
      case "text":
        return t('surveys.text');
      case "multiple_choice":
        return t('surveys.multipleChoice');
      default:
        return type;
    }
  };

  // Renderizar estado vacío cuando no hay preguntas configuradas
  if (sortedQuestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('surveys.noQuestions')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('surveys.noQuestionsDescription', 'No hay preguntas de encuesta configuradas. Crea la primera pregunta para comenzar.')}
          </p>
          <Button onClick={() => onEdit(null as any)} variant="outline">
            {t('surveys.createFirstQuestion')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Renderizar lista de preguntas con todas las funcionalidades CRUD
  return (
    <div className="space-y-3 sm:space-y-4">
      {sortedQuestions.map((question) => (
        <Card key={question.id} className={`${!question.isActive ? 'opacity-60' : ''}`}>
          {/* Header con información de la pregunta y controles */}
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
              <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                {/* Círculo con número de orden */}
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold text-primary">{question.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Título de la pregunta */}
                  <CardTitle className="text-sm sm:text-base leading-tight">{question.question}</CardTitle>
                  {/* Badges con información del tipo, sede y estado */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      {getTypeIcon(question.type)}
                      <span className="hidden sm:inline">{getTypeLabel(question.type)}</span>
                      <span className="sm:hidden">{getTypeLabel(question.type).charAt(0)}</span>
                    </Badge>
                    {/* Badge para la sede */}
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate max-w-20 sm:max-w-none">{getBranchName(question.branchId)}</span>
                    </Badge>
                    {/* Badge para preguntas requeridas */}
                    {question.required && (
                      <Badge variant="destructive" className="text-xs">
                        {t('surveys.required')}
                      </Badge>
                    )}
                    {/* Badge para preguntas inactivas */}
                    {!question.isActive && (
                      <Badge variant="outline" className="text-xs">
                        {t('common.inactive')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Controles: Switch de activación, botón editar y botón eliminar */}
              <div className="flex items-center justify-end space-x-1 sm:space-x-2 flex-shrink-0">
                {/* Switch para activar/desactivar la pregunta */}
                <Switch
                  checked={question.isActive}
                  onCheckedChange={() => handleStatusToggle(question)}
                  disabled={isUpdatingQuestion}
                />
                {/* Botón para editar la pregunta */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(question)}
                  disabled={isUpdatingQuestion}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                {/* AlertDialog para confirmar eliminación */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeletingQuestion && deletingId === question.id}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('surveys.deleteQuestionConfirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('surveys.deleteQuestionWarning')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(question.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          {/* Contenido adicional para preguntas de múltiple opción */}
          {question.type === "multiple_choice" && question.options && question.options.length > 0 && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('surveys.options')}:</p>
                {/* Lista de opciones como badges */}
                <div className="flex flex-wrap gap-1">
                  {question.options.map((option, index) => (
                    <Badge key={index} variant="outline" className="text-xs max-w-32 truncate">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
          
          {/* Contenido adicional para preguntas de rating: mostrar escala de estrellas */}
          {question.type === "rating" && (
            <CardContent className="pt-0">
              <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                <span className="hidden sm:inline">{t('surveys.ratingScale')} 1</span>
                <span className="sm:hidden">1</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span>5</span>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
