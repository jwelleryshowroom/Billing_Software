import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useAuth } from '../context/useAuth';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek, getYear } from 'date-fns';
import { Trash2, AlertTriangle, Calendar, ChevronRight, ChevronDown, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

const DataManagement = ({ onClose }) => {
    const { transactions, deleteTransactionsByDateRange, clearAllTransactions } = useTransactions();
    const { role } = useAuth();
    const [confirmModal, setConfirmModal] = useState({ show: false, range: null, title: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

    // Group transactions dynamically based on viewMode
    const groups = useMemo(() => {
        const grouped = {};
        transactions.forEach(t => {
            const date = parseISO(t.date);
            let key, label, start, end;

            if (viewMode === 'day') {
                key = format(date, 'yyyy-MM-dd');
                label = format(date, 'MMMM d, yyyy');
                start = startOfDay(date);
                end = endOfDay(date);
            } else if (viewMode === 'week') {
                start = startOfWeek(date, { weekStartsOn: 1 });
                end = endOfWeek(date, { weekStartsOn: 1 });
                key = `${getYear(date)}-W${getISOWeek(date)}`;
                label = `Week ${getISOWeek(date)} (${format(start, 'MMM d')} - ${format(end, 'MMM d')})`;
            } else {
                key = format(date, 'yyyy-MM');
                label = format(date, 'MMMM yyyy');
                start = startOfMonth(date);
                end = endOfMonth(date);
            }

            if (!grouped[key]) {
                grouped[key] = { label, count: 0, start, end };
            }
            grouped[key].count += 1;
        });

        // Convert to array and sort descending
        return Object.values(grouped).sort((a, b) => b.start - a.start);
    }, [transactions, viewMode]);

    const handleDeleteClick = (group) => {
        if (role !== 'admin') {
            setConfirmModal({
                show: true,
                isAccessDenied: true,
                title: 'Access Denied',
                message: 'You need Admin permissions to delete bulk data.'
            });
            return;
        }
        setConfirmModal({
            show: true,
            range: { start: group.start, end: group.end },
            title: `Delete ${viewMode === 'day' ? 'Day' : viewMode === 'week' ? 'Week' : 'Month'}?`,
            message: `Deleting: ${group.label}. This will remove ${group.count} transaction(s). This cannot be undone.`
        });
    };

    const handleClearAll = () => {
        if (role !== 'admin') {
            setConfirmModal({
                show: true,
                isAccessDenied: true,
                title: 'Access Denied',
                message: 'Only Administrators can wipe the entire database.'
            });
            return;
        }
        setConfirmModal({
            show: true,
            range: 'all',
            title: 'Reset Everything?',
            message: 'DANGER: This will wipe the ENTIRE database. Every single record will be lost forever.'
        });
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            if (confirmModal.range === 'all') {
                await clearAllTransactions();
            } else {
                await deleteTransactionsByDateRange(
                    confirmModal.range.start.toISOString(),
                    confirmModal.range.end.toISOString()
                );
            }
            setConfirmModal({ show: false, range: null, title: '', message: '' });
        } catch {
            alert("Error deleting data.");
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '0 4px', height: '100%', overflowY: 'auto' }}>

            {/* Header */}
            <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(0,0,0,0.05)',
                                border: 'none',
                                color: 'var(--color-text-main)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Trash2 size={20} /> Data Management
                    </h2>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginLeft: onClose ? '40px' : '0' }}>
                    Select a view to delete specific groups of data. Only dates with data are shown.
                </p>
            </div>

            {/* Toggle Switch */}
            <div style={{ display: 'flex', marginBottom: '16px', backgroundColor: 'var(--color-bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                {['day', 'week', 'month'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: viewMode === mode ? 'var(--color-primary)' : 'transparent',
                            color: viewMode === mode ? 'white' : 'var(--color-text-muted)',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Data List (Scrollable) */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '4px',
                marginBottom: '20px'
            }} className="custom-scrollbar">
                {groups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        <CheckCircle2 size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>No data found.</p>
                    </div>
                ) : (
                    groups.map((group, index) => (
                        <div key={index} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--color-primary)' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                    {group.label}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {group.count} Record{group.count !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(group)}
                                style={{
                                    padding: '8px',
                                    color: 'var(--color-danger)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: var(--color-border);
                        border-radius: 10px;
                    }
                `}</style>
            </div>

            {/* Danger Zone (Reset UI) */}
            {groups.length > 0 && (
                <div className="card" style={{
                    marginTop: '20px',
                    padding: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
                    borderRadius: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-danger)', marginBottom: '12px' }}>
                        <AlertTriangle size={20} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Danger Zone</span>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
                        Resetting the database will permanently delete all transaction history. This action cannot be undone.
                    </p>
                    <button
                        onClick={handleClearAll}
                        style={{
                            color: '#fff',
                            backgroundColor: 'var(--color-danger)',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
                        }}
                    >
                        <Trash2 size={18} /> Reset Entire Database
                    </button>
                </div>
            )}

            {/* Confirmation Modal (Glassy) */}
            {confirmModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass" style={{
                        width: '85%', maxWidth: '320px', padding: '24px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ color: confirmModal.isAccessDenied ? 'var(--color-text-muted)' : 'var(--color-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            {confirmModal.isAccessDenied ? <ShieldAlert size={48} className="text-secondary" /> : <AlertTriangle size={48} />}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', textAlign: 'center', fontWeight: 700 }}>{confirmModal.title}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem', textAlign: 'center' }}>
                            {confirmModal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {confirmModal.isAccessDenied ? (
                                <button
                                    onClick={() => setConfirmModal({ show: false, range: null, title: '', message: '' })}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
                                >
                                    Understood
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setConfirmModal({ show: false, range: null, title: '', message: '' })}
                                        className="btn"
                                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--color-text-main)', borderRadius: '12px' }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="btn"
                                        style={{ flex: 1, backgroundColor: 'var(--color-danger)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagement;
