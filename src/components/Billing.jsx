import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTransactions } from '../context/useTransactions';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { useCustomers } from '../context/CustomerContext';
import { Plus, Minus, Search, ShoppingCart, User, Calendar, Clock, CreditCard, ChevronRight, ChevronLeft, Printer, Clipboard, NotebookPen, Save, CheckCircle, Phone, UtensilsCrossed, Camera, X, Trash2, Award } from 'lucide-react';
import { format } from 'date-fns';
import Modal from './Modal';

import ReceiptPrinter from './ReceiptPrinter';
import { toTitleCase, getSmartEmoji, generateWhatsAppLink } from '../utils/smartHelpers';
import { triggerHaptic } from '../utils/haptics';

// --- Extracted Cart Component to fix Focus Issues ---
const CartContent = ({
    isMobile = false,
    mode,
    cart,
    totalAmount,
    payment,
    setPayment,
    customerDetails,
    setCustomerDetails,
    handoverMode,
    setHandoverMode,
    deliveryDetails,
    setDeliveryDetails,
    updateQty,
    handleCheckout,
    balanceDue,
    isPrinting,
    clearCart,
    existingCustomer // [NEW] Pass this prop
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header Spacer for Mobile Modal */}
            {isMobile && <div style={{ height: '8px' }}></div>}

            {/* SCENARIO B: ORDER DETAILS (Only if Order Mode) */}
            {mode === 'order' && (
                <div style={{ padding: '16px', background: 'transparent', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Order Details</div>

                    {/* Handover Type Toggle */}
                    <div style={{ display: 'flex', background: 'var(--color-bg-glass-tab)', padding: '4px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                setHandoverMode('now');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                background: handoverMode === 'now' ? 'var(--color-bg-surface)' : 'transparent',
                                color: handoverMode === 'now' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                boxShadow: handoverMode === 'now' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: handoverMode === 'now' ? 700 : 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Take Now
                        </button>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                setHandoverMode('later');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                background: handoverMode === 'later' ? 'var(--color-bg-surface)' : 'transparent',
                                color: handoverMode === 'later' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                boxShadow: handoverMode === 'later' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: handoverMode === 'later' ? 700 : 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Book Later
                        </button>
                    </div>

                    {/* Customer Input */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ flex: 1.5, position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                            <input
                                placeholder="Name"
                                value={customerDetails.name}
                                onChange={e => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                                style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div style={{ flex: 1, position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={customerDetails.phone}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setCustomerDetails(prev => ({ ...prev, phone: val }));
                                }}
                                style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                    </div>

                    {/* Returning Customer Badge */}
                    {existingCustomer && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(255, 152, 0, 0.1)', color: 'var(--color-primary)',
                            padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem',
                            marginBottom: '10px', width: 'fit-content'
                        }}>
                            <Award size={14} />
                            <span style={{ fontWeight: 600 }}>Returning Customer</span>
                            <span style={{ opacity: 0.8 }}>• {existingCustomer.visitCount} Visits</span>
                        </div>
                    )}


                    {/* Date Picker (Only if Handover IS Later) */}
                    {handoverMode === 'later' && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Date Input */}
                            <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <Calendar size={16} color="#FF9800" />
                                <input
                                    type="date"
                                    value={deliveryDetails.date}
                                    onChange={e => setDeliveryDetails(prev => ({ ...prev, date: e.target.value }))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', colorScheme: 'var(--color-scheme)', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>

                            {/* Time Input */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <Clock size={16} color="#4CAF50" />
                                <input
                                    type="time"
                                    value={deliveryDetails.time}
                                    onChange={e => setDeliveryDetails(prev => ({ ...prev, time: e.target.value }))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', colorScheme: 'var(--color-scheme)', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* CART ITEMS LIST */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                {!isMobile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 600, color: '#aaa' }}>CURRENT CART</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{cart.length} Items</span>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        clearCart();
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'transparent', border: 'none',
                                        color: '#ef5350', fontSize: '0.8rem', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={14} /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>
                        <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                        <div>Cart is empty</div>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                <div style={{ fontWeight: 700 }}>₹{item.price * item.qty}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#aaa' }}>₹{item.price} each</div>
                                {/* Qty Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-glass-input)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                    <button onClick={() => updateQty(item.id, -1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>-</button>
                                    <span style={{ padding: '0 8px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FOOTER - COMPACT ON MOBILE */}
            <div style={{ padding: isMobile ? '12px' : '20px', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                {mode === 'order' && (
                    <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <NotebookPen size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#666' }} />
                            <input
                                placeholder="Special Instructions..."
                                value={customerDetails.note || ''}
                                onChange={e => setCustomerDetails(prev => ({ ...prev, note: e.target.value }))}
                                style={{ width: '100%', padding: '8px 8px 8px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>
                )}

                {/* Totals Section */}
                <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                        <span style={{ color: '#aaa' }}>Total</span>
                        <span style={{ color: 'var(--color-text-main)' }}>₹{totalAmount}</span>
                    </div>

                    {/* Order Mode Extras */}
                    {mode === 'order' && handoverMode === 'later' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Advance</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-bg-glass-input)', borderRadius: '4px', padding: '0 8px', border: '1px solid var(--color-border)' }}>
                                    <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>₹</span>
                                    <input
                                        type="number"
                                        className="no-spinner"
                                        value={payment.advance}
                                        onChange={e => setPayment(prev => ({ ...prev, advance: e.target.value }))}
                                        style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontWeight: 600, textAlign: 'right', padding: '6px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600, paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                                <span style={{ color: '#FF5252' }}>BALANCE</span>
                                <span style={{ color: '#FF5252' }}>₹{balanceDue}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Payment Method Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '10px' : '16px' }}>
                    <button onClick={() => { triggerHaptic('light'); setPayment(prev => ({ ...prev, type: 'cash' })); }} style={{ flex: 1, padding: isMobile ? '8px' : '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'cash' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'cash' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>💵 CASH</button>
                    <button onClick={() => { triggerHaptic('light'); setPayment(prev => ({ ...prev, type: 'upi' })); }} style={{ flex: 1, padding: isMobile ? '8px' : '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'upi' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'upi' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>📱 UPI</button>
                </div>

                {/* DUAL ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Hide standalone Save button on mobile to save space, or keep it small? User wanted PRINT button change primarily. keeping both but updating print text. */}
                    <button disabled={cart.length === 0} onClick={() => handleCheckout(false)} style={{ flex: 1, padding: isMobile ? '12px' : '14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '0.9rem', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: cart.length === 0 ? 0.5 : 1 }}>
                        <Save size={18} /> <span>SAVE</span>
                    </button>

                    <button disabled={cart.length === 0 || isPrinting} onClick={() => handleCheckout(true)} style={{ flex: 1.5, padding: isMobile ? '12px' : '14px', borderRadius: '8px', border: 'none', background: (cart.length === 0 || isPrinting) ? '#ccc' : (mode === 'quick' ? '#4CAF50' : '#FF9800'), color: (cart.length === 0 || isPrinting) ? '#666' : (mode === 'quick' ? 'white' : 'black'), fontWeight: 800, fontSize: '0.9rem', cursor: (cart.length === 0 || isPrinting) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: (cart.length === 0 || isPrinting) ? 'none' : '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <Printer size={18} /> <span>{isPrinting ? 'PROCESSING...' : 'PRINT & SAVE'}</span>
                    </button>
                </div>
            </div>
        </div >
    );
};


const Billing = () => {
    const { addTransaction } = useTransactions();
    const { items: allItems, addItem: addInventoryItem, updateItem } = useInventory();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { addOrUpdateCustomer, getCustomerByPhone } = useCustomers(); // [NEW] Context
    const location = useLocation();

    // Mode State: 'quick' | 'order'
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('mode_backup') || 'quick';
    });
    const [handoverMode, setHandoverMode] = useState(() => {
        return localStorage.getItem('handoverMode_backup') || 'later';
    });





    // Items now come from Context!

    const [searchTerm, setSearchTerm] = useState('');

    // Quick Add Form State
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddPrice, setQuickAddPrice] = useState('');
    const [quickAddCategory, setQuickAddCategory] = useState('General');
    const [quickAddStock, setQuickAddStock] = useState('20');
    const [quickAddImage, setQuickAddImage] = useState('');
    const [suggestedEmoji, setSuggestedEmoji] = useState('');

    // Sync Quick Add Name with Search & Suggest Emoji
    useEffect(() => {
        if (searchTerm) {
            setQuickAddName(toTitleCase(searchTerm));
        }
    }, [searchTerm]);

    // Update Suggestion when Name/Category changes
    useEffect(() => {
        const emoji = getSmartEmoji(quickAddName, quickAddCategory);
        setSuggestedEmoji(emoji);
    }, [quickAddName, quickAddCategory]);

    const handleQuickAddSubmit = () => {
        triggerHaptic('success');
        if (!quickAddName || !quickAddPrice) {
            showToast('Name and Price are required', 'error');
            return;
        }
        const newItem = {
            id: Date.now().toString(),
            name: quickAddName,
            price: parseFloat(quickAddPrice),
            category: quickAddCategory,
            stock: parseInt(quickAddStock) || 0,
            image: quickAddImage // Use selected image
        };
        addInventoryItem(newItem);
        addToCart(newItem);
        setSearchTerm('');
        showToast(`Added ${quickAddName}`, 'success');
        // Reset Form
        setQuickAddPrice('');
        setQuickAddStock('20');
        setQuickAddCategory('General');
        setQuickAddImage('');
        setSuggestedEmoji('');
    };
    const [filterCategory, setFilterCategory] = useState('All');

    // Cart State
    const [cart, setCart] = useState(() => {
        // [NEW] Persist Cart via LocalStorage
        const saved = localStorage.getItem('cart_backup');
        return saved ? JSON.parse(saved) : [];
    });

    // Hydrate Cart from Navigation State (e.g. from Home Quick Sale)
    useEffect(() => {
        if (location.state?.cart) {
            setCart(location.state.cart);
            // Clear state to prevent re-adding on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // [NEW] Auto-Save Cart
    useEffect(() => {
        localStorage.setItem('cart_backup', JSON.stringify(cart));
    }, [cart]);

    // Order Mode Specific State
    const [customerDetails, setCustomerDetails] = useState(() => {
        const saved = localStorage.getItem('customerDetails_backup');
        return saved ? JSON.parse(saved) : { name: '', phone: '', note: '' };
    });
    // Default Delivery = Now + 2 Hours
    const [deliveryDetails, setDeliveryDetails] = useState(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 Hours
        return {
            date: format(future, 'yyyy-MM-dd'),
            time: format(future, 'HH:mm')
        };
    });
    const [payment, setPayment] = useState(() => {
        const saved = localStorage.getItem('payment_backup');
        return saved ? JSON.parse(saved) : { advance: '', type: 'cash' };
    }); // cash, upi


    // [NEW] Persist Mode & Draft Data (Moved here to avoid ReferenceError)
    useEffect(() => {
        localStorage.setItem('mode_backup', mode);
        localStorage.setItem('handoverMode_backup', handoverMode);
        // Persist Draft Form Data (PII Consideration: Local only, cleared on checkout)
        localStorage.setItem('customerDetails_backup', JSON.stringify(customerDetails));
        localStorage.setItem('payment_backup', JSON.stringify(payment));
    }, [mode, handoverMode, customerDetails, payment]);

    // Receipt Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false); // Mobile Search Toggle
    const [isPrinting, setIsPrinting] = useState(false);

    // Safety Lock for Double Clicks (State is async, Ref is sync)
    const processingRef = useRef(false);

    // [NEW] Customer Auto-Complete Logic
    const existingCustomer = useMemo(() => {
        if (!customerDetails.phone || customerDetails.phone.length !== 10) return null;
        return getCustomerByPhone(customerDetails.phone);
    }, [customerDetails.phone, getCustomerByPhone]);

    // Auto-fill Side Effect
    useEffect(() => {
        if (existingCustomer) {
            // Only auto-fill if name is empty to avoid overwriting user input?
            // Or better: Just show the suggestion?
            // Let's being aggressive but safe: Only fill if empty.
            if (!customerDetails.name) {
                setCustomerDetails(prev => ({ ...prev, name: existingCustomer.name }));
                triggerHaptic('success');
            }
        }
    }, [existingCustomer]);

    // Smart Search State
    const [newItemDetails, setNewItemDetails] = useState({ price: '', category: '', stock: '' });

    // --- Filter Logic ---
    const categories = ['All', ...new Set(allItems.map(i => i.category).filter(c => c.toLowerCase() !== 'all'))];
    const filteredItems = useMemo(() => {
        return allItems
            .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                // Smart Sort Logic: 
                // 1. Items in Cart (Easy access) - DISABLED per user request
                // const inCartA = cart.some(c => c.id === a.id);
                // const inCartB = cart.some(c => c.id === b.id);
                // if (inCartA && !inCartB) return -1;
                // if (!inCartA && inCartB) return 1;

                // 2. Popular/Low Stock (Implies high demand)
                const lowStockA = a.stock < 5;
                const lowStockB = b.stock < 5;
                if (lowStockA && !lowStockB) return -1;
                if (!lowStockA && lowStockB) return 1;

                // 3. Alphabetical
                return a.name.localeCompare(b.name);
            });
    }, [allItems, searchTerm, filterCategory]);

    // --- Cart Actions ---
    const addToCart = (item) => {
        triggerHaptic('medium');
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const updateQty = (itemId, delta) => {
        triggerHaptic('light');
        setCart(prev => prev.map(i => {
            if (i.id === itemId) {
                const newQty = Math.max(0, i.qty + delta);
                return { ...i, qty: newQty };
            }
            return i;
        }).filter(i => i.qty > 0));
    };

    const updateItemNote = (itemId, note) => {
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i));
    };

    const clearCart = () => setCart([]);

    // --- Calculations ---
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    // For 'Take Now', we consider the Advance as the Total Amount (Fully Paid)
    const advanceAmount = (mode === 'order' && handoverMode === 'now')
        ? totalAmount
        : (Number(payment.advance) || 0);
    const balanceDue = totalAmount - advanceAmount;

    // --- Helpers ---
    const createTransactionData = () => {
        if (cart.length === 0) {
            showToast("Cart is empty!", "error");
            return null;
        }

        const isOrder = mode === 'order';

        return {
            type: isOrder ? 'order' : 'sale',
            amount: isOrder ? advanceAmount : totalAmount, // Cash Basis: Only record what is paid NOW
            totalValue: totalAmount,
            // STRICT CLEANUP: Map items to plain objects to avoid "Invalid nested entity" errors
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: Number(item.price), // Ensure primitive number
                qty: Number(item.qty),
                category: item.category || 'General',
                stock: Number(item.stock || 0)
                // Do NOT spread ...item here to avoid carrying over Firestore metadata/prototypes
            })),
            date: new Date().toISOString(),
            description: isOrder
                ? `Order for ${customerDetails.name || 'Customer'} (${handoverMode})`
                : `Quick Sale (${cart.length} items)`,
            customer: isOrder ? {
                name: customerDetails.name || 'Walk-in',
                phone: customerDetails.phone || '',
                note: customerDetails.note
            } : null,
            delivery: (isOrder && handoverMode === 'later') ? deliveryDetails : null,
            payment: {
                method: payment.type,
                advance: isOrder ? advanceAmount : 0,
                balance: isOrder ? balanceDue : 0,
                status: isOrder ? (balanceDue <= 0 ? 'paid' : 'partial') : 'paid'
            },
            status: (isOrder && handoverMode === 'later') ? 'pending' : 'completed'
        };
    };

    const resetUI = () => {
        setCart([]);
        localStorage.removeItem('cart_backup'); // Clear backup
        localStorage.removeItem('customerDetails_backup');
        localStorage.removeItem('payment_backup');
        // We do NOT clear mode/handoverMode preferences as they might be user preference for the session

        setCustomerDetails({ name: '', phone: '', note: '' });
        setPayment({ advance: '', type: 'cash' });
        setMode('quick');
        setHandoverMode('later');
    };

    // --- Actions ---
    // --- Actions ---
    const handleCheckout = async (shouldPrint) => {
        triggerHaptic('success');
        // Strict Double Check Prevention
        if (processingRef.current) return;

        const data = createTransactionData();
        if (!data) return;

        // Validation: Phone Number (If provided, must be 10 digits)
        if (mode === 'order' && customerDetails.phone && customerDetails.phone.length !== 10) {
            showToast("Please enter a valid 10-digit phone number", "error");
            return;
        }

        // --- OPTIMISTIC UI START ---
        // 1. Lock Immediately
        processingRef.current = true;

        // 2. UI Updates
        setShowMobileCart(false);
        setIsPrinting(true);

        // 2. Show Processing Toast Immediately
        if (!shouldPrint) {
            showToast("Saving...", "info");
        }

        try {
            // 3. Save to DB (Background)
            const docRef = await addTransaction(data);

            // [NEW] Auto-Save Customer
            if (data.customer) {
                addOrUpdateCustomer(data);
            }

            // --- STOCK MANAGEMENT ---
            // Deduct stock for each item sold
            data.items.forEach(cartItem => {
                const realItem = allItems.find(i => i.id === cartItem.id);
                if (realItem) {
                    const newStock = Math.max(0, realItem.stock - cartItem.qty);
                    updateItem(cartItem.id, { stock: newStock });
                }
            });

            // 4. Success Handling
            if (shouldPrint) {
                // Enhance preview data with real ID if we got one and want to show it
                const finalData = docRef ? { ...data, id: docRef.id } : data;

                setPreviewData(finalData);
                setShowPreview(true);

                // Auto-trigger print after delay
                setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    processingRef.current = false; // Release Lock
                }, 800);

                showToast(mode === 'order' ? "Order Saved & Printing..." : "Sale Saved & Printing...", "success");
            } else {
                showToast(mode === 'order' ? "Order Saved!" : "Sale Completed!", "success");
                setIsPrinting(false);
                processingRef.current = false; // Release Lock
            }

            // 5. Reset UI Data
            resetUI();

        } catch (error) {
            console.error("Checkout Error:", error);
            // Context already showed "Failed to add transaction"
            // We don't need another generic error toast here that confuses the user.

            setIsPrinting(false);
            processingRef.current = false; // Release Lock
        }
    };

    // Helper Icons
    const ShoppingBagIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
    const ClipboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;



    // --- RENDER ---
    // --- DETECT MOBILE ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // --- RENDER ---
    return (
        <div style={{ height: '100dvh', background: 'transparent', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* 1. THE HEADER */}
            <header style={{
                padding: '12px 20px',
                background: 'var(--color-bg-surface-transparent)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                height: '60px',
                position: 'relative'
            }}>
                {/* A. MOBILE SEARCH OVERLAY */}
                {showMobileSearch ? (
                    <div style={{ position: 'absolute', inset: 0, background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', padding: '0 12px', zIndex: 50 }}>
                        <Search size={18} style={{ marginRight: '12px', color: '#666' }} />
                        <input
                            autoFocus
                            placeholder="Search Item..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '1rem', outline: 'none', height: '100%', color: 'var(--color-text-primary)' }}
                        />
                        <button onClick={() => {
                            triggerHaptic('light');
                            setShowMobileSearch(false);
                        }} style={{ padding: '8px', background: 'transparent', border: 'none', color: '#666' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                ) : (
                    /* B. NORMAL HEADER CONTENT */
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px' }}>⚡ BILLING</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Mobile Search Trigger */}
                            <button
                                className="mobile-only"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setShowMobileSearch(true);
                                }}
                                style={{ padding: '8px', background: 'var(--color-bg-surface)', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}
                            >
                                <Search size={20} />
                            </button>

                            {/* Mode Switcher */}
                            <div style={{ display: 'flex', background: 'var(--color-bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                <button onClick={() => { triggerHaptic('light'); setMode('quick'); }} style={{ padding: '6px 16px', borderRadius: '6px', background: mode === 'quick' ? '#4CAF50' : 'transparent', color: mode === 'quick' ? 'white' : '#888', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <ShoppingBagIcon /> <span className="hide-mobile">QUICK</span>
                                </button>
                                <div style={{ width: '1px', background: 'var(--color-border)', margin: '4px 0' }}></div>
                                <button onClick={() => { triggerHaptic('light'); setMode('order'); }} style={{ padding: '6px 16px', borderRadius: '6px', background: mode === 'order' ? '#FF9800' : 'transparent', color: mode === 'order' ? 'black' : '#888', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <ClipboardIcon /> <span className="hide-mobile">ORDER</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* MAIN CONTENT SPLIT */}
            <div className="layout-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

                {/* 2. LEFT SIDE: PRODUCT GRID */}
                <div className="menu-pane" style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative' }}>
                    {/* Search & Filter Bar */}
                    <div className="filter-bar" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px', background: 'var(--color-bg-surface-transparent)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                        <div className="search-container-desktop" style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Search Item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingRight: '4px' }} className="no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setFilterCategory(cat);
                                    }}
                                    style={{
                                        padding: '0 16px',
                                        borderRadius: '8px',
                                        background: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                        color: filterCategory === cat ? 'white' : 'var(--color-text-muted)',
                                        border: '1px solid',
                                        borderColor: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.9rem',
                                        height: '42px'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
                        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                            {filteredItems.map(item => {
                                const cartItem = cart.find(c => c.id === item.id);
                                const qty = cartItem ? cartItem.qty : 0;

                                // --- DESKTOP CARD VIEW (Restore Original) ---
                                if (!isMobile) {
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className="item-card"
                                            style={{
                                                background: 'var(--color-bg-glass-input)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '12px',
                                                padding: '12px',
                                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                                cursor: 'pointer',
                                                height: 'auto',
                                                minHeight: '140px',
                                                position: 'relative',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{
                                                height: '100px', width: '100%',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: `${item.imagePadding || 0}px`
                                            }}>
                                                {item.image && item.image.length > 5 ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={{
                                                            width: '100%', height: '100%',
                                                            objectFit: item.imageFit || 'cover',
                                                            borderRadius: item.imagePadding ? '4px' : '0',
                                                            transform: `scale(${item.imageZoom || 1})`
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                                                        {item.image ? item.image : <UtensilsCrossed size={32} color="var(--color-border)" />}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.2', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{item.name}</div>
                                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <div style={{ color: '#4CAF50', fontWeight: 700 }}>₹{item.price}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#666', background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{item.stock} left</div>
                                            </div>
                                            {qty > 0 && (
                                                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                    {qty}
                                                </div>
                                            )}
                                        </button>
                                    );
                                }

                                // --- MOBILE CARD VIEW (Swiggy Style) ---
                                return (
                                    <div
                                        key={item.id}
                                        className="item-card"
                                        style={{
                                            background: 'var(--color-bg-glass-input)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '12px',
                                            padding: '8px',
                                            display: 'flex', flexDirection: 'column',
                                            position: 'relative',
                                            textAlign: 'left',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <div style={{
                                            height: '100px', width: '100%',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            // marginTop: '45px', // REVERTED
                                            overflow: 'hidden',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: `${item.imagePadding || 0}px`,
                                            position: 'relative'
                                        }}>
                                            {item.image && item.image.length > 5 ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    style={{
                                                        width: '100%', height: '100%',
                                                        objectFit: 'contain', // Changed from item.imageFit || 'cover' to prevent cropping
                                                        borderRadius: item.imagePadding ? '4px' : '0',
                                                        // Disable zoom on mobile to prevent cropping issues
                                                        // transform: `scale(${item.imageZoom || 1})` 
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                                                    {item.image ? item.image : <UtensilsCrossed size={32} color="var(--color-border)" />}
                                                </span>
                                            )}
                                        </div>

                                        {/* MOBILE ACTION: Plus Icon Top-Right (Corner of Tile) */}
                                        <div
                                            style={{ position: 'absolute', top: '1px', right: '1px', left: 'auto', zIndex: 10, width: 'fit-content' }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {qty === 0 ? (
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="swiggy-btn"
                                                    style={{
                                                        width: '24px', height: '24px', // Ultra Compact
                                                        background: 'white', border: '1px solid var(--color-border)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                        color: '#4CAF50', // Swiggy Green
                                                        cursor: 'pointer',
                                                        fontWeight: 800,
                                                        padding: 0
                                                    }}
                                                >
                                                    <Plus size={16} strokeWidth={3} />
                                                </button>
                                            ) : (
                                                <div className="swiggy-btn" style={{
                                                    background: 'white',
                                                    display: 'flex', alignItems: 'center',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', height: '24px',
                                                    border: '1px solid var(--color-primary)',
                                                    overflow: 'hidden',
                                                    width: 'fit-content'
                                                }}>
                                                    <button onClick={() => updateQty(item.id, -1)} style={{ width: '20px', height: '100%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', padding: 0 }}><Minus size={12} /></button>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', minWidth: '14px', textAlign: 'center', lineHeight: '1' }}>{qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} style={{ width: '20px', height: '100%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', padding: 0 }}><Plus size={12} /></button>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.2', color: 'var(--color-text-primary)', marginBottom: '4px', flex: 1 }}>{item.name}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '4px' }}>
                                            <div style={{ color: '#4CAF50', fontWeight: 700 }}>₹{item.price}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>{item.stock} left</div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* EMPTY STATE */}
                            {filteredItems.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '10px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>No items found</div>
                                    <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Add "{searchTerm}" to Inventory?</div>

                                    {searchTerm && (
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.4)',
                                            backdropFilter: 'blur(12px)',
                                            padding: '16px', borderRadius: '12px',
                                            display: 'flex', flexDirection: 'column', gap: '10px',
                                            width: '100%', maxWidth: '300px',
                                            border: '1px solid var(--color-border)',
                                            textAlign: 'left',
                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                            color: 'var(--color-text-primary)'
                                        }}>
                                            {/* Close Button */}
                                            <button
                                                onClick={() => setShowMobileSearch(false)}
                                                style={{
                                                    position: 'absolute', top: '12px', right: '12px',
                                                    background: 'transparent', border: 'none',
                                                    color: 'var(--color-text-muted)', cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                            >
                                                <X size={20} />
                                            </button>

                                            {/* Name & Emoji Suggestion */}
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Name</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        value={quickAddName}
                                                        onChange={e => setQuickAddName(e.target.value)}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                                    />
                                                    {/* Emoji Suggestion / Selection */}
                                                    {quickAddImage ? (
                                                        <button
                                                            onClick={() => setQuickAddImage('')}
                                                            style={{
                                                                width: '36px', height: '36px', borderRadius: '6px',
                                                                border: '1px solid var(--color-primary)', background: 'var(--color-bg-surface)',
                                                                fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title="Clear Icon"
                                                        >
                                                            {quickAddImage}
                                                        </button>
                                                    ) : (
                                                        suggestedEmoji && (
                                                            <button
                                                                onClick={() => setQuickAddImage(suggestedEmoji)}
                                                                style={{
                                                                    padding: '0 12px', borderRadius: '6px',
                                                                    border: '1px dashed var(--color-primary)', background: 'transparent',
                                                                    color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600,
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                                }}
                                                            >
                                                                Use {suggestedEmoji}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price & Stock Row */}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={quickAddPrice}
                                                        onChange={e => setQuickAddPrice(e.target.value)}
                                                        placeholder="0"
                                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Stock</label>
                                                    <input
                                                        type="number"
                                                        value={quickAddStock}
                                                        onChange={e => setQuickAddStock(e.target.value)}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                                                <select
                                                    value={quickAddCategory}
                                                    onChange={e => setQuickAddCategory(e.target.value)}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                                >
                                                    {categories && categories.length > 0 ? (
                                                        categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)
                                                    ) : (
                                                        <option value="General">General</option>
                                                    )}
                                                </select>
                                            </div>

                                            <button
                                                onClick={handleQuickAddSubmit}
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '10px', borderRadius: '8px',
                                                    background: 'var(--color-primary)', color: 'white',
                                                    border: 'none', fontWeight: 700, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                                                }}
                                            >
                                                <Plus size={18} /> Add & to Cart
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT SIDE: CART (Desktop Only) */}
                <div className="cart-pane" style={{ background: 'var(--color-bg-surface-transparent)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--color-border)' }}>
                    <CartContent
                        isMobile={false}
                        mode={mode}
                        cart={cart}
                        totalAmount={totalAmount}
                        payment={payment}
                        setPayment={setPayment}
                        customerDetails={customerDetails}
                        setCustomerDetails={setCustomerDetails}
                        handoverMode={handoverMode}
                        setHandoverMode={setHandoverMode}
                        deliveryDetails={deliveryDetails}
                        setDeliveryDetails={setDeliveryDetails}
                        updateQty={updateQty}
                        handleCheckout={handleCheckout}
                        balanceDue={balanceDue}
                        isPrinting={isPrinting}
                        clearCart={clearCart}
                        existingCustomer={existingCustomer}
                    />
                </div>

                {/* MOBILE FLOATING CART BAR */}
                {cart.length > 0 && (
                    <div className="mobile-cart-bar" onClick={() => setShowMobileCart(true)}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{cart.length} ITEMS</span>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{totalAmount}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            View Cart <ChevronRight size={18} />
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE CART MODAL - FULL SCREEN */}
            {
                showMobileCart && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 10001,
                        background: 'var(--color-bg-surface)',
                        display: 'flex', flexDirection: 'column',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        {/* CUSTOM MOBILE HEADER with Back Button */}
                        <div style={{
                            padding: '12px 16px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            borderBottom: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)'
                        }}>
                            <button
                                onClick={() => setShowMobileCart(false)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--color-text-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Your Cart ({cart.length})</div>
                            <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-primary)' }}>₹{totalAmount}</div>
                        </div>

                        {/* Cart Content Container */}
                        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-surface)' }}>
                            <CartContent
                                isMobile={true}
                                mode={mode}
                                cart={cart}
                                totalAmount={totalAmount}
                                payment={payment}
                                setPayment={setPayment}
                                customerDetails={customerDetails}
                                setCustomerDetails={setCustomerDetails}
                                handoverMode={handoverMode}
                                setHandoverMode={setHandoverMode}
                                deliveryDetails={deliveryDetails}
                                setDeliveryDetails={setDeliveryDetails}
                                updateQty={updateQty}
                                handleCheckout={handleCheckout}
                                balanceDue={balanceDue}
                                isPrinting={isPrinting}
                            />
                        </div>
                    </div>
                )
            }

            {/* Receipt Preview Modal */}
            <Modal isOpen={showPreview && previewData} onClose={() => setShowPreview(false)} title="Invoice Placed">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ color: '#4CAF50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={24} />
                        <span>Transaction Saved Successfully!</span>
                    </div>

                    <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <ReceiptPrinter
                            transaction={previewData || {}}
                            type={(previewData?.type === 'order' && previewData?.status === 'pending') ? 'ORDER_BOOKING' : 'TAX_INVOICE'}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Close
                        </button>

                        <button
                            onClick={() => {
                                triggerHaptic('success');
                                const url = generateWhatsAppLink(previewData);
                                window.open(url, '_blank');
                            }}
                            className="btn-whatsapp"
                            style={{
                                flex: 1, padding: '12px', borderRadius: '8px',
                                border: 'none', background: '#25D366', // WhatsApp Green
                                color: 'white', cursor: 'pointer', fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Share
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="btn-print-now"
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#4CAF50', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Printer size={18} /> Print Again
                        </button>
                    </div>
                </div>
            </Modal>



            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #333; borderRadius: 3px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                input[type="date"], input[type="time"] {
                    color-scheme: light dark;
                }

                input[type="date"], input[type="time"] {
                    color-scheme: light dark;
                }

                /* GLOBAL UTILITIES for Billing.jsx */
                .swiggy-btn { border-radius: 6px !important; }

                /* Hide Spinners */
                .no-spinner::-webkit-inner-spin-button, 
                .no-spinner::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .no-spinner { 
                    -moz-appearance: textfield; 
                }

                /* DESKTOP DEFAULT LAYOUT */
                .layout-container { display: flex; }
                .menu-pane { flex: 65%; }
                .cart-pane { flex: 35%; display: flex; flex-direction: column; }
                .mobile-cart-bar { display: none; }
                .mobile-only { display: none; }
                
                /* ANIMATION */
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .slide-up-enter { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

                /* MOBILE RESPONSIVE OVERRIDES */
                @media (max-width: 768px) {
                    .layout-container { flex-direction: column; }
                    .menu-pane { flex: 1; border-right: none; }
                    .cart-pane { display: none; } /* Hide Sidebar Cart */
                    
                    /* Adjust Main Padding for Mobile */
                    .menu-pane > div:last-child { padding: 10px !important; padding-bottom: 100px !important; }

                    /* Compact Grid for Mobile - 4 Items Row */
                    .product-grid { 
                        grid-template-columns: repeat(4, 1fr) !important; 
                        gap: 8px !important; 
                    }
                    /* Compact Card Styling for Mobile */
                    .item-card {
                        padding: 6px !important;
                        min-height: 100px !important;
                        min-width: 0 !important; /* CRITICAL: Allows grid item to shrink below content size */
                        box-shadow: none !important; 
                        background: rgba(255,255,255,0.05) !important; /* Lighter background for less clutter */
                    }
                    .item-card img { height: 100% !important; }
                    .item-card > div:first-child { height: 50px !important; margin-bottom: 4px !important; margin-top: 0 !important; } /* Improved Image Visibility */
                    .item-card > div:nth-child(3) { 
                        font-size: 0.65rem !important; 
                        line-height: 1 !important; 
                        white-space: nowrap; 
                        overflow: hidden; 
                        text-overflow: ellipsis; 
                        width: 100%; 
                        text-align: center !important;
                    } /* Name */
                    .item-card > div:last-child { 
                        flex-direction: column; 
                        align-items: center !important; 
                        gap: 1px; 
                        width: 100%;
                    } /* Price & Stock Stacked */
                    .item-card > div:last-child > div:first-child { font-size: 0.75rem !important; } /* Price */
                    .item-card > div:last-child > div:last-child { display: none !important; } /* Hide Stock on tiny cards to save space, or make very small */


                    .header h2 { font-size: 1rem; }
                    
                    /* Hide Text Labels on Mobile Header if needed */
                    .hide-mobile { display: none; }

                    /* Floating Swiggy Bar - ABOVE DOCK */
                    .mobile-cart-bar {
                        display: flex;
                        position: fixed;
                        bottom: 90px;
                        left: 12px; 
                        right: 12px;
                        background: #60b246;
                        color: white;
                        padding: 10px 16px;
                        border-radius: 12px;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        z-index: 10000;
                        cursor: pointer;
                        animation: slideUp 0.3s ease-out;
                    }
                    .mobile-cart-bar:active { transform: scale(0.98); }

                    /* NEW MOBILE HEADER ELEMENTS */
                    .mobile-only { display: flex !important; }
                    .search-container-desktop { display: none !important; } /* Hide old search on mobile */
                    
                    /* Sticky Filters on Mobile */
                    .filter-bar {
                        padding: 8px 12px !important;
                        position: sticky !important;
                        top: 0;
                    }
                        top: 0;
                    }
                }
            `}</style>
        </div >
    );
};

export default Billing;
