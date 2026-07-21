import React from 'react';

interface MoneyInputProps {
  label: string;
  value: number | '';
  onChange: (val: number | '') => void;
  placeholder?: string;
  className?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '0',
  className = ''
}) => {
  const formatNumber = (num: number | '') => {
    if (!num) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const numVal = rawVal ? parseInt(rawVal, 10) : '';
    onChange(numVal);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">{label}</label>
      )}
      <div className="relative flex items-center rounded-xl border border-neutral-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 overflow-hidden bg-neutral-50 transition-all duration-200">
        <span className="pl-3 pr-1 text-sm font-extrabold text-neutral-400 select-none">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={formatNumber(value)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full py-2.5 pl-1 pr-8 text-sm outline-none bg-transparent font-extrabold text-neutral-800 placeholder-neutral-400"
        />
        {typeof value === 'number' && value > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-neutral-400 hover:text-neutral-600 p-1 rounded-full text-[10px] transition-colors cursor-pointer"
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
