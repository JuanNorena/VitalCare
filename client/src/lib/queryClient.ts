import { QueryClient } from "@tanstack/react-query";

type RequestOptions = {
  on401?: "throw" | "returnNull";
};

export const getQueryFn = (options: RequestOptions = {}) => {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401 && options.on401 === "returnNull") {
        return null;
      }

      if (res.status >= 500) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      throw new Error(await res.text());
    }

    return res.json();
  };
};

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  contentType = "application/json"
) {
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
  };

  if (body) {
    options.body = contentType === "application/json" ? JSON.stringify(body) : body;
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});