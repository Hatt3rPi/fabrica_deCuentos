import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DualLineChartData {
  date: string;
  tokens: number;
  activeUsers: number;
}

interface DualLineChartProps {
  data: DualLineChartData[];
  loading?: boolean;
}

const DualLineChart: React.FC<DualLineChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const formatTooltip = (value: number, name: string) => {
    if (name === 'tokens') {
      return [value.toLocaleString('es-ES'), 'Tokens Consumidos'];
    }
    return [value.toLocaleString('es-ES'), 'Usuarios Activos'];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Consumo de Tokens y Usuarios Activos
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              yAxisId="tokens"
              orientation="left"
              stroke="#8b5cf6"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString('es-ES')}
            />
            <YAxis 
              yAxisId="users"
              orientation="right"
              stroke="#06b6d4"
              fontSize={12}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => `Fecha: ${formatDate(label)}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              yAxisId="tokens"
              type="monotone"
              dataKey="tokens"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              name="Tokens Consumidos"
            />
            <Line
              yAxisId="users"
              type="monotone"
              dataKey="activeUsers"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
              name="Usuarios Activos"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DualLineChart;