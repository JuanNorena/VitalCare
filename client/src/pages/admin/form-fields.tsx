import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  MoveUp,
  MoveDown,
  Eye,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForms } from "@/hooks/use-forms";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link } from "wouter";
import type { FormField } from "@db/schema";

// Interfaces para el componente FormPreview
interface FormPreviewProps {
  fields: FormField[] | undefined;
}

interface FormData {
  [key: string]: string | boolean;
}

// Form Preview components
const FormPreview: React.FC<FormPreviewProps> = ({ fields }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({});

  const handleInputChange = (field: FormField, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field.name]: value
    }));
  };

  const renderField = (field: FormField) => {
    const fieldWithTooltip = (inputElement: React.ReactNode) => (
      field.helperText ? (
        <div className="relative">
          {inputElement}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>{field.helperText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        inputElement
      )
    );

    switch (field.type) {
      case 'text':        return fieldWithTooltip(
          <Input
            id={field.name}
            placeholder={field.label}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={field.helperText ? "pr-10" : ""}
          />
        );      case 'number':
        return fieldWithTooltip(
          <Input
            id={field.name}
            type="number"
            placeholder={field.label}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={field.helperText ? "pr-10" : ""}
          />
        );
      case 'email':
        return fieldWithTooltip(
          <Input            id={field.name}
            type="email"
            placeholder={field.label}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={field.helperText ? "pr-10" : ""}
          />
        );
      case 'date':
        return fieldWithTooltip(
          <Input
            id={field.name}
            type="date"
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={field.helperText ? "pr-10" : ""}
          />
        );      case 'select':
        const options = field.options && typeof field.options === 'string' 
          ? field.options.split(',').map((opt: string) => opt.trim()) 
          : [];
        return fieldWithTooltip(
          <Select
            value={formData[field.name] as string || ''}
            onValueChange={(value) => handleInputChange(field, value)}
          >
            <SelectTrigger className={field.helperText ? "pr-10" : ""}>
              <SelectValue placeholder={field.label} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!formData[field.name]}
              onCheckedChange={(checked) => handleInputChange(field, !!checked)}
            />
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </label>
            {field.helperText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>{field.helperText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      case 'textarea':
        return fieldWithTooltip(
          <Textarea
            id={field.name}
            placeholder={field.label}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={field.helperText ? "pr-10" : ""}
          />
        );
      default:
        return null;
    }
  };
  // Form submission (simulated for preview)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(t('forms.previewSubmitMessage'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">{t('forms.formPreview')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t('forms.previewDescription')}</p>

      {fields?.map((field: FormField) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}

      <Button type="submit" className="mt-4">
        {t('common.submit')}
      </Button>
    </form>
  );
};

export default function FormFields() {
  const { formId } = useParams<{ formId: string }>();
  const { forms, isFormsLoading, getFormFields, createField, updateField, deleteField, updateFieldOrder, generateAIHelperText } = useForms();
  const { data: fields, isLoading: isFieldsLoading } = getFormFields(parseInt(formId));

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [fieldType, setFieldType] = useState<string>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [helperText, setHelperText] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  // Get current form
  const currentForm = forms?.find(form => form.id === parseInt(formId));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const label = formData.get("label") as string;
    const options = fieldType === "select" ? formData.get("options") as string : undefined;
    const fieldHelperText = formData.get("helperText") as string || null;

    try {
      if (editingField) {
        await updateField.mutateAsync({
          fieldId: editingField.id,
          data: {            name,
            label,
            type: fieldType,
            required: isRequired,
            options,
            order: editingField.order,
            helperText: fieldHelperText || undefined
          },
        });
        toast({
          title: t('forms.fieldUpdated'),
          description: label,
        });
      } else {
        // Calculate the new order (one more than the highest existing order, or 1 if no fields exist)
        const maxOrder = fields?.length ? Math.max(...fields.map(field => field.order)) : 0;

        await createField.mutateAsync({          formId: parseInt(formId),
          name,
          label,
          type: fieldType,
          required: isRequired,
          options,
          order: maxOrder + 1,
          helperText: fieldHelperText || undefined
        });
        toast({
          title: t('forms.fieldCreated'),
          description: label,
        });
      }
      setIsOpen(false);
      setEditingField(null);
      setFieldType("text");
      setIsRequired(false);
      setHelperText("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('forms.errorManagingField'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback((field: any) => {
    if (!field) return;
    setEditingField(field);
    setFieldType(field.type);
    setIsRequired(field.required);
    setHelperText(field.helperText || "");
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(async (fieldId: number) => {
    try {
      await deleteField.mutateAsync(fieldId);
      toast({
        title: t('forms.fieldDeleted'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('forms.errorDeletingField'),
      });
    }
  }, [deleteField, t, toast]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingField(null);
      setFieldType("text");
      setIsRequired(false);
      setHelperText("");
    }
  }, []);

  // Handle AI helper text generation
  const handleGenerateHelperText = useCallback(async () => {
    const fieldNameElement = document.getElementById("name") as HTMLInputElement;
    const fieldLabelElement = document.getElementById("label") as HTMLInputElement;

    const fieldName = fieldNameElement?.value;
    const fieldLabel = fieldLabelElement?.value;

    if (!fieldName || !fieldLabel) {
      toast({
        variant: "destructive",
        title: t('forms.aiHelperError'),
        description: t('forms.aiHelperErrorDesc'),
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const generatedText = await generateAIHelperText.mutateAsync({
        fieldName,
        fieldLabel,
        fieldType,
        formId: parseInt(formId)
      });

      setHelperText(generatedText);
      toast({
        title: t('forms.aiHelperSuccess'),
        description: t('forms.aiHelperSuccessDesc'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('forms.errorGeneratingHelper'),
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [fieldType, formId, t, toast, generateAIHelperText]);

  // Handle moving a field up or down
  const handleMoveField = useCallback(async (fieldId: number, direction: 'up' | 'down') => {
    if (!fields || fields.length <= 1) return;

    // Find current index of the field
    const currentIndex = fields.findIndex(field => field.id === fieldId);
    if (currentIndex === -1) return;

    // Calculate new index based on direction
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(fields.length - 1, currentIndex + 1);

    // If the field is already at the top/bottom, do nothing
    if (newIndex === currentIndex) return;

    // Create a copy of the fields array
    const newFieldsOrder = [...fields];

    // Swap the fields
    const temp = newFieldsOrder[currentIndex];
    newFieldsOrder[currentIndex] = newFieldsOrder[newIndex];
    newFieldsOrder[newIndex] = temp;

    // Update order property for all fields
    const updatedFields = newFieldsOrder.map((field, index) => ({
      ...field,
      order: index + 1
    }));

    // Call API to update order in the database
    try {
      await updateFieldOrder.mutateAsync({
        formId: parseInt(formId),
        fields: updatedFields.map(field => ({
          id: field.id,
          order: field.order
        }))
      });

      toast({
        title: t('forms.fieldsReordered'),
        description: t('forms.fieldsReorderedDesc'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('forms.errorReorderingFields'),
      });
    }
  }, [fields, formId, updateFieldOrder, toast, t]);

  // Reset when selecting a new form
  useEffect(() => {
    setEditingField(null);
    setFieldType("text");
    setIsRequired(false);
    setHelperText("");
  }, [formId]);

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case "text": return t('forms.textField');
      case "number": return t('forms.numberField');
      case "email": return t('forms.emailField');
      case "date": return t('forms.dateField');
      case "select": return t('forms.selectField');
      case "checkbox": return t('forms.checkboxField');
      case "textarea": return t('forms.textareaField');
      default: return type;
    }
  };

  if (isFormsLoading || isFieldsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">{t('common.error')}</h2>
        <p>{t('forms.formNotFound')}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.cancel')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2">
            <Link href="/admin/forms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.cancel')}
            </Link>
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold">{t('forms.fields')}</h2>
          <p className="text-muted-foreground">{currentForm.name}</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                {t('forms.preview')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] p-0">
              <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10">
                <DialogTitle>{currentForm.name}</DialogTitle>
                <DialogDescription>
                  {currentForm.description}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-120px)]">
                <FormPreview fields={fields} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                {t('forms.addField')}
              </Button>
            </DialogTrigger>            
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? t('forms.editField') : t('forms.addField')}
                </DialogTitle>
                <DialogDescription>
                  {editingField ? t('forms.editFieldDescription') : t('forms.addFieldDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('forms.fieldName')}</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingField?.name || ''}
                    placeholder={t('forms.fieldNamePlaceholder')}
                    required
                  />                  <p className="text-xs text-muted-foreground mt-1">
                    {t('forms.fieldNameHelp')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="label">{t('forms.fieldLabel')}</Label>
                  <Input
                    id="label"
                    name="label"
                    defaultValue={editingField?.label || ''}
                    placeholder={t('forms.fieldLabelPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">{t('forms.fieldType')}</Label>
                  <Select 
                    value={fieldType} 
                    onValueChange={setFieldType}
                  >                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.selectFieldType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">{t('forms.textField')}</SelectItem>
                      <SelectItem value="number">{t('forms.numberField')}</SelectItem>
                      <SelectItem value="email">{t('forms.emailField')}</SelectItem>
                      <SelectItem value="date">{t('forms.dateField')}</SelectItem>
                      <SelectItem value="select">{t('forms.selectField')}</SelectItem>
                      <SelectItem value="checkbox">{t('forms.checkboxField')}</SelectItem>
                      <SelectItem value="textarea">{t('forms.textareaField')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fieldType === "select" && (
                  <div>
                    <Label htmlFor="options">{t('forms.fieldOptions')}</Label>
                    <Textarea
                      id="options"
                      name="options"
                      defaultValue={editingField?.options as string || ''}
                      placeholder={t('forms.fieldOptionsPlaceholder')}
                      required
                    />
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="helperText">{t('forms.helperText')}</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={isGeneratingAI}
                      onClick={handleGenerateHelperText}
                      className="h-7 px-2 text-xs"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3 w-3" />
                      )}
                      {t('forms.generateAIHelper')}
                    </Button>
                  </div>
                  <Textarea
                    id="helperText"
                    name="helperText"
                    value={helperText}
                    onChange={(e) => setHelperText(e.target.value)}
                    placeholder={t('forms.helperTextPlaceholder')}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('forms.helperTextDescription')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="required" 
                    checked={isRequired} 
                    onCheckedChange={(checked) => setIsRequired(!!checked)}
                  />
                  <Label htmlFor="required" className="cursor-pointer">
                    {t('forms.fieldRequired')}
                  </Label>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingField ? t('forms.updating') : t('forms.creating')}
                    </>
                  ) : (
                    editingField ? t('common.update') : t('common.create')
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {fields?.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">{t('forms.noFields')}</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('forms.addField')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('forms.fields')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t('forms.dragToReorder')}</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t('forms.fieldOrder')}</TableHead>
                  <TableHead>{t('forms.fieldName')}</TableHead>
                  <TableHead>{t('forms.fieldLabel')}</TableHead>
                  <TableHead>{t('forms.fieldType')}</TableHead>
                  <TableHead className="text-center">{t('forms.fieldRequired')}</TableHead>
                  <TableHead className="text-center">{t('forms.hasHelper')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields?.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.order}</TableCell>
                    <TableCell>{field.name}</TableCell>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>{getFieldTypeLabel(field.type)}</TableCell>
                    <TableCell className="text-center">
                      {field.required ? "✓" : ""}
                    </TableCell>
                    <TableCell className="text-center">
                      {field.helperText ? "✓" : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveField(field.id, 'up')}
                          disabled={field.order === 1}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveField(field.id, 'down')}
                          disabled={fields && field.order === fields.length}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(field)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>                            
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('common.delete')} {field.label}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('forms.confirmDeleteField')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(field.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}