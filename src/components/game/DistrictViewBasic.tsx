import React from "react";
import { motion } from "framer-motion";
import { DistrictInfo } from "@/game/generation/CityGenerator";

interface DistrictViewBasicProps {
  districtId: string;
  districtInfo?: DistrictInfo;
}

const DISTRICT_DETAILS: Record<
  string,
  {
    name: string;
    color: string;
    description: string;
    venueTypes: string[];
    jobTypes: string[];
  }
> = {
  downtown: {
    name: "Downtown",
    color: "#3B82F6",
    description: "Corporate venues and mainstream clubs",
    venueTypes: ["Concert Hall", "Corporate Venue", "Chain Bar"],
    jobTypes: ["Office Temp", "Marketing Intern", "Barista"],
  },
  warehouse: {
    name: "Warehouse District",
    color: "#EF4444",
    description: "Underground venues and DIY spaces",
    venueTypes: ["Warehouse", "DIY Space", "Underground Club"],
    jobTypes: ["Loading Dock", "Night Security", "Forklift Operator"],
  },
  college: {
    name: "College Town",
    color: "#10B981",
    description: "Student venues and campus spots",
    venueTypes: ["House Show", "Student Center", "Coffee Shop"],
    jobTypes: ["TA", "Campus Food", "Library Assistant"],
  },
  residential: {
    name: "Residential",
    color: "#F59E0B",
    description: "House shows and neighborhood bars",
    venueTypes: ["House Show", "Dive Bar", "Garage"],
    jobTypes: ["Dog Walker", "Delivery", "Grocery Clerk"],
  },
  arts: {
    name: "Arts District",
    color: "#8B5CF6",
    description: "Creative spaces and galleries",
    venueTypes: ["Gallery", "Artist Loft", "Experimental Space"],
    jobTypes: ["Gallery Assistant", "Screen Printing", "Art Handler"],
  },
};

export const DistrictViewBasic: React.FC<DistrictViewBasicProps> = ({
  districtInfo,
}) => {
  const districtType = districtInfo?.type || "downtown";
  const details = DISTRICT_DETAILS[districtType];
  const districtSize = districtInfo?.cells.length || 0;
  const connections = districtInfo?.neighbors.length || 0;

  return (
    <div className="w-full h-full min-h-[500px] bg-gray-900 rounded-lg p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1
          className="text-4xl font-bold mb-2 uppercase tracking-wider"
          style={{ color: details.color }}
        >
          {details.name}
        </h1>
        <p className="text-gray-400 mb-8 text-lg">{details.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
            <div className="text-2xl mb-1">🏘️</div>
            <div className="text-xs text-gray-400">District Size</div>
            <div className="text-lg font-bold text-white">
              {districtSize} blocks
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
            <div className="text-2xl mb-1">🔗</div>
            <div className="text-xs text-gray-400">Connections</div>
            <div className="text-lg font-bold text-blue-400">{connections}</div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
            <div className="text-2xl mb-1">🎵</div>
            <div className="text-xs text-gray-400">Venues</div>
            <div className="text-lg font-bold text-pink-400">0</div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
            <div className="text-2xl mb-1">💼</div>
            <div className="text-xs text-gray-400">Jobs Available</div>
            <div className="text-lg font-bold text-green-400">3</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700">
            <h3 className="text-lg font-bold mb-3 text-white">
              Available Venues
            </h3>
            <div className="space-y-2">
              {details.venueTypes.map((venue, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-400 bg-gray-900 p-2 rounded"
                >
                  🏢 {venue}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700">
            <h3 className="text-lg font-bold mb-3 text-white">
              Job Opportunities
            </h3>
            <div className="space-y-2">
              {details.jobTypes.map((job, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-400 bg-gray-900 p-2 rounded"
                >
                  💼 {job}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg border-2 border-gray-700">
          <p className="text-sm text-gray-400">
            🏗️ Build venues • 💼 Find jobs • 🎤 Book shows
          </p>
        </div>
      </motion.div>
    </div>
  );
};
