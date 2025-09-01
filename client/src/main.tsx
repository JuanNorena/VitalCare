import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from './App';
import "./index.css";
import { AccessibilityProvider } from '@/contexts/accessibility-context';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccessibilityProvider>
      <App />
      <AccessibilityPanel />
    </AccessibilityProvider>
  </StrictMode>,
);
