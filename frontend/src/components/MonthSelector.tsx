import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthName } from '../utils/format';

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const prev = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const next = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-3">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[96px] text-center text-sm font-medium text-gray-900 sm:min-w-[140px]">
        {monthName(month, year)}
      </span>
      <button
        onClick={next}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
