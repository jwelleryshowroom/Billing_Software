import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, MinusCircle, ShieldAlert, Search, ShoppingBag, Printer, ArrowRight, X, CheckCircle } from 'lucide-react';
import { useTransactions } from '../context/useTransactions';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useInventory } from '../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import ReceiptPrinter from './ReceiptPrinter';
import { triggerHaptic } from '../utils/haptics';

const TransactionForm = ({ initialType = 'sale', onSuccess, onInputFocus, onInputBlur }) => {
    const { addTransaction, transactions } = useTransactions();
    const { items: inventoryItems } = useInventory();
    const { role } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [accessDenied, setAccessDenied] = useState(false);
    const [type, setType] = useState(initialType); // 'sale' or 'expense'

    // --- EXPENSE STATE ---
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [expenseSuggestions, setExpenseSuggestions] = useState([]);

    // --- QUICK SALE STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [customPrice, setCustomPrice] = useState(''); // Allow overriding price if needed

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync type if prop changes
    useEffect(() => {
        setType(initialType);
    }, [initialType]);

    // --- EXPENSE LOGIC ---
    useEffect(() => {
        if (type === 'sale') return; // Only for expense
        if (!transactions || transactions.length === 0) {
            setExpenseSuggestions([]);
            return;
        }
        const history = transactions.filter(t => t.type === 'expense');
        const counts = {};
        history.forEach(t => {
            if (t.description) {
                const desc = t.description.trim();
                if (desc) counts[desc] = (counts[desc] || 0) + 1;
            }
        });
        const inputLower = description.toLowerCase().trim();
        const sorted = Object.entries(counts)
            .filter(([desc]) => !inputLower || desc.toLowerCase().includes(inputLower))
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .map(entry => entry[0])
            .slice(0, 5);
        setExpenseSuggestions(sorted);
    }, [transactions, type, description]);

    // --- QUICK SALE LOGIC ---
    const filteredInventory = useMemo(() => {
        if (!searchTerm || selectedItem) return [];
        const lower = searchTerm.toLowerCase();
        return inventoryItems.filter(item =>
            item.name.toLowerCase().includes(lower) ||
            item.category.toLowerCase().includes(lower)
        ).slice(0, 5);
    }, [searchTerm, inventoryItems, selectedItem]);

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        setSearchTerm(item.name);
        setCustomPrice(item.price.toString());
        setQuantity(1);
    };

    const handleClearSelection = () => {
        setSelectedItem(null);
        setSearchTerm('');
        setCustomPrice('');
        setQuantity(1);
    };

    // Auto-Print Effect
    useEffect(() => {
        if (showReceipt && lastTransaction) {
            // Wait for modal transition and DOM render
            const timer = setTimeout(() => {
                window.print();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [showReceipt, lastTransaction]);

    const handleSaleSubmit = async (action) => {
        if (role === 'guest') {
            setAccessDenied(true);
            return;
        }

        const finalPrice = parseFloat(customPrice);
        if (!finalPrice || isNaN(finalPrice)) {
            alert("Please enter a valid price");
            return;
        }

        const saleItem = {
            ...selectedItem,
            price: finalPrice,
            qty: parseInt(quantity)
        };

        if (action === 'add_more') {
            // Redirect to Billing with this item in cart
            navigate('/billing', { state: { cart: [saleItem] } });
            return;
        }

        // Print & Save
        const totalAmount = finalPrice * quantity;
        const tempTx = {
            type: 'sale',
            amount: totalAmount,
            description: `${selectedItem ? selectedItem.name : searchTerm} (x${quantity})`, // Simple desc for Dashboard
            date: new Date().toISOString(),
            // Store details for ReceiptPrinter
            items: [saleItem],
            customer: { name: 'Walk-in', phone: '' },
            payment: { type: 'cash' },
            mode: 'quick'
        };

        try {
            setIsSaving(true);
            const docRef = await addTransaction(tempTx);
            const savedTx = { ...tempTx, id: docRef.id };
            setLastTransaction(savedTx);
            setShowReceipt(true);

            // Reset
            triggerHaptic('hover');
            handleClearSelection();
            if (onSuccess && action !== 'print_save') onSuccess();
        } catch (error) {
            console.error("Failed to save transaction", error);
        } finally {
            setIsSaving(false);
        }
    };


    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        if (role === 'guest') {
            setAccessDenied(true);
            return;
        }
        if (!amount || isNaN(parseFloat(amount))) return;

        addTransaction({
            type: 'expense',
            amount: parseFloat(amount),
            description: description || 'Expense',
            date: new Date().toISOString()
        });
        triggerHaptic('success');
        setAmount('');
        setDescription('');
        if (onSuccess) onSuccess();
    };

    // --- STYLES ---
    const isPopup = !!onSuccess; // Reusing existing prop logic
    const tabContainerStyle = {
        display: 'flex',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '100px',
        padding: '4px',
        marginBottom: '16px',
        border: '1px solid var(--color-border)'
    };
    const tabStyle = (isActive, txType) => ({
        flex: 1, padding: '8px', borderRadius: '100px',
        backgroundColor: isActive ? (txType === 'sale' ? 'var(--color-success)' : 'var(--color-danger)') : 'transparent',
        color: isActive ? 'white' : 'var(--color-text-muted)',
        border: 'none', fontSize: '0.9rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
    });

    return (
        <div className={isPopup ? "" : "card"} style={isPopup ? { marginBottom: 0, padding: 0, border: 'none', background: 'transparent' } : { marginBottom: '16px', padding: '16px' }}>

            {/* TABS */}
            <div style={tabContainerStyle}>
                <button type="button" onClick={() => setType('sale')} style={tabStyle(type === 'sale', 'sale')}>
                    <PlusCircle size={18} /> Quick Sale
                </button>
                <button type="button" onClick={() => setType('expense')} style={tabStyle(type === 'expense', 'expense')}>
                    <MinusCircle size={18} /> Expense
                </button>
            </div>

            {/* EXPENSE FORM (Legacy) */}
            {type === 'expense' && (
                <form onSubmit={handleExpenseSubmit}>
                    <div className="input-group" style={{ marginBottom: '12px' }}>
                        <label className="input-label">Amount (₹)</label>
                        <input
                            type="number" className="input-field" placeholder="0"
                            value={amount} onChange={(e) => setAmount(e.target.value)}
                            required inputMode="decimal"
                            onFocus={onInputFocus} onBlur={onInputBlur}
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: '12px' }}>
                        <label className="input-label">Description</label>
                        <input
                            type="text" className="input-field" placeholder="e.g. Vegetables"
                            value={description} onChange={(e) => setDescription(e.target.value)}
                            onFocus={onInputFocus} onBlur={onInputBlur}
                        />
                        {/* Suggestions */}
                        {expenseSuggestions.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {expenseSuggestions.map((s, i) => (
                                    <button key={i} type="button" onClick={() => setDescription(s)}
                                        style={{ padding: '6px 12px', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={!amount || isNaN(parseFloat(amount))}
                        className="btn btn-danger"
                        style={{ width: '100%', opacity: (!amount || isNaN(parseFloat(amount))) ? 0.5 : 1 }}
                        onClick={() => triggerHaptic('hover')}
                    >
                        Add Expense
                    </button>
                </form>
            )}

            {/* NEW SMART SALE FORM */}
            {type === 'sale' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* 1. Item Search / Name */}
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label className="input-label">Item Name</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px', paddingRight: selectedItem ? '40px' : '12px' }}
                                placeholder="Start typing (e.g. Ca...)"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedItem) handleClearSelection(); // Clear selection if user types again
                                }}
                                onFocus={onInputFocus} onBlur={onInputBlur}
                            />
                            {selectedItem && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('hover');
                                        handleClearSelection();
                                    }}
                                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Suggestions Dropdown */}
                        {filteredInventory.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                                zIndex: 1000,
                                marginTop: '4px',
                                overflowY: 'auto',
                                maxHeight: '200px'
                            }}>
                                {filteredInventory.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemSelect(item)}
                                        style={{
                                            padding: '10px 14px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            borderBottom: '1px solid var(--color-border)',
                                            cursor: 'pointer',
                                            transition: 'background 0.1s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.category}</span>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>₹{item.price}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Price & Qty Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label className="input-label">Price</label>
                            <input
                                type="number"
                                className="input-field"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Qty</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('hover');
                                        setQuantity(Math.max(1, quantity - 1));
                                    }}
                                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer' }}
                                >
                                    <MinusCircle size={16} />
                                </button>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ textAlign: 'center', padding: '10px 4px' }}
                                    value={quantity}
                                    onChange={(e) => {
                                        triggerHaptic('hover');
                                        setQuantity(parseInt(e.target.value) || 1);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('hover');
                                        setQuantity(quantity + 1);
                                    }}
                                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer' }}
                                >
                                    <PlusCircle size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Total Display */}
                    {customPrice && (
                        <div style={{
                            padding: '10px', borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '4px'
                        }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Total</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                                ₹{(parseFloat(customPrice || 0) * quantity).toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <button
                        onClick={() => {
                            if (!isSaving) {
                                triggerHaptic('hover');
                                handleSaleSubmit('print_save');
                            }
                        }}
                        disabled={!searchTerm || !customPrice || isSaving}
                        className="btn-premium-hover"
                        style={{
                            width: '100%', padding: '12px', borderRadius: '12px',
                            background: 'var(--color-primary)', color: 'white', border: 'none',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: 'pointer', opacity: (!searchTerm || !customPrice || isSaving) ? 0.6 : 1
                        }}
                    >
                        {isSaving ? (
                            <div style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                        ) : <Printer size={18} />}
                        {isSaving ? 'Saving...' : 'Print & Save'}
                    </button>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                    <button
                        onClick={() => {
                            triggerHaptic('hover');
                            handleSaleSubmit('add_more');
                        }}
                        disabled={!searchTerm || !customPrice}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '12px',
                            background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: 'pointer', opacity: (!searchTerm || !customPrice) ? 0.6 : 1
                        }}
                    >
                        <ShoppingBag size={18} /> Add More Items <ArrowRight size={16} />
                    </button>

                </div>
            )}

            {/* ACCESS DENIED MODAL */}
            {accessDenied && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: theme === 'dark' ? 'rgba(20, 20, 30, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)', zIndex: 20,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '16px', padding: '20px', textAlign: 'center'
                }}>
                    <ShieldAlert size={40} className="text-secondary" style={{ marginBottom: '12px' }} />
                    <h3>Access Denied</h3>
                    <button onClick={() => setAccessDenied(false)} className="btn btn-primary" style={{ marginTop: '16px' }}>Close</button>
                </div>
            )}

            {/* RECEIPT MODAL */}
            {/* RECEIPT MODAL - Matches Billing.jsx Exactly */}
            <Modal isOpen={showReceipt && lastTransaction} onClose={() => { setShowReceipt(false); if (onSuccess) onSuccess(); }} title="Invoice Placed" zIndex={20000}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={24} />
                        <span>Transaction Saved Successfully!</span>
                    </div>

                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <ReceiptPrinter
                            transaction={lastTransaction || {}}
                            type="TAX_INVOICE"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button
                            onClick={() => {
                                triggerHaptic('hover');
                                setShowReceipt(false);
                                if (onSuccess) onSuccess();
                            }}
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                triggerHaptic('hover');
                                window.print();
                            }}
                            className="btn-print-now"
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Printer size={18} /> Print Again
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default TransactionForm;
