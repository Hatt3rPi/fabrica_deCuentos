import React from 'react';

interface Props {
  label: string;
  fn: string;
  enabled: boolean;
  inflight: number;
  onToggle: (value: boolean) => void;
}

const StageActivityCard: React.FC<Props> = ({ label, fn, enabled, inflight, onToggle }) => {
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
      <p className="text-xs text-purple-700">Llamadas activas: {inflight}</p>
    </div>
  );
};

export default StageActivityCard;
