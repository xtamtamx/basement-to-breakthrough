import React from "react";

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-punk-pink/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-punk-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-text-secondary text-sm animate-pulse">{message}</p>
    </div>
  );
};

export const GameLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-display text-punk-pink mb-8 animate-pulse">
          Basement to Breakthrough
        </h1>
        <LoadingSpinner message="Setting up the underground..." />
        <div className="mt-8 text-text-muted text-xs">
          <p>🎸 Tuning guitars...</p>
          <p>🥁 Testing drums...</p>
          <p>🎤 Checking mics...</p>
        </div>
      </div>
    </div>
  );
};
