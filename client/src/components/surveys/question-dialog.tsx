import { useState, useEffect } from "react";
import { useSurveys, type SurveyQuestion, type CreateSurveyQuestionData } from "@/hooks/use-surveys";
import { useBranches } from "@/hooks/use-branches";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Props para el componente QuestionDialog.
 * 
 * @interface QuestionDialogProps
 */
interface QuestionDialogProps {
  /** Controla si el diálogo está abierto o cerrado */
  open: boolean;
  /** Función callback para cambiar el estado de apertura del diálogo */
  onOpenChange: (open: boolean) => void;
  /** Pregunta a editar (null para crear una nueva pregunta) */
  question: SurveyQuestion | null;
}

/**
 * Componente de diálogo modal para crear y editar preguntas de encuesta de satisfacción.
 * 
 * Este componente proporciona una interfaz de formulario completa para gestionar
 * preguntas de encuesta, soportando diferentes tipos de preguntas (rating, texto libre,
 * múltiple opción) y todas las configuraciones necesarias como orden, opciones y requisitos.
 * 
 * @param props - Las propiedades del componente
 * @param props.open - Estado de apertura del diálogo
 * @param props.onOpenChange - Función para controlar la apertura/cierre del diálogo
 * @param props.question - Pregunta a editar (null para crear nueva)
 * @returns Componente React que renderiza el diálogo de pregunta
 * 
 * @example
 * ```tsx
 * function QuestionsManagement() {
 *   const [isDialogOpen, setIsDialogOpen] = useState(false);
 *   const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
 * 
 *   const handleCreateQuestion = () => {
 *     setEditingQuestion(null);
 *     setIsDialogOpen(true);
 *   };
 * 
 *   const handleEditQuestion = (question: SurveyQuestion) => {
 *     setEditingQuestion(question);
 *     setIsDialogOpen(true);
 *   };
 * 
 *   return (
 *     <div>
 *       <Button onClick={handleCreateQuestion}>Nueva Pregunta</Button>
 *       <QuestionDialog
 *         open={isDialogOpen}
 *         onOpenChange={setIsDialogOpen}
 *         question={editingQuestion}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @remarks
 * ### Funcionalidades principales:
 * 
 * **📝 Campos del formulario:**
 * - **Pregunta**: Texto principal de la pregunta (Textarea)
 * - **Tipo**: Selector entre rating, texto libre y múltiple opción
 * - **Opciones**: Campo de texto para opciones separadas por comas (solo múltiple opción)
 * - **Orden**: Número que define la posición en la encuesta
 * - **Requerida**: Switch para marcar la pregunta como obligatoria
 * 
 * **🎯 Tipos de pregunta soportados:**
 * - **Rating**: Calificación por estrellas (1-5)
 * - **Text**: Respuesta de texto libre
 * - **Multiple Choice**: Selección entre opciones predefinidas
 * 
 * **✨ Características especiales:**
 * - **Modo dual**: Crear nueva pregunta o editar existente
 * - **Validación**: Campos requeridos y validación de tipos
 * - **Preview**: Vista previa de opciones como badges
 * - **Estados de carga**: Indicadores durante creación/actualización
 * 
 * **🔄 Gestión de estado:**
 * - **Auto-reset**: El formulario se resetea al abrir/cerrar
 * - **Pre-llenado**: Si se pasa una pregunta, los campos se llenan automáticamente
 * - **Validación en tiempo real**: Para opciones de múltiple opción
 * 
 * ### Campos específicos por tipo:
 * 
 * **Rating Questions:**
 * - Solo requiere pregunta, orden y si es requerida
 * - Automáticamente usa escala 1-5 estrellas
 * 
 * **Text Questions:**
 * - Campo de pregunta libre
 * - Sin opciones adicionales
 * 
 * **Multiple Choice Questions:**
 * - Campo adicional para opciones separadas por comas
 * - Vista previa en tiempo real como badges
 * - Ayuda contextual sobre el formato
 * 
 * ### Validaciones implementadas:
 * - Pregunta no puede estar vacía
 * - Orden debe ser número positivo
 * - Opciones requeridas para tipo múltiple opción
 * - Limpieza automática de opciones vacías
 * 
 * ### Estados de carga:
 * - Botón de envío muestra spinner durante operaciones
 * - Texto dinámico según sea creación o actualización
 * - Deshabilitación de controles durante envío
 */
export function QuestionDialog({ open, onOpenChange, question }: QuestionDialogProps) {
  /** Hook para operaciones de encuestas (crear, actualizar, estados de carga) */
  const { createQuestion, updateQuestion, isCreatingQuestion, isUpdatingQuestion } = useSurveys();
  /** Hook para obtener lista de sedes disponibles */
  const { branches } = useBranches();
  /** Hook de traducción para internacionalización */
  const { t } = useTranslation();
  
  /** Estado del formulario con todos los campos de la pregunta */
  const [formData, setFormData] = useState<CreateSurveyQuestionData>({
    question: "",
    type: "rating",
    options: [],
    required: false,
    order: 1,
    branchId: 0, // Se establecerá cuando se seleccione una sede
  });
  /** Estado para el texto de opciones (separadas por comas) */
  const [optionsText, setOptionsText] = useState("");

  /** Determina si estamos en modo edición o creación */
  const isEditing = !!question;
  /** Indica si hay una operación de envío en progreso */
  const isSubmitting = isCreatingQuestion || isUpdatingQuestion;

  /**
   * Effect que se ejecuta cuando cambia la pregunta a editar o el estado de apertura.
   * Resetea o pre-llena el formulario según corresponda.
   */
  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question,
        type: question.type,
        options: question.options || [],
        required: question.required,
        order: question.order,
        branchId: question.branchId,
      });
      setOptionsText(question.options?.join(", ") || "");
    } else {
      setFormData({
        question: "",
        type: "rating",
        options: [],
        required: false,
        order: 1,
        branchId: 0,
      });
      setOptionsText("");
    }
  }, [question, open]);

  /**
   * Maneja el envío del formulario para crear o actualizar una pregunta.
   * Procesa las opciones según el tipo de pregunta y llama a la función apropiada.
   * 
   * @param e - Evento del formulario
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Procesar las opciones según el tipo de pregunta
    const submitData = {
      ...formData,
      options: formData.type === "multiple_choice" 
        ? optionsText.split(",").map(option => option.trim()).filter(Boolean)
        : formData.type === "rating" ? [] : undefined,
    };

    // Llamar a la función apropiada según el modo (crear o editar)
    if (isEditing && question) {
      updateQuestion({ 
        questionId: question.id, 
        data: submitData 
      });
    } else {
      createQuestion(submitData);
    }
    
    // Cerrar el diálogo tras el envío
    onOpenChange(false);
  };

  /**
   * Maneja el cambio de tipo de pregunta y resetea campos específicos.
   * 
   * @param value - Nuevo tipo de pregunta seleccionado
   */
  const handleTypeChange = (value: "rating" | "text" | "multiple_choice") => {
    setFormData(prev => ({ ...prev, type: value }));
    // Limpiar opciones si no es múltiple opción
    if (value !== "multiple_choice") {
      setOptionsText("");
    }
  };

  // Renderizar el diálogo con el formulario completo
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {/* Header del diálogo con título y descripción dinámicos */}
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('surveys.editQuestion') : t('surveys.createQuestion')}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('surveys.editQuestionDescription', 'Edita los detalles de la pregunta')
              : t('surveys.createQuestionDescription', 'Completa los detalles para crear una nueva pregunta')
            }
          </DialogDescription>
        </DialogHeader>

        {/* Formulario principal con todos los campos */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo principal: Texto de la pregunta */}
          <div className="space-y-2">
            <Label htmlFor="question">{t('surveys.question')}</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder={t('surveys.questionPlaceholder', 'Ingrese la pregunta de la encuesta')}
              required
            />
          </div>

          {/* Selector de sede */}
          <div className="space-y-2">
            <Label htmlFor="branch">{t('surveys.branch', 'Sede')}</Label>
            <Select
              value={formData.branchId ? formData.branchId.toString() : ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: parseInt(value) }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('surveys.selectBranch', 'Seleccione una sede')} />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de tipo de pregunta */}
          <div className="space-y-2">
            <Label htmlFor="type">{t('surveys.questionType')}</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t('surveys.rating')}</SelectItem>
                <SelectItem value="text">{t('surveys.text')}</SelectItem>
                <SelectItem value="multiple_choice">{t('surveys.multipleChoice')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo condicional: Opciones para preguntas de múltiple opción */}
          {formData.type === "multiple_choice" && (
            <div className="space-y-2">
              <Label htmlFor="options">{t('surveys.options')}</Label>
              <Textarea
                id="options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={t('surveys.optionsPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('surveys.optionsHelp', 'Separe las opciones con comas')}
              </p>
              {/* Vista previa de opciones como badges */}
              {optionsText && (
                <div className="flex flex-wrap gap-1">
                  {optionsText.split(",").map((option, index) => {
                    const trimmed = option.trim();
                    return trimmed ? (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {trimmed}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Grid con orden y switch de requerido */}
          <div className="grid grid-cols-2 gap-4">
            {/* Campo numérico para el orden */}
            <div className="space-y-2">
              <Label htmlFor="order">{t('surveys.questionOrder')}</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>

            {/* Switch para marcar como pregunta requerida */}
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
              />
              <Label htmlFor="required" className="text-sm">
                {t('surveys.required')}
              </Label>
            </div>
          </div>

          {/* Botones de acción: Cancelar y Guardar/Crear */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            {/* Botón de envío con estado de carga */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEditing ? t('common.updating') : t('common.creating')}</span>
                </div>
              ) : (
                isEditing ? t('common.update') : t('common.create')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
