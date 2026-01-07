import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import { useToast } from './useToast';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { TransactionContext } from './TransactionContextDef';

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Default range: Current Month
    const [currentRange, setCurrentRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const { showToast } = useToast();

    useEffect(() => {
        // Optimized Listener: Only listen to the requested range
        const q = query(
            collection(db, 'transactions'),
            where('date', '>=', currentRange.start.toISOString()),
            where('date', '<=', currentRange.end.toISOString()),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            // Ignore specialized index errors initially, as they might pop up before index is built
            if (error.code !== 'failed-precondition') {
                showToast("Failed to sync data.", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentRange, showToast]);

    // Function to update the view (Components call this to switch context)
    const setViewDateRange = React.useCallback((startDate, endDate) => {
        setLoading(true);
        // Ensure we cover the full day boundaries
        setCurrentRange({
            start: startOfDay(startDate),
            end: endOfDay(endDate)
        });
    }, []);

    const addTransaction = async (transaction) => {
        try {
            await addDoc(collection(db, 'transactions'), {
                ...transaction,
                date: transaction.date || new Date().toISOString(), // Use provided date or new
                createdAt: new Date().toISOString()
            });
            // Silent success (User requested removal of notification)
        } catch (error) {
            console.error("Error adding transaction:", error);
            showToast("Failed to add transaction. Check connection.", "error");
        }
    };

    const deleteTransaction = async (id) => {
        // Find transaction data before deleting for Undo capability
        const transactionToDelete = transactions.find(t => t.id === id);

        try {
            await deleteDoc(doc(db, 'transactions', id));

            if (transactionToDelete) {
                const { id: _, ...dataToRestore } = transactionToDelete;
                showToast("Transaction deleted.", "info", {
                    label: "UNDO",
                    onClick: () => addTransaction(dataToRestore) // Re-add clean data
                });
            } else {
                showToast("Transaction deleted.", "info");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            showToast("Failed to delete transaction.", "error");
        }
    };

    const deleteTransactionsByDateRange = async (startDate, endDate) => {
        try {
            const q = query(
                collection(db, 'transactions'),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            showToast(`Cleared ${snapshot.size} records.`, "success");
        } catch (error) {
            console.error("Error deleting data range:", error);
            showToast("Failed to clear data.", "error");
        }
    };

    const clearAllTransactions = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'transactions'));
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            showToast("Database wiped successfully.", "success");
        } catch (error) {
            console.error("Error clearing database:", error);
            showToast("Failed to wipe database.", "error");
        }
    };

    const value = {
        transactions,
        loading,
        currentRange,
        setViewDateRange,
        addTransaction,
        deleteTransaction,
        deleteTransactionsByDateRange,
        clearAllTransactions
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};
