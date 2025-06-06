import React, { useEffect, useState } from 'react';
import StageActivityCard from '../../components/StageActivityCard';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { subscribeToInflight } from '../../lib/supabase/realtime';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface Inflight {
  actividad: string;
}

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

const CONFIG = {
  personajes: [
    { key: 'generar_descripcion', label: 'Generar descripción', fn: 'analyze-character' },
    { key: 'miniatura', label: 'Generar miniatura', fn: 'describe-and-sketch' },
    { key: 'miniatura_variante', label: 'Miniatura variantes', fn: 'generate-thumbnail-variant' },
  ],
  historia: [
    { key: 'generar_historia', label: 'Generar historia', fn: 'generate-story' },
    { key: 'generar_portada', label: 'Generar portada', fn: 'generate-cover' },
    { key: 'portada_variante', label: 'Variantes de portada', fn: 'generate-cover-variant' },
  ],
};

const AdminFlujo: React.FC = () => {
  const isAdmin = useAdmin();
  const [settings, setSettings] = useState<any>({});
  const [inflight, setInflight] = useState<Inflight[]>([]);
  const [stats, setStats] = useState<Record<string, ActivityStats>>({});

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

  const loadStats = async () => {
    const activities = Object.values(CONFIG).flat().map((a) => a.key);
    const sinceMs = Date.now() - 60 * 60 * 1000;
    const sinceIso = new Date(sinceMs).toISOString();
    const { data } = await supabase
      .from('prompt_metrics')
      .select('actividad, estado, timestamp')
      .in('actividad', activities)
      .gte('timestamp', sinceIso);
    const template = () =>
      Array.from({ length: 60 }, (_, i) => ({
        time: new Date(sinceMs + i * 60000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        success: 0,
        error: 0,
      }));
    const result: Record<string, ActivityStats> = {};
    (data || []).forEach((row: any) => {
      const key = row.actividad as string;
      if (!result[key]) {
        result[key] = { total: 0, errorRate: 0, timeline: template() };
      }
      const stat = result[key];
      stat.total++;
      const idx = Math.floor(
        (new Date(row.timestamp).getTime() - sinceMs) / 60000
      );
      if (idx >= 0 && idx < 60) {
        if (row.estado === 'error') {
          stat.timeline[idx].error++;
        } else {
          stat.timeline[idx].success++;
        }
      }
    });
    Object.values(result).forEach((s) => {
      const errors = s.timeline.reduce((a, b) => a + b.error, 0);
      s.errorRate = s.total ? errors / s.total : 0;
    });
    setStats(result);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadSettings();
    loadInflight();
    loadStats();
    const unsub = subscribeToInflight(loadInflight);
    const id = setInterval(() => {
      loadInflight();
      loadStats();
    }, 10000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [isAdmin]);

  const toggle = async (stage: string, act: string, value: boolean) => {
    const updated = { ...settings };
    if (!updated[stage]) updated[stage] = {};
    updated[stage][act] = value;
    await supabase
      .from('system_settings')
      .upsert({ key: 'stages_enabled', value: updated }, { onConflict: 'key' });
    setSettings(updated);
    loadStats();
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
                stats={stats[a.key]}
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
