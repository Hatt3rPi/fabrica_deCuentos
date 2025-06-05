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
    { key: 'generar_descripcion', label: 'Generar descripción', prompt: 'PROMPT_DESCRIPCION_PERSONAJE' },
    { key: 'miniatura', label: 'Generar miniatura', prompt: 'PROMPT_CREAR_MINIATURA_PERSONAJE' },
    { key: 'miniatura_variante', label: 'Miniatura variantes', prompt: 'PROMPT_VARIANTE_TRASERA' },
  ],
  historia: [
    { key: 'generar_historia', label: 'Generar historia', prompt: 'PROMPT_GENERADOR_CUENTOS' },
    { key: 'generar_portada', label: 'Generar portada', prompt: 'PROMPT_CUENTO_PORTADA' },
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
    return unsub;
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
      <div className="flex gap-4 overflow-x-auto">
        {Object.entries(CONFIG).map(([stage, acts]) => (
          <div key={stage} className="space-y-3">
            <h2 className="font-semibold capitalize">{stage}</h2>
            {acts.map((a) => (
              <StageActivityCard
                key={a.key}
                label={a.label}
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
