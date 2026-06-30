import QRCode from 'qrcode';

export const generateQrDataUrl = (text) =>
  QRCode.toDataURL(text, { margin: 1, width: 240 });
