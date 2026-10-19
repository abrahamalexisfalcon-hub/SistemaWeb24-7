import React from 'react';
import { MapPin, Wrench, FileSignature, Check } from 'lucide-react';

interface OrderStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export const OrderStepper: React.FC<OrderStepperProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, icon: MapPin, label: 'Llegada' },
    { number: 2, icon: Wrench, label: 'Atención' },
    { number: 3, icon: FileSignature, label: 'Firma' },
    { number: 4, icon: Check, label: 'Finalizado' },
  ];

  return (
    <div className="w-full py-4 px-2">
      <div className="relative flex items-center justify-between max-w-xs mx-auto">
        {/* Línea conectora de fondo */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200" />

        {/* Línea conectora activa en cian */}
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300"
          style={{
            width: `${((Math.min(currentStep, 4) - 1) / (steps.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 2rem)',
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep || currentStep === 4;
          const isActive = step.number === currentStep;
          const IconComponent = step.icon;

          return (
            <div key={step.number} className="relative z-0 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? 'bg-[#0ea5e9] text-white ring-4 ring-[#0ea5e9]/20'
                    : isActive
                    ? 'bg-[#0ea5e9] text-white ring-4 ring-[#0ea5e9]/20'
                    : 'bg-white text-slate-400 border border-slate-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <IconComponent className="w-4 h-4 stroke-[2]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
