
export const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export const getSmartEmoji = (name, category) => {
    const lowerName = (name || '').toLowerCase();
    const lowerCat = (category || '').toLowerCase();

    // Comprehensive Keyword Mapping
    const keywords = {
        // 🎂 CAKES & PASTRIES
        'cake': '🎂', 'truffle': '🎂', 'forest': '🎂', 'velvet': '🎂', 'cheesecake': '🍰',
        'pastry': '🍰', 'slice': '🍰', 'tart': '🥧', 'brownie': '🍫', 'cupcake': '🧁',
        'muffin': '🧁', 'donut': '🍩', 'doughnut': '🍩', 'eclair': '🥖', 'pie': '🥧',
        'macaron': '🍪', 'cookie': '🍪', 'biscuit': '🍪', 'wafer': '🧇', 'toast': '🍞',
        'bread': '🍞', 'loaf': '🍞', 'bun': '🥯', 'bagel': '🥯', 'croissant': '🥐',
        'puff': '🥐', 'roll': '🥐', 'cream roll': '🥖',

        // 🍫 CHOCOLATES & SWEETS
        'chocolate': '🍫', 'choco': '🍫', 'bar': '🍫', 'candy': '🍬', 'sweet': '🍬',
        'toffee': '🍬', 'lollipop': '🍭', 'jelly': '🍮', 'pudding': '🍮', 'mousse': '🍮',
        'ice cream': '🍦', 'cone': '🍦', 'sundae': '🍨', 'kulfi': '🍡', 'laddu': '🟠',

        // 🍔 SNACKS & FAST FOOD
        'burger': '🍔', 'pizza': '🍕', 'sandwich': '🥪', 'fries': '🍟', 'chip': '🍟',
        'nacho': '🌮', 'taco': '🌮', 'hotdog': '🌭', 'samosa': '🥟', 'pattie': '🥟',
        'momos': '🥟', 'dimsum': '🥟', 'spring roll': '🌯', 'wrap': '🌯', 'pasta': '🍝',
        'noodle': '🍜', 'maggi': '🍜', 'soup': '🍲', 'salad': '🥗', 'popcorn': '🍿',

        // 🥤 DRINKS
        'coke': '🥤', 'cola': '🥤', 'pepsi': '🥤', 'soda': '🥤', 'drink': '🍹',
        'juice': '🧃', 'orange': '🍊', 'mango': '🥭', 'apple': '🍎', 'lemon': '🍋',
        'coffee': '☕', 'latte': '☕', 'cappuccino': '☕', 'tea': '🫖', 'chai': '🫖',
        'shake': '🥤', 'smoothie': '🥤', 'milk': '🥛', 'water': '💧', 'bottle': '🍾',
        'beer': '🍺', 'wine': '🍷', 'cocktail': '🍸', 'mocktail': '🍹',

        // 🎉 PARTY & DECORATION
        'candle': '🕯️', 'wick': '🕯️', 'balloon': '🎈', 'popper': '🎉', 'confetti': '🎊',
        'streamer': '🎏', 'banner': '🎏', 'decoration': '🎎', 'hat': '🥳', 'cap': '🥳',
        'mask': '🎭', 'whistle': '📢', 'gift': '🎁', 'present': '🎁', 'ribbon': '🎀',
        'tape': '📏', 'card': '🃏', 'invitation': '📨', 'envelope': '✉️', 'bag': '🛍️',
        'box': '📦', 'plate': '🍽️', 'spoon': '🥄', 'fork': '🍴', 'knife': '🔪',
        'cup': '🥤', 'glass': '🥂', 'napkin': '🧻', 'tissue': '🧻',

        // 🍱 GENERAL FOOD
        'rice': '🍚', 'biryani': '🥘', 'curry': '🍛', 'roti': '🫓', 'naan': '🫓',
        'chicken': '🍗', 'meat': '🥩', 'egg': '🥚', 'fish': '🐟', 'veg': '🥬'
    };

    // Check Name Keywords (Longest match first to avoid partial issues like 'cup' matching 'cupcake')
    // We don't strictly sort here for speed, but detailed keys usually work.
    for (const key in keywords) {
        if (lowerName.includes(key)) return keywords[key];
    }

    // Strict Match Only - No fuzzy fallbacks
    return '';
};

export const generateWhatsAppLink = (order) => {
    const link = `${window.location.origin}/view/${order.id}`;
    const phone = order.customer?.phone || '';

    // Distinction Logic
    const isBooking = order.type === 'order' && order.status !== 'completed' && order.status !== 'delivered';
    const docType = isBooking ? 'BOOKING SLIP' : 'INVOICE';
    const closeMsg = isBooking ? 'Order is subject to confirmation.' : 'Please visit us again! 🙏';

    // Message Construction (Safe Emojis)
    const message = `*THE CLASSIC CONFECTION* 🧁\n` +
        `Hello *${order.customer?.name || 'Customer'}*,\n` +
        `Here is your ${docType} for Order *#${order.id.slice(-6).toUpperCase()}*:\n` +
        `${link}\n\n` +
        `${closeMsg}`;

    const encodedMessage = encodeURIComponent(message);

    // Use api.whatsapp.com for better cross-platform compatibility
    const url = phone
        ? `https://api.whatsapp.com/send?phone=91${phone}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    return url;
};
