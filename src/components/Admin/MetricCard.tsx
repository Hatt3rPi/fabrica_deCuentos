import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  miniChart?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  iconBgColor,
  iconColor,
  miniChart,
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toLocaleString('es-ES');
    }
    return val;
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatValue(value)}
          </p>
          
          {change && (
            <div className={`flex items-center text-sm ${
              change.type === 'increase' 
                ? 'text-green-600' 
                : change.type === 'decrease' 
                ? 'text-red-600' 
                : 'text-gray-500'
            }`}>
              {change.type === 'increase' && (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              )}
              {change.type === 'decrease' && (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">
                {Math.abs(change.value)}%
              </span>
              <span className="ml-1 text-gray-500">vs anterior</span>
            </div>
          )}
        </div>
        
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      
      {miniChart && (
        <div className="mt-4 h-16">
          {miniChart}
        </div>
      )}
    </div>
  );
};

export default MetricCard;