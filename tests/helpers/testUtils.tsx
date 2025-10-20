/**
 * Utilidades y helpers para pruebas unitarias en VitalCare.
 * 
 * Este módulo proporciona funciones auxiliares reutilizables para:
 * - Renderizado de componentes con providers (QueryClient, Router)
 * - Creación de mocks para servicios y APIs
 * - Generación de datos de prueba consistentes
 * - Espera de elementos asincrónicos
 * 
 * @module testUtils
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Crea un nuevo QueryClient configurado para testing.
 * Desactiva reintentos y reduce timeouts para tests más rápidos.
 * 
 * @returns {QueryClient} Cliente de React Query configurado para testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No reintentar queries fallidas en tests
        gcTime: Infinity, // No recolectar garbage durante tests
        staleTime: Infinity, // Datos nunca se vuelven stale en tests
      },
      mutations: {
        retry: false, // No reintentar mutations fallidas en tests
      },
    },
  });
}

/**
 * Props para el wrapper de testing con providers.
 */
interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

/**
 * Componente wrapper que envuelve el componente bajo prueba con todos los providers necesarios.
 * Incluye QueryClientProvider y Router para simular el contexto completo de la aplicación.
 * 
 * @param {AllTheProvidersProps} props - Props del wrapper
 * @returns {JSX.Element} Componente envuelto con todos los providers
 */
export function AllTheProviders({ 
  children, 
  queryClient = createTestQueryClient(),
  initialRoute = '/'
}: AllTheProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Opciones extendidas para el renderizado personalizado.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

/**
 * Función de renderizado personalizada que envuelve automáticamente el componente
 * con todos los providers necesarios (QueryClient, Router).
 * 
 * @param {ReactElement} ui - Componente a renderizar
 * @param {CustomRenderOptions} options - Opciones de renderizado
 * @returns {Object} Objeto de render de Testing Library con utilidades adicionales
 * 
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test/utils';
 * import { MyComponent } from './MyComponent';
 * 
 * test('renders MyComponent', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  { 
    queryClient = createTestQueryClient(), 
    initialRoute = '/',
    ...renderOptions 
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllTheProviders queryClient={queryClient} initialRoute={initialRoute}>
      {children}
    </AllTheProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient, // Retorna el queryClient para poder accederlo en tests
  };
}

/**
 * Función auxiliar para esperar a que desaparezcan los indicadores de carga.
 * Útil para tests asincrónicos donde se necesita esperar a que los datos se carguen.
 * 
 * @param {HTMLElement} container - Contenedor del componente renderizado
 * @returns {Promise<void>}
 * 
 * @example
 * ```tsx
 * const { container } = renderWithProviders(<MyComponent />);
 * await waitForLoadingToFinish(container);
 * expect(screen.getByText('Data loaded')).toBeInTheDocument();
 * ```
 */
export async function waitForLoadingToFinish(container: HTMLElement): Promise<void> {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  const loadingElements = container.querySelectorAll('[data-testid="loading"], .loading');
  
  if (loadingElements.length > 0) {
    await waitForElementToBeRemoved(() => 
      container.querySelectorAll('[data-testid="loading"], .loading')
    );
  }
}

/**
 * Mock factory para crear respuestas de API simuladas.
 * 
 * @param {Partial<T>} data - Datos parciales a incluir en la respuesta
 * @returns {Promise<T>} Promise resuelta con los datos
 * 
 * @example
 * ```tsx
 * vi.mock('@/services/api', () => ({
 *   getUsers: vi.fn(() => createMockResponse({ users: mockUsers }))
 * }));
 * ```
 */
export function createMockResponse<T>(data: T): Promise<T> {
  return Promise.resolve(data);
}

/**
 * Mock factory para crear errores de API simulados.
 * 
 * @param {string} message - Mensaje de error
 * @param {number} status - Código de estado HTTP
 * @returns {Promise<never>} Promise rechazada con el error
 * 
 * @example
 * ```tsx
 * vi.mock('@/services/api', () => ({
 *   getUsers: vi.fn(() => createMockError('Not found', 404))
 * }));
 * ```
 */
export function createMockError(message: string, status = 500): Promise<never> {
  const error: any = new Error(message);
  error.status = status;
  return Promise.reject(error);
}

/**
 * Helper para limpiar todos los mocks después de cada test.
 * 
 * @example
 * ```tsx
 * afterEach(() => {
 *   clearAllMocks();
 * });
 * ```
 */
export function clearAllMocks() {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Helper para simular delay en respuestas asíncronas.
 * 
 * @param {number} ms - Milisegundos de espera
 * @returns {Promise<void>}
 * 
 * @example
 * ```tsx
 * vi.mock('@/services/api', () => ({
 *   getUsers: vi.fn(async () => {
 *     await delay(100);
 *     return mockUsers;
 *   })
 * }));
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Re-exportar funciones comunes de Testing Library para conveniencia.
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
