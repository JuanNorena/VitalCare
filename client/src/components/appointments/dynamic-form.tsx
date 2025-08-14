/**
 * @fileoverview Componente para renderizado de formularios dinámicos
 * 
 * Este componente permite crear y renderizar formularios dinámicos basados en una configuración
 * de campos. Soporta diferentes tipos de campos como texto, email, número, textarea, select,
 * checkbox y fecha. Incluye validación automática, manejo de errores y presentación visual mejorada.
 * 
 * @features
 * - Soporte para múltiples tipos de campos (text, email, number, textarea, select, checkbox, date)
 * - Validación automática con mensajes de error contextuales
 * - Iconografía contextual para cada tipo de campo
 * - Tooltips informativos para campos con texto de ayuda
 * - Estados visuales mejorados (errores, carga, hover)
 * - Separadores visuales para mejor organización
 * - Badges informativos para campos requeridos/opcionales
 * - Animaciones suaves y transiciones
 * 
 * @example
 * ```tsx
 * const form = {
 *   id: 1,
 *   name: "Formulario de Contacto",
 *   description: "Complete sus datos para contacto",
 *   fields: [
 *     {
 *       id: 1,
 *       name: "nombre",
 *       label: "Nombre Completo",
 *       type: "text",
 *       required: true,
 *       order: 1,
 *       helperText: "Ingrese su nombre y apellidos"
 *     }
 *   ]
 * };
 * 
 * <DynamicForm
 *   form={form}
 *   onSubmit={(data) => console.log(data)}
 *   onCancel={() => navigate(-1)}
 *   isSubmitting={false}
 * />
 * ```
 * 
 * @version 2.0.0
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  HelpCircle, 
  FileText, 
  Mail, 
  Hash, 
  Calendar, 
  CheckSquare, 
  List,
  Type,
  AlertCircle,
  Sparkles
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

/**
 * @interface FormField
 * @description Definición de un campo individual del formulario dinámico
 */
interface FormField {
  /** Identificador único del campo */
  id: number;
  /** Nombre interno del campo para el manejo de datos */
  name: string;
  /** Etiqueta visible para el usuario */
  label: string;
  /** Tipo de campo (text, email, number, textarea, select, checkbox, date) */
  type: string;
  /** Indica si el campo es obligatorio */
  required: boolean;
  /** Opciones separadas por comas para campos tipo select */
  options?: string;
  /** Orden de presentación del campo */
  order: number;
  /** Texto de ayuda que se muestra en tooltip */
  helperText?: string;
}

/**
 * @interface Form
 * @description Configuración completa del formulario dinámico
 */
interface Form {
  /** Identificador único del formulario */
  id: number;
  /** Nombre del formulario */
  name: string;
  /** Descripción opcional del formulario */
  description: string | null;
  /** Lista de campos que componen el formulario */
  fields: FormField[];
}

/**
 * @interface DynamicFormProps
 * @description Propiedades del componente DynamicForm
 */
interface DynamicFormProps {
  /** Configuración del formulario a renderizar */
  form: Form;
  /** Función callback ejecutada al enviar el formulario */
  onSubmit: (formData: Record<string, any>) => void;
  /** Función callback ejecutada al cancelar */
  onCancel: () => void;
  /** Indica si el formulario está en proceso de envío */
  isSubmitting?: boolean;
  /** Datos iniciales para pre-llenar el formulario */
  initialData?: Record<string, any>;
}

/**
 * @component DynamicForm
 * @description Componente principal para renderizado de formularios dinámicos
 * 
 * Renderiza formularios basados en configuración JSON, con validación automática,
 * iconografía contextual, y presentación visual mejorada.
 * 
 * @param {DynamicFormProps} props - Propiedades del componente
 * @returns {JSX.Element} Formulario dinámico renderizado
 */
export function DynamicForm({ form, onSubmit, onCancel, isSubmitting, initialData = {} }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    // Inicializar con initialData si está disponible
    return Object.keys(initialData).length > 0 ? initialData : {};
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();
  // Solo actualizar formData si initialData cambia y formData está vacío
  useEffect(() => {
    if (Object.keys(initialData).length > 0 && Object.keys(formData).length === 0) {
      setFormData(initialData);
    }
  }, [initialData]); // Removido formData de las dependencias para evitar loops
  // Memoizar campos ordenados para evitar re-cálculos
  const sortedFields = useMemo(() => {
    return [...form.fields].sort((a, b) => a.order - b.order);
  }, [form.fields]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Limpiar error si existe
    setErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    sortedFields.forEach(field => {
      if (field.required) {
        const value = formData[field.name];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.name] = t('validation.required');
        }
      }

      // Validaciones específicas por tipo
      if (formData[field.name]) {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData[field.name])) {
              newErrors[field.name] = t('validation.invalidEmail');
            }
            break;
          case 'number':
            if (isNaN(Number(formData[field.name]))) {
              newErrors[field.name] = t('validation.mustBeNumber');
            }
            break;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };  /**
   * @function getFieldIcon
   * @description Obtiene el icono contextual según el tipo de campo
   * @param {string} fieldType - Tipo de campo
   * @returns {JSX.Element} Icono correspondiente
   */
  const getFieldIcon = (fieldType: string) => {
    const iconProps = { className: "h-4 w-4 text-muted-foreground" };
    
    switch (fieldType) {
      case 'text':
        return <Type {...iconProps} />;
      case 'email':
        return <Mail {...iconProps} />;
      case 'number':
        return <Hash {...iconProps} />;
      case 'textarea':
        return <FileText {...iconProps} />;
      case 'select':
        return <List {...iconProps} />;
      case 'checkbox':
        return <CheckSquare {...iconProps} />;
      case 'date':
        return <Calendar {...iconProps} />;
      default:
        return <Type {...iconProps} />;
    }
  };

  /**
   * @function renderField
   * @description Renderiza un campo individual del formulario con mejoras visuales
   * @param {FormField} field - Configuración del campo a renderizar
   * @returns {JSX.Element} Campo renderizado con iconografía y validación
   */
  const renderField = (field: FormField) => {
    const fieldValue = formData[field.name] ?? '';
    const hasError = !!errors[field.name];

    /**
     * @function renderLabel
     * @description Renderiza la etiqueta del campo con iconografía y tooltips
     */
    const renderLabel = () => (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getFieldIcon(field.type)}
          <Label htmlFor={field.name} className={`font-medium ${hasError ? 'text-destructive' : ''}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.helperText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{field.helperText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {field.required ? (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              {t('dynamicForm.required')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {t('dynamicForm.optional')}
            </Badge>
          )}
        </div>
      </div>
    );    /**
     * @function renderError
     * @description Renderiza mensajes de error con iconografía mejorada
     */
    const renderError = () => (
      hasError && (
        <div className="flex items-center space-x-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{errors[field.name]}</p>
        </div>
      )
    );

    // Contenedor común para todos los campos
    const fieldContainer = (children: React.ReactNode) => (
      <div key={field.id} className="group space-y-3 p-4 rounded-lg border border-muted/50 hover:border-muted transition-colors duration-200 hover:shadow-sm">
        {children}
      </div>
    );    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return fieldContainer(
          <>
            {renderLabel()}
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`transition-all duration-200 ${
                hasError 
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                  : 'focus:border-primary hover:border-primary/50'
              }`}
              placeholder={t('dynamicForm.placeholders.' + field.type)}
              required={field.required}
            />
            {renderError()}
          </>
        );

      case 'textarea':
        return fieldContainer(
          <>
            {renderLabel()}
            <Textarea
              id={field.name}
              name={field.name}
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`min-h-[100px] transition-all duration-200 ${
                hasError 
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                  : 'focus:border-primary hover:border-primary/50'
              }`}
              placeholder={t('dynamicForm.placeholders.textarea')}
              required={field.required}
            />
            {renderError()}
          </>
        );

      case 'select':
        const options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return fieldContainer(
          <>
            {renderLabel()}
            <Select
              value={fieldValue}
              onValueChange={(value) => handleFieldChange(field.name, value)}
              required={field.required}
            >
              <SelectTrigger className={`transition-all duration-200 ${
                hasError 
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                  : 'focus:border-primary hover:border-primary/50'
              }`}>
                <SelectValue placeholder={`${t('dynamicForm.selectPlaceholder')} ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => (
                  <SelectItem 
                    key={index} 
                    value={option}
                    className="hover:bg-primary/10 transition-colors duration-200"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderError()}
          </>
        );

      case 'checkbox':
        return fieldContainer(
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={field.name}
                  checked={fieldValue === true}
                  onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                  className={`transition-all duration-200 ${
                    hasError 
                      ? 'border-destructive data-[state=checked]:bg-destructive' 
                      : 'hover:border-primary data-[state=checked]:bg-primary'
                  }`}
                />
                <div className="flex items-center space-x-2">
                  {getFieldIcon(field.type)}
                  <Label htmlFor={field.name} className={`font-medium cursor-pointer ${hasError ? 'text-destructive' : ''}`}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.helperText && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{field.helperText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {field.required ? (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {t('dynamicForm.required')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {t('dynamicForm.optional')}
                  </Badge>
                )}
              </div>
            </div>
            {renderError()}
          </>
        );

      case 'date':
        return fieldContainer(
          <>
            {renderLabel()}
            <Input
              id={field.name}
              name={field.name}
              type="date"
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`transition-all duration-200 ${
                hasError 
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                  : 'focus:border-primary hover:border-primary/50'
              }`}
              required={field.required}
            />
            {renderError()}
          </>
        );

      default:
        return null;
    }
  };
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">{form.name}</CardTitle>
            {form.description && (
              <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              {t('dynamicForm.fieldsCount', { count: sortedFields.length })}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {sortedFields.filter(f => f.required).length} {t('dynamicForm.required').toLowerCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sortedFields.filter(f => !f.required).length} {t('dynamicForm.optional').toLowerCase()}
            </Badge>
          </div>
        </div>
        
        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
      </CardHeader>

      <CardContent className="space-y-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {sortedFields.map(renderField)}
          </div>
          
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 h-11 transition-all duration-200 hover:bg-muted hover:scale-105"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 transition-all duration-200 hover:scale-105 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('dynamicForm.submitting')}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>{t('common.submit')}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
