import React, { useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { SimpleCityMap } from '@/components/map/SimpleCityMap';
import { haptics } from '@utils/mobile';
import { PixelButton } from '@components/ui/PixelButton';
import { DistrictViewBasic } from '../DistrictViewBasic';
import { DistrictInfo } from '@/game/generation/CityGenerator';
import { BuildingInfoModal } from '@/components/modals/BuildingInfoModal';
import { WorkplaceInfoModal } from '@/components/modals/WorkplaceInfoModal';
import { MapInteractionProvider, useMapInteraction } from '@/contexts/MapInteractionContext';
import { devLog } from '@utils/devLogger';

const CityViewContent: React.FC = () => {
  const gameStore = useGameStore();
  const [viewMode, setViewMode] = useState<'overview' | 'district'>('overview');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedDistrictInfo, setSelectedDistrictInfo] = useState<DistrictInfo | null>(null);
  const { selectedVenue, setSelectedVenue, selectedWorkplace, setSelectedWorkplace } = useMapInteraction();
  
  // Debug logging
  React.useEffect(() => {
    devLog.log('CityView - selectedVenue:', selectedVenue);
    devLog.log('CityView - selectedWorkplace:', selectedWorkplace);
  }, [selectedVenue, selectedWorkplace]);

  const handleDistrictClick = (districtId: string, districtInfo: DistrictInfo) => {
    devLog.log('District clicked:', districtId, districtInfo);
    setSelectedDistrictId(districtId);
    setSelectedDistrictInfo(districtInfo);
    setViewMode('district');
    haptics.light();
  };

  const handleZoomOut = () => {
    setViewMode('overview');
    setSelectedDistrictId(null);
    setSelectedDistrictInfo(null);
    haptics.light();
  };

  return (
    <div className="city-view" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {viewMode === 'overview' ? (
          <SimpleCityMap />
        ) : (
          <DistrictViewBasic 
            districtId={selectedDistrictId || ''} 
            districtInfo={selectedDistrictInfo || undefined}
          />
        )}
      </div>

      {/* Test button */}
      <button 
        onClick={() => {
          const testVenue = gameStore.venues[0];
          devLog.log('Test button - setting venue:', testVenue);
          setSelectedVenue(testVenue);
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'red',
          color: 'white',
          padding: '10px',
          zIndex: 100
        }}
      >
        TEST MODAL
      </button>
      
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
      
      <BuildingInfoModal
        isOpen={selectedVenue !== null}
        onClose={() => setSelectedVenue(null)}
        venue={selectedVenue}
      />
      
      <WorkplaceInfoModal
        isOpen={selectedWorkplace !== null}
        onClose={() => setSelectedWorkplace(null)}
        workplace={selectedWorkplace}
      />
    </div>
  );
};

export const CityView: React.FC = () => {
  return (
    <MapInteractionProvider>
      <CityViewContent />
    </MapInteractionProvider>
  );
};