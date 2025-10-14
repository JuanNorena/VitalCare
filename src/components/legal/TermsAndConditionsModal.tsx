/**
 * Componente Modal de Términos y Condiciones con Habeas Data
 * 
 * Este componente presenta los términos y condiciones de uso de VitalCare,
 * incluyendo la política de tratamiento de datos personales conforme a:
 * - Ley 1581 de 2012 (Protección de Datos Personales - Colombia)
 * - Decreto 1377 de 2013
 * - Ley Estatutaria 1581 de 2012
 * 
 * @component
 * @example
 * ```tsx
 * <TermsAndConditionsModal
 *   isOpen={showTerms}
 *   onClose={() => setShowTerms(false)}
 *   onAccept={() => handleAcceptTerms()}
 * />
 * ```
 */

import React from 'react';
import { X, Shield, FileText, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TermsAndConditionsModalProps {
  /** Estado de visibilidad del modal */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función al aceptar términos */
  onAccept: () => void;
}

/**
 * Modal que muestra los términos y condiciones completos de VitalCare
 */
export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--vc-card-bg)] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--vc-border)]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-[var(--vc-text)]">
              Términos y Condiciones
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--vc-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--vc-text)]" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[var(--vc-text)]">
          
          {/* Introducción */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">1. Aceptación de Términos</h3>
            </div>
            <p className="text-sm text-[var(--vc-text)]/80 leading-relaxed">
              Al registrarse y utilizar los servicios de <strong>VitalCare</strong>, usted acepta 
              expresamente estar sujeto a estos Términos y Condiciones, así como a nuestra Política 
              de Tratamiento de Datos Personales, conforme a la legislación colombiana vigente.
            </p>
          </section>

          {/* Habeas Data - Sección Principal */}
          <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                2. Autorización de Tratamiento de Datos Personales (Habeas Data)
              </h3>
            </div>
            
            <div className="space-y-3 text-sm text-[var(--vc-text)]/90">
              <p className="font-medium">
                De conformidad con la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>, 
                autorizo de manera libre, voluntaria, previa, explícita, informada e inequívoca a VitalCare para:
              </p>

              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Recolectar, almacenar, usar, circular, suprimir, procesar, compilar, intercambiar, 
                actualizar y disponer de mis datos personales.</li>
                <li>Utilizar mis datos para la prestación de servicios médicos y de salud.</li>
                <li>Compartir información con profesionales de la salud autorizados para la atención médica.</li>
                <li>Enviar notificaciones sobre citas médicas, recordatorios y comunicaciones relacionadas con el servicio.</li>
                <li>Realizar análisis estadísticos para mejorar la calidad del servicio (datos anonimizados).</li>
              </ul>

              <div className="bg-white dark:bg-gray-800/50 p-3 rounded-lg mt-3">
                <p className="font-semibold mb-2">Datos Sensibles - Información de Salud:</p>
                <p className="text-xs">
                  Autorizo expresamente el tratamiento de mis datos sensibles relacionados con mi salud, 
                  historia clínica, diagnósticos, tratamientos y demás información médica necesaria para 
                  la prestación del servicio, en los términos del artículo 6 de la Ley 1581 de 2012.
                </p>
              </div>
            </div>
          </section>

          {/* Derechos del Titular */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">3. Derechos como Titular de Datos</h3>
            </div>
            <p className="text-sm text-[var(--vc-text)]/80 mb-2">
              Como titular de sus datos personales, usted tiene derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--vc-text)]/80 ml-4">
              <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales.</li>
              <li><strong>Solicitar prueba</strong> de la autorización otorgada.</li>
              <li><strong>Ser informado</strong> sobre el uso dado a sus datos personales.</li>
              <li><strong>Revocar la autorización</strong> y/o solicitar la supresión de datos cuando no se respeten 
              principios, derechos y garantías constitucionales y legales.</li>
              <li><strong>Acceder gratuitamente</strong> a sus datos personales objeto de tratamiento.</li>
            </ul>
          </section>

          {/* Seguridad de Datos */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">4. Seguridad y Confidencialidad</h3>
            </div>
            <p className="text-sm text-[var(--vc-text)]/80">
              VitalCare implementa medidas técnicas, humanas y administrativas necesarias para proteger 
              sus datos personales y evitar su adulteración, pérdida, consulta, uso o acceso no autorizado 
              o fraudulento, cumpliendo con los estándares de seguridad establecidos en la normativa colombiana.
            </p>
          </section>

          {/* Finalidad del Tratamiento */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">5. Finalidad del Tratamiento de Datos</h3>
            </div>
            <p className="text-sm text-[var(--vc-text)]/80 mb-2">
              Sus datos personales serán utilizados para:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--vc-text)]/80 ml-4">
              <li>Gestión de citas médicas y consultas</li>
              <li>Elaboración y actualización de historias clínicas</li>
              <li>Facturación y pagos de servicios médicos</li>
              <li>Comunicación de resultados médicos y seguimiento de tratamientos</li>
              <li>Envío de recordatorios y notificaciones del servicio</li>
              <li>Cumplimiento de obligaciones legales y regulatorias del sector salud</li>
              <li>Mejora continua de nuestros servicios</li>
            </ul>
          </section>

          {/* Vigencia */}
          <section>
            <h3 className="text-lg font-semibold mb-2">6. Vigencia</h3>
            <p className="text-sm text-[var(--vc-text)]/80">
              La autorización para el tratamiento de datos personales tendrá vigencia durante el tiempo 
              que sea necesario para cumplir con las finalidades descritas, salvo que usted ejerza su 
              derecho de revocación o supresión.
            </p>
          </section>

          {/* Responsable del Tratamiento */}
          <section>
            <h3 className="text-lg font-semibold mb-2">7. Responsable del Tratamiento</h3>
            <div className="text-sm text-[var(--vc-text)]/80 space-y-1">
              <p><strong>Razón Social:</strong> VitalCare S.A.S.</p>
              <p><strong>Domicilio:</strong> Colombia</p>
              <p><strong>Email:</strong> protecciondatos@vitalcare.com</p>
              <p><strong>Área de Peticiones, Quejas y Reclamos:</strong> pqr@vitalcare.com</p>
            </div>
          </section>

          {/* Aceptación Final */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              ⚠️ <strong>Declaración de Aceptación:</strong>
            </p>
            <p className="text-sm text-[var(--vc-text)]/80 mt-2">
              Al hacer clic en "Acepto los Términos y Condiciones", declaro que he leído, entendido 
              y acepto los términos aquí establecidos, y autorizo expresamente el tratamiento de mis 
              datos personales, incluyendo datos sensibles de salud, en los términos de la Ley 1581 
              de 2012 y normativa complementaria.
            </p>
          </section>

        </div>

        {/* Footer - Botones */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--vc-border)] bg-[var(--vc-bg)]">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={onAccept}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Acepto los Términos y Condiciones
          </Button>
        </div>
      </div>
    </div>
  );
};
