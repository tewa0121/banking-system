// ============================================
// Helper Functions - ረዳት ተግባራት
// ============================================

// ============================================
// የዘፈቀደ ቁጥር ማመንጨት
// ============================================
function generateRandomNumber(min = 1000, max = 9999) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// የማጣቀሻ ቁጥር ማመንጨት
// ============================================
function generateReference(prefix = 'REF') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// ============================================
// ቀን ቅርጸት መቀየር
// ============================================
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    }
    if (format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
    }
    if (format === 'MM/DD/YYYY') {
        return `${month}/${day}/${year}`;
    }
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ============================================
// ገንዘብ ቅርጸት መቀየር
// ============================================
function formatCurrency(amount, currency = 'ETB') {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
}

// ============================================
// ኢሜይል ማረጋገጫ
// ============================================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// የስልክ ቁጥር ማረጋገጫ (ኢትዮጵያ)
// ============================================
function isValidPhone(phone) {
    const phoneRegex = /^(09|07)\d{8}$/;
    return phoneRegex.test(phone);
}

// ============================================
// ግብይት መጠን ማረጋገጫ
// ============================================
function isValidAmount(amount) {
    return !isNaN(amount) && parseFloat(amount) > 0;
}

// ============================================
// የአካውንት ቁጥር ማረጋገጫ
// ============================================
function isValidAccountNumber(accountNumber) {
    return /^10\d{8}$/.test(accountNumber);
}

// ============================================
// ከፍተኛ ገደብ ማረጋገጫ
// ============================================
function isWithinLimit(amount, limit = 100000) {
    return parseFloat(amount) <= limit;
}

// ============================================
// የአይፒ አድራሻ ማግኘት
// ============================================
function getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           '127.0.0.1';
}

// ============================================
// ስህተት መልዕክት ማጠቃለያ
// ============================================
function getErrorMessage(error) {
    if (error.message) return error.message;
    if (error.error) return error.error;
    return 'An unexpected error occurred';
}

// ============================================
// የክፍለ ጊዜ ማጠቃለያ
// ============================================
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 30) return `${days} days ago`;
    return formatDate(date, 'DD/MM/YYYY');
}

// ============================================
// ሁሉንም አስወጣ
// ============================================
module.exports = {
    generateRandomNumber,
    generateReference,
    formatDate,
    formatCurrency,
    isValidEmail,
    isValidPhone,
    isValidAmount,
    isValidAccountNumber,
    isWithinLimit,
    getClientIP,
    getErrorMessage,
    getTimeAgo
};