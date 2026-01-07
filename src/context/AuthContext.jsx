import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthContext } from './AuthContextDef';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(null);

    // Backend Role from Firestore
    const [backendRole, setBackendRole] = useState(null);

    const role = backendRole || 'guest';

    const login = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setIsAllowed(null); // Reset to null to trigger loading state while checking
                try {
                    // Check if user exists in 'authorized_users' collection
                    const docRef = doc(db, "authorized_users", currentUser.email);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setIsAllowed(true);
                        setBackendRole(data.role || 'guest');
                    } else {
                        console.warn("User email not found in authorized_users collection.");
                        setIsAllowed(false);
                        setBackendRole('guest');
                    }
                } catch (error) {
                    console.error("Error checking authorization:", error);
                    setIsAllowed(false);
                }
            } else {
                setIsAllowed(false);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        isAllowed,
        role,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
