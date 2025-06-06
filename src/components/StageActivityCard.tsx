import React from 'react';

interface ActivityStats {
  total: number;
  errorRate: number;
  errors: Record<string, number>;
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
        <p className="text-purple-700">Llamadas activas: {inflight}</p>
        <p className="text-gray-700">
          Estado: <span className={enabled ? 'text-green-600' : 'text-red-600'}>{enabled ? 'Activado' : 'Desactivado'}</span>
        </p>
        {stats && (
          <p className="text-gray-500">
            Últimos 10m: {stats.total} llamadas, {(stats.errorRate * 100).toFixed(0)}% errores
            {Object.keys(stats.errors).length > 0 && ' – '}
            {Object.entries(stats.errors)
              .map(([type, count]) => `${type}: ${count}`)
              .join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default StageActivityCard;
