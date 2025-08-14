import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Tipo que define la estructura de una pregunta de encuesta de satisfacción.
 * 
 * @interface SurveyQuestion
 */
export type SurveyQuestion = {
  /** Identificador único de la pregunta */
  id: number;
  /** Texto de la pregunta en español */
  question: string;
  /** Tipo de pregunta: calificación, texto libre o múltiple opción */
  type: "rating" | "text" | "multiple_choice";
  /** Opciones disponibles para preguntas de múltiple opción (null para otros tipos) */
  options: string[] | null;
  /** Indica si la pregunta es obligatoria de responder */
  required: boolean;
  /** Orden de aparición de la pregunta en la encuesta */
  order: number;
  /** Indica si la pregunta está activa y debe mostrarse */
  isActive: boolean;
  /** ID de la sede a la que pertenece esta pregunta */
  branchId: number;
  /** Fecha y hora de creación de la pregunta */
  createdAt: Date;
  /** Fecha y hora de última actualización de la pregunta */
  updatedAt: Date;
};

/**
 * Tipo que define la estructura de una encuesta de satisfacción enviada.
 * 
 * @interface Survey
 */
export type Survey = {
  /** Identificador único de la encuesta */
  id: number;
  /** ID del usuario que recibió la encuesta */
  userId: number;
  /** ID del servicio al que corresponde la encuesta */
  serviceId: number;
  /** ID de la sede donde se realizó el servicio */
  branchId: number;
  /** Token único para acceso público a la encuesta */
  token: string;
  /** Estado actual de la encuesta */
  status: "pending" | "completed" | "expired";
  /** Fecha y hora de creación de la encuesta */
  createdAt: Date;
  /** Fecha y hora de completación (null si no está completada) */
  completedAt: Date | null;
  /** Información del usuario que recibió la encuesta */
  user: {
    id: number;
    username: string;
    email: string;
  };
  /** Información del servicio relacionado */
  service: {
    id: number;
    name: string;
  };
  /** Información de la sede relacionada */
  branch: {
    id: number;
    name: string;
  };
};

/**
 * Tipo que define la estructura de una respuesta individual a una pregunta de encuesta.
 * 
 * @interface SurveyResponse
 */
export type SurveyResponse = {
  /** Identificador único de la respuesta */
  id: number;
  /** ID de la encuesta a la que pertenece esta respuesta */
  surveyId: number;
  /** ID de la pregunta que se está respondiendo */
  questionId: number;
  /** Respuesta en texto (para preguntas de texto o múltiple opción) */
  answer: string;
  /** Calificación numérica (para preguntas tipo rating, 1-5 estrellas) */
  rating: number | null;
  /** Fecha y hora cuando se envió la respuesta */
  createdAt: Date;
  /** Información de la pregunta respondida */
  question: {
    id: number;
    question: string;
    type: string;
  };
};

/**
 * Tipo que define los datos necesarios para crear una nueva pregunta de encuesta.
 * 
 * @interface CreateSurveyQuestionData
 */
export type CreateSurveyQuestionData = {
  /** Texto de la pregunta a crear */
  question: string;
  /** Tipo de pregunta que se va a crear */
  type: "rating" | "text" | "multiple_choice";
  /** Opciones para preguntas de múltiple opción (opcional) */
  options?: string[];
  /** Indica si la pregunta será obligatoria */
  required: boolean;
  /** Posición de la pregunta en el orden de la encuesta */
  order: number;
  /** ID de la sede a la que pertenecerá esta pregunta */
  branchId: number;
};

/**
 * Tipo que define los datos opcionales para actualizar una pregunta existente.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 * 
 * @interface UpdateSurveyQuestionData
 */
export type UpdateSurveyQuestionData = Partial<CreateSurveyQuestionData> & {
  /** Permite activar o desactivar la pregunta */
  isActive?: boolean;
};

/**
 * Tipo que define la estructura completa de analytics y métricas de encuestas.
 * Incluye estadísticas generales, distribuciones y respuestas recientes.
 * 
 * @interface SurveyAnalytics
 */
export type SurveyAnalytics = {
  /** Número total de encuestas creadas */
  totalSurveys: number;
  /** Número de encuestas completadas por los usuarios */
  completedSurveys: number;
  /** Número de encuestas pendientes de completar */
  pendingSurveys: number;
  /** Número de encuestas que expiraron sin completar */
  expiredSurveys: number;
  /** Tasa de completación como porcentaje (0-100) */
  completionRate: number;
  /** Calificación promedio de todas las encuestas completadas */
  averageRating: number;
  /** Distribución de calificaciones por número de estrellas */
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  /** Estadísticas de respuestas agrupadas por servicio */
  responsesByService: {
    serviceId: number;
    serviceName: string;
    count: number;
    averageRating: number;
  }[];
  /** Estadísticas de respuestas agrupadas por sede */
  responsesByBranch: {
    branchId: number;
    branchName: string;
    count: number;
    averageRating: number;
  }[];
  /** Lista de las respuestas más recientes con información completa */
  recentResponses: {
    id: number;
    surveyId: number;
    questionId: number;
    answer: string;
    rating: number | null;
    createdAt: Date;
    survey: {
      user: {
        username: string;
      };
      service: {
        name: string;
      };
      branch: {
        name: string;
      };
    };
    question: {
      question: string;
      type: string;
    };
  }[];
};

/**
 * Hook personalizado para la gestión completa del sistema de encuestas de satisfacción.
 * 
 * Proporciona todas las operaciones necesarias para:
 * - Gestionar preguntas de encuesta (CRUD)
 * - Administrar encuestas enviadas
 * - Obtener analytics y métricas
 * - Reenviar emails de encuesta
 * - Crear nuevas encuestas desde la gestión de cola
 * 
 * @returns Objeto con datos, estados de carga y funciones de mutación
 * 
 * @example
 * ```tsx
 * function SurveysManagement() {
 *   const { 
 *     questions, 
 *     surveys, 
 *     analytics,
 *     createQuestion,
 *     updateQuestion,
 *     deleteQuestion,
 *     resendEmail
 *   } = useSurveys();
 * 
 *   const handleCreateQuestion = () => {
 *     createQuestion({
 *       question: "¿Qué tan satisfecho está con el servicio?",
 *       type: "rating",
 *       required: true,
 *       order: 1
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {questions?.map(q => <QuestionCard key={q.id} question={q} />)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * ### Características principales:
 * 
 * **📊 Datos disponibles:**
 * - `questions`: Lista de preguntas de encuesta
 * - `surveys`: Lista de encuestas enviadas
 * - `analytics`: Métricas y estadísticas completas
 * 
 * **🔄 Operaciones CRUD:**
 * - `createQuestion`: Crear nueva pregunta
 * - `updateQuestion`: Actualizar pregunta existente
 * - `deleteQuestion`: Eliminar pregunta
 * 
 * **📧 Gestión de encuestas:**
 * - `createSurvey`: Crear encuesta desde gestión de cola
 * - `resendEmail`: Reenviar email de encuesta
 * 
 * **⏳ Estados de carga:**
 * - Estados individuales para cada operación
 * - Indicadores de loading para UI responsiva
 * 
 * ### Dependencias:
 * - `@tanstack/react-query`: Para gestión de estado del servidor
 * - `useToast`: Para notificaciones de usuario
 * - `useTranslation`: Para mensajes internacionalizados
 * 
 * ### Manejo de errores:
 * - Todos los errores se muestran via toast notifications
 * - Mensajes de error internacionalizados
 * - Invalidación automática de queries en mutaciones exitosas
 */
export function useSurveys() {
  /** Instancia de toast para mostrar notificaciones al usuario */
  const { toast } = useToast();
  /** Cliente de React Query para invalidar queries tras mutaciones */
  const queryClient = useQueryClient();
  /** Hook de traducción para mensajes internacionalizados */
  const { t } = useTranslation();

  // === QUERIES PARA OBTENER DATOS ===
  
  /** Query para obtener la lista de preguntas de encuesta disponibles */
  // Fetch survey questions
  const { data: questions, isLoading: isQuestionsLoading } = useQuery<SurveyQuestion[]>({
    queryKey: ['/api/survey-questions'],
    queryFn: async () => {
      const response = await fetch('/api/survey-questions', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch survey questions');
      }
      return response.json();
    }
  });

  /** Función helper para obtener preguntas filtradas por sede */
  const getQuestionsByBranch = (branchId?: number) => {
    if (!branchId) return questions || [];
    return (questions || []).filter(q => q.branchId === branchId);
  };

  /** Query para obtener la lista completa de encuestas enviadas */
  // Fetch surveys
  const { data: surveys, isLoading: isSurveysLoading } = useQuery<Survey[]>({
    queryKey: ['/api/surveys/list'],
    queryFn: async () => {
      const response = await fetch('/api/surveys/list', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch surveys');
      }
      return response.json();
    }
  });

  /** Query para obtener analytics, métricas y estadísticas de las encuestas */
  // Fetch survey analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<SurveyAnalytics>({
    queryKey: ['/api/surveys/all'],
    queryFn: async () => {
      const response = await fetch('/api/surveys/all', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch survey analytics');
      }
      return response.json();
    }
  });

  // === MUTATIONS PARA GESTIÓN DE PREGUNTAS ===

  /** Mutación para crear una nueva pregunta de encuesta */
  // Create survey question
  const createQuestionMutation = useMutation({
    mutationFn: async (data: CreateSurveyQuestionData) => {
      const response = await fetch('/api/survey-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
      toast({
        title: t('surveys.questionCreated'),
        description: t('surveys.questionCreatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /** Mutación para actualizar una pregunta de encuesta existente */
  // Update survey question
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: number; data: UpdateSurveyQuestionData }) => {
      const response = await fetch(`/api/survey-questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
      toast({
        title: t('surveys.questionUpdated'),
        description: t('surveys.questionUpdatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /** Mutación para eliminar una pregunta de encuesta */
  // Delete survey question
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await fetch(`/api/survey-questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
      toast({
        title: t('surveys.questionDeleted'),
        description: t('surveys.questionDeletedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  // === MUTATIONS PARA GESTIÓN DE ENCUESTAS ===

  /** Mutación para reenviar el email de una encuesta a un usuario */
  // Resend survey email
  const resendEmailMutation = useMutation({
    mutationFn: async (surveyId: number) => {
      const response = await fetch(`/api/surveys/${surveyId}/resend-email`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('surveys.emailResent'),
        description: t('surveys.emailResentDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /** Mutación para crear una nueva encuesta desde la gestión de cola */
  // Create survey from queue management
  const createSurveyMutation = useMutation({
    mutationFn: async (data: { 
      appointmentId?: number; 
      queueId?: number; 
      emailAddress?: string; 
      patientName?: string 
    }) => {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/surveys/all'] });
      toast({
        title: t('surveys.surveyCreated'),
        description: t('surveys.surveyCreatedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  return {
    // === DATOS PRINCIPALES ===
    /** Lista de preguntas de encuesta configuradas */
    questions,
    /** Lista de encuestas enviadas a usuarios */
    surveys,
    /** Métricas y estadísticas completas de encuestas */
    analytics,
    /** Función helper para filtrar preguntas por sede */
    getQuestionsByBranch,
    
    // === ESTADOS DE CARGA PARA QUERIES ===
    /** Indica si se están cargando las preguntas */
    isQuestionsLoading,
    /** Indica si se están cargando las encuestas */
    isSurveysLoading,
    /** Indica si se están cargando los analytics */
    isAnalyticsLoading,
    
    // === FUNCIONES DE MUTACIÓN ===
    /** Crear una nueva pregunta de encuesta */
    createQuestion: createQuestionMutation.mutate,
    /** Actualizar una pregunta existente */
    updateQuestion: updateQuestionMutation.mutate,
    /** Eliminar una pregunta de encuesta */
    deleteQuestion: deleteQuestionMutation.mutate,
    /** Reenviar email de encuesta a un usuario */
    resendEmail: resendEmailMutation.mutate,
    /** Crear nueva encuesta desde gestión de cola */
    createSurvey: createSurveyMutation.mutate,
    
    // === ESTADOS DE CARGA PARA MUTACIONES ===
    /** Indica si se está creando una pregunta */
    isCreatingQuestion: createQuestionMutation.isPending,
    /** Indica si se está actualizando una pregunta */
    isUpdatingQuestion: updateQuestionMutation.isPending,
    /** Indica si se está eliminando una pregunta */
    isDeletingQuestion: deleteQuestionMutation.isPending,
    /** Indica si se está reenviando un email */
    isResendingEmail: resendEmailMutation.isPending,
    /** Indica si se está creando una encuesta */
    isCreatingSurvey: createSurveyMutation.isPending,
  };
}

/**
 * Hook especializado para el acceso público a encuestas de satisfacción.
 * 
 * Este hook permite que los usuarios accedan y respondan encuestas sin necesidad
 * de autenticación, utilizando únicamente el token único de la encuesta.
 * Es utilizado en la página pública de encuestas que se accede via QR o enlace directo.
 * 
 * @param token - Token único de la encuesta para acceso público
 * @returns Objeto con datos de la encuesta, estados de carga y función para enviar respuestas
 * 
 * @example
 * ```tsx
 * function PublicSurveyPage() {
 *   const { token } = useParams();
 *   const { 
 *     survey, 
 *     isLoading, 
 *     error, 
 *     submitResponse, 
 *     isSubmitting 
 *   } = usePublicSurvey(token);
 * 
 *   const handleSubmit = () => {
 *     const responses = [
 *       { questionId: 1, numericValue: 5 },
 *       { questionId: 2, response: "Excelente servicio" }
 *     ];
 *     submitResponse(responses);
 *   };
 * 
 *   return (
 *     <div>
 *       {survey?.questions.map(q => <QuestionCard key={q.id} question={q} />)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * ### Características principales:
 * 
 * **🔓 Acceso sin autenticación:**
 * - No requiere login del usuario
 * - Acceso via token único y seguro
 * - Ideal para encuestas post-servicio
 * 
 * **📋 Datos disponibles:**
 * - `survey`: Información completa de la encuesta y preguntas
 * - `isLoading`: Estado de carga inicial
 * - `error`: Manejo de errores (encuesta no encontrada, expirada, etc.)
 * 
 * **📤 Envío de respuestas:**
 * - `submitResponse`: Función para enviar respuestas de la encuesta
 * - `isSubmitting`: Estado de carga durante el envío
 * - Validación automática de respuestas requeridas
 * 
 * ### Estructura de respuestas:
 * ```typescript
 * const responses = [
 *   { questionId: 1, numericValue: 4 },      // Pregunta tipo rating
 *   { questionId: 2, response: "Muy bien" }, // Pregunta tipo texto
 *   { questionId: 3, response: "Opción A" }  // Pregunta múltiple opción
 * ];
 * ```
 * 
 * ### Manejo de errores:
 * - Encuesta no encontrada (404)
 * - Encuesta expirada o ya completada
 * - Errores de validación en respuestas
 * - Notificaciones automáticas via toast
 */
export function usePublicSurvey(token: string) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['/api/surveys/token', token],
    queryFn: async () => {
      const response = await fetch(`/api/surveys/token/${token}`);
      if (!response.ok) {
        throw new Error('Survey not found or expired');
      }
      return response.json();
    },
    enabled: !!token,
  });

  const submitResponseMutation = useMutation({
    mutationFn: async (responses: { questionId: number; response?: string; numericValue?: number }[]) => {
      const response = await fetch(`/api/surveys/${survey?.survey?.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('surveys.responseSubmitted'),
        description: t('surveys.responseSubmittedDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  return {
    survey,
    isLoading,
    error,
    submitResponse: submitResponseMutation.mutate,
    isSubmitting: submitResponseMutation.isPending,
  };
}
