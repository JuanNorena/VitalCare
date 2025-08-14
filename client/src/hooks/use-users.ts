import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "user" | "selfservice" | "visualizer";
  mustChangePassword: boolean;
  isActive: boolean;
}

interface UpdateUserData {
  username: string;
  email: string;
  role: "admin" | "staff" | "user" | "selfservice" | "visualizer";
}

export function useUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  const createUser = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const responseText = await response.text();

      if (!response.ok) {
        // Si la respuesta no es JSON, usar el texto como mensaje de error
        const errorMessage = isJson ? JSON.parse(responseText).message : responseText;
        throw new Error(errorMessage);
      }

      // Si la respuesta es exitosa pero no es JSON, lanzar error
      if (!isJson) {
        throw new Error("Invalid server response format");
      }

      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("admin.users.userCreated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: UpdateUserData;
    }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = isJson ? JSON.parse(responseText).message : responseText;
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error("Invalid server response format");
      }

      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("admin.users.userUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: number;
      isActive: boolean;
    }) => {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = isJson ? JSON.parse(responseText).message : responseText;
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error("Invalid server response format");
      }

      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("admin.users.userStatusUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    createUser: createUser.mutateAsync,
    updateUser: updateUser.mutateAsync,
    updateUserStatus: updateUserStatus.mutateAsync,
  };
}