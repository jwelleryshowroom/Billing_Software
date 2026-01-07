import React, { useState } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import {
    X, FileText, Download, Calendar,
    Zap, Settings as SettingsIcon, AlertCircle,
    Smartphone, Trash2, PieChart, Inbox,
    ChevronRight, FileSpreadsheet
} from 'lucide-react';
import {
    format, subDays, startOfDay, endOfDay,
    startOfMonth, endOfMonth, subMonths,
    startOfYear, isWithinInterval
} from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportModal = ({ isOpen, onClose }) => {
    const { transactions, setViewDateRange, loading } = useTransactions();
    const { role } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'custom'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');

    const isGuest = role === 'guest';

    if (!isOpen) return null;

    const exportData = (rangeType, specificRange = null) => {
        if (isGuest) {
            setError('Access Denied: Visitors cannot download business records.');
            setTimeout(() => setError(''), 3000);
            return null; // Return null explicitly
        }

        let start, end;
        const now = new Date();

        // 1. Determine Range
        if (rangeType === 'custom') {
            if (!startDate || !endDate) {
                setError('Please select both start and end dates.');
                setTimeout(() => setError(''), 3000);
                return null;
            }
            if (new Date(startDate) > new Date(endDate)) {
                setError('Start date cannot be after end date.');
                setTimeout(() => setError(''), 3000);
                return null;
            }
            start = startOfDay(new Date(startDate));
            end = endOfDay(new Date(endDate));
        } else {
            switch (specificRange) {
                case 'today':
                    start = startOfDay(now);
                    end = endOfDay(now);
                    break;
                case 'yesterday':
                    start = startOfDay(subDays(now, 1));
                    end = endOfDay(subDays(now, 1));
                    break;
                case 'thisMonth':
                    start = startOfMonth(now);
                    end = endOfMonth(now);
                    break;
                case 'last3Months':
                    start = startOfMonth(subMonths(now, 3));
                    end = endOfMonth(now);
                    break;
                case 'thisYear':
                    start = startOfYear(now);
                    end = endOfDay(now);
                    break;
                case 'all':
                    setError("Exporting 'All Time' is disabled for performance. Please select a year.");
                    setTimeout(() => setError(''), 3000);
                    return null;
                default:
                    return null;
            }
        }

        // 2. CHECK if we need to fetch new data (Basic Check)
        // We instruct the Context to load this range.
        // NOTE: This is an async action. For this MVP, we will Trigger the load,
        // and ask the user to click again or watch the background.
        // Ideally we would wait for a promise.

        // Strategy: We force the view to update to this range.
        setViewDateRange(start, end);

        // 3. Filter CURRENT transactions
        // Because fetch is async, 'transactions' might currently be stale or empty for this new range.
        // We check if the data *looks* sufficient.

        const filtered = transactions.filter(t => {
            const date = new Date(t.date);
            return isWithinInterval(date, { start, end });
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Critical UX: If our local data doesn't match the requested wide range, 
        // we assume it's fetching.
        // We will return the data we HAVE, but we should probably warn or block if it's 0 and we just requested.

        if (loading) {
            setError('Syncing data... please wait a moment and try again.');
            setTimeout(() => setError(''), 2000);
            return null;
        }

        if (filtered.length === 0) {
            // It might be genuinely empty, OR it might be not loaded yet.
            // Since we called setViewDateRange above, it WILL load soon.
            setError('Syncing data range... click again in a second.');
            setTimeout(() => setError(''), 3000);
            return null;
        }

        return filtered;
    };

    const handleCSV = (rangeType, specificRange) => {
        const data = exportData(rangeType, specificRange);
        if (!data) return;

        const headers = ['Date,Description,Type,Amount\n'];
        const rows = data.map(t =>
            `${format(new Date(t.date), 'dd/MM/yyyy HH:mm')},"${t.description.replace(/"/g, '""')}",${t.type},${t.amount}`
        );

        const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_${specificRange || 'custom'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePDF = (rangeType, specificRange) => {
        const data = exportData(rangeType, specificRange);
        if (!data) return;

        const doc = new jsPDF();
        const title = `Export Report: ${specificRange ? specificRange.toUpperCase() : 'Custom Range'}`;
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

        const tableColumn = ["Date", "Description", "Type", "Amount"];
        const tableRows = data.map(t => [
            format(new Date(t.date), 'dd/MM/yyyy HH:mm'),
            t.description,
            t.type.toUpperCase(),
            `INR ${t.amount.toFixed(2)}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] } // Matches brand green
        });

        doc.save(`export_${specificRange || 'custom'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const quickRanges = [
        { label: 'Today 🍕', id: 'today' },
        { label: 'Yesterday 🥖', id: 'yesterday' },
        { label: 'This Month 🥐', id: 'thisMonth' },
        { label: 'Last 3 Months 🍩', id: 'last3Months' },
        { label: 'This Year 🍰', id: 'thisYear' },
        { label: 'All Data 🏪', id: 'all' },
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
            />

            {/* Modal Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                backgroundColor: isDark ? 'rgba(30, 30, 46, 0.95)' : '#FFFFFF',
                borderRadius: '32px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                color: isDark ? '#fff' : '#1e1e2e',
                colorScheme: isDark ? 'dark' : 'light' // Fixes native date picker popup theme
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                    position: 'relative'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: isDark ? '#fff' : '#1e1e2e' }}>
                        Export Transactions 🚀
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            right: '24px',
                            top: '24px',
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            border: 'none',
                            color: isDark ? '#fff' : '#1e1e2e',
                            padding: '8px',
                            borderRadius: '50%',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 24px', position: 'relative' }}>
                    <button
                        onClick={() => setActiveTab('quick')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'quick' ? (isDark ? '#FFD700' : '#8B4513') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'),
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderBottom: activeTab === 'quick' ? `2px solid ${isDark ? '#FFD700' : '#8B4513'}` : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Quick Range ⚡
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'custom' ? (isDark ? '#FFD700' : '#8B4513') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'),
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderBottom: activeTab === 'custom' ? `2px solid ${isDark ? '#FFD700' : '#8B4513'}` : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Custom Range 🛠️
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                    {activeTab === 'quick' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {quickRanges.map(range => (
                                <div key={range.id} style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                                }}>
                                    <span style={{ fontWeight: 500, color: isDark ? '#fff' : '#3E2723' }}>{range.label}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleCSV('quick', range.id)}
                                            style={{
                                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                                color: '#FFD700',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            CSV 📤
                                        </button>
                                        <button
                                            onClick={() => handlePDF('quick', range.id)}
                                            style={{
                                                backgroundColor: 'rgba(79, 179, 255, 0.1)',
                                                border: '1px solid rgba(79, 179, 255, 0.3)',
                                                color: '#4FB3FF',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            PDF 📄
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>Start Date</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="date"
                                        value={startDate}
                                        max={format(new Date(), 'yyyy-MM-dd')}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                            borderRadius: '12px',
                                            padding: '12px',
                                            color: isDark ? '#fff' : '#1e1e2e',
                                            outline: 'none',
                                            colorScheme: isDark ? 'dark' : 'light'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                        borderRadius: '12px',
                                        padding: '12px',
                                        color: isDark ? '#fff' : '#1e1e2e',
                                        outline: 'none',
                                        colorScheme: isDark ? 'dark' : 'light'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button
                                    onClick={() => handleCSV('custom')}
                                    style={{
                                        flex: 1,
                                        height: '100px',
                                        backgroundColor: 'rgba(255, 215, 0, 0.05)',
                                        border: '2px solid rgba(255, 215, 0, 0.2)',
                                        borderRadius: '20px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        color: '#FFD700', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.05)'}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>📤</span>
                                    <span style={{ fontWeight: 600 }}>CSV Export</span>
                                </button>
                                <button
                                    onClick={() => handlePDF('custom')}
                                    style={{
                                        flex: 1,
                                        height: '100px',
                                        backgroundColor: 'rgba(79, 179, 255, 0.05)',
                                        border: '2px solid rgba(79, 179, 255, 0.2)',
                                        borderRadius: '20px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        color: '#4FB3FF', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 179, 255, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 179, 255, 0.05)'}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                                    <span style={{ fontWeight: 600 }}>PDF Export</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '24px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: '50px',
                            color: isDark ? '#fff' : '#1e1e2e',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
                    >
                        Close
                    </button>
                </div>

                {/* Error / Access Denied Toast */}
                {error && (
                    <div style={{
                        position: 'absolute',
                        bottom: '90px',
                        left: '24px',
                        right: '24px',
                        backgroundColor: isDark ? 'rgba(245, 127, 23, 0.2)' : 'rgba(245, 127, 23, 0.15)', // Glassy Orange
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: isDark ? '1px solid rgba(245, 127, 23, 0.4)' : '1px solid rgba(245, 127, 23, 0.3)',
                        color: isDark ? '#FFD700' : '#E65100', // Gold/DarkOrange text
                        padding: '16px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 10
                    }}>
                        <div style={{
                            padding: '8px',
                            borderRadius: '50%',
                            backgroundColor: isDark ? 'rgba(245, 127, 23, 0.2)' : 'rgba(245, 127, 23, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <AlertCircle size={20} style={{ color: isDark ? '#FFD700' : '#E65100' }} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.3px', lineHeight: '1.4' }}>{error}</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ExportModal;
