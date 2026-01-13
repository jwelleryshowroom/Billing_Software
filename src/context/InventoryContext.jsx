import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    writeBatch,
    getDocs
} from 'firebase/firestore';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    // Initial Seed Data (Same as before)
    const defaultItems = [
        { name: 'Veg Puff', price: 25, category: 'Snacks', stock: 45, image: '🥐' },
        { name: 'Black Forest (1kg)', price: 800, category: 'Cakes', stock: 2, image: '🎂' },
        { name: 'Chocolate Truffle', price: 550, category: 'Cakes', stock: 5, image: '🍫' },
        { name: 'Pineapple Cake', price: 450, category: 'Cakes', stock: 3, image: '🍰' },
        { name: 'Coke (300ml)', price: 40, category: 'Drinks', stock: 45, image: '🥤' },
        { name: 'Chicken Puff', price: 35, category: 'Snacks', stock: 8, image: '🍖' },
        { name: 'Cupcake', price: 60, category: 'Pastries', stock: 15, image: '🧁' },
        { name: 'Donut', price: 80, category: 'Pastries', stock: 10, image: '🍩' },
        { name: 'Cold Coffee', price: 65, category: 'Drinks', stock: 20, image: '☕' },
    ];

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { user } = useAuth();

    // 1. Realtime Sync with Firestore (Only when authenticated)
    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'inventory_items'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            // Auto-Seed if empty and not loading for the first time
            if (docs.length === 0 && !snapshot.metadata.hasPendingWrites) {
                checkAndSeed(docs);
            } else {
                setItems(docs);
                setLoading(false);
            }
        }, (error) => {
            console.error("Inventory Sync Error:", error);
            // Only show toast if it's NOT a permission error (to avoid spamming guests)
            if (error.code !== 'permission-denied') {
                showToast("Failed to sync inventory", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const checkAndSeed = async (currentDocs) => {
        // Double check to prevent loops
        if (currentDocs.length > 0) return;

        try {
            // Explicitly check server state once to be sure
            const snap = await getDocs(collection(db, 'inventory_items'));
            if (snap.size === 0) {
                console.log("Seeding Database...");
                const batch = writeBatch(db);
                defaultItems.forEach(item => {
                    const docRef = doc(collection(db, 'inventory_items'));
                    batch.set(docRef, item);
                });
                await batch.commit();
                showToast("Database safely seeded with default menu", "success");
            }
        } catch (err) {
            console.error("Seeding failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const addItem = async (newItem) => {
        try {
            // Remove undefined fields to prevent Firestore crashes
            const cleanItem = JSON.parse(JSON.stringify(newItem));

            await addDoc(collection(db, 'inventory_items'), cleanItem);
            showToast("Item added to menu", "success");
        } catch (error) {
            console.error("Error adding item:", error);
            const msg = error.code === 'permission-denied' ? 'Permission Denied: You are not authorized.' : error.message;
            showToast(`Failed: ${msg}`, "error");
        }
    };

    const updateItem = async (id, updates) => {
        try {
            const docRef = doc(db, 'inventory_items', id);
            await updateDoc(docRef, updates);
            // No toast needed for minor updates usually, or keep it subtle
        } catch (error) {
            console.error("Error updating item:", error);
            showToast("Failed to update item", "error");
        }
    };

    const deleteItem = async (id) => {
        try {
            await deleteDoc(doc(db, 'inventory_items', id));
            showToast("Item removed from menu", "success");
        } catch (error) {
            console.error("Error deleting item:", error);
            showToast("Failed to delete item", "error");
        }
    };

    const getItemsByCategory = (category) => {
        if (category === 'All') return items;
        return items.filter(i => i.category === category);
    };

    return (
        <InventoryContext.Provider value={{ items, addItem, updateItem, deleteItem, getItemsByCategory, loading }}>
            {children}
        </InventoryContext.Provider>
    );
};
