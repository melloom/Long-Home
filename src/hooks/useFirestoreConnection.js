import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { onSnapshotsInSync } from 'firebase/firestore';

export const useFirestoreConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSynced, setIsSynced] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for Firestore sync status
    const unsubscribe = onSnapshotsInSync(db, () => {
      setIsSynced(true);
      setRetryCount(0);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const retryConnection = async () => {
    if (retryCount >= maxRetries) {
      console.error('Max retry attempts reached');
      return false;
    }

    try {
      await db.enableNetwork();
      setRetryCount(prev => prev + 1);
      return true;
    } catch (error) {
      console.error('Error retrying connection:', error);
      return false;
    }
  };

  return {
    isOnline,
    isSynced,
    retryCount,
    retryConnection
  };
}; 