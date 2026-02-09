import React from "react";

const ProcessingStep: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="font-pixel text-lg text-atari-orange animate-title-blink mb-6">
        SENDING...
      </div>
      <div className="font-pixel text-sm text-atari-midgray text-center">
        PLEASE WAIT WHILE WE PROCESS YOUR TRANSACTION
      </div>
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-atari-orange"
            style={{
              animation: "title-blink 1.5s steps(2) infinite",
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProcessingStep;
