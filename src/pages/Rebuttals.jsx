import { useState } from 'react';
import { rebuttals } from '../data/rebuttals';
import RebuttalCard from '../components/RebuttalCard';

export default function Rebuttals() {
  const [selectedCategory, setSelectedCategory] = useState(rebuttals[0]?.category || '');

  const selectedGroup = rebuttals.find(group => group.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <button 
            onClick={() => window.history.back()} 
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rebuttal Library</h1>
          <p className="text-gray-600">Browse evidence-based responses by category</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {rebuttals.map((group) => (
                  <button
                    key={group.category}
                    onClick={() => setSelectedCategory(group.category)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === group.category
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {group.category}
                    <span className="text-sm text-gray-500 ml-2">
                      ({group.items.length})
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Rebuttals Content */}
          <div className="lg:col-span-3">
            {selectedGroup && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {selectedGroup.category}
                </h2>
                <div className="space-y-4">
                  {selectedGroup.items.map((item, index) => (
                    <RebuttalCard 
                      key={`${item.title}-${index}`} 
                      title={item.title} 
                      response={item.response} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}