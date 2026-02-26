
import { useState } from 'react';

export const useMarketing = () => {
  const [activeCampaigns, setActiveCampaigns] = useState([
    { id: 1, name: 'Verano Radiante', status: 'active', reach: 1200, conversion: '3.5%', assets: 4 },
    { id: 2, name: 'Promo Brazilian First-Timer', status: 'draft', reach: 0, conversion: '-', assets: 1 },
  ]);

  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');

  const generateQR = (campaignName: string) => {
    // Simulating QR generation
    setGeneratedQR(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=dermibelle.com/promo/${campaignName.replace(/\s/g, '')}`);
  };

  // Mock Calendar Events
  const calendarEvents = [
      { id: 1, title: 'Post Instagram', date: '2024-10-22', type: 'social' },
      { id: 2, title: 'Email Newsletter', date: '2024-10-24', type: 'email' },
      { id: 3, title: 'Launch: Verano', date: '2024-10-25', type: 'launch' }
  ];

  return {
    activeCampaigns,
    generatedQR,
    generateQR,
    viewMode,
    setViewMode,
    calendarEvents
  };
};
