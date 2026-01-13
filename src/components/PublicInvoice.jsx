import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, AlertCircle, Phone, Share2, ChefHat, MapPin, Star } from 'lucide-react';

const PublicInvoice = () => {
    const { orderId } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                if (!orderId) throw new Error('No order ID provided');
                const docRef = doc(db, 'transactions', orderId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTransaction({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('Invoice not found.');
                }
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setError('Unable to load invoice.');
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [orderId]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Classic Confection Invoice',
                    text: `Invoice #${transaction?.id?.slice(-6).toUpperCase()}`,
                    url: window.location.href,
                });
            } catch (err) { console.log('Share canceled'); }
        } else {
            alert('Link copied to clipboard!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={32} className="animate-spin text-gray-400" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', letterSpacing: '0.05em', color: '#9ca3af' }}>LOADING INVOICE...</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
            <div style={{ width: '4rem', height: '4rem', background: 'rgba(127, 29, 29, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <AlertCircle size={32} color="#f87171" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>Unavailable</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{error}</p>
        </div>
    );

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatCurrency = (amount) => Number(amount).toFixed(2);
    const subtotal = transaction.totalValue || transaction.amount || 0;
    const tax = 0;
    const grandTotal = subtotal;
    const advance = Number(transaction.payment?.advance || transaction.advancePaid || 0);
    const balance = Number(transaction.payment?.balance || transaction.balanceDue || 0);
    const isOrderMode = transaction.type === 'order' || balance > 0;
    // status might be 'pending', 'preparing', 'ready' for bookings. 'delivered' or 'completed' for final.
    // Quick sales (type='sale') are always final.
    const isBooking = transaction.type === 'order' && transaction.status !== 'delivered' && transaction.status !== 'completed';

    return (
        <div className="invoice-container">
            <style>{`
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                
                .invoice-container {
                    height: 100vh; /* Fixed height to viewport */
                    height: 100dvh; /* Mobile viewport fix */
                    width: 100%;
                    overflow-y: auto; /* Enable internal scrolling */
                    -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
                    background-color: #1f2937;
                    color: #111827;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-bottom: 0; /* Removing padding on container, relying on spacer inside */
                }

                /* Header */
                .app-header {
                    width: 100%;
                    padding: 1.5rem;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.875rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                /* Receipt Card */
                .receipt-card {
                    background: white;
                    width: 100%;
                    max-width: 360px; /* Mobile Friendly Width */
                    position: relative;
                    margin: 0 1rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    /* Torn edge setup */
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); 
                }

                .receipt-content {
                    padding: 2rem 1.5rem 3.5rem 1.5rem; /* Extra bottom padding for torn edge space */
                }

                /* Typography */
                .store-name {
                    font-size: 1.25rem;
                    font-weight: 800;
                    text-align: center;
                    margin-bottom: 0.5rem;
                    color: #111827;
                }
                .store-address {
                    text-align: center;
                    font-size: 0.75rem;
                    color: #6b7280;
                    line-height: 1.5;
                    margin-bottom: 1.5rem;
                }

                .info-grid {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                }
                .label { font-size: 0.65rem; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
                .value { font-size: 0.875rem; color: #1f2937; font-weight: 600; }

                /* Items */
                .item-row { display: flex; font-size: 0.875rem; padding: 0.5rem 0; color: #374151; }
                .item-name { flex: 1; font-weight: 500; }
                .item-qty { width: 3rem; text-align: center; color: #6b7280; }
                .item-price { width: 4rem; text-align: right; font-weight: 600; }
                
                .totals { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #d1d5db; }
                .total-row { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem; color: #6b7280; }
                .grand-total { 
                    display: flex; justify-content: space-between; 
                    font-size: 1.125rem; font-weight: 800; color: #111827; 
                    margin-top: 0.75rem; 
                }

                /* Torn Edge bottom */
                .receipt-card::after {
                    content: "";
                    position: absolute;
                    bottom: -10px; /* Adjust based on zigzag size */
                    left: 0;
                    width: 100%;
                    height: 20px;
                    background: white;
                    -webkit-mask-image: linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%);
                    mask-image: linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%);
                    -webkit-mask-size: 20px 20px;
                    mask-size: 20px 20px;
                    -webkit-mask-repeat: repeat-x;
                    -webkit-mask-position: bottom;
                    mask-position: bottom; 
                }

                /* Footer Elements */
                .rate-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 2rem;
                    margin-bottom: 2rem; /* Extra separation from bottom */
                    padding: 0.75rem;
                    background: #f9fafb;
                    border-radius: 0.5rem;
                    text-decoration: none;
                    color: #111827;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: 1px solid #e5e7eb;
                    transition: all 0.2s;
                }
                .rate-link:hover { background: #f3f4f6; }

                .app-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #1f2937;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding: 1rem;
                    display: flex;
                    justify-content: center;
                    z-index: 100;
                    box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
                }
                .share-btn {
                    flex: 1;
                    max-width: 450px; /* Constrain width on tablets/desktop */
                    padding: 1rem;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 0.5rem;
                }
                .share-btn:hover { background: rgba(255,255,255,0.05); }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            <div className="app-header">
                <ChefHat size={20} />
                <span>{isBooking ? 'BOOKING RECEIPT' : 'TAX INVOICE'}</span>
            </div>

            <div className="receipt-card">
                <div className="receipt-content">
                    <div className="store-name">The Classic Confection</div>
                    {/* ... (address remains same) ... */}
                    <div className="store-address">
                        Mahavir Marg, opp. Hotel Shyam Palace<br />
                        Gandhi Chowk, Kishanganj, Bihar 855108<br />
                        +91 82945 56416
                    </div>

                    <div className="info-grid">
                        <div style={{ textAlign: 'left' }}>
                            <div className="label">Order Details</div>
                            <div className="value">#{transaction.id?.slice(-6).toUpperCase()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="label">Date</div>
                            <div className="value">{formatDate(transaction.createdAt || transaction.date)}</div>
                        </div>
                    </div>

                    {/* ... (items and totals remain same) ... */}
                    {/* Header Row */}
                    <div style={{ display: 'flex', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>Item</div>
                        <div style={{ width: '3rem', textAlign: 'center' }}>Qty</div>
                        <div style={{ width: '4rem', textAlign: 'right' }}>Price</div>
                    </div>

                    {/* Items List */}
                    <div style={{ marginTop: '0.5rem' }}>
                        {(transaction.items || []).map((item, idx) => (
                            <div key={idx} className="item-row" style={{ flexDirection: 'column', padding: '0.75rem 0', borderBottom: '1px dashed #f3f4f6' }}>
                                <div style={{ display: 'flex', width: '100%' }}>
                                    <div className="item-name">{item.name}</div>
                                    <div className="item-qty">{item.qty || item.quantity}</div>
                                    <div className="item-price">{formatCurrency(item.price * (item.qty || item.quantity))}</div>
                                </div>
                                {item.note && (
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
                                        - Note: "{item.note}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="totals">
                        <div className="total-row">
                            <span>Subtotal</span>
                            <span>₹{formatCurrency(subtotal)}</span>
                        </div>
                        {transaction.delivery && isBooking && (
                            <div className="total-row">
                                <span>Delivery Due</span>
                                <span>{new Date(transaction.delivery.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{transaction.delivery.time && `, ${transaction.delivery.time}`}</span>
                            </div>
                        )}
                        <div className="grand-total">
                            <span>Total</span>
                            <span>₹{formatCurrency(grandTotal)}</span>
                        </div>

                        {transaction.payment?.balanceMethod ? (
                            <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem' }}>
                                <div className="total-row" style={{ fontSize: '0.75rem' }}>
                                    <span>Advance Paid ({transaction.payment.method?.toUpperCase()})</span>
                                    <span>{formatCurrency(transaction.payment.advance || transaction.advancePaid || 0)}</span>
                                </div>
                                <div className="total-row" style={{ fontSize: '0.75rem' }}>
                                    <span>Balance Paid ({transaction.payment.balanceMethod?.toUpperCase()})</span>
                                    <span>{formatCurrency((transaction.totalValue || transaction.amount) - (transaction.payment.advance || transaction.advancePaid || 0))}</span>
                                </div>
                            </div>
                        ) : (
                            transaction.payment?.method && (
                                <div className="total-row" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                    <span>Payment Method</span>
                                    <span style={{ textTransform: 'uppercase' }}>{transaction.payment.method}</span>
                                </div>
                            )
                        )}

                        {isOrderMode && !transaction.payment?.balanceMethod && (
                            <>
                                <div className="total-row" style={{ marginTop: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem' }}>
                                    <span>Advance Paid</span>
                                    <span style={{ color: '#059669', fontWeight: 600 }}>₹{formatCurrency(advance)}</span>
                                </div>
                                <div className="total-row">
                                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Balance Due</span>
                                    <span style={{ color: '#dc2626', fontWeight: 700 }}>₹{formatCurrency(balance)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#374151' }}>
                        The Classic Confection
                        <div style={{ fontWeight: '500', color: '#9ca3af', fontSize: '0.65rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {isBooking ? (
                                <>
                                    * PLEASE BRING THIS SLIP *<br />
                                    <span style={{ textTransform: 'none', fontWeight: 'normal' }}>Order is subject to confirmation.</span>
                                </>
                            ) : (
                                "No Return • No Refund • No Exchange"
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* EXPICIT SPACER to clear Fixed Footer */}
            <div style={{ width: '100%', height: '180px', flexShrink: 0 }}></div>

            <div className="app-footer">
                <a href="https://maps.app.goo.gl/83qhC3mrtegUR7XM6" target="_blank" rel="noreferrer" className="share-btn" style={{ textDecoration: 'none', background: '#374151', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Star size={18} fill="#fbbf24" color="#fbbf24" />
                    <span style={{ color: 'white' }}>RATE US ON GOOGLE</span>
                </a>
            </div>
        </div>
    );
};

export default PublicInvoice;
