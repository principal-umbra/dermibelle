
import { useState } from 'react';

export const useLab = () => {
  const [ideas, setIdeas] = useState([
    { id: 1, title: 'Membresía Mensual', status: 'running', impact: 'high', owner: 'Elena', effort: 'Medio' },
    { id: 2, title: 'Happy Hour Facial', status: 'draft', impact: 'medium', owner: 'Sarah', effort: 'Bajo' },
  ]);

  // Simulator
  const [simValues, setSimValues] = useState({ price: 0, customers: 0 });
  const [simResult, setSimResult] = useState<number | null>(null);

  const calculate = () => {
    setSimResult(simValues.price * simValues.customers);
  };

  // Learning Vault (Closed Experiments)
  const vault = [
      { id: 101, title: 'Promo 2x1 Martes', result: 'Fail', insight: 'Bajo margen, alto volumen no compensó.' },
      { id: 102, title: 'Bundle Skincare', result: 'Success', insight: 'Aumentó ticket promedio un 15%.' }
  ];

  return {
    ideas,
    simValues,
    setSimValues,
    simResult,
    calculate,
    vault
  };
};
