import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BarChart = ({ data, width = 400, height = 200, color = '#10B981', title, showValues = true }) => {
  const [animatedData, setAnimatedData] = useState([]);
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

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

  // Calculate max value for scaling
  const values = data.map(d => typeof d === 'object' ? d.value : d);
  const maxValue = Math.max(...values) || 1;

  // Calculate bar dimensions
  const barWidth = chartWidth / data.length * 0.7;
  const barSpacing = chartWidth / data.length * 0.3;

  return (
    <div className="relative">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      )}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`bar-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
          <filter id="bar-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1"/>
          </filter>
        </defs>
        
        {/* Grid lines */}
        <g className="opacity-20">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + ratio * chartHeight;
            return (
              <line
                key={`grid-${index}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            );
          })}
        </g>
        
        {/* Bars */}
        {animatedData.map((item, index) => {
          const value = typeof item === 'object' ? item.value : item;
          const label = typeof item === 'object' ? item.label : `Item ${index + 1}`;
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding + index * (chartWidth / data.length) + barSpacing / 2;
          const y = height - padding - barHeight;
          
          return (
            <motion.g key={index}>
              {/* Bar */}
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={`url(#bar-gradient-${color.replace('#', '')})`}
                filter="url(#bar-shadow)"
                rx="4"
                ry="4"
                className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                initial={{ height: 0, y: height - padding }}
                animate={{ height: barHeight, y }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
              />
              
              {/* Value label on top of bar */}
              {showValues && (
                <motion.text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#374151"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                >
                  {value}
                </motion.text>
              )}
              
              {/* Label below bar */}
              <motion.text
                x={x + barWidth / 2}
                y={height - padding + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
              >
                {label.length > 8 ? `${label.substring(0, 8)}...` : label}
              </motion.text>
              
              {/* Hover effect */}
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="transparent"
                className="cursor-pointer"
                whileHover={{
                  fill: "rgba(255, 255, 255, 0.1)"
                }}
              />
            </motion.g>
          );
        })}
        
        {/* Y-axis labels */}
        {[0, maxValue * 0.5, maxValue].map((value, index) => {
          const y = height - padding - (index * chartHeight / 2);
          return (
            <text
              key={`y-label-${index}`}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6B7280"
            >
              {Math.round(value)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default BarChart;