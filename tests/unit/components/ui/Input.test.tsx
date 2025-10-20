/**
 * @vitest-environment jsdom
 * 
 * Pruebas unitarias para el componente Input.
 * 
 * Este archivo contiene tests exhaustivos para verificar:
 * - Renderizado correcto del componente
 * - Manejo de diferentes tipos de input (text, email, password, etc.)
 * - Manejo de eventos onChange, onFocus, onBlur
 * - Estados disabled y readonly
 * - Valores por defecto y controlados
 * - Placeholders y labels
 * - Accesibilidad
 * - Clases CSS personalizadas
 * 
 * @group ui-components
 * @group input
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../helpers/testUtils';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  describe('Renderizado Básico', () => {
    it('debe renderizar el input correctamente', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('debe ser un elemento input HTML', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input.tagName).toBe('INPUT');
    });

    it('debe tener type="text" por defecto', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });
  });

  describe('Tipos de Input', () => {
    it('debe aplicar type="email" correctamente', () => {
      renderWithProviders(<Input type="email" />);
      
      const input = document.querySelector('input[type="email"]');
      expect(input).toBeInTheDocument();
    });

    it('debe aplicar type="password" correctamente', () => {
      renderWithProviders(<Input type="password" />);
      
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('debe aplicar type="number" correctamente', () => {
      renderWithProviders(<Input type="number" />);
      
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('number');
    });

    it('debe aplicar type="tel" correctamente', () => {
      renderWithProviders(<Input type="tel" />);
      
      const input = document.querySelector('input[type="tel"]');
      expect(input).toBeInTheDocument();
    });

    it('debe aplicar type="date" correctamente', () => {
      renderWithProviders(<Input type="date" />);
      
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('debe aplicar type="time" correctamente', () => {
      renderWithProviders(<Input type="time" />);
      
      const input = document.querySelector('input[type="time"]');
      expect(input).toBeInTheDocument();
    });

    it('debe aplicar type="file" correctamente', () => {
      renderWithProviders(<Input type="file" />);
      
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Placeholder', () => {
    it('debe mostrar el placeholder correctamente', () => {
      renderWithProviders(
        <Input placeholder="Ingresa tu nombre" />
      );
      
      const input = screen.getByPlaceholderText(/ingresa tu nombre/i);
      expect(input).toBeInTheDocument();
    });

    it('debe aplicar estilos al placeholder', () => {
      renderWithProviders(<Input placeholder="Test" />);
      
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('placeholder:text-gray-400');
    });
  });

  describe('Valores', () => {
    it('debe mostrar el valor inicial', () => {
      renderWithProviders(<Input defaultValue="Valor inicial" />);
      
      const input = screen.getByDisplayValue('Valor inicial') as HTMLInputElement;
      expect(input.value).toBe('Valor inicial');
    });

    it('debe actualizar el valor cuando el usuario escribe', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Hola Mundo');
      
      expect(input.value).toBe('Hola Mundo');
    });

    it('debe funcionar como componente controlado', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            data-testid="controlled-input"
          />
        );
      };

      const { default: React } = await import('react');
      renderWithProviders(<TestComponent />);
      
      const input = screen.getByTestId('controlled-input') as HTMLInputElement;
      await user.type(input, 'Test');
      
      expect(input.value).toBe('Test');
    });
  });

  describe('Eventos', () => {
    it('debe llamar a onChange cuando el usuario escribe', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'A');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('debe llamar a onFocus cuando el input recibe foco', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a onBlur cuando el input pierde foco', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(
        <div>
          <Input onBlur={handleBlur} />
          <button>Other element</button>
        </div>
      );
      
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      
      await user.click(input);
      await user.click(button);
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a onKeyDown cuando se presiona una tecla', async () => {
      const handleKeyDown = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      await user.keyboard('A');
      
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Estados', () => {
    it('debe aplicar el estado disabled correctamente', () => {
      renderWithProviders(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('NO debe permitir escribir cuando está disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input disabled onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Test');
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('debe aplicar el estado readonly correctamente', () => {
      renderWithProviders(<Input readOnly />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    it('NO debe permitir escribir cuando está readonly', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<Input readOnly defaultValue="Readonly" />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Test');
      
      expect(input.value).toBe('Readonly'); // No debe cambiar
    });

    it('debe aplicar el estado required correctamente', () => {
      renderWithProviders(<Input required />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.required).toBe(true);
    });
  });

  describe('Validación', () => {
    it('debe aplicar minLength correctamente', () => {
      renderWithProviders(<Input minLength={5} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.minLength).toBe(5);
    });

    it('debe aplicar maxLength correctamente', () => {
      renderWithProviders(<Input maxLength={10} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.maxLength).toBe(10);
    });

    it('debe aplicar pattern correctamente', () => {
      const pattern = '[0-9]{3}-[0-9]{3}-[0-9]{4}';
      renderWithProviders(<Input pattern={pattern} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.pattern).toBe(pattern);
    });

    it('debe aplicar min para inputs numéricos', () => {
      renderWithProviders(<Input type="number" min="0" />);
      
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input.min).toBe('0');
    });

    it('debe aplicar max para inputs numéricos', () => {
      renderWithProviders(<Input type="number" max="100" />);
      
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input.max).toBe('100');
    });
  });

  describe('Clases CSS', () => {
    it('debe aplicar clases base por defecto', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-lg');
    });

    it('debe aplicar className personalizado', () => {
      renderWithProviders(<Input className="custom-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
      expect(input).toHaveClass('flex'); // Debe mantener clases base
    });

    it('debe aplicar estilos de focus', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:ring-2');
      expect(input).toHaveClass('focus-visible:ring-blue-500');
    });

    it('debe aplicar estilos de disabled', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Accesibilidad', () => {
    it('debe soportar aria-label', () => {
      renderWithProviders(<Input aria-label="Nombre completo" />);
      
      const input = screen.getByLabelText(/nombre completo/i);
      expect(input).toBeInTheDocument();
    });

    it('debe soportar aria-describedby', () => {
      renderWithProviders(
        <div>
          <Input aria-describedby="help-text" />
          <span id="help-text">Ingresa tu nombre completo</span>
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('debe soportar aria-invalid', () => {
      renderWithProviders(<Input aria-invalid="true" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('debe soportar aria-required', () => {
      renderWithProviders(<Input aria-required="true" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('debe ser navegable con teclado (focus)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.tab();
      
      expect(input).toHaveFocus();
    });
  });

  describe('Props Adicionales', () => {
    it('debe soportar id personalizado', () => {
      renderWithProviders(<Input id="email-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('debe soportar name personalizado', () => {
      renderWithProviders(<Input name="email" />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.name).toBe('email');
    });

    it('debe soportar data-attributes personalizados', () => {
      renderWithProviders(
        <Input data-testid="test-input" data-custom="value" />
      );
      
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('data-custom', 'value');
    });

    it('debe soportar autoComplete', () => {
      renderWithProviders(<Input autoComplete="email" />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.autocomplete).toBe('email');
    });

    it('debe soportar autoFocus', () => {
      renderWithProviders(<Input autoFocus />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('Integración con Formularios', () => {
    it('debe funcionar dentro de un formulario', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const user = userEvent.setup();
      
      renderWithProviders(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      const button = screen.getByRole('button');
      
      await user.type(input, 'testuser');
      await user.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(input.value).toBe('testuser');
    });

    it('debe resetear el valor cuando el formulario se resetea', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <form>
          <Input defaultValue="initial" data-testid="reset-input" />
          <button type="reset">Reset</button>
        </form>
      );
      
      const input = screen.getByTestId('reset-input') as HTMLInputElement;
      const resetButton = screen.getByRole('button');
      
      await user.clear(input);
      await user.type(input, 'changed');
      expect(input.value).toBe('changed');
      
      await user.click(resetButton);
      expect(input.value).toBe('initial');
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar valores vacíos correctamente', () => {
      renderWithProviders(<Input value="" onChange={() => {}} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('debe manejar cambios rápidos de valor', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
          />
        );
      };

      const { default: React } = await import('react');
      renderWithProviders(<TestComponent />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      // Escribir rápidamente múltiples caracteres
      await user.type(input, 'abcdefghij');
      
      expect(input.value).toBe('abcdefghij');
    });

    it('debe funcionar sin props adicionales', () => {
      renderWithProviders(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toBeEnabled();
    });
  });
});
