import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useTheme } from '../context/useTheme';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, isAfter, startOfDay, isSameDay } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const Analytics = ({ setCurrentView }) => {
    const { transactions, setViewDateRange } = useTransactions();
    const { theme } = useTheme();
    const [dateRange, setDateRange] = useState('7'); // 'today', '7', '30'

    const isDark = theme === 'dark';

    // Effect to Sync Context with View for Analytics
    React.useEffect(() => {
        const now = new Date();
        const todayStart = startOfDay(now);
        let start, end = now;

        if (dateRange === 'today') {
            start = startOfDay(now);
        } else {
            start = subDays(todayStart, parseInt(dateRange));
        }

        setViewDateRange(start, end);
    }, [dateRange, setViewDateRange]);

    // Theme-specific styles
    const themeStyles = {
        modalBg: isDark ? '#1E1E2E' : '#EFEBE9', // Dark: Matches image, Light: Warm Grey
        textMain: isDark ? '#FFD700' : '#5D4037', // Dark: Gold, Light: Brand Dark Brown
        textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#795548', // Muted Text
        cardBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)', // Glass effect
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(139, 69, 19, 0.1)',
        chartGrid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        tooltipBg: isDark ? '#1E1E2E' : 'rgba(255, 255, 255, 0.95)',
        tooltipColor: isDark ? '#fff' : '#3E2723'
    };

    // Compact Formatter for Y-Axis (e.g. 1.2k, 5k)
    const formatCompact = (value) => {
        if (value >= 1000) {
            return `₹${(value / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 }).replace(/\.0$/, '')}k`;
        }
        return `₹${value}`;
    };

    // Currency Formatter
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Filter transactions based on selected range
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const todayStart = startOfDay(now);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            if (dateRange === 'today') {
                return isSameDay(tDate, now);
            } else {
                const cutoff = subDays(todayStart, parseInt(dateRange));
                return isAfter(tDate, cutoff);
            }
        });
    }, [transactions, dateRange]);

    // 1. Daily Sales vs Expense
    const dailyData = useMemo(() => {
        const groups = {};
        filteredTransactions.forEach(t => {
            const dateKey = format(new Date(t.date), 'dd/MM');
            if (!groups[dateKey]) groups[dateKey] = { name: dateKey, sales: 0, expense: 0 };
            if (t.type === 'sale' || t.type === 'order' || t.type === 'settlement') groups[dateKey].sales += t.amount;
            else if (t.type === 'expense') groups[dateKey].expense += t.amount;
        });
        return Object.values(groups).reverse();
    }, [filteredTransactions]);

    // 2. Peak Time of Sale
    const peakTimeData = useMemo(() => {
        const hours = new Array(24).fill(0).map((_, i) => ({
            hour: i,
            label: `${i % 12 || 12}${i < 12 ? 'AM' : 'PM'}`,
            sales: 0
        }));

        filteredTransactions.filter(t => t.type === 'sale' || t.type === 'order').forEach(t => {
            const hour = new Date(t.date).getHours();
            hours[hour].sales += t.amount;
        });

        return hours.filter(h => h.sales > 0);
    }, [filteredTransactions]);

    // 3. Top 5 Items Sold
    const topItemsData = useMemo(() => {
        const items = {};
        filteredTransactions.filter(t => t.type === 'sale' || t.type === 'order').forEach(t => {
            if (t.items && Array.isArray(t.items)) {
                t.items.forEach(item => {
                    const name = item.name || 'Unknown';
                    if (!items[name]) items[name] = 0;
                    items[name] += (Number(item.price || 0) * Number(item.qty || 0));
                });
            }
        });
        return Object.entries(items)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredTransactions]);

    // 4. Top 5 Expenses
    const topExpensesData = useMemo(() => {
        const items = {};
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            const desc = t.description.trim() || 'Unknown';
            if (!items[desc]) items[desc] = 0;
            items[desc] += t.amount;
        });
        return Object.entries(items)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredTransactions]);

    // 5. Overall Sales vs Expense
    const overallData = useMemo(() => {
        let sales = 0;
        let expense = 0;
        filteredTransactions.forEach(t => {
            if (t.type === 'sale' || t.type === 'order' || t.type === 'settlement') sales += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        });
        return [
            { name: 'Sales', value: sales },
            { name: 'Expense', value: expense }
        ];
    }, [filteredTransactions]);

    const COLORS_OVERALL = isDark ? ['#FFD700', '#FF6B6B'] : ['#2E7D32', '#C62828'];

    const RADIAN = Math.PI / 180;


    // Common tooltip style
    const tooltipStyle = {
        backgroundColor: themeStyles.tooltipBg,
        borderColor: themeStyles.border,
        color: themeStyles.tooltipColor,
        fontSize: '0.85rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        padding: '10px 14px',
        backdropFilter: 'blur(8px)'
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            backgroundColor: themeStyles.modalBg,
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${themeStyles.border}`,
            overflow: 'hidden',
            color: themeStyles.textMain,
            transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
            {/* Modal Header */}
            <div style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${themeStyles.border}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: themeStyles.textMain, fontSize: '1.2rem' }}>📈</span>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        margin: 0,
                        letterSpacing: '0.5px'
                    }}>Analytics Dashboard</h2>
                </div>

                <button
                    onClick={() => setCurrentView('reports')}
                    className="btn-premium-hover"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: themeStyles.textSecondary,
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = themeStyles.textMain}
                    onMouseOut={(e) => e.currentTarget.style.color = themeStyles.textSecondary}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Controls / Toggles - Centered */}
            <div style={{
                padding: '16px',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)',
                    padding: '6px',
                    borderRadius: '50px',
                    border: `1px solid ${themeStyles.border}`
                }}>
                    {['today', '7', '30'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className="btn-premium-hover"
                            style={{
                                padding: '8px 24px',
                                borderRadius: '50px',
                                border: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: dateRange === range ? themeStyles.textMain : 'transparent',
                                color: dateRange === range ? (isDark ? '#1E1E2E' : '#FFFFFF') : themeStyles.textSecondary,
                                cursor: 'pointer',
                                boxShadow: dateRange === range ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {range === 'today' ? 'Today' : range === '7' ? '7 Days' : '30 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="analytics-container" style={{
                flex: 1,
                overflowY: 'auto',
                // padding set via CSS for responsiveness
            }}>
                <style>{`
                    .analytics-container {
                        padding: 0 24px 24px 24px;
                    }
                    .analytics-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                    @media (min-width: 900px) {
                        .analytics-grid {
                            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        }
                    }
                    @media (max-width: 600px) {
                        .analytics-container {
                            padding: 0 12px 12px 12px !important; /* Less padding on mobile */
                        }
                        .analytics-grid {
                            gap: 16px; /* Tighten gap on mobile */
                        }
                    }
                `}</style>
                <div className="analytics-grid">

                    {/* Card 1: Sales vs Expense Trend - Spans full width ONLY for 30 days */}
                    <div className="card glass" style={{
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.border}`,
                        gridColumn: dateRange === '30' ? '1 / -1' : 'auto'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#fff' : themeStyles.textMain }}>
                            <span style={{ color: isDark ? '#FFD700' : 'var(--color-success)' }}>📅</span> Sales vs Expense
                        </h3>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isDark ? '#FFD700' : 'var(--color-success)'} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={isDark ? '#FFD700' : 'var(--color-success)'} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isDark ? '#FF6B6B' : 'var(--color-danger)'} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={isDark ? '#FF6B6B' : 'var(--color-danger)'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: themeStyles.textSecondary }} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: themeStyles.textSecondary }}
                                        tickFormatter={formatCompact}
                                        width={40} /* Fixed shorter width for compact numbers */
                                    />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={tooltipStyle}
                                    />
                                    <CartesianGrid vertical={false} stroke={themeStyles.chartGrid} strokeDasharray="3 3" />
                                    <Area type="monotone" dataKey="sales" stroke={isDark ? '#FFD700' : 'var(--color-success)'} fillOpacity={1} fill="url(#colorSales)" animationDuration={800} />
                                    <Area type="monotone" dataKey="expense" stroke={isDark ? '#FF6B6B' : 'var(--color-danger)'} fillOpacity={1} fill="url(#colorExpense)" animationDuration={800} />
                                    <Legend verticalAlign="top" height={36} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Card 2: Overall Performance (Pie) */}
                    <div className="card glass" style={{
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.border}`
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#fff' : themeStyles.textMain }}>
                            <span style={{ color: themeStyles.textMain }}>📊</span> Overall Performance
                        </h3>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={overallData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            // Index 0 (Sales) is Gold/Yellow -> Dark Text
                                            // Index 1 (Expense) is Red -> White Text
                                            const textColor = index === 0 ? '#1E1E2E' : '#FFFFFF';

                                            return (
                                                <text x={x} y={y} fill={textColor} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                                                    <tspan x={x} dy="-0.6em">{name}</tspan>
                                                    <tspan x={x} dy="1.2em">{`${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}</tspan>
                                                </text>
                                            );
                                        }}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationDuration={800}
                                    >
                                        {overallData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_OVERALL[index % COLORS_OVERALL.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={tooltipStyle}
                                        itemStyle={{ color: themeStyles.tooltipColor }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>



                    {/* Card 3: Top Items */}
                    <div className="card glass" style={{
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.border}`
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#fff' : themeStyles.textMain }}>
                            <span style={{ color: isDark ? '#4a90e2' : 'var(--color-info)' }}>🏆</span> Top Items (Sales)
                        </h3>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={topItemsData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: themeStyles.textSecondary }} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                                    <Bar
                                        dataKey="value"
                                        fill={isDark ? '#4a90e2' : 'var(--color-info)'}
                                        radius={[0, 4, 4, 0]}
                                        label={{
                                            position: 'right',
                                            fill: themeStyles.textMain,
                                            fontSize: 11,
                                            formatter: (value) => formatCurrency(value)
                                        }}
                                        animationDuration={800}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Card 4: Top Expenses (NEW) */}
                    <div className="card glass" style={{
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.border}`
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#fff' : themeStyles.textMain }}>
                            <span style={{ color: isDark ? '#FF6B6B' : 'var(--color-danger)' }}>💸</span> Top Expenses
                        </h3>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={topExpensesData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: themeStyles.textSecondary }} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                                    <Bar
                                        dataKey="value"
                                        fill={isDark ? '#FF6B6B' : 'var(--color-danger)'}
                                        radius={[0, 4, 4, 0]}
                                        label={{
                                            position: 'right',
                                            fill: themeStyles.textMain,
                                            fontSize: 11,
                                            formatter: (value) => formatCurrency(value)
                                        }}
                                        animationDuration={800}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Card 5: Peak Sales Time */}
                    <div className="card glass" style={{
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.border}`
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#fff' : themeStyles.textMain }}>
                            <span style={{ color: isDark ? '#F57F17' : 'var(--color-warning)' }}>⏰</span> Peak Sales Time
                        </h3>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakTimeData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: themeStyles.textSecondary }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} hide />
                                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                                    <Bar
                                        dataKey="sales"
                                        fill={isDark ? '#F57F17' : 'var(--color-warning)'}
                                        radius={[4, 4, 0, 0]}
                                        label={{
                                            position: 'top',
                                            fill: themeStyles.textMain,
                                            fontSize: 10,
                                            formatter: (value) => formatCurrency(value)
                                        }}
                                        animationDuration={800}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Analytics;
