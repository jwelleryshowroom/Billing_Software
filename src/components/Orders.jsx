import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../context/useTransactions';
import { useAuth } from '../context/useAuth';
import AccessDeniedModal from './AccessDeniedModal';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Car, Phone, Printer, Search, Send, Package, LayoutGrid, List, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { format, differenceInMinutes, isPast } from 'date-fns';
import ReceiptPrinter from './ReceiptPrinter';
import Modal from './Modal';
import { triggerHaptic } from '../utils/haptics';
import MobileOrderCard from '../features/orders/components/MobileOrderCard'; // [NEW] Extracted
import StatusBadge from '../features/orders/components/StatusBadge'; // [NEW] Extracted
import OrderFilters from '../features/orders/components/OrderFilters'; // [NEW] Extracted
import DeliveryModal from '../features/orders/components/DeliveryModal'; // [NEW]
import useOrderActions from '../features/orders/hooks/useOrderActions'; // [NEW] Extracted
import { useOrderFilters } from '../features/orders/hooks/useOrderFilters'; // [NEW] Extracted

// StatusBadge moved to features/orders/components/StatusBadge.jsx

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const Orders = () => {
    // Orders Component - Updated Invoice Sharing
    const { transactions, updateTransaction, addTransaction } = useTransactions();
    const { role } = useAuth();
    const location = useLocation(); // [NEW]


    // --- Filtering & Sorting (Extracted to Hook) ---
    const {
        viewMode, setViewMode,
        statusFilter, setStatusFilter,
        searchTerm, setSearchTerm,
        sortBy, setSortBy,
        filteredOrders
    } = useOrderFilters(transactions);

    // [NEW] Handle Home Page Navigation to Specific Order
    const [highlightedId, setHighlightedId] = useState(null);

    useEffect(() => {
        if (location.state?.highlightOrderId) {
            const targetId = location.state.highlightOrderId;
            setHighlightedId(targetId);
            setViewMode('card'); // Ensure Card view

            // Scroll to element after render
            setTimeout(() => {
                const element = document.getElementById(`order-${targetId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    triggerHaptic('success');
                }
            }, 300);

            // Clear state (optional, or keep to maintain highlight)
            window.history.replaceState({}, document.title);
        }
    }, [location.state, setViewMode]);

    const [isPrinting, setIsPrinting] = useState(false);

    // Auto-Print Effect when Receipt Modal opens




    // --- Actions & State (Extracted to Hook) ---
    const {
        selectedOrder,
        showReceipt, setShowReceipt,
        deliveryModal, setDeliveryModal,
        settleMethod, setSettleMethod,
        accessDeniedModal, setAccessDeniedModal,
        handlePrint,
        handleSmartShare,
        handleMarkReady,
        openDeliveryModal,
        confirmDelivery
    } = useOrderActions();

    // Auto-Print Effect when Receipt Modal opens
    useEffect(() => {
        if (showReceipt && selectedOrder) {
            setIsPrinting(true);
            const timer = setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [showReceipt, selectedOrder]);

    // --- Mobile Detection ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // MobileOrderCard moved to features/orders/components/MobileOrderCard.jsx


    return (
        <div className="container" style={{ padding: isMobile ? '12px 16px' : '24px', paddingBottom: '0', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header & Controls */}
            <OrderFilters
                isMobile={isMobile}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                viewMode={viewMode}
                setViewMode={setViewMode}
                sortBy={sortBy}
                setSortBy={setSortBy}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

            {/* Content Area */}
            {filteredOrders.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flex: 1, color: 'var(--color-text-muted)',
                    opacity: 0.8,
                    marginTop: '40px'
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '50%', padding: '24px',
                        marginBottom: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Package size={42} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>No {statusFilter} orders</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Try changing filters or search terms.</p>
                </div>
            ) : (
                isMobile || viewMode === 'card' ? (
                    // --- Mobile View / Desktop Card View (Grid) ---
                    <motion.div
                        key={statusFilter + viewMode}
                        className="hide-scrollbar"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            paddingBottom: '120px',
                            paddingTop: '16px',
                            marginBottom: '0',
                            display: isMobile ? 'block' : 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '16px',
                            alignContent: 'start'
                        }}
                    >
                        {filteredOrders.map(order => (
                            <motion.div
                                key={order.id}
                                id={`order-${order.id}`} // [NEW] ID for scrolling
                                variants={itemVariants}
                                initial="hidden"
                                animate="show"
                                layout
                            >
                                <MobileOrderCard
                                    order={order}
                                    isHighlighted={highlightedId === order.id} // [NEW] Pass highlight prop
                                    onPrint={handlePrint}
                                    onShare={handleSmartShare}
                                    onDeliver={openDeliveryModal}
                                    onMarkReady={handleMarkReady}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    // --- Desktop Table View ---
                    <div className="table-responsive" style={{
                        background: 'var(--color-bg-glass-input)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1, /* Fill remaining height */
                        marginBottom: '20px'
                    }}>
                        <div style={{ overflowY: 'auto', flex: 1 }}> {/* Scrollable Container */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{
                                    background: 'var(--color-bg-surface)', /* Solid background to prevent see-through */
                                    backdropFilter: 'none',
                                    borderBottom: '1px solid var(--color-border)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10
                                }}>
                                    <tr>
                                        <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>ORDER ID</th>
                                        <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>CUSTOMER</th>
                                        <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>DELIVERY</th>
                                        <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>ITEMS</th>
                                        <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>STATUS</th>
                                        <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <motion.tbody
                                    key={statusFilter}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                >
                                    {filteredOrders.map(order => (
                                        <motion.tr
                                            key={order.id}
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="show"
                                            layout
                                            style={{ borderBottom: '1px solid var(--color-border)' }}
                                        >
                                            <td style={{ padding: '16px', fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: 600 }}>{order.customer?.name || "Walk-in"}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.customer?.phone}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {/* State 1: Quick Sale -> "Instant Delivery" */}
                                                {order.type === 'sale' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 600 }}>
                                                            <CheckCircle size={14} />
                                                            <span>Instant Delivery</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>
                                                            {format(new Date(order.date), 'dd MMM yyyy, hh:mm a')}
                                                        </div>
                                                    </div>
                                                ) : !order.delivery?.date ? (
                                                    /* State 2: Order (Take Now) -> "Take Away Mode" */
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                                            <Package size={14} />
                                                            <span>Take Away Mode</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>
                                                            {format(new Date(order.date), 'dd MMM yyyy, hh:mm a')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* State 3: Order (Book Later) -> Delivery Date */
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {order.status === 'completed' ? <CheckCircle size={14} color="var(--color-success)" /> : <Clock size={14} color="var(--color-text-muted)" />}
                                                            {(order.delivery?.date) ? format(new Date(order.delivery.date), 'dd MMM yyyy') : 'N/A'}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: order.status === 'completed' ? 'var(--color-success)' : 'var(--color-text-muted)', marginLeft: '20px' }}>
                                                            {order.status === 'completed' ? 'Booking Paid' : ((order.delivery?.time) ? format(new Date(`2000-01-01T${order.delivery?.time}`), 'hh:mm a') : '')}
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {(() => {
                                                    // Smart check for any note (Global or First Item Legacy)
                                                    const note = order.note || order.customer?.note || order.items.find(i => i.note)?.note;
                                                    const hasNote = note && note !== '-' && note.trim() !== '';

                                                    return (
                                                        <>
                                                            <div style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: hasNote ? 1 : 2, /* Show more lines if no note takes space */
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                fontSize: '0.9rem',
                                                                lineHeight: '1.4',
                                                                color: 'var(--color-text-primary)'
                                                            }}>
                                                                {order.items.map(i => `${i.qty} x ${i.name}`).join(', ')}
                                                            </div>
                                                            {hasNote && (
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    Note: {note}
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <StatusBadge
                                                    status={order.status}
                                                    onClick={order.status === 'pending' ? () => handleMarkReady(order.id) : undefined}
                                                />
                                                {order.status === 'pending' && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 600 }}>
                                                        Due: ₹{order.payment?.balance}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button
                                                        onClick={() => {
                                                            triggerHaptic('light');
                                                            handlePrint(order);
                                                        }}
                                                        title="Print Bill"
                                                        className="icon-btn"
                                                        style={{ padding: '8px', borderRadius: '8px', background: '#333', border: '1px solid #444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                                                    >
                                                        <Printer size={18} color="white" />
                                                    </button>

                                                    {/* Smart Share Button */}
                                                    <button
                                                        onClick={() => {
                                                            triggerHaptic('light');
                                                            handleSmartShare(order);
                                                        }}
                                                        title="Share Invoice via WhatsApp"
                                                        className="icon-btn"
                                                        style={{ padding: '8px', borderRadius: '8px', background: '#DCF8C6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        {/* WhatsApp Logo SVG */}
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                        </svg>
                                                    </button>

                                                    {/* Desktop Actions: Checkout/Deliver */}
                                                    {(order.status === 'pending' || order.status === 'ready') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                triggerHaptic('light');
                                                                openDeliveryModal(order);
                                                            }}
                                                            title="Checkout / Deliver"
                                                            className="icon-btn"
                                                            style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <CheckCircle size={18} color="white" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Print Modal */}
            <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Print Document" zIndex={20000}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {selectedOrder && (
                        <ReceiptPrinter
                            transaction={selectedOrder}
                            type={selectedOrder.status === 'completed' ? 'TAX_INVOICE' : 'ORDER_BOOKING'}
                        />
                    )}

                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setShowReceipt(false);
                        }}
                        style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#333', color: 'white', cursor: 'pointer' }}
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {/* Delivery Modal */}
            <DeliveryModal
                isOpen={deliveryModal.open}
                onClose={() => setDeliveryModal({ ...deliveryModal, open: false })}
                deliveryModal={deliveryModal}
                settleMethod={settleMethod}
                setSettleMethod={setSettleMethod}
                onConfirm={confirmDelivery}
                onPrint={handlePrint}
                onShare={handleSmartShare}
            />

            {/* Access Denied Modal */}
            <AccessDeniedModal
                isOpen={accessDeniedModal}
                onClose={() => setAccessDeniedModal(false)}
                role={role}
            />
        </div>
    );
};

export default Orders;
