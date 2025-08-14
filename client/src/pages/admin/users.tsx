import { useState, useCallback } from "react";
import { useUsers } from "@/hooks/use-users";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Edit, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@db/schema";

export default function Users() {
  const { users, isLoading, createUser, updateUser, updateUserStatus } = useUsers();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff" | "user" | "selfservice" | "visualizer">("all");
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);    try {
      if (editingUser) {        const updateData: any = {
          username: formData.get("username") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as "admin" | "staff" | "user" | "selfservice" | "visualizer",
        };

        // Solo incluir la contraseña si se proporciona una nueva
        const newPassword = formData.get("password") as string;
        if (newPassword) {
          updateData.password = newPassword;
          updateData.mustChangePassword = true;
        }

        await updateUser({
          userId: editingUser.id,
          data: updateData,
        });      } else {        await createUser({
          username: formData.get("username") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          role: formData.get("role") as "admin" | "staff" | "user" | "selfservice" | "visualizer",
          mustChangePassword: true,
          isActive: true,
        });
      }
      handleClose();
    } catch (error) {
      console.error("Error en la operación de usuario:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setIsOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingUser(null);
    setIsOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  }, []);

  const handleStatusChange = useCallback(async (userId: number, isActive: boolean) => {
    try {
      await updateUserStatus({ userId, isActive });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }  }, [updateUserStatus, t, toast]);

  // Filtrar usuarios según el rol seleccionado
  const filteredUsers = users?.filter(user => {
    if (roleFilter === "all") return true;
    return user.role === roleFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold">{t('admin.users.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro de roles */}
          <div className="flex items-center gap-2">
            <Label htmlFor="roleFilter" className="text-sm whitespace-nowrap">
              {t('admin.users.filterByRole')}:
            </Label>            <Select value={roleFilter} onValueChange={(value: "all" | "admin" | "staff" | "user" | "selfservice" | "visualizer") => setRoleFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.users.allRoles')}</SelectItem>
                <SelectItem value="admin">{t('admin.users.roles.admin')}</SelectItem>
                <SelectItem value="staff">{t('admin.users.roles.staff')}</SelectItem>
                <SelectItem value="user">{t('admin.users.roles.user')}</SelectItem>
                <SelectItem value="selfservice">{t('admin.users.roles.selfservice')}</SelectItem>
                <SelectItem value="visualizer">{t('admin.users.roles.visualizer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>          {/* Botón agregar usuario */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} className="whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.users.addUser')}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? t('admin.users.editUser') : t('admin.users.addUser')}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? t('admin.users.editDescription') : t('admin.users.addDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">{t('admin.users.username')}</Label>
                <Input 
                  id="username" 
                  name="username" 
                  defaultValue={editingUser?.username}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="email">{t('admin.users.email')}</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email}
                  required 
                />
              </div>              <div>
                <Label htmlFor="password">
                  {editingUser ? t('auth.newPassword') : t('auth.password')}
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    minLength={8}
                    placeholder={editingUser ? t('auth.passwordOptional') : undefined}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">
                      {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    </span>
                  </Button>
                </div>
                {editingUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('auth.leaveBlankPassword')}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="role">{t('admin.users.role')}</Label>
                <Select 
                  name="role"
                  defaultValue={editingUser?.role ?? "staff"}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.users.role')} />
                  </SelectTrigger>                  <SelectContent>
                    <SelectItem value="admin">{t('admin.users.roles.admin')}</SelectItem>
                    <SelectItem value="staff">{t('admin.users.roles.staff')}</SelectItem>
                    <SelectItem value="user">{t('admin.users.roles.user')}</SelectItem>
                    <SelectItem value="selfservice">{t('admin.users.roles.selfservice')}</SelectItem>
                    <SelectItem value="visualizer">{t('admin.users.roles.visualizer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting 
                  ? (editingUser ? t('admin.users.updating') : t('admin.users.creating')) 
                  : (editingUser ? t('admin.users.updateUser') : t('admin.users.createUser'))}
              </Button>
            </form>          
            </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredUsers.map((user) => (
          <Card 
            key={user.id}
            className={`${!user.isActive ? "opacity-60" : ""} overflow-hidden`}
          >
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{user.username}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(user)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {t(`admin.users.roles.${user.role}`)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor={`active-${user.id}`} className="text-sm">
                  {user.isActive ? t('common.active') : t('common.inactive')}
                </Label>
                <Switch
                  id={`active-${user.id}`}
                  checked={user.isActive}
                  onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}