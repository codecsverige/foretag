import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase.js";

const AuthContext = createContext({
  user: null,
  authLoading: true,
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      console.log("🔄 Auth state changed:", fbUser ? "User logged in" : "No user");
      
      if (!fbUser) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        // ✅ إعادة تحميل بيانات Firebase Auth
        await fbUser.reload();
        const fresh = auth.currentUser;

        // ✅ إعداد user المبدئي من Firebase Auth
        let updatedUser = {
          uid: fresh.uid,
          email: fresh.email,
          displayName: fresh.displayName || "",
          phoneNumber: fresh.phoneNumber || null,
          balance: 0
        };

        // ✅ دمج بيانات Firestore أو إنشاؤها مع timeout
        const ref = doc(db, "users", fresh.uid);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore timeout')), 5000)
        );
        
        let data;
        try {
          const snap = await Promise.race([getDoc(ref), timeoutPromise]);
          
          if (snap.exists()) {
            data = snap.data();
          } else {
            data = {
              email: fresh.email,
              phone: fresh.phoneNumber || null,
              role: "user",
              balance: 0,
              createdAt: Date.now()
            };
            // Don't wait for setDoc to complete
            setDoc(ref, data, { merge: true }).catch(console.warn);
          }

          updatedUser = {
            ...updatedUser,
            phoneNumber: updatedUser.phoneNumber || data.phone || null,
            balance: data.balance || 0
          };
        } catch (firestoreError) {
          console.warn("⚠️ Firestore error, using minimal user data:", firestoreError.message);
          // Continue with basic user data even if Firestore fails
        }

        // Ensure we always expose a usable email for flows that depend on it
        setUser({
          ...updatedUser,
          email: updatedUser.email || (data && data.email) || null,
        });
        console.log("✅ User set successfully");
      } catch (err) {
        console.warn("❗ Auth sync error:", err.message);
        // Set minimal user data even on error
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || "",
          phoneNumber: fbUser.phoneNumber || null,
          balance: 0
        });
      } finally {
        setAuthLoading(false);
        console.log("✅ Auth loading completed");
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    try {
      console.log("Logging out user...");
      // Clear user state immediately
      setUser(null);
      
      // Sign out from Firebase
      await signOut(auth);
      console.log("Firebase signOut successful");
      
      // Clear any cached data
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      console.log("Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if Firebase logout fails, clear local state
      setUser(null);
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
