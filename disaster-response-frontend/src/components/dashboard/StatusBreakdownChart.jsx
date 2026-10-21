import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const STATUS_COLORS = {
  Active: '#dc2626',
  Pending: '#d97706',
  Resolved: '#059669',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <p className="text-xs font-semibold text-slate-800">{data.name}</p>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          {data.value} incidents ({data.payload.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const StatusBreakdownChart = ({ incidents = [] }) => {
  const total = incidents.length;

  const statusCounts = incidents.reduce(
    (acc, curr) => {
      const status = (curr.status || 'Pending').trim();
      const normalized =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

      if (normalized === 'Active') acc.Active += 1;
      else if (normalized === 'Resolved') acc.Resolved += 1;
      else acc.Pending += 1;

      return acc;
    },
    { Active: 0, Pending: 0, Resolved: 0 }
  );

  const data = [
    {
      name: 'Active',
      value: statusCounts.Active,
      color: STATUS_COLORS.Active,
      percentage: total > 0 ? Math.round((statusCounts.Active / total) * 100) : 0,
    },
    {
      name: 'Pending',
      value: statusCounts.Pending,
      color: STATUS_COLORS.Pending,
      percentage: total > 0 ? Math.round((statusCounts.Pending / total) * 100) : 0,
    },
    {
      name: 'Resolved',
      value: statusCounts.Resolved,
      color: STATUS_COLORS.Resolved,
      percentage: total > 0 ? Math.round((statusCounts.Resolved / total) * 100) : 0,
    },
  ].filter((item) => item.value > 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
        <PieIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          No incident data available
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Add incidents to see resolution vs active breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Incident Status Breakdown</h3>
          <p className="text-xs text-slate-500">Current operational lifecycle distribution</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
        <div className="h-44 w-44 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 leading-tight">{total}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 w-full max-w-xs">
          {[
            { key: 'Active', count: statusCounts.Active, dotColor: 'bg-red-600', textColor: 'text-red-700' },
            { key: 'Pending', count: statusCounts.Pending, dotColor: 'bg-amber-500', textColor: 'text-amber-700' },
            { key: 'Resolved', count: statusCounts.Resolved, dotColor: 'bg-emerald-600', textColor: 'text-emerald-700' },
          ].map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                  <span className="font-medium text-slate-700">{item.key}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <strong className={`font-semibold ${item.textColor}`}>{item.count}</strong>
                  <span className="text-slate-400 text-xs">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusBreakdownChart;

