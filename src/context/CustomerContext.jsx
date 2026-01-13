import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from './useToast';

const CustomerContext = createContext();

export const useCustomers = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState({}); // Cache by Phone Number
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // 1. Initial Load (Build Cache)
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const q = query(collection(db, 'customers'));
                const snapshot = await getDocs(q);

                const cache = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.phone) {
                        cache[data.phone] = { id: doc.id, ...data };
                    }
                });

                setCustomers(cache);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load customers:", error);
                // Fail silently, don't block app
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    // 2. Add or Update Customer (Called on Checkout)
    const addOrUpdateCustomer = async (transactionData) => {
        const { customer } = transactionData;

        // Skip if no valid phone
        if (!customer || !customer.phone || customer.phone.length !== 10) return;

        const phone = customer.phone;
        const name = customer.name || 'Unknown';
        const docRef = doc(db, 'customers', phone);

        try {
            const exists = customers[phone];

            const updates = {
                phone,
                name, // Always update name to latest used
                lastVisit: serverTimestamp(),
                visitCount: increment(1),
                totalSpent: increment(transactionData.amount || 0)
            };

            // If they provided a note, append or update it? For now, we only update if provided.
            if (customer.note) {
                updates.lastNote = customer.note;
            }

            // Optimistic Cache Update
            setCustomers(prev => ({
                ...prev,
                [phone]: {
                    ...prev[phone],
                    name,
                    visitCount: (exists?.visitCount || 0) + 1,
                    totalSpent: (exists?.totalSpent || 0) + (transactionData.amount || 0),
                    lastVisit: new Date().toISOString() // Approximate
                }
            }));

            // Async Firestore Update
            await setDoc(docRef, updates, { merge: true });

        } catch (error) {
            console.error("Error saving customer:", error);
            // Silent error, don't stop checkout
        }
    };

    // 3. Fast Lookup
    const getCustomerByPhone = (phone) => {
        if (!phone) return null;
        return customers[phone] || null;
    };

    const value = {
        customers,
        loading,
        addOrUpdateCustomer,
        getCustomerByPhone
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};
