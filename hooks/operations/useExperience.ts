
import { useState } from 'react';

export const useExperience = () => {
  const [status, setStatus] = useState<'ready' | 'pending' | 'issues'>('pending');
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Iluminación Ambiental (Dimmer 40%)', checked: true, required: true },
    { id: 2, label: 'Playlist "Morning Glow" Activa', checked: true, required: false },
    { id: 3, label: 'Aroma Diffuser (Eucalipto)', checked: false, required: true },
    { id: 4, label: 'Temperatura (72°F)', checked: true, required: true },
    { id: 5, label: 'Stock de Toallas Calientes', checked: false, required: true },
    { id: 6, label: 'Amenidades (Agua/Té) Repuestas', checked: false, required: false },
  ]);

  const toggleItem = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const progress = Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100);

  const markAllReady = () => {
    setChecklist(prev => prev.map(i => ({ ...i, checked: true })));
    setStatus('ready');
  };

  return {
    status,
    checklist,
    toggleItem,
    progress,
    markAllReady
  };
};
