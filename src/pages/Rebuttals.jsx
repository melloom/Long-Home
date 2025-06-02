import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import RebuttalCard from '../components/RebuttalCard';

export default function Rebuttals() {
  const [rebuttals, setRebuttals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for rebuttals
    const rebuttalsQuery = query(
      collection(db, 'rebuttals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(rebuttalsQuery, (snapshot) => {
      const updatedRebuttals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRebuttals(updatedRebuttals);
      if (updatedRebuttals.length > 0 && !selectedCategory) {
        setSelectedCategory(updatedRebuttals[0].category);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to rebuttals:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [selectedCategory]);

  const selectedGroup = rebuttals.find(group => group.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rebuttals...</p>
        </div>
      </div>
    );
  }

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedGroup && selectedGroup.rebuttals?.map((rebuttal, index) => (
            <RebuttalCard
              key={rebuttal.id || index}
              title={rebuttal.title}
              response={rebuttal.content?.pt1 || rebuttal.content}
            />
          ))}
        </div>
      </div>
    </div>
  );
}