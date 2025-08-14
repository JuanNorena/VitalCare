import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { user, changePassword } = useUser();
  const [_, setLocation] = useLocation();

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "admin":
        setLocation("/dashboard");
        break;
      case "staff":
        setLocation("/queue/manage");
        break;
      case "user":
      default:
        setLocation("/appointments/book");
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await changePassword({
        currentPassword: user?.mustChangePassword ? undefined : "",
        newPassword
      });

      toast({
        title: t("auth.passwordChanged"),
        description: t("auth.passwordChangedDescription"),
      });

      // Esperar a que se actualice el estado y redirigir
      if (response.user?.role) {
        redirectBasedOnRole(response.user.role);
      }

    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("auth.errors.changePasswordFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{t("auth.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">            
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isSubmitting}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showNewPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  </span>
                </Button>
              </div>
            </div>           
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  </span>
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("auth.changePassword")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}