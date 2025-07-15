const getDeviceInfo = (userAgent) => {
    const isMobile = /mobile/i.test(userAgent);
    const brwoser = userAgent.match(/Chrome|Firefox|Safari|Edge|Opera/i)?.[0] || 'unknown';
    return {
        deviceType: isMobile ? 'Mobile' : 'Desktop',
        brwoser: brwoser
    };
};

module.exports = { getDeviceInfo};