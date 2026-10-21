import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = [
  '#1e40af', // Deep Navy Blue
  '#2563eb', // Royal Blue
  '#0284c7', // Sky Blue
  '#0d9488', // Teal
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#475569', // Slate
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md">
        <p className="text-xs font-semibold text-slate-800">{data.type}</p>
        <p className="text-xs font-bold text-blue-700 mt-0.5">
          {data.count} {data.count === 1 ? 'incident' : 'incidents'}
        </p>
      </div>
    );
  }
  return null;
};

const DisasterTypeChart = ({ incidents = [] }) => {
  // Compute frequency dynamically from incidents
  const countsMap = incidents.reduce((acc, curr) => {
    const type = (curr.disasterType || 'Unspecified').trim();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(countsMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
        <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          No incident data available
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Report incidents to view disaster type distributions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Incidents by Disaster Type</h3>
          <p className="text-xs text-slate-500">Distribution across emergency classifications</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
          {data.length} Types
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="type"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DisasterTypeChart;

