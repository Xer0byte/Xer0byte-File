import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect started');
    let isMounted = true;
    
    // Fallback timeout to prevent infinite loading if Firebase Auth is blocked
    const timeoutId = setTimeout(() => {
      console.log('AuthProvider timeout fired, isMounted:', isMounted);
      if (isMounted) {
        console.warn('Firebase auth state change timed out. Setting loading to false.');
        setLoading(false);
      }
    }, 1500);

    console.log('Calling onAuthStateChanged');
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('onAuthStateChanged callback fired, currentUser:', currentUser ? currentUser.uid : null);
        clearTimeout(timeoutId);
        
        // Set user and loading state immediately so UI is responsive
        if (isMounted) {
          setUser(currentUser);
          setLoading(false);
        }

        // Run Firestore sync in the background
        if (currentUser) {
          try {
            // Ensure user document exists in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              const userData: any = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.uid}@no-email.com`,
                createdAt: serverTimestamp(),
              };
              if (currentUser.displayName) {
                userData.displayName = currentUser.displayName;
              }
              if (currentUser.photoURL) {
                userData.photoURL = currentUser.photoURL;
              }
              await setDoc(userRef, userData);
            }
          } catch (error) {
            console.error('Error checking/creating user document:', error);
          }
        }
      }, (error) => {
        console.error('Auth state change error:', error);
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      });

      return () => {
        console.log('AuthProvider useEffect cleanup');
        isMounted = false;
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error calling onAuthStateChanged:', err);
      clearTimeout(timeoutId);
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
