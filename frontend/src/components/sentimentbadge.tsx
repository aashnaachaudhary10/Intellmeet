import React from 'react';
import { Smile } from 'lucide-react';

const SentimentBadge = ({ sentiment = "Productive" }) => {
  return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[11px] font-bold text-emerald-700 uppercase">Sentiment analysis</span>
      <span className="flex items-center gap-1 text-[11px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">
        <Smile size={12}/> {sentiment}
      </span>
    </div>
  );
};

export default SentimentBadge;