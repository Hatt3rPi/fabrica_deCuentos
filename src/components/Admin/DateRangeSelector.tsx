import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateRangeSelectorProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  onApply: () => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  from, 
  to, 
  onChange, 
  onApply 
}) => {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const handleFromChange = (date: Date | null) => {
    if (date) {
      onChange(date.toISOString().split('T')[0], to);
    }
  };

  const handleToChange = (date: Date | null) => {
    if (date) {
      onChange(from, date.toISOString().split('T')[0]);
    }
  };

  const setQuickRange = (range: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let fromDate: Date;
    let toDate: Date = today;

    switch (range) {
      case 'today':
        fromDate = today;
        break;
      case 'yesterday':
        fromDate = yesterday;
        toDate = yesterday;
        break;
      case 'last7':
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case 'last30':
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      default:
        return;
    }

    onChange(
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    );
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <CalendarIcon className="w-4 h-4" />
        Filtrar por fecha
      </div>

      {/* Quick Range Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setQuickRange('today')}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Hoy
        </button>
        <button
          onClick={() => setQuickRange('yesterday')}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Ayer
        </button>
        <button
          onClick={() => setQuickRange('last7')}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Últimos 7 días
        </button>
        <button
          onClick={() => setQuickRange('last30')}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Últimos 30 días
        </button>
        <button
          onClick={() => setQuickRange('thisMonth')}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Este mes
        </button>
      </div>

      {/* Custom Date Range */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <div className="relative">
            <DatePicker
              selected={fromDate}
              onChange={handleFromChange}
              selectsStart
              startDate={fromDate}
              endDate={toDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
            />
            <CalendarIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <div className="relative">
            <DatePicker
              selected={toDate}
              onChange={handleToChange}
              selectsEnd
              startDate={fromDate}
              endDate={toDate}
              minDate={fromDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
            />
            <CalendarIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={onApply}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
        >
          Aplicar
        </button>
      </div>

      {/* Selected Range Indicator */}
      {fromDate && toDate && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
          Rango seleccionado: {fromDate.toLocaleDateString('es-ES')} - {toDate.toLocaleDateString('es-ES')}
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;