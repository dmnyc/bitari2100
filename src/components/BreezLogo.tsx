import React from 'react';

const BreezLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-pixel text-base text-atari-midgray tracking-wider">BREEZ SDK</span>
    </div>
  );
};

export default BreezLogo;
