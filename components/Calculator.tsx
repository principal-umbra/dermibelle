import React, { useState } from 'react';

const Calculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOperator = (op: string) => {
    const currentValue = parseFloat(display);

    if (operator && !waitingForNewValue && previousValue) {
      const result = calculate(parseFloat(previousValue), currentValue, operator);
      setDisplay(String(result));
      setPreviousValue(String(result));
    } else {
      setPreviousValue(display);
    }

    setOperator(op);
    setWaitingForNewValue(true);
  };

  const handleEqual = () => {
    if (operator && previousValue) {
      const currentValue = parseFloat(display);
      const result = calculate(parseFloat(previousValue), currentValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-green-800 transition-all duration-300 z-30 hover:scale-110"
      >
        <span className="material-icons">calculate</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-72 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-30 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-primary p-3 flex justify-between items-center">
        <span className="text-white font-bold text-sm">Calculator</span>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
          <span className="material-icons text-sm">close</span>
        </button>
      </div>
      
      <div className="p-4 bg-gray-100 dark:bg-gray-800 text-right">
        <div className="text-3xl font-mono text-gray-800 dark:text-white truncate">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50 dark:bg-gray-900">
        <button onClick={handleClear} className="col-span-3 p-3 bg-red-100 text-red-600 rounded hover:bg-red-200 font-bold">C</button>
        <button onClick={() => handleOperator('/')} className="p-3 bg-gray-200 dark:bg-gray-700 text-primary rounded hover:bg-gray-300">/</button>
        
        {['7', '8', '9'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="p-3 bg-white dark:bg-surface-dark text-gray-800 dark:text-white rounded hover:bg-gray-50">{n}</button>
        ))}
        <button onClick={() => handleOperator('*')} className="p-3 bg-gray-200 dark:bg-gray-700 text-primary rounded hover:bg-gray-300">*</button>

        {['4', '5', '6'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="p-3 bg-white dark:bg-surface-dark text-gray-800 dark:text-white rounded hover:bg-gray-50">{n}</button>
        ))}
        <button onClick={() => handleOperator('-')} className="p-3 bg-gray-200 dark:bg-gray-700 text-primary rounded hover:bg-gray-300">-</button>

        {['1', '2', '3'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="p-3 bg-white dark:bg-surface-dark text-gray-800 dark:text-white rounded hover:bg-gray-50">{n}</button>
        ))}
        <button onClick={() => handleOperator('+')} className="p-3 bg-gray-200 dark:bg-gray-700 text-primary rounded hover:bg-gray-300">+</button>

        <button onClick={() => handleNumber('0')} className="col-span-2 p-3 bg-white dark:bg-surface-dark text-gray-800 dark:text-white rounded hover:bg-gray-50">0</button>
        <button onClick={handleDecimal} className="p-3 bg-white dark:bg-surface-dark text-gray-800 dark:text-white rounded hover:bg-gray-50">.</button>
        <button onClick={handleEqual} className="p-3 bg-primary text-white rounded hover:bg-green-700">=</button>
      </div>
    </div>
  );
};

export default Calculator;