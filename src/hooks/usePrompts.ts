import { useCallback, useEffect, useState } from 'react';
import { promptService } from '../services/promptService';
import { Prompt } from '../types/prompts';
import { useAdmin } from '../context/AdminContext';

export const usePrompts = () => {
  const isAdmin = useAdmin();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await promptService.fetchPrompts();
      setPrompts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const createPrompt = useCallback(
    async (type: string, content: string) => {
      if (!isAdmin) return null;
      setSaving(true);
      try {
        const created = await promptService.upsertPrompt(type, content);
        setPrompts(prev => [...prev, created]);
        return created;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [isAdmin]
  );

  const updatePrompt = useCallback(
    async (id: string, content: string) => {
      if (!isAdmin) return null;
      const current = prompts.find(p => p.id === id);
      if (!current) return null;
      setSaving(true);
      try {
        const updated = await promptService.upsertPrompt(current.type, content);
        setPrompts(prev => prev.map(p => (p.id === id ? updated : p)));
        return updated;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [isAdmin, prompts]
  );

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return { prompts, loading, saving, error, createPrompt, updatePrompt, loadPrompts };
};
