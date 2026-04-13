import React from 'react';

const PresenceDot = ({ status = 'online' }) => {
  const colors = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-300'
  };

  return (
    <div className="relative">
      <div className={`w-3 h-3 rounded-full border-2 border-white ${colors[status as keyof typeof colors]}`} />
      {status === 'online' && (
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-25" />
      )}
    </div>
  );
};

export default PresenceDot;