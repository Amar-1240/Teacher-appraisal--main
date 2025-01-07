import { create } from 'zustand';
import { User } from '../types';
import { db } from '../config/firebaseConfig'; // Ensure firebase config is correct
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'teacher' | 'admin') => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password, role) => {
    try {
      if (role === 'admin') {
        // Admin login logic
        const adminUser: User = {
          id: 'admin1', // Hardcoded admin ID
          name: 'Admin',
          email,
          role: 'admin',
          documentId: null, // Admin does not require a Firestore document ID
        };
        set({ user: adminUser, isAuthenticated: true });
        return;
      }

      if (role === 'teacher') {
        // Fetch teacher data from Firestore
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('email', '==', email), where('password', '==', password));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const teacherDoc = querySnapshot.docs[0];
          const documentId = teacherDoc.id; // Get document ID from Firestore
          const teacherData = teacherDoc.data(); // Get document data

          const teacherUser: User = {
            id: documentId, // Use Firestore document ID as user ID
            name: teacherData.name || email.split('@')[0], // Use teacher name or fallback to email username
            email,
            role: 'teacher',
            documentId, // Store Firestore document ID
          };

          set({ user: teacherUser, isAuthenticated: true });
        } else {
          throw new Error('Invalid teacher credentials');
        }
        return;
      }

      // Handle unsupported roles
      throw new Error(`Unsupported role: ${role}`);
    } catch (err) {
      const error = err as Error; // Explicitly assert the type of `err`
      console.error('Login failed:', error.message);
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
