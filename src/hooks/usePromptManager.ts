import { useState, useCallback, useEffect } from 'react';
import { promptService, Prompt } from '../services/promptService';
import { useAdmin } from '../context/AdminContext';

export const usePromptManager = () => {
  const isAdmin = useAdmin();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
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

  const savePrompt = useCallback(async (
    type: string,
    content: string,
    endpoint: string,
    model: string
  ) => {
    if (!isAdmin) return null;
    try {
      const updated = await promptService.upsertPrompt(type, content, endpoint, model);
      setPrompts(prev => {
        const exists = prev.find(p => p.type === updated.type);
        if (exists) {
          return prev.map(p => (p.type === updated.type ? updated : p));
        }
        return [...prev, updated];
      });
      return updated;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [isAdmin]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return { prompts, loadPrompts, savePrompt, loading, error };
};
