"use client";

import React, { useState, useEffect } from "react";

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
}

interface TutorialModalProps {
  storageKey: string;
  steps: TutorialStep[];
  title: string;
  badge: string;
}

export default function TutorialModal({ storageKey, steps, title, badge }: TutorialModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-300 relative text-neutral-850 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Skip Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-xs font-extrabold text-neutral-400 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-200 transition-colors uppercase tracking-wider cursor-pointer"
        >
          Lewati
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5 mt-2 select-none">
          <span className="text-[9px] bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
            {badge}
          </span>
          <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-zinc-100 mt-1.5">
            {title}
          </h2>
        </div>

        {/* Step Content */}
        <div className="flex flex-col items-center text-center gap-4 py-2 select-none min-h-[170px]">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-zinc-900 border border-orange-100 dark:border-zinc-800 flex items-center justify-center text-3xl shadow-sm">
            {step.icon}
          </div>
          <div className="flex flex-col gap-1.5 max-w-sm">
            <h3 className="text-sm font-black text-neutral-805 dark:text-zinc-200">
              {step.title}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-450 leading-relaxed font-medium">
              {step.description}
            </p>
          </div>
        </div>

        {/* Progress Bar / Dots */}
        <div className="flex items-center justify-center gap-2 select-none">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentStep
                  ? "w-6 bg-orange-600"
                  : "w-1.5 bg-neutral-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-2">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              type="button"
              className="flex-1 py-3 border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 font-extrabold text-xs rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all uppercase tracking-wider cursor-pointer text-center"
            >
              Kembali
            </button>
          ) : (
            <button
              onClick={handleClose}
              type="button"
              className="flex-1 py-3 border border-neutral-200 dark:border-zinc-800 text-neutral-450 dark:text-zinc-500 font-extrabold text-xs rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all uppercase tracking-wider cursor-pointer text-center"
            >
              Tutup
            </button>
          )}
          <button
            onClick={handleNext}
            type="button"
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-100 dark:shadow-none transition-all uppercase tracking-wider cursor-pointer text-center"
          >
            {currentStep === steps.length - 1 ? "Mulai Sekarang" : "Lanjut"}
          </button>
        </div>

      </div>
    </div>
  );
}
