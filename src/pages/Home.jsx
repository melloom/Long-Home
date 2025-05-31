import { useState } from 'react';
import Rebuttals from './Rebuttals';

export default function Home() {
  const [showRebuttals, setShowRebuttals] = useState(false);

  if (showRebuttals) {
    return <Rebuttals />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center p-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Rebuttal Library
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Access evidence-based responses to common misconceptions and arguments. 
            Navigate through organized categories to find the perfect rebuttal when you need it.
          </p>
        </div>
        
        <button
          onClick={() => setShowRebuttals(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Go to Rebuttals →
        </button>
      </div>
    </div>
  );
}