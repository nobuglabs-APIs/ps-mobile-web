import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  disabled = false,
  className = '',
  id,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-all duration-150 cursor-pointer select-none ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
              ? 'border-[#0056d6] ring-2 ring-[#0056d6]/15 bg-white text-[#0a1e42]'
              : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300 hover:bg-slate-100/70'
        }`}
      >
        {icon && (
          <span className="text-slate-400 shrink-0">{icon}</span>
        )}
        <span className={`flex-1 truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0056d6]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[180px] bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">Sem opções disponíveis</div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors cursor-pointer select-none ${
                      option.disabled
                        ? 'text-slate-300 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#0056d6]/5 text-[#0056d6] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-[#0056d6]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
