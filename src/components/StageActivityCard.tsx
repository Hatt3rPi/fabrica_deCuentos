import React from 'react';

interface Props {
  label: string;
  enabled: boolean;
  inflight: number;
  onToggle: (value: boolean) => void;
}

const StageActivityCard: React.FC<Props> = ({ label, enabled, inflight, onToggle }) => {
  return (
    <div className="border p-4 rounded space-y-2 bg-white shadow">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">{label}</h3>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span>{enabled ? 'On' : 'Off'}</span>
        </label>
      </div>
      <p className="text-xs">Llamadas activas: {inflight}</p>
    </div>
  );
};

export default StageActivityCard;
