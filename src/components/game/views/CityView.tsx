import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { ProceduralCityMap } from '../ProceduralCityMap';
import { haptics } from '@utils/mobile';
import { PixelButton } from '@components/ui/PixelButton';
import { DistrictViewBasic } from '../DistrictViewBasic';

export const CityView: React.FC = () => {
  const { money } = useGameStore();
  const [viewMode, setViewMode] = useState<'overview' | 'district'>('overview');
  const [zoomedDistrict, setZoomedDistrict] = useState<string | null>(null);

  const handleDistrictClick = (districtId: string) => {
    console.log('District clicked:', districtId);
    setZoomedDistrict(districtId);
    setViewMode('district');
    haptics.light();
  };

  const handleZoomOut = () => {
    setViewMode('overview');
    setZoomedDistrict(null);
    haptics.light();
  };

  return (
    <div className="city-view" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', padding: '20px' }}>
        {viewMode === 'overview' ? (
          <ProceduralCityMap
            onDistrictClick={handleDistrictClick}
            selectedDistrict={zoomedDistrict}
          />
        ) : (
          <DistrictViewBasic districtId={zoomedDistrict || ''} />
        )}
      </div>

      {viewMode === 'district' && (
        <div style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <PixelButton onClick={handleZoomOut} variant="primary" size="sm">
            🏙️ City Overview
          </PixelButton>
          <PixelButton variant="success" size="sm">
            🏗️ Build
          </PixelButton>
        </div>
      )}
    </div>
  );
};