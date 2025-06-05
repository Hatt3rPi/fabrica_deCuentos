import React, { useEffect, useState } from 'react';
import StageActivityCard from '../../components/StageActivityCard';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { subscribeToInflight } from '../../lib/supabase/realtime';

interface Inflight {
  actividad: string;
}

const CONFIG = {
  personajes: [
    { key: 'generar_descripcion', label: 'Generar descripción', fn: 'analyze-character' },
    { key: 'miniatura', label: 'Generar miniatura', fn: 'describe-and-sketch' },
    { key: 'miniatura_variante', label: 'Miniatura variantes', fn: 'generate-thumbnail-variant' },
  ],
  historia: [
    { key: 'generar_historia', label: 'Generar historia', fn: 'generate-story' },
    { key: 'generar_portada', label: 'Generar portada', fn: 'generate-cover' },
  ],
};

const AdminFlujo: React.FC = () => {
  const isAdmin = useAdmin();
  const [settings, setSettings] = useState<any>({});
  const [inflight, setInflight] = useState<Inflight[]>([]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'stages_enabled')
      .single();
    setSettings(data?.value || {});
  };

  const loadInflight = async () => {
    const { data } = await supabase.from('inflight_calls').select('actividad');
    setInflight(data || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadSettings();
    loadInflight();
    const unsub = subscribeToInflight(loadInflight);
    const id = setInterval(loadInflight, 1000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [isAdmin]);

  const toggle = async (stage: string, act: string, value: boolean) => {
    const updated = { ...settings };
    if (!updated[stage]) updated[stage] = {};
    updated[stage][act] = value;
    await supabase.from('system_settings').update({ value: updated }).eq('key', 'stages_enabled');
    setSettings(updated);
  };

  if (!isAdmin) return <p>No autorizado</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Flujo</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.entries(CONFIG).map(([stage, acts]) => (
          <div key={stage} className="bg-gray-50 rounded-lg p-4 shadow space-y-4">
            <h2 className="font-semibold capitalize text-lg">{stage}</h2>
            {acts.map((a) => (
              <StageActivityCard
                key={a.key}
                label={a.label}
                fn={a.fn}
                enabled={!!settings?.[stage]?.[a.key]}
                inflight={inflight.filter((f) => f.actividad === a.key).length}
                onToggle={(v) => toggle(stage, a.key, v)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFlujo;
