import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeContainerProps {
  value: string;
  size?: number;
}

export const QRCodeContainer: React.FC<QRCodeContainerProps> = ({ value, size = 200 }) => (
  <div className="qr-container">
    <div className="qr-frame">
      <QRCode value={value} size={size} level="M" />
    </div>
  </div>
);
