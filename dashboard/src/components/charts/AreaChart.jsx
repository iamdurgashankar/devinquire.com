import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AreaChart = ({ data, width = 400, height = 200, color = '#8B5CF6', title, showGrid = true, showPoints = false }) => {
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

  // Calculate min and max values
  const values = data.map(d => typeof d === 'object' ? d.value : d);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Generate points for the area
  const points = animatedData.map((item, index) => {
    const value = typeof item === 'object' ? item.value : item;
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y, value, label: typeof item === 'object' ? item.label : index };
  });

  // Create path string for the line
  const linePath = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  // Create area path with smooth curves
  const createSmoothPath = (points, tension = 0.3) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (i === 1) {
        // First curve
        const cp1x = prev.x + (curr.x - prev.x) * tension;
        const cp1y = prev.y;
        const cp2x = curr.x - (next ? (next.x - prev.x) * tension : 0);
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else if (i === points.length - 1) {
        // Last curve
        const prevPrev = points[i - 2];
        const cp1x = prev.x + (curr.x - prevPrev.x) * tension;
        const cp1y = prev.y;
        const cp2x = curr.x - (curr.x - prev.x) * tension;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        // Middle curves
        const prevPrev = points[i - 2];
        const cp1x = prev.x + (curr.x - prevPrev.x) * tension;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - prev.x) * tension;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const smoothLinePath = createSmoothPath(points);
  
  // Create area path for gradient fill
  const areaPath = points.length > 0 ? 
    `${smoothLinePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z` : '';

  return (
    <div className="relative">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      )}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`area-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="50%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          <filter id="area-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid lines */}
        {showGrid && (
          <g className="opacity-20">
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = padding + ratio * chartHeight;
              return (
                <line
                  key={`h-grid-${index}`}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            })}
            {/* Vertical grid lines */}
            {data.map((_, index) => {
              if (index % Math.ceil(data.length / 5) === 0) {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                return (
                  <line
                    key={`v-grid-${index}`}
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={height - padding}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                );
              }
              return null;
            })}
          </g>
        )}
        
        {/* Area fill */}
        {areaPath && (
          <motion.path
            d={areaPath}
            fill={`url(#area-gradient-${color.replace('#', '')})`}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ transformOrigin: `center ${height - padding}px` }}
          />
        )}
        
        {/* Main line */}
        <motion.path
          d={smoothLinePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#area-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Data points */}
        {showPoints && points.map((point, index) => (
          <motion.g key={index}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:r-5 transition-all duration-200"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 + 0.8 }}
              whileHover={{ scale: 1.5 }}
            />
            {/* Tooltip on hover */}
            <motion.g
              className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <rect
                x={point.x - 25}
                y={point.y - 35}
                width="50"
                height="25"
                rx="4"
                fill="rgba(0, 0, 0, 0.8)"
              />
              <text
                x={point.x}
                y={point.y - 20}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="500"
              >
                {point.value}
              </text>
            </motion.g>
          </motion.g>
        ))}
        
        {/* Y-axis labels */}
        {[minValue, (minValue + maxValue) / 2, maxValue].map((value, index) => {
          const y = padding + chartHeight - (index * chartHeight / 2);
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
        
        {/* X-axis labels */}
        {points.map((point, index) => {
          if (index % Math.ceil(points.length / 4) === 0) {
            return (
              <text
                key={`x-label-${index}`}
                x={point.x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
              >
                {point.label}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default AreaChart;