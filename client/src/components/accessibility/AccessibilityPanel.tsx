import React, { useState } from "react";
import { Moon, Sun, ZoomIn, ZoomOut, Settings, RefreshCw } from "lucide-react";
import { useAccessibility } from "@/contexts/accessibility-context";

export const AccessibilityPanel: React.FC = () => {
  const { theme, toggleTheme, increaseFont, decreaseFont, setTheme, setFontScale } = useAccessibility();
  const [open, setOpen] = useState(false);

  const restoreDefaults = () => {
    // Reset to light theme and default font scale
    try {
      setTheme("light");
      setFontScale(1);
    } catch (e) {
      // ignore
    }
    setOpen(false);
  };

  return (
    <div>
      {/* Desktop / tablet vertical toolbar */}
      <aside
        role="toolbar"
        aria-orientation="vertical"
        aria-label="Panel de accesibilidad"
        className="hidden md:flex fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-popover/80 backdrop-blur-sm rounded-lg p-2 flex-col gap-2 shadow-lg"
      >
  <button
          aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? "Desactivar modo oscuro" : "Activar modo oscuro"}
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="sr-only">{theme === "dark" ? "Desactivar modo oscuro" : "Activar modo oscuro"}</span>
        </button>

        <button
          aria-label="Aumentar tamaño de fuente"
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={increaseFont}
        >
          <ZoomIn className="w-5 h-5" />
          <span className="sr-only">Aumentar tamaño de fuente</span>
        </button>

        <button
          aria-label="Reducir tamaño de fuente"
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={decreaseFont}
        >
          <ZoomOut className="w-5 h-5" />
          <span className="sr-only">Reducir tamaño de fuente</span>
        </button>
        
        {/* Restore defaults */}
        <button
          aria-label="Restaurar valores por defecto"
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={restoreDefaults}
        >
          <RefreshCw className="w-5 h-5" />
          <span className="sr-only">Restaurar valores por defecto</span>
        </button>
      </aside>

      {/* Mobile: floating single button that opens a small sheet */}
      <div className="md:hidden fixed right-4 bottom-6 z-50">
        <button
          aria-expanded={open}
          aria-controls="vc-access-sheet"
          aria-label="Abrir opciones de accesibilidad"
          className="w-12 h-12 rounded-full bg-popover/90 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={() => setOpen(!open)}
        >
          <Settings className="w-6 h-6" />
        </button>

            {open && (
          <div
            id="vc-access-sheet"
            role="dialog"
            aria-label="Opciones de accesibilidad"
            className="mt-2 w-44 p-2 bg-popover/90 rounded-lg shadow-lg flex flex-col gap-2"
          >
            <button
              aria-pressed={theme === "dark"}
              onClick={() => { toggleTheme(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60 focus:outline-none"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm">Modo oscuro</span>
            </button>

            <button
              onClick={() => increaseFont()}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60 focus:outline-none"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-sm">Aumentar fuente</span>
            </button>

            <button
              onClick={() => decreaseFont()}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60 focus:outline-none"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="text-sm">Reducir fuente</span>
            </button>

            <button
              onClick={() => restoreDefaults()}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/60 focus:outline-none"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Restaurar valores</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityPanel;
