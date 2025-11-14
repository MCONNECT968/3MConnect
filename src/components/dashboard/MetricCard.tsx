import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  bgColor: string;
  textColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  bgColor,
  textColor
}) => {
  return (
    <div className={`${bgColor} ${textColor} rounded-lg shadow-md p-5 dark:shadow-gray-900`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium opacity-90">{title}</h3>
          <p className="text-3xl font-bold mt-2">{value}</p>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="ml-1 text-sm opacity-75">vs last month</span>
            </div>
          )}
        </div>
        
        <div className="p-2 rounded-full bg-white dark:bg-opacity-30 bg-opacity-20">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;