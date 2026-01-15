import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardBody } from '../ui';
import type { ChartData } from '../../types';

interface CategoryChartProps {
  data: ChartData['categoryDistribution'];
}

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#14b8a6',
];

export default function CategoryChart({ data }: CategoryChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item._id.category,
      value: item.total,
      type: item._id.type,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
        <p className="text-sm text-gray-500">Top categories by amount</p>
      </CardHeader>
      <CardBody>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              No category data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name: string, entry) => [
                    formatCurrency(value),
                    `${entry.payload.name} (${entry.payload.type})`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span className="text-sm text-gray-600">
                      {entry.payload && 'name' in entry.payload ? (entry.payload as { name: string }).name : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
