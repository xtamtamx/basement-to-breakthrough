import React from 'react';
import { motion } from 'framer-motion';

interface DistrictViewBasicProps {
  districtId: string;
}

export const DistrictViewBasic: React.FC<DistrictViewBasicProps> = ({ districtId }) => {
  const districts = {
    eastside: { name: 'Eastside', color: '#E91E63' },
    downtown: { name: 'Downtown', color: '#3498DB' },
    industrial: { name: 'Industrial', color: '#FF6F00' },
    university: { name: 'University', color: '#8B6914' },
  };

  const district = districts[districtId] || { name: 'Unknown', color: '#666' };

  return (
    <div className="w-full h-full min-h-[500px] bg-gray-900 rounded-lg p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ color: district.color }}
        >
          {district.name} District
        </h1>
        <p className="text-gray-400 mb-8">
          Welcome to the {district.name.toLowerCase()} area
        </p>
        
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-sm text-gray-400">Buildings</div>
            <div className="text-xl font-bold text-white">3</div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-2xl mb-2">💼</div>
            <div className="text-sm text-gray-400">Jobs</div>
            <div className="text-xl font-bold text-green-400">2</div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-2xl mb-2">🎵</div>
            <div className="text-sm text-gray-400">Venues</div>
            <div className="text-xl font-bold text-pink-400">1</div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            Click locations to interact • Build venues • Find jobs
          </p>
        </div>
      </motion.div>
    </div>
  );
};