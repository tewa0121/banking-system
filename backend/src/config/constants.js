require('dotenv').config();

module.exports = {
    // VAT Rate (ኢትዮጵያ 15%)
    VAT_RATE: parseFloat(process.env.VAT_RATE) || 0.15,
    
    // የVAT መለያ አካውንት (ለመንግስት)
    VAT_ACCOUNT_ID: parseInt(process.env.VAT_ACCOUNT_ID) || 999,
    
    // የተጠቃሚ አይነቶች
    USER_TYPES: {
        CUSTOMER: 'customer',
        ADMIN: 'admin',
        VAT_COLLECTOR: 'vat_collector'
    },
    
    // የግብይት ገደቦች
    MAX_TRANSFER_AMOUNT: parseFloat(process.env.MAX_TRANSFER_AMOUNT) || 1000000,
    MIN_TRANSFER_AMOUNT: parseFloat(process.env.MIN_TRANSFER_AMOUNT) || 1
};