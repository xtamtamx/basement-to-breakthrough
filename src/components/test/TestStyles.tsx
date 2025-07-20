import React from 'react';

export const TestStyles: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'yellow' }}>
        INLINE STYLE TEST
      </h1>
      <h1 className="pixel-text pixel-text-xl">TEST PIXEL TEXT</h1>
      <div className="pixel-panel p-4">
        <p>Pixel Panel Test</p>
      </div>
      <div className="glass-panel p-4">
        <p>Glass Panel Test</p>
      </div>
      <button className="pixel-button">Pixel Button</button>
      <button className="glass-button px-4 py-2">Glass Button</button>
      <div className="bg-metal-900 p-4 rounded">
        <p className="text-punk-500">Tailwind Test</p>
      </div>
    </div>
  );
};