import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DonutChart = ({ data, width = 200, height = 200, title, showLegend = true, colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'] }) => {
  const [animatedData, setAnimatedData] = useState([]);
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.6;
  const centerX = width / 2;
  const centerY = height / 2;

  useEffect(() => {
    if (data && data.length > 0) {
      const timer = setTimeout(() => {
        setAnimatedData(data);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-gray-500 text-sm">No data available</div>
      </div>
    );
  }

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + (typeof item === 'object' ? item.value : item), 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-gray-500 text-sm">No data to display</div>
      </div>
    );
  }

  // Create arc data
  let currentAngle = -90; // Start from top
  const arcs = animatedData.map((item, index) => {
    const value = typeof item === 'object' ? item.value : item;
    const label = typeof item === 'object' ? item.label : `Item ${index + 1}`;
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Calculate arc path
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    currentAngle += angle;
    
    return {
      path: pathData,
      value,
      label,
      percentage: percentage.toFixed(1),
      color: colors[index % colors.length],
      startAngle,
      endAngle,
      midAngle: startAngle + angle / 2
    };
  });

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      )}
      
      <div className="flex items-center gap-6">
        {/* Chart */}
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              {colors.map((color, index) => (
                <linearGradient key={index} id={`donut-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                </linearGradient>
              ))}
              <filter id="donut-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
              </filter>
            </defs>
            
            {/* Arcs */}
            {arcs.map((arc, index) => (
              <motion.g key={index}>
                <motion.path
                  d={arc.path}
                  fill={`url(#donut-gradient-${index % colors.length})`}
                  filter="url(#donut-shadow)"
                  className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                />
                
                {/* Percentage labels on arcs */}
                {arc.percentage > 5 && (
                  <motion.text
                    x={centerX + (radius - innerRadius) / 2 * Math.cos((arc.midAngle * Math.PI) / 180)}
                    y={centerY + (radius - innerRadius) / 2 * Math.sin((arc.midAngle * Math.PI) / 180) + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                  >
                    {arc.percentage}%
                  </motion.text>
                )}
              </motion.g>
            ))}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className="text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {total}
            </motion.div>
            <motion.div
              className="text-xs text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1 }}
            >
              Total
            </motion.div>
          </div>
        </div>
        
        {/* Legend */}
        {showLegend && (
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {arcs.map((arc, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.7 }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="text-gray-700 font-medium">{arc.label}</span>
                <span className="text-gray-500">({arc.value})</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DonutChart;