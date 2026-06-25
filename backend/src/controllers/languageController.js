// ============================================
// Language Controller - Get supported languages
// ============================================
exports.getLanguages = async (req, res) => {
    try {
        const languages = [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
            { code: 'or', name: 'Oromoo', flag: '🇪🇹' },
            { code: 'ti', name: 'ትግርኛ', flag: '🇪🇹' },
            { code: 'so', name: 'Soomaali', flag: '🇸🇴' }
        ];
        
        res.status(200).json({
            success: true,
            data: languages
        });
    } catch (error) {
        console.error('Get languages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get languages',
            error: error.message
        });
    }
};