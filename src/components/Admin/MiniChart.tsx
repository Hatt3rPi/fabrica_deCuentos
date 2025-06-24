import React from 'react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MiniChartData {
  value: number;
  date?: string;
}

interface MiniChartProps {
  data: MiniChartData[];
  type: 'area' | 'bar';
  color: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, type, color }) => {
  if (!data || data.length === 0) return null;

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MiniChart;