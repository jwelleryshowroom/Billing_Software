import React from 'react';
import { format } from 'date-fns';
import { Printer, Share2 } from 'lucide-react';

const ReceiptPrinter = ({ transaction, type = 'TAX_INVOICE' }) => {
    const isBooking = type === 'ORDER_BOOKING';

    // Formatting Helpers
    const formatCurrency = (amount) => Number(amount).toFixed(2);
    const formatDate = (dateString) => format(new Date(dateString), 'dd-MMM-yyyy');

    // Fixed width text helper (simple padding)
    const padRight = (str, len) => str.padEnd(len, ' ').slice(0, len);
    const padLeft = (str, len) => str.padStart(len, ' ').slice(-len);

    // The separator line
    const SEPARATOR = '---------------------------------------';

    const Header = () => (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>THE CLASSIC CONFECTION</div>
            <div style={{ fontSize: '11px' }}>Mahavir Marg, opp. Hotel Shyam Palace</div>
            <div style={{ fontSize: '11px' }}>Gandhi Chowk, Kishanganj, Bihar 855108</div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>Ph: +91-8294556416</div>
        </div>
    );

    // Common Container Styles for the receipt paper itself
    const containerStyle = {
        width: '100%', // Let parent control width
        maxWidth: '80mm',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '12px',
        lineHeight: '1.2',
        color: 'black',
        background: 'white',
        padding: '10px',
        whiteSpace: 'pre-wrap',
        margin: '0 auto',
        // Shadow is now handled by the parent wrapper in PublicInvoice
        boxShadow: 'none'
    };

    // Print CSS
    const printStyle = `
        @media print {
            @page { size: auto; margin: 0mm; }
            body { 
                visibility: hidden; 
                overflow: hidden; 
            }
            #printable-receipt { 
                visibility: visible;
                position: fixed; 
                left: 0; 
                top: 0; 
                width: 79mm; 
                height: auto;
                padding: 1mm;
                background: white;
                z-index: 99999;
                font-family: 'Courier New', monospace; 
                margin: 0;
                box-shadow: none !important;
            }
            #printable-receipt * { 
                visibility: visible; 
            }
            .no-print { display: none !important; }
        }
    `;

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        // FORCE the Network IP for the link so it works on phones even if generated from localhost
        const PUBLIC_HOST = 'http://192.168.1.30:5173';
        const link = `${PUBLIC_HOST}/view/${transaction.id}`;
        const phone = transaction.customer?.phone || transaction.customerPhone || '';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Use \n for newlines, we will encode it later
        const message = `*THE CLASSIC CONFECTION* 🧁\n` +
            `Hello *${transaction.customer?.name || transaction.customerName || 'Customer'}*,\n` +
            `Here is your receipt link for Order *#${transaction.id.slice(-6).toUpperCase()}*:\n` +
            `${link}\n\n` +
            `Please visit us again! 🙏\n` +
            `(Generated: ${new Date().toLocaleTimeString()})`; // Force unique message

        // Properly encode the message
        const encodedMessage = encodeURIComponent(message);

        // Only show alert if user is on localhost to warn them
        if (isLocalhost) {
            alert(`⚠️ WARNING: You are on 'localhost'. \nThis link will fail with 'SSL Error' on some browsers and WON'T work on phones.\n\nLINK: ${link}\n\nPlease open the app using your Network IP to generate shareable links.`);
        }

        const url = phone
            ? `https://wa.me/91${phone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    // Render Content Logic
    const renderContent = () => {
        if (!isBooking) {
            // 1. QUICK MODE (INVOICE)
            return (
                <>
                    <div>{SEPARATOR}</div>
                    <Header />
                    <div>{SEPARATOR}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>INVOICE NO: #{transaction.id?.slice(-8).toUpperCase() || 'POS-8921'}</span>
                        <span>Date: {formatDate(transaction.date || transaction.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cashier: Ankit</span>
                        <span>Time: {format(new Date(transaction.date || transaction.createdAt), 'hh:mm a')}</span>
                    </div>
                    {/* Customer Details if present (even in Quick Mode sometimes) */}
                    {transaction.customerName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>CUSTOMER:</span>
                            <span className="uppercase">{transaction.customerName}</span>
                        </div>
                    )}

                    <div>{SEPARATOR}</div>
                    {/* Header Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '18fr 6fr 9fr 9fr' }}>
                        <span>ITEM</span>
                        <span style={{ textAlign: 'center' }}>QTY</span>
                        <span style={{ textAlign: 'right' }}>RATE</span>
                        <span style={{ textAlign: 'right' }}>AMT</span>
                    </div>
                    <div>{SEPARATOR}</div>

                    {/* Items */}
                    {(transaction.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '18fr 6fr 9fr 9fr', marginBottom: '4px' }}>
                            <span>{item.name}</span>
                            <span style={{ textAlign: 'center' }}>{item.qty || item.quantity}</span>
                            <span style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</span>
                            <span style={{ textAlign: 'right' }}>{formatCurrency(item.price * (item.qty || item.quantity))}</span>
                        </div>
                    ))}

                    <div>{SEPARATOR}</div>
                    <div>Total Qty: {(transaction.items || []).reduce((acc, i) => acc + (i.qty || i.quantity || 0), 0)}</div>
                    <div>{SEPARATOR}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                        <span>GRAND TOTAL:</span>
                        <span>{formatCurrency(transaction.totalValue || transaction.amount)}</span>
                    </div>

                    <div>{SEPARATOR}</div>
                    <div>{SEPARATOR}</div>

                    {transaction.payment?.balanceMethod ? (
                        <div style={{ fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Advance Paid ({transaction.payment.method?.toUpperCase()}):</span>
                                <span>{formatCurrency(transaction.payment.advance || transaction.advancePaid || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Balance Paid ({transaction.payment.balanceMethod?.toUpperCase()}):</span>
                                <span>{formatCurrency((transaction.totalValue || transaction.amount) - (transaction.payment.advance || transaction.advancePaid || 0))}</span>
                            </div>
                        </div>
                    ) : (
                        <div>Payment Mode: {transaction.payment?.method?.toUpperCase() || 'CASH'}</div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <div>Thank you for visiting!</div>
                        <div>Have a sweet day! 🧁</div>
                    </div>
                    <div>{SEPARATOR}</div>
                </>
            );
        } else {
            // 2. ORDER MODE (BOOKING SLIP)
            return (
                <>
                    <div>{SEPARATOR}</div>
                    <Header />
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '5px' }}>** ORDER BOOKING SLIP **</div>
                    <div>{SEPARATOR}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ref: #{transaction.id?.slice(-6).toUpperCase() || 'BK-104'}</span>
                        <span>Date: {formatDate(transaction.date || transaction.createdAt)}</span>
                    </div>

                    <div>{SEPARATOR}</div>
                    <div style={{ fontWeight: 'bold' }}>CUSTOMER DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'min-content auto', gap: '10px' }}>
                        <span>Name:</span>
                        <span>{transaction.customer?.name || transaction.customerName || 'Walk-in'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'min-content auto', gap: '10px' }}>
                        <span>Phone:</span>
                        <span>{transaction.customer?.phone || transaction.customerPhone || 'N/A'}</span>
                    </div>

                    <div>{SEPARATOR}</div>
                    <div style={{ fontWeight: 'bold' }}>📦 DELIVERY DUE:</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        📅 {transaction.delivery ? format(new Date(transaction.delivery.date), 'dd-MMM-yyyy (EEEE)') :
                            (transaction.dueDate ? format(new Date(transaction.dueDate), 'dd-MMM-yyyy') : 'ASAP')}
                    </div>
                    {transaction.delivery?.time || transaction.dueTime ? (
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            🕒 {transaction.delivery ? format(new Date(`2000-01-01T${transaction.delivery.time}`), 'hh:mm a') :
                                (transaction.dueTime ? format(new Date(`2000-01-01T${transaction.dueTime}`), 'hh:mm a') : '')}
                        </div>
                    ) : null}

                    <div>{SEPARATOR}</div>
                    <div style={{ fontWeight: 'bold' }}>ITEM DETAILS</div>
                    <div>{SEPARATOR}</div>

                    {(transaction.items || []).map((item, i) => (
                        <div key={i} style={{ marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold' }}>{i + 1}. {item.name}</div>
                            <div style={{ paddingLeft: '15px' }}>
                                {item.note && <div>- Note: "{item.note}"</div>}
                                <div>- Rate: {formatCurrency(item.price)} x {item.qty || item.quantity}</div>
                            </div>
                        </div>
                    ))}

                    <div>{SEPARATOR}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Amount:</span>
                        <span style={{ fontWeight: 'bold' }}>₹ {formatCurrency(transaction.totalValue || transaction.amount)}</span>
                    </div>
                    {!transaction.payment?.balanceMethod && (
                        <>
                            <div>{SEPARATOR}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>ADVANCE PAID:</span>
                                <span>₹ {formatCurrency(transaction.payment?.advance || transaction.advancePaid || 0)}</span>
                            </div>
                            <div>{SEPARATOR}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                                <span>⚠️ BALANCE DUE:</span>
                                <span>₹ {formatCurrency(transaction.payment?.balance || transaction.balanceDue || 0)}</span>
                            </div>
                        </>
                    )}
                    <div>{SEPARATOR}</div>

                    <div style={{ textAlign: 'center', marginTop: '5px' }}>
                        <div style={{ fontWeight: 'bold' }}>* PLEASE BRING THIS SLIP *</div>
                        <div style={{ fontSize: '11px' }}>Order is subject to confirmation.</div>
                        <div style={{ fontSize: '11px' }}>Ph: 8294556416</div>
                    </div>
                    <div>{SEPARATOR}</div>
                </>
            );
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 py-4 max-w-full overflow-hidden">
            {/* Printable Receipt Area */}
            <div id="printable-receipt" style={containerStyle}>
                <style>{printStyle}</style>
                {renderContent()}
            </div>

            {/* Action Buttons Removed as per request (handled by parent modal) */}
        </div>
    );
};

export default ReceiptPrinter;
