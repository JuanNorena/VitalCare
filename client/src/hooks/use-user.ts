import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
};

type ChangePasswordData = {
  currentPassword?: string;
  newPassword: string;
};

export function useUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          const errorText = await response.text();
          throw new Error(errorText);
        }

        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('auth.errors.changePasswordFailed'));
      }

      const responseData = await response.json();
      return responseData;
    },
    onSuccess: (data) => {
      if (data.user) {
        queryClient.setQueryData(['/api/user'], data.user);
      }
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Traducir mensajes de error comunes para cambio de contraseña
      if (error.message === "Current password is incorrect") {
        errorMessage = t("auth.errors.incorrectPassword");
      } else if (error.message === "Password too weak") {
        errorMessage = t("auth.errors.passwordTooWeak");
      } else if (error.message === "New password cannot be the same as current password") {
        errorMessage = t("auth.errors.samePassword");
      } else {
        errorMessage = t("auth.errors.changePasswordFailed");
      }

      toast({
        variant: "destructive",
        title: t("common.error"),
        description: errorMessage,
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      return response.json();
    },
    onSuccess: (response) => {
      // Limpiar todas las queries existentes
      queryClient.clear();

      // Establecer los datos del usuario
      queryClient.setQueryData(['/api/user'], response.user);      // Obtener la ruta por defecto según el rol
      const getDefaultRoute = (role: string) => {
        switch (role) {
          case "admin":
            return "/admin/dashboard";
          case "staff":
            return "/queue/manage";
          case "selfservice":
            return "/self-services/generate-turn";
          default:
            return "/appointments/book";
        }
      };

      // Forzar navegación a la ruta por defecto
      const defaultRoute = getDefaultRoute(response.user.role);
      setLocation(defaultRoute);

      toast({
        title: t("auth.loginSuccess"),
        description: response.message,
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Traducir mensajes de error comunes del servidor
      if (error.message === "User not found") {
        errorMessage = t("auth.errors.userNotFound");
      } else if (error.message === "Incorrect password") {
        errorMessage = t("auth.errors.incorrectPassword");
      } else if (error.message === "Invalid credentials") {
        errorMessage = t("auth.errors.invalidCredentials");
      } else if (error.message === "Account is inactive") {
        errorMessage = t("auth.errors.accountInactive");
      } else if (error.message === "Too many login attempts") {
        errorMessage = t("auth.errors.tooManyAttempts");
      } else {
        // Si no es un error específico conocido, usar un mensaje genérico
        errorMessage = t("auth.errors.loginFailed");
      }

      toast({
        variant: "destructive",
        title: t("auth.loginError"),
        description: errorMessage,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('auth.errors.registerFailed'));
      }

      return response.json();
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['/api/user'], response.user);
      toast({
        title: t("auth.registerSuccess"),
        description: response.message,
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Traducir mensajes de error comunes del servidor para registro
      if (error.message === "Username already exists") {
        errorMessage = t("auth.errors.usernameExists");
      } else if (error.message === "Email already exists") {
        errorMessage = t("auth.errors.emailExists");
      } else if (error.message === "Invalid email format") {
        errorMessage = t("auth.errors.invalidEmail");
      } else if (error.message === "Password too weak") {
        errorMessage = t("auth.errors.passwordTooWeak");
      } else if (error.message === "Username too short") {
        errorMessage = t("auth.errors.usernameTooShort");
      } else {
        // Si no es un error específico conocido, usar un mensaje genérico
        errorMessage = t("auth.errors.registerFailed");
      }

      toast({
        variant: "destructive",
        title: t("auth.registerError"),
        description: errorMessage,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('auth.errors.logoutFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Limpiar todas las queries y el estado
      queryClient.clear();
      // Redirigir a la página de login
      setLocation("/");
      toast({
        title: t("auth.logoutSuccess"),
        description: t("auth.logoutMessage"),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("auth.logoutError"),
        description: error.message,
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
  };
}