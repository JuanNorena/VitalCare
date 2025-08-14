import { useState, useCallback } from "react";
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
import { 
  Loader2, 
  Plus, 
  Edit, 
  List, 
  Trash2, 
  Check, 
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForms } from "@/hooks/use-forms";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Forms() {
  const { forms, isFormsLoading, createForm, updateForm, updateFormStatus } = useForms();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    try {
      if (editingForm) {
        await updateForm.mutateAsync({
          formId: editingForm.id,
          data: {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
          },
        });
        toast({
          title: t('forms.formUpdated'),
          description: t('forms.editDescription'),
        });
      } else {
        await createForm.mutateAsync({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          isActive: true,
        });
        toast({
          title: t('forms.formCreated'),
          description: t('forms.addDescription'),
        });
      }
      setIsOpen(false);
      setEditingForm(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('forms.errorManagingForm'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback((form: any) => {
    setEditingForm(form);
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingForm(null);
    }
  }, []);

  const handleStatusChange = useCallback(async (formId: number, isActive: boolean) => {
    try {
      await updateFormStatus.mutateAsync({ formId, isActive });
      toast({
        title: t('forms.formStatusUpdated'),
        description: isActive ? t('common.active') : t('common.inactive'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Error updating status',
      });
    }
  }, [updateFormStatus, t, toast]);

  if (isFormsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">{t('forms.title')}</h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              {t('forms.addForm')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingForm ? t('forms.editForm') : t('forms.createForm')}
              </DialogTitle>
              <DialogDescription>
                {editingForm ? t('forms.editDescription') : t('forms.addDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('forms.name')}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingForm?.name || ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">{t('forms.description')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingForm?.description || ''}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingForm ? t('forms.updating') : t('forms.creating')}
                  </>
                ) : (
                  editingForm ? t('forms.updateForm') : t('forms.createForm')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {forms?.map((form) => (
          <Card
            key={form.id}
            className={`${!form.isActive ? "opacity-60" : ""} overflow-hidden`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="truncate">{form.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(form)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={`/admin/forms/${form.id}/fields`}>
                      <List className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {form.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {form.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor={`active-${form.id}`} className="text-sm">
                  {form.isActive ? t('common.active') : t('common.inactive')}
                </Label>
                <Switch
                  id={`active-${form.id}`}
                  checked={form.isActive}
                  onCheckedChange={(checked) => handleStatusChange(form.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}