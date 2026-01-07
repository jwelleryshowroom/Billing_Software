import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import TransactionForm from './TransactionForm';
import Modal from './Modal';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, Trash2, ChevronDown, ChevronUp, ShoppingBag, ShieldAlert } from 'lucide-react';


const Dashboard = () => {
    const { transactions, deleteTransaction } = useTransactions();
    const { dashboardMode } = useTheme();
    const { role } = useAuth();
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
    const [accessDeniedModal, setAccessDeniedModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalInitialType, setModalInitialType] = useState('sale');

    // Filter today's transactions and calculate totals
    const { todaysTransactions, income, expense } = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const filteredTransactions = transactions
            .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === today)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Force Newest First

        const totalIncome = filteredTransactions
            .filter(t => t.type === 'sale')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0);

        return { todaysTransactions: filteredTransactions, income: totalIncome, expense: totalExpense };
    }, [transactions]);

    const handleOpenModal = (type) => {
        setModalInitialType(type);
        setShowModal(true);
    };

    const handleDeleteClick = (id) => {
        if (role === 'guest') {
            setAccessDeniedModal(true);
            return;
        }
        deleteTransaction(id);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Toggle Header for Overview */}
            <div
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px', // Reduced from 10px
                    cursor: 'pointer',
                    userSelect: 'none',
                    flexShrink: 0
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Today's Overview</h2>
                <button className="btn" style={{ padding: '4px 8px', color: 'var(--color-text-muted)' }}>
                    {isOverviewExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Collapsible Section: Summary Cards + Form/Buttons */}
            {isOverviewExpanded && (
                <div style={{ animation: 'fadeIn 0.2s ease-out', flexShrink: 0, position: 'relative', zIndex: 50 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex' }}>
                                    <TrendingUp size={18} className="text-success" />
                                </div>
                                <span>Sales</span>
                            </div>
                            <div className="text-success font-bold" style={{ fontSize: '1.5rem' }}>
                                ₹{income.toFixed(2)}
                            </div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex' }}>
                                    <TrendingDown size={18} className="text-danger" />
                                </div>
                                <span>Expense</span>
                            </div>
                            <div className="text-danger font-bold" style={{ fontSize: '1.5rem' }}>
                                ₹{expense.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Section - ALWAYS VISIBLE */}
            <div style={{ marginBottom: '10px', flexShrink: 0 }}>
                {dashboardMode === 'inline' ? (
                    <TransactionForm onInputFocus={() => setIsOverviewExpanded(false)} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <button
                            onClick={() => handleOpenModal('sale')}
                            className="btn-premium-hover"
                            style={{
                                position: 'relative',
                                width: 'calc(100% - 20px)',
                                margin: '10px',
                                padding: '20px',
                                borderRadius: '24px',
                                background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.3)',
                                overflow: 'hidden',
                                height: '160px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                zIndex: 10
                            }}
                        >
                            {/* Decorative Blob */}
                            <div style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-20%',
                                width: '100px',
                                height: '100px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                filter: 'blur(40px)',
                                borderRadius: '50%'
                            }} />

                            <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
                                🧁
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Daily Sale</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Sell sweet treats</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleOpenModal('expense')}
                            className="btn-premium-hover"
                            style={{
                                position: 'relative',
                                width: 'calc(100% - 20px)',
                                margin: '10px',
                                padding: '20px',
                                borderRadius: '24px',
                                background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px -10px rgba(239, 68, 68, 0.3)',
                                overflow: 'hidden',
                                height: '160px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                zIndex: 10
                            }}
                        >
                            {/* Decorative Blob */}
                            <div style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-20%',
                                width: '100px',
                                height: '100px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                filter: 'blur(40px)',
                                borderRadius: '50%'
                            }} />

                            <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
                                💸
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Add Expense</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Log spending</div>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Divider if collapsed */}
            {
                !isOverviewExpanded && (
                    <div style={{
                        borderBottom: '1px solid var(--color-border)',
                        marginBottom: '20px',
                        paddingBottom: '10px',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.9rem',
                        flexShrink: 0
                    }}>
                        <span style={{ marginRight: '16px' }}><span className="text-success">Sales: ₹{income.toFixed(0)}</span></span>
                        <span><span className="text-danger">Exp: ₹{expense.toFixed(0)}</span></span>
                    </div>
                )
            }

            {/* Recent Activity Section (Scrollable) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Activity</h3>
                <button
                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                    className="btn"
                    style={{ padding: '4px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    {isOverviewExpanded ? (
                        <>
                            <ChevronUp size={16} /> Collapse Overview
                        </>
                    ) : (
                        <>
                            <ChevronDown size={16} /> Expand Overview
                        </>
                    )}
                </button>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {todaysTransactions.length === 0 ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-bg-body)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                border: '1px solid var(--color-border)'
                            }}>
                                <ShoppingBag size={24} style={{ opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>No activity yet</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Ready to sell some sweet treats? 🧁</p>
                        </div>
                    ) : (
                        <div>
                            {todaysTransactions.map((t, index) => (
                                <div
                                    key={t.id}
                                    style={{
                                        padding: '16px',
                                        borderBottom: index !== todaysTransactions.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{t.description}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {format(new Date(t.date), 'h:mm a')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            fontWeight: '600',
                                            color: t.type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}>
                                            {t.type === 'sale' ? '+' : '-'}₹{Number(t.amount)}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClick(t.id)}
                                            style={{ color: 'var(--color-text-muted)', opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Access Denied Modal (Glassy) */}
            {
                accessDeniedModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="glass" style={{
                            width: '85%', maxWidth: '300px', padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                <ShieldAlert size={48} className="text-secondary" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>Access Denied</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem' }}>
                                You can view data, but you cannot add or delete anything.
                            </p>
                            <button
                                onClick={() => setAccessDeniedModal(false)}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Popup View Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalInitialType === 'sale' ? 'Add Daily Sale' : 'Add Expense'}
            >
                <TransactionForm
                    initialType={modalInitialType}
                    onSuccess={() => setShowModal(false)}
                />
            </Modal>
        </div >
    );
};

export default Dashboard;
