const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const textData = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const dataUrl = await QRCode.toDataURL(textData, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    return '';
  }
};

module.exports = { generateQRCode };
