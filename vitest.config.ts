/**
 * Configuración de Vitest para pruebas unitarias en VitalCare Frontend.
 * 
 * Este archivo configura el entorno de testing con Vitest, incluyendo:
 * - Simulación del DOM con jsdom
 * - Configuración de globals (describe, it, expect)
 * - Setup de archivos de configuración antes de cada test
 * - Alias de rutas para imports
 * - Cobertura de código con v8
 * 
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno de testing: jsdom simula el DOM del navegador
    environment: 'jsdom',
    
    // Habilita variables globales como describe, it, expect
    globals: true,
    
    // Archivos de setup que se ejecutan antes de cada test
    setupFiles: ['./tests/setup.ts'],
    
    // Configuración de cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      // Umbrales mínimos de cobertura
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    
    // Incluir archivos de test
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    
    // Excluir directorios
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
});
