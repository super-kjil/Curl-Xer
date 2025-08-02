import React, { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';

interface ChartData {
  name: string;
  success_urls: number;
  failed_urls: number;
  [key: string]: any;
}

interface MultiChartProps {
  data: ChartData[];
  className?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | 'basis' | 'basisOpen' | 'basisClosed' | 'natural' | 'monotoneX' | 'monotoneY';
}

export function MultiChart({
  data,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  strokeWidth = 2,
  type = 'monotone',
}: MultiChartProps) {
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
        success: '#10B981', // green-500
        failed: '#EF4444', // red-500
        tooltipBg: '#1F2937', // gray-800
        tooltipBorder: '#374151', // gray-700
      };
    } else {
      return {
        grid: '#E5E7EB', // gray-200
        text: '#6B7280', // gray-500
        success: '#10B981', // green-500
        failed: '#EF4444', // red-500
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
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col">
                          <span 
                            className="text-[0.70rem] uppercase"
                            style={{ color: colors.text }}
                          >
                            {payload[0]?.payload?.name}
                          </span>
                          <div className="flex flex-col gap-1 mt-1">
                            <span 
                              className="text-sm font-medium"
                              style={{ color: colors.success }}
                            >
                              Success: {payload[0]?.payload?.success_urls || 0}
                            </span>
                            <span 
                              className="text-sm font-medium"
                              style={{ color: colors.failed }}
                            >
                              Failed: {payload[0]?.payload?.failed_urls || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '10px',
              }}
              formatter={(value) => (
                <span style={{ color: colors.text, fontSize: '12px' }}>
                  {value === 'success_urls' ? 'Success URLs' : 'Failed URLs'}
                </span>
              )}
            />
          )}
          <Area
            type={type}
            dataKey="success_urls"
            stackId="1"
            fill={colors.success}
            stroke={colors.success}
            strokeWidth={strokeWidth}
            fillOpacity={0.6}
            name="success_urls"
          />
          <Area
            type={type}
            dataKey="failed_urls"
            stackId="1"
            fill={colors.failed}
            stroke={colors.failed}
            strokeWidth={strokeWidth}
            fillOpacity={0.6}
            name="failed_urls"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 