import React from 'react';

interface SimpleDistrictViewProps {
  districtId: string;
}

export const SimpleDistrictView: React.FC<SimpleDistrictViewProps> = ({ districtId }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '400px',
      backgroundColor: '#f00',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      District View: {districtId}
    </div>
  );
};