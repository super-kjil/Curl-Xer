import React, { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartProps {
  data: ChartData[];
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  strokeWidth?: number;
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | 'basis' | 'basisOpen' | 'basisClosed' | 'natural' | 'monotoneX' | 'monotoneY';
  fill?: string;
  stroke?: string;
}

export function Chart({
  data,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  strokeWidth = 2,
  type = 'monotone',
  fill,
  stroke,
}: ChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Get theme-appropriate colors
  const getColors = () => {
    if (isDark) {
      return {
        grid: '#374151', // gray-700
        text: '#9CA3AF', // gray-400
        fill: fill || '#3B82F6', // blue-500
        stroke: stroke || '#3B82F6', // blue-500
        tooltipBg: '#1F2937', // gray-800
        tooltipBorder: '#374151', // gray-700
      };
    } else {
      return {
        grid: '#E5E7EB', // gray-200
        text: '#6B7280', // gray-500
        fill: fill || '#3B82F6', // blue-500
        stroke: stroke || '#3B82F6', // blue-500
        tooltipBg: '#FFFFFF', // white
        tooltipBorder: '#E5E7EB', // gray-200
      };
    }
  };

  const colors = getColors();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              opacity={0.3}
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey="name"
              className="text-xs"
              stroke={colors.text}
              tick={{ fontSize: 12, fill: colors.text }}
            />
          )}
          {showYAxis && (
            <YAxis
              className="text-xs"
              stroke={colors.text}
              tick={{ fontSize: 12, fill: colors.text }}
            />
          )}
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div 
                      className="rounded-lg border p-2 shadow-sm"
                      style={{
                        backgroundColor: colors.tooltipBg,
                        borderColor: colors.tooltipBorder,
                        color: colors.text,
                      }}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span 
                            className="text-[0.70rem] uppercase"
                            style={{ color: colors.text }}
                          >
                            {payload[0]?.payload?.name}
                          </span>
                          <span 
                            className="font-bold"
                            style={{ color: colors.text }}
                          >
                            {payload[0]?.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          <Area
            type={type}
            dataKey="value"
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 