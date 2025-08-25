import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: Array<{ name: string; [key: string]: any }>
  height?: number
  fill?: string
  stroke?: string
  className?: string
}

export function Chart({ data, height = 300, fill = "#3B82F6", stroke = "#3B82F6", className }: ChartProps) {
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
      };
    } else {
      return {
        grid: '#E5E7EB', // gray-200
        text: '#6B7280', // gray-500
      };
    }
  };

  const colors = getColors();

  // Get the first numeric data key for the chart
  const dataKeys = Object.keys(data[0] || {}).filter(key => 
    key !== 'name' && typeof data[0][key] === 'number'
  );
  const dataKey = dataKeys[0] || 'value';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            opacity={0.3}
          />
          <XAxis
            dataKey="name"
            className="text-xs"
            stroke={colors.text}
            tick={{ fontSize: 12, fill: colors.text }}
          />
          <YAxis
            className="text-xs"
            stroke={colors.text}
            tick={{ fontSize: 12, fill: colors.text }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div 
                    className="rounded-lg border p-2 shadow-sm"
                    style={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: colors.grid,
                      color: colors.text,
                    }}
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex flex-col">
                        <span 
                          className="text-[0.70rem] uppercase"
                          style={{ color: colors.text }}
                        >
                          {payload[0]?.payload?.name}
                        </span>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: stroke }}
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
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={2}
            fill={fill}
            fillOpacity={0.1}
            dot={{ fill: stroke, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: stroke, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
