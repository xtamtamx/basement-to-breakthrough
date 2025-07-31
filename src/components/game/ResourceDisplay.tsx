import React from "react";
import { Resources } from "@game/types";
import { useColorblindStyles } from "@hooks/useColorblindStyles";
import { motion } from "framer-motion";

interface ResourceDisplayProps {
  resources: Resources;
  previousResources?: Resources;
  showAnimations?: boolean;
}

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resources,
  previousResources,
  showAnimations = true,
}) => {
  const cbStyles = useColorblindStyles();
  
  const renderResource = (
    key: keyof Resources,
    icon: string,
    label: string,
    color: string
  ) => {
    const value = resources[key];
    const previousValue = previousResources?.[key];
    const hasChanged = previousValue !== undefined && value !== previousValue;
    const isPositive = hasChanged && value > previousValue;
    
    return (
      <div 
        key={key}
        className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-lg border border-white/10"
      >
        <span className="text-xl" style={{ color }}>
          {icon}
        </span>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">{label}</span>
          <motion.span 
            className="font-bold text-sm"
            style={{ color }}
            animate={
              showAnimations && hasChanged
                ? {
                    scale: [1, 1.2, 1],
                    color: [color, isPositive ? cbStyles.success : cbStyles.error, color],
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            {value.toLocaleString()}
          </motion.span>
        </div>
        {showAnimations && hasChanged && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: isPositive ? -20 : 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="text-xs font-bold absolute right-2"
            style={{ color: isPositive ? cbStyles.success : cbStyles.error }}
          >
            {isPositive ? "+" : ""}{value - previousValue}
          </motion.span>
        )}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {renderResource("money", "💰", "Money", cbStyles.money)}
      {renderResource("reputation", "⭐", "Rep", cbStyles.reputation)}
      {renderResource("fans", "👥", "Fans", cbStyles.fans)}
      {renderResource("stress", "😰", "Stress", cbStyles.stress)}
    </div>
  );
};