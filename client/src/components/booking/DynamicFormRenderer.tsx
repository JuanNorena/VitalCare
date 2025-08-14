import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

/**
 * Representa un campo individual de un formulario dinámico
 * @interface FormField
 */
interface FormField {
  /** Identificador único del campo */
  id: number;
  /** ID del formulario al que pertenece este campo */
  formId: number;
  /** Nombre único del campo usado como clave en los datos */
  name: string;
  /** Etiqueta visible para el usuario */
  label: string;
  /** Tipo de campo que determina el componente de entrada a renderizar */
  type: "text" | "number" | "email" | "date" | "select" | "checkbox" | "textarea";
  /** Indica si el campo es obligatorio */
  required: boolean;
  /** Opciones disponibles para campos de tipo select (formato JSON) */
  options?: any;
  /** Orden de visualización del campo en el formulario */
  order: number;
  /** Texto de ayuda opcional que se muestra debajo del campo */
  helperText?: string;
}

/**
 * Representa la estructura completa de un formulario dinámico
 * @interface DynamicForm
 */
interface DynamicForm {
  /** Identificador único del formulario */
  id: number;
  /** Nombre descriptivo del formulario */
  name: string;
  /** Descripción opcional del formulario */
  description?: string;
  /** Estado de activación del formulario */
  isActive: boolean;
  /** Array de campos que componen el formulario */
  fields: FormField[];
}

/**
 * Propiedades del componente DynamicFormRenderer
 * @interface DynamicFormRendererProps
 */
interface DynamicFormRendererProps {
  /** Formulario dinámico a renderizar */
  form: DynamicForm;
  /** Valores actuales de los campos del formulario */
  values: Record<string, any>;
  /** Función callback ejecutada cuando cambia el valor de un campo */
  onChange: (fieldName: string, value: any) => void;
  /** Errores de validación por campo (opcional) */
  errors?: Record<string, string>;
  /** Indica si el formulario está deshabilitado (opcional) */
  disabled?: boolean;
}

/**
 * Componente para renderizar formularios dinámicos con validación y manejo de errores
 * 
 * @description
 * Este componente permite mostrar formularios configurables dinámicamente con diferentes tipos
 * de campos (texto, número, email, fecha, select, checkbox, textarea). Incluye soporte para
 * validación, errores, campos obligatorios y estados deshabilitados.
 * 
 * @example
 * ```tsx
 * const form = {
 *   id: 1,
 *   name: "Formulario de Contacto",
 *   description: "Complete sus datos de contacto",
 *   isActive: true,
 *   fields: [
 *     {
 *       id: 1,
 *       formId: 1,
 *       name: "nombre",
 *       label: "Nombre completo",
 *       type: "text",
 *       required: true,
 *       order: 1
 *     }
 *   ]
 * };
 * 
 * <DynamicFormRenderer
 *   form={form}
 *   values={formValues}
 *   onChange={handleFieldChange}
 *   errors={validationErrors}
 * />
 * ```
 * 
 * @param props - Propiedades del componente
 * @returns Elemento JSX que representa el formulario dinámico
 * 
 * @since 1.0.0
 */
export function DynamicFormRenderer({
  form,
  values,
  onChange,
  errors = {},
  disabled = false
}: DynamicFormRendererProps) {
  const { t } = useTranslation();

  /**
   * Renderiza un campo individual del formulario según su tipo
   * 
   * @description
   * Esta función se encarga de crear el componente de entrada apropiado para cada tipo
   * de campo, aplicando validaciones, estilos de error y configuraciones específicas.
   * Soporta los siguientes tipos: text, email, number, date, textarea, select, checkbox.
   * 
   * @param field - Configuración del campo a renderizar
   * @returns Elemento JSX del campo renderizado
   * 
   * @internal
   */
  const renderField = (field: FormField) => {
    /** Valor actual del campo */
    const fieldValue = values[field.name] || '';
    /** Indica si el campo tiene errores de validación */
    const hasError = !!errors[field.name];
    /** ID único para el elemento HTML del campo */
    const fieldId = `dynamic-field-${field.id}`;

    /**
     * Maneja los cambios de valor en el campo
     * @param value - Nuevo valor del campo
     */
    const handleChange = (value: any) => {
      onChange(field.name, value);
    };

    switch (field.type) {
      // Campos de texto simple y email
      case 'text':
      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={field.name}
              type={field.type}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.helperText || `${t('common.enter')} ${field.label.toLowerCase()}`}
              disabled={disabled}
              required={field.required}
              className={hasError ? 'border-red-500 focus:border-red-500' : ''}
            />
            {field.helperText && !hasError && (
              <p className="text-xs text-gray-500">{field.helperText}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      // Campo numérico con conversión automática
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={field.name}
              type="number"
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
              placeholder={field.helperText || `${t('common.enter')} ${field.label.toLowerCase()}`}
              disabled={disabled}
              required={field.required}
              className={hasError ? 'border-red-500 focus:border-red-500' : ''}
            />
            {field.helperText && !hasError && (
              <p className="text-xs text-gray-500">{field.helperText}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      // Campo de fecha con selector nativo
      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={field.name}
              type="date"
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              required={field.required}
              className={hasError ? 'border-red-500 focus:border-red-500' : ''}
            />
            {field.helperText && !hasError && (
              <p className="text-xs text-gray-500">{field.helperText}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      // Campo de texto multilínea
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              name={field.name}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.helperText || `${t('common.enter')} ${field.label.toLowerCase()}`}
              disabled={disabled}
              required={field.required}
              rows={3}
              className={`resize-none ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {field.helperText && !hasError && (
              <p className="text-xs text-gray-500">{field.helperText}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      // Campo de selección con opciones predefinidas
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue || ''}
              onValueChange={handleChange}
              disabled={disabled}
              required={field.required}
            >
              <SelectTrigger className={hasError ? 'border-red-500 focus:border-red-500' : ''}>
                <SelectValue placeholder={field.helperText || t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any, index: number) => (
                  <SelectItem key={index} value={option.value || option}>
                    {option.label || option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helperText && !hasError && (
              <p className="text-xs text-gray-500">{field.helperText}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        );

      // Campo de casilla de verificación
      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={fieldId}
                name={field.name}
                checked={!!fieldValue}
                onCheckedChange={handleChange}
                disabled={disabled}
                required={field.required}
                className={hasError ? 'border-red-500' : ''}
              />
              <div className="flex-1">
                <Label htmlFor={fieldId} className="text-sm font-medium cursor-pointer">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.helperText && !hasError && (
                  <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>
                )}
                {hasError && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
                )}
              </div>
            </div>
          </div>
        );

      // Tipo de campo no soportado
      default:
        return (
          <div key={field.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              {t('dynamicForm.unsupportedFieldType', { type: field.type })}
            </p>
          </div>
        );
    }
  };

  // Renderizado principal del componente
  return (
    <div className="space-y-4">
      {/* Descripción opcional del formulario */}
      {form.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">{form.description}</p>
        </div>
      )}
      
      {/* Renderizado de campos ordenados */}
      {form.fields
        .sort((a, b) => a.order - b.order)
        .map(renderField)}
    </div>
  );
}

/**
 * Exportación por defecto del componente DynamicFormRenderer
 * @default DynamicFormRenderer
 */
export default DynamicFormRenderer;
