import React, { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getISOWeek, getYear } from 'date-fns';
import { Trash2, AlertTriangle, Calendar, ChevronRight, ChevronDown, CheckCircle2, ShieldAlert, ArrowRight, X } from 'lucide-react';

const DataManagementDrawer = () => {
    const { transactions, deleteTransactionsByDateRange, clearAllTransactions } = useTransactions();
    const { role } = useAuth();
    const { isDataOpen, closeData } = useSettings();
    const [confirmModal, setConfirmModal] = useState({ show: false, range: null, title: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

    // Prevent body scroll when open
    useEffect(() => {
        if (isDataOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDataOpen]);

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

    if (!isDataOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <div
                onClick={closeData}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.3s ease-out'
                }}
            />

            {/* Drawer Panel */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '100%',
                    background: 'var(--color-bg-surface)',
                    borderLeft: '1px solid var(--color-border)',
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRightDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--color-bg-surface)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'var(--color-danger)',
                            padding: '8px', borderRadius: '12px',
                            color: 'white', display: 'flex'
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Data Management</h2>
                    </div>
                    <button
                        onClick={closeData}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-muted)', display: 'flex'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '0 24px 24px 24px', overflowY: 'auto', flex: 1 }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '16px', lineHeight: 1.5 }}>
                        Select a view to delete specific groups of data. Only dates with data are shown.
                    </p>

                    {/* Role Explainer Card (Munna Bhai Theme) */}
                    <div className="card" style={{ marginBottom: '24px', marginTop: '16px', padding: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎭 Role Guide
                        </h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.2rem', minWidth: '24px' }}>🕶️</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-success)' }}>Munna Bhai (Admin)</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"Asli Boss. Hisab-kitab, tod-phod (delete), sab yahi karega."</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.2rem', minWidth: '24px' }}>🔌</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>Circuit (Staff)</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"Bhai ka right hand. Entry karega, par mitane (delete) ka haq nahi."</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.2rem', minWidth: '24px' }}>🤕</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Mamu (Guest)</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"Sirf dekhne ka. Haath nahi lagane ka."</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <div style={{ display: 'flex', marginBottom: '24px', backgroundColor: 'var(--color-bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
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
                                    transition: 'all 0.2s',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Data List */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '32px'
                    }}>
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
                                            padding: '10px',
                                            color: 'var(--color-danger)',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            borderRadius: '12px',
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
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Danger Zone (Reset UI) */}
                    {groups.length > 0 && (
                        <div className="card" style={{
                            padding: '24px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
                            borderRadius: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-danger)', marginBottom: '12px' }}>
                                <AlertTriangle size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Danger Zone</span>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '20px', lineHeight: 1.5 }}>
                                Resetting the database will permanently delete all transaction history. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleClearAll}
                                style={{
                                    width: '100%',
                                    color: '#fff',
                                    backgroundColor: 'var(--color-danger)',
                                    border: 'none',
                                    padding: '14px 24px',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Trash2 size={18} /> Reset Entire Database
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        Data handling requires special permissions.
                    </p>
                </div>
            </div>

            {/* Confirmation Modal (Glassy) - Directly integrated here for simplicity, or reuse global modal if preferred. 
                Using inline style to match drawer z-index hierarchy.
             */}
            {confirmModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10000, // Higher than drawer
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass" style={{
                        width: '85%', maxWidth: '340px', padding: '24px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        background: 'var(--color-bg-surface)'
                    }}>
                        <div style={{ color: confirmModal.isAccessDenied ? 'var(--color-text-muted)' : 'var(--color-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                            {confirmModal.isAccessDenied ? <ShieldAlert size={48} /> : <AlertTriangle size={48} />}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-main)' }}>{confirmModal.title}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem', textAlign: 'center' }}>
                            {confirmModal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {confirmModal.isAccessDenied ? (
                                <button
                                    onClick={() => setConfirmModal({ show: false, range: null, title: '', message: '' })}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Understood
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setConfirmModal({ show: false, range: null, title: '', message: '' })}
                                        style={{ flex: 1, backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-main)', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', padding: '12px' }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        style={{ flex: 1, backgroundColor: 'var(--color-danger)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', border: 'none', fontWeight: 600, cursor: 'pointer', padding: '12px' }}
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

            <style>{`
                @keyframes slideInRightDrawer {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default DataManagementDrawer;
