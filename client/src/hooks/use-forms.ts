import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Form, FormField } from "@db/schema";

interface CreateFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface UpdateFormData {
  name: string;
  description: string;
}

interface CreateFieldData {
  formId: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
  order: number;
  helperText?: string;
}

interface UpdateFieldData {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
  order: number;
  helperText?: string;
}

interface FieldOrderItem {
  id: number;
  order: number;
}

interface UpdateFieldOrderData {
  formId: number;
  fields: FieldOrderItem[];
}

interface GenerateAIHelperTextData {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  formId: number;
}

export function useForms() {
  const queryClient = useQueryClient();
  const { data: forms, isLoading: isFormsLoading } = useQuery<Form[]>({
    queryKey: ['/api/forms'],
    queryFn: async () => {
      const response = await fetch('/api/forms', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }
      return response.json();
    }
  });

  const getFormFields = (formId: number) => {
    return useQuery<FormField[]>({
      queryKey: [`/api/forms/${formId}/fields`],
      queryFn: async () => {
        const response = await fetch(`/api/forms/${formId}/fields`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch form fields');
        }
        return response.json();
      },
      enabled: !!formId,
    });
  };

  const createForm = useMutation({
    mutationFn: async (data: CreateFormData) => {
      const response = await apiRequest('POST', '/api/forms', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
    }
  });

  const updateForm = useMutation({
    mutationFn: async ({ 
      formId, 
      data 
    }: { 
      formId: number;
      data: UpdateFormData;
    }) => {
      const response = await apiRequest('PUT', `/api/forms/${formId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
    }
  });

  const updateFormStatus = useMutation({
    mutationFn: async ({ 
      formId, 
      isActive 
    }: { 
      formId: number;
      isActive: boolean;
    }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/forms/${formId}/status`,
        { isActive }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
    }  });

  const deleteForm = useMutation({
    mutationFn: async (formId: number) => {
      const response = await apiRequest('DELETE', `/api/forms/${formId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
    }
  });

  const createField = useMutation({
    mutationFn: async (data: CreateFieldData) => {
      const response = await apiRequest('POST', '/api/form-fields', data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${variables.formId}/fields`] });
    }
  });

  const updateField = useMutation({
    mutationFn: async ({ 
      fieldId, 
      data 
    }: { 
      fieldId: number;
      data: UpdateFieldData;
    }) => {
      const response = await apiRequest('PUT', `/api/form-fields/${fieldId}`, data);
      return response.json();
    },
    onSuccess: (response) => {
      // Invalidar la consulta específica para los campos del formulario al que pertenece este campo
      if (response && response.formId) {
        queryClient.invalidateQueries({ queryKey: [`/api/forms/${response.formId}/fields`] });
      } else {
        // Fallback por si no podemos determinar el formId
        queryClient.invalidateQueries({ queryKey: ['/api/form-fields'] });
      }
    }
  });

  const deleteField = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await apiRequest('DELETE', `/api/form-fields/${fieldId}`);
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: (_, fieldId, context) => {
      // Necesitamos saber qué formId invalidar
      // Esto requiere que pasemos el formId en el context o recuperemos el formId del campo antes de eliminarlo
      // Como no tenemos esa información, invalidaremos todas las consultas de campos
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
    }
  });

  // New mutation for updating field order
  const updateFieldOrder = useMutation({
    mutationFn: async (data: UpdateFieldOrderData) => {
      const response = await apiRequest('POST', `/api/forms/${data.formId}/reorder-fields`, {
        fields: data.fields
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${variables.formId}/fields`] });
    }
  });

  // New mutation for generating AI helper text
  const generateAIHelperText = useMutation({
    mutationFn: async (data: GenerateAIHelperTextData) => {
      const response = await apiRequest('POST', '/api/form-fields/generate-helper-text', data);
      const result = await response.json();
      return result.helperText;
    }
  });
  return {
    forms,
    isFormsLoading,
    getFormFields,
    createForm,
    updateForm,
    updateFormStatus,
    deleteForm,
    createField,
    updateField,
    deleteField,
    updateFieldOrder,
    generateAIHelperText
  };
}