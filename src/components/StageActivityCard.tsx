import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

interface ActivityPoint {
  time: string;
  success: number;
  error: number;
}

interface ActivityStats {
  total: number;
  errorRate: number;
  timeline: ActivityPoint[];
}

interface Props {
  label: string;
  fn: string;
  enabled: boolean;
  inflight: number;
  stats?: ActivityStats;
  onToggle: (value: boolean) => void;
}

const StageActivityCard: React.FC<Props> = ({ label, fn, enabled, inflight, stats, onToggle }) => {
  return (
    <div className="rounded-lg bg-white shadow p-4 space-y-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{label}</h3>
          <p className="text-xs text-gray-500">{fn}</p>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
      <div className="text-xs space-y-1">
        <div className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-medium">
          Activas: {inflight}
        </div>
        <p className="text-gray-700">
          Estado: <span className={enabled ? 'text-green-600' : 'text-red-600'}>{enabled ? 'Activado' : 'Desactivado'}</span>
        </p>
        {stats && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeline} stackOffset="expand">
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip formatter={(v: number) => Math.round(v as number)} />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#16a34a" fill="#bbf7d0" />
                <Area type="monotone" dataKey="error" stackId="1" stroke="#dc2626" fill="#fecaca" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-gray-500 mt-1">Última hora: {stats.total} llamadas, {(stats.errorRate * 100).toFixed(0)}% errores</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StageActivityCard;
