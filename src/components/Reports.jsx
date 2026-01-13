import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/useTransactions';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, BarChart2, Calendar as CalendarIcon, Inbox, PieChart as PieChartIcon, ShoppingBag } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ExportModal from './ExportModal';
import { triggerHaptic } from '../utils/haptics';

// Override some calendar styles
const calendarStyles = `
  .react-calendar {
    width: 100%;
    background: var(--color-bg-surface);
    border: none;
    border-radius: var(--radius-md);
    font-family: 'Outfit', sans-serif;
    line-height: 1.125em;
    padding: 16px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }
  .react-calendar__navigation {
    display: flex;
    margin-bottom: 1em;
  }
  .react-calendar__navigation button {
    min-width: 44px;
    background: transparent !important;
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 8px;
    color: var(--color-primary);
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }
  .react-calendar__navigation button:disabled {
    background-color: transparent !important;
    opacity: 0.3;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: var(--color-bg-body) !important;
  }
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 0.75em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
    text-decoration: none;
  }
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
  }
  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
    border-bottom: 2px solid transparent;
    padding-bottom: 2px;
  }
  .react-calendar__month-view__weekdays__weekday:hover abbr {
    border-bottom-color: var(--color-primary);
  }
  .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: bold;
  }
  .react-calendar__tile {
    max-width: 100%;
    padding: 12px 6px;
    background: none;
    text-align: center;
    line-height: 16px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-main);
    border-radius: 12px; /* Rounded corners */
    transition: all 0.2s;
    position: relative;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: var(--color-bg-body);
    color: var(--color-primary);
  }
  .react-calendar__tile--now {
    background: transparent;
    color: var(--color-primary);
    font-weight: bold;
    border: 1px solid var(--color-primary);
  }
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: var(--color-primary-light);
    color: white;
  }
  .react-calendar__tile--hasActive {
    background: var(--color-primary-light);
  }
  .react-calendar__tile--active {
    background: var(--color-primary) !important;
    color: white !important;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
  }
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: var(--color-primary-dark);
  }
  .react-calendar__tile:disabled {
    background-color: transparent !important;
    color: var(--color-text-muted) !important;
    opacity: 0.4;
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: var(--color-text-muted) !important;
    opacity: 0.5;
  }
  /* Indicator for data */
  .tile-dot {
      height: 4px;
      width: 4px;
      background-color: var(--color-danger);
      border-radius: 50%;
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                boxShadow: 'var(--shadow-md)',
                fontSize: '0.85rem'
            }}>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--color-success)' }}>Sales & Orders: ₹{payload[0].value}</span>
                    <span style={{ color: 'var(--color-danger)' }}>Expense: ₹{payload[1].value}</span>
                </div>
            </div>
        );
    }
    return null;
};

const EmptyState = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: 'var(--color-text-muted)',
        height: '100%',
        textAlign: 'center'
    }}>
        <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--color-bg-body)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
        }}>
            <Inbox size={40} color="var(--color-primary)" strokeWidth={1.5} />
        </div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--color-text-main)' }}>No Transactions Found</h3>
        <p style={{ fontSize: '0.9rem', maxWidth: '250px' }}>
            It looks like there's no activity for this period. Try selecting a different date.
        </p>
    </div>
);

const Reports = ({ setCurrentView }) => {
    const { transactions, loading, setViewDateRange, currentRange } = useTransactions();
    const [view, setView] = useState('monthly'); // Default to monthly for performance
    const [viewType, setViewType] = useState('transactions'); // 'transactions' | 'items'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const reportData = useMemo(() => {
        const now = new Date();
        let start, end;

        if (view === 'daily') {
            return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
        }

        if (view === 'weekly') {
            start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else {
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        return transactions.filter(t =>
            isWithinInterval(new Date(t.date), { start, end })
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, view, selectedDate]);

    // Aggregate Item Sales Data
    const itemSalesData = useMemo(() => {
        const items = {};
        reportData.forEach(tx => {
            if (tx.type === 'sale' || tx.type === 'order') {
                if (tx.items && Array.isArray(tx.items)) {
                    tx.items.forEach(item => {
                        const id = item.id || item.name; // Fallback
                        if (!items[id]) {
                            items[id] = {
                                id,
                                name: item.name,
                                category: item.category || 'General',
                                qty: 0,
                                total: 0
                            };
                        }
                        items[id].qty += Number(item.qty || 0);
                        // Calculate total based on item price * qty (safest) or proportional split
                        items[id].total += (Number(item.price || 0) * Number(item.qty || 0));
                    });
                }
            }
        });
        return Object.values(items).sort((a, b) => b.total - a.total);
    }, [reportData]);


    // Helper to check for transaction on a specific date for calendar tile
    const hasTransaction = (date) => {
        return transactions.some(t => isSameDay(new Date(t.date), date));
    };

    const handleDateChange = (date) => {
        triggerHaptic('light');
        setSelectedDate(date);
        setView('daily');
        setShowCalendar(false); // Close calendar after selection
    };


    // Effect to Sync Context with View
    React.useEffect(() => {
        const now = selectedDate; // Use selected date as anchor
        let start, end;

        if (view === 'daily') {
            // For daily view, we might want to load the whole month to make calendar navigation smooth, 
            // or just the day. Let's load the MONTH of the selected date so the calendar dots work.
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else if (view === 'weekly') {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else {
            // Monthly
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        // Only update if range is different (Simple check using ISO string)
        if (start.toISOString() !== currentRange.start.toISOString() || end.toISOString() !== currentRange.end.toISOString()) {
            setViewDateRange(start, end);
        }
    }, [view, selectedDate, setViewDateRange, currentRange.start, currentRange.end]);

    const toggleView = (newView) => {
        triggerHaptic('light');
        if (newView === 'daily') {
            setShowCalendar(!showCalendar);
            if (view !== 'daily') setView('daily');
        } else {
            setView(newView);
            setShowCalendar(false);
        }
    };

    const getTitle = () => {
        const now = new Date();
        if (view === 'weekly') {
            const start = startOfWeek(now, { weekStartsOn: 1 });
            const end = endOfWeek(now, { weekStartsOn: 1 });
            return `This Week (${format(start, 'dd MMM')} - ${format(end, 'dd MMM')})`;
        }
        if (view === 'monthly') {
            return `This Month (${format(now, 'MMMM yyyy')})`;
        }
        return `Daily Report (${format(selectedDate, 'dd MMM yyyy')})`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <style>{calendarStyles}</style>

            {/* Controls Header - Static (Flex item) */}
            <style>{`
                /* Hard override for Recharts focus outline */
                .recharts-wrapper:focus,
                .recharts-wrapper:active,
                .recharts-surface:focus,
                .recharts-layer:focus,
                div[class^="recharts"]:focus {
                    outline: none !important;
                    border: none !important;
                    box-shadow: none !important;
                     -webkit-tap-highlight-color: transparent !important;
                }
                
                .report-nav-btn {
                    transition: all 0.2s ease;
                }
                .report-nav-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    z-index: 5;
                }
                .report-nav-btn:active {
                    transform: translateY(0);
                    box-shadow: none;
                }

                .reports-title {
                    margin: 0;
                    font-size: 1.25rem;
                    white-space: nowrap;
                    color: var(--color-text-main);
                    font-weight: 700;
                }

                @media (max-width: 480px) {
                    .reports-title {
                        font-size: 0.85rem !important;
                    }
                }
            `}</style>
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '20px 0 8px', // Even more room for the hover "pop",
                marginTop: '-10px', // Compensate for the extra padding
                marginBottom: '10px',
                flexShrink: 0,
                overflow: 'visible'
            }}>
                <button
                    onClick={() => {
                        triggerHaptic('light');
                        setSelectedDate(new Date());
                        setView('daily');
                        setShowCalendar(false);
                    }}
                    className={`btn report-nav-btn ${view === 'daily' && isSameDay(selectedDate, new Date()) && !showCalendar ? 'btn-primary' : ''}`}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: (view === 'daily' && isSameDay(selectedDate, new Date()) && !showCalendar) ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: (view === 'daily' && isSameDay(selectedDate, new Date()) && !showCalendar) ? 'white' : 'var(--color-text-main)',
                        border: (view === 'daily' && isSameDay(selectedDate, new Date()) && !showCalendar) ? 'none' : '1px solid var(--color-border)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '16px'
                    }}
                >
                    Today 🍕
                </button>

                <button
                    className={`btn report-nav-btn ${view === 'weekly' ? 'btn-primary' : ''}`}
                    onClick={() => toggleView('weekly')}
                    style={{
                        flex: 1,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        padding: '12px',
                        backgroundColor: view !== 'weekly' ? 'var(--color-bg-surface)' : undefined,
                        color: view !== 'weekly' ? 'var(--color-text-main)' : undefined,
                        border: view !== 'weekly' ? '1px solid var(--color-border)' : undefined,
                        borderRadius: '16px'
                    }}
                >
                    Week 🍩
                </button>

                <button
                    className={`btn report-nav-btn ${view === 'monthly' ? 'btn-primary' : ''}`}
                    onClick={() => toggleView('monthly')}
                    style={{
                        flex: 1,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        padding: '12px',
                        backgroundColor: view !== 'monthly' ? 'var(--color-bg-surface)' : undefined,
                        color: view !== 'monthly' ? 'var(--color-text-main)' : undefined,
                        border: view !== 'monthly' ? '1px solid var(--color-border)' : undefined,
                        borderRadius: '16px'
                    }}
                >
                    Month 🥐
                </button>

                <button
                    onClick={() => toggleView('daily')}
                    className={`btn report-nav-btn ${showCalendar || (view === 'daily' && !isSameDay(selectedDate, new Date())) ? 'btn-primary' : ''}`}
                    style={{
                        padding: '12px',
                        backgroundColor: (showCalendar || (view === 'daily' && !isSameDay(selectedDate, new Date()))) ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: (showCalendar || (view === 'daily' && !isSameDay(selectedDate, new Date()))) ? 'white' : 'var(--color-text-main)',
                        border: (showCalendar || (view === 'daily' && !isSameDay(selectedDate, new Date()))) ? 'none' : '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        height: '46px',
                        borderRadius: '16px'
                    }}
                    title="Select Date"
                >
                    <CalendarIcon size={20} />
                </button>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            {/* Calendar Widget (Conditional) */}
            {showCalendar && (
                <div style={{ animation: 'fadeIn 0.2s ease-out', flexShrink: 0 }}>
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        maxDate={new Date()}
                        tileContent={({ date, view }) => view === 'month' && hasTransaction(date) ? <div className="tile-dot"></div> : null}
                    />
                </div>
            )}



            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0, gap: '8px', flexWrap: 'nowrap' }}>
                <h3 className="reports-title">{getTitle()}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setCurrentView('analytics');
                        }}
                        className="btn btn-premium-hover"
                        style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-bg-surface)',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <PieChartIcon size={18} /> Analytics
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setShowExportModal(true);
                        }}
                        className="btn btn-premium-hover"
                        style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* View Type Toggle (Transactions / Items) */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '0' }}>
                <button
                    onClick={() => { triggerHaptic('light'); setViewType('transactions'); }}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: viewType === 'transactions' ? 'var(--color-bg-surface)' : 'transparent',
                        borderBottom: viewType === 'transactions' ? '2px solid var(--color-primary)' : 'none',
                        color: viewType === 'transactions' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    Transactions
                </button>
                <button
                    onClick={() => { triggerHaptic('light'); setViewType('items'); }}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: viewType === 'items' ? 'var(--color-bg-surface)' : 'transparent',
                        borderBottom: viewType === 'items' ? '2px solid var(--color-primary)' : 'none',
                        color: viewType === 'items' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    Item Sales
                </button>
            </div>

            {/* Table Section (Flex 1) */}
            {/* Table Section (Flex 1) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, backgroundColor: 'var(--color-bg-surface-transparent)',
                        zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {reportData.length > 0 ? (
                        <>
                            <div style={{ borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-surface)', zIndex: 10 }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '100px 1fr 125px',
                                    maxWidth: '600px',
                                    margin: '0 auto',
                                    padding: '16px 0'
                                }}>
                                    {[
                                        {
                                            label: 'Total Sales 🧁',
                                            value: reportData.reduce((acc, curr) => acc + ((curr.type === 'sale' || curr.type === 'order' || curr.type === 'settlement') ? curr.amount : 0), 0),
                                            color: 'var(--color-success)',
                                            align: 'left',
                                            padding: '0 16px'
                                        },
                                        {
                                            label: 'Total Expense 💸',
                                            value: reportData.reduce((acc, curr) => acc + (curr.type === 'expense' ? curr.amount : 0), 0),
                                            color: 'var(--color-danger)',
                                            align: 'center',
                                            padding: '0 8px'
                                        },
                                        {
                                            label: 'Net Profit 💼',
                                            value: reportData.reduce((acc, curr) => {
                                                if (curr.type === 'sale' || curr.type === 'order' || curr.type === 'settlement') return acc + curr.amount;
                                                if (curr.type === 'expense') return acc - curr.amount;
                                                return acc;
                                            }, 0),
                                            color: 'var(--color-text-main)',
                                            align: 'right',
                                            padding: '0 16px'
                                        }
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: item.align, padding: item.padding, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', whiteSpace: 'nowrap' }}>{item.label}</div>
                                            <div style={{ color: item.color, fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                                                ₹ {item.value.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {viewType === 'transactions' ? (
                                <table style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    margin: '0 auto',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.9rem',
                                    tableLayout: 'fixed'
                                }}>
                                    <thead style={{ position: 'sticky', top: '75px', backgroundColor: 'var(--color-bg-surface)', zIndex: 5, boxShadow: '0 1px 0 var(--color-border)' }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '12px 16px', width: '100px', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                                            <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', width: '125px', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid var(--color-bg-body)', transition: 'background-color 0.2s' }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{format(new Date(t.date), 'dd/MM')}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{format(new Date(t.date), 'h:mm a')}</div>
                                                </td>
                                                <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--color-text-main)' }}>
                                                    {t.description}
                                                    {t.status === 'pending' && <span style={{ display: 'inline-block', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 193, 7, 0.2)', color: 'var(--color-warning)', marginLeft: '6px' }}>Pending</span>}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', fontWeight: '600' }}>
                                                    <div style={{ color: (t.type === 'sale' || t.type === 'order' || t.type === 'settlement') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                        {(t.type === 'sale' || t.type === 'order' || t.type === 'settlement') ? '+' : '-'}₹{t.amount.toLocaleString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                /* ITEM SALES TABLE */
                                <table style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    margin: '0 auto',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.9rem',
                                    tableLayout: 'fixed'
                                }}>
                                    <thead style={{ position: 'sticky', top: '75px', backgroundColor: 'var(--color-bg-surface)', zIndex: 5, boxShadow: '0 1px 0 var(--color-border)' }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '12px 16px', width: '60%', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item</th>
                                            <th style={{ padding: '12px 8px', textAlign: 'center', width: '15%', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', width: '25%', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemSalesData.length > 0 ? itemSalesData.map((item, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--color-bg-body)', transition: 'background-color 0.2s' }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.category}</div>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '500', color: 'var(--color-text-main)' }}>
                                                    {item.qty}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', fontWeight: '600', color: 'var(--color-success)' }}>
                                                    ₹{item.total.toLocaleString()}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No item sales found for this period.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </>
                    ) : (
                        !loading && <EmptyState message="No transactions for this range." />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
