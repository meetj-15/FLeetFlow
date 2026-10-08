import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import '../../styles/dashboard.css';

const fmt = (n) =>
  n === undefined || n === null
    ? '—'
    : parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EXPENSE_COLORS = ['#2563eb','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444'];

const FinancialAnalystDashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setData(await getDashboardMetrics());
    } catch {
      setError('Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="dash-full-loading">
      <div className="dash-spinner" />
      <p>Loading financial dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="dash-full-error">
      <p>{error}</p>
      <button className="dash-retry-btn" onClick={load}>Retry</button>
    </div>
  );

  if (!data) return null;

  // API shape: { revenue, expenses, profitability, revenueByVehicle, recentExpenses, vehicleProfitability }
  const revenueData      = data.revenue        || {};
  const expensesData     = data.expenses       || {};
  const profitData       = data.profitability  || {};

  const totalRevenue     = revenueData.totalRevenue      ?? 0;
  const avgRevPerTrip    = revenueData.avgRevenuePerTrip ?? 0;
  const totalExpenses    = expensesData.totalExpenses    ?? 0;
  const expensesByCategory = expensesData.expensesByCategory || [];
  const netProfit        = profitData.netProfit   ?? 0;
  const profitMargin     = profitData.profitMargin ?? 0;

  const revenueByVehicle = data.revenueByVehicle   || [];
  const vehicleROI       = data.vehicleProfitability || [];
  const recentExpenses   = data.recentExpenses      || [];

  const expenseChartData = [...expensesByCategory]
    .map(c => ({ name: c.category, amount: parseFloat(c.total) }))
    .sort((a, b) => b.amount - a.amount);

  const isProfit = netProfit >= 0;

  return (
    <div className="dash-root">
      {/* Header */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1>Financial Overview</h1>
          <p>Revenue, expenses and fleet profitability analysis</p>
        </div>
        <button className="dash-refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* KPIs */}
      <div className="dash-kpi-grid">
        <KpiCard title="Total Revenue"   value={`$${fmt(totalRevenue)}`}  icon="💰" color="success" />
        <KpiCard title="Total Expenses"  value={`$${fmt(totalExpenses)}`} icon="📊" color="danger"  />
        <KpiCard title="Net Profit"      value={`$${fmt(netProfit)}`}     icon="📈" color={isProfit ? 'success' : 'danger'} />
        <KpiCard title="Profit Margin"   value={`${parseFloat(profitMargin).toFixed(1)}%`} icon="📉" color={isProfit ? 'success' : 'danger'} />
        <KpiCard title="Avg Rev / Trip"  value={`$${fmt(avgRevPerTrip)}`} icon="🚚" color="primary" />
      </div>

      {/* Net profit banner */}
      {!isProfit && (
        <div className="dash-alerts">
          <div className="dash-alert dash-alert-danger">
            <span className="dash-alert-icon">📉</span>
            <span>Fleet is currently operating at a <strong>net loss of ${fmt(Math.abs(netProfit))}</strong>. Review expenses to improve margins.</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dash-actions-card">
        <p className="dash-actions-title">⚡ Quick Actions</p>
        <div className="dash-action-btns">
          <button className="dash-btn dash-btn-primary" onClick={() => window.location.href = '/expenses'}>📊 View All Expenses</button>
          <button className="dash-btn dash-btn-ghost"   onClick={() => window.location.href = '/expenses'}>➕ Add Expense</button>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">

        {/* Expenses by category */}
        <div className="dash-card dash-col-6">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">💸</span> Expenses by Category</h2>
          </div>
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expenseChartData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => `$${fmt(v)}`} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {expenseChartData.map((_, i) => (
                    <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">💸</span>
              <span className="dash-empty-text">No expense data available</span>
            </div>
          )}
        </div>

        {/* Revenue by vehicle */}
        <div className="dash-card dash-col-6">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🚚</span> Revenue by Vehicle</h2>
            <span className="dash-card-badge">Top 10</span>
          </div>
          {revenueByVehicle.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Trips</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByVehicle.slice(0, 10).map(v => (
                    <tr key={v.vehicle_id}>
                      <td><strong>{v.registration_no}</strong></td>
                      <td>{v.trip_count}</td>
                      <td className="text-profit">${fmt(v.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">🚚</span>
              <span className="dash-empty-text">No revenue data available</span>
            </div>
          )}
        </div>

        {/* Vehicle profitability */}
        <div className="dash-card dash-col-8">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">📈</span> Vehicle Profitability (ROI)</h2>
          </div>
          {vehicleROI.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Net Profit</th>
                    <th>ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleROI.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.registration_no}</strong></td>
                      <td>${fmt(v.total_revenue)}</td>
                      <td>${fmt(v.total_expenses)}</td>
                      <td className={parseFloat(v.net_profit) >= 0 ? 'text-profit' : 'text-loss'}>
                        ${fmt(v.net_profit)}
                      </td>
                      <td className={parseFloat(v.roi_percentage) >= 0 ? 'text-profit' : 'text-loss'}>
                        {v.roi_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">📈</span>
              <span className="dash-empty-text">No profitability data available</span>
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="dash-card dash-col-4">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🧾</span> Recent Expenses</h2>
            <span className="dash-card-badge">Last 10</span>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(e => (
                    <tr key={e.id}>
                      <td>{new Date(e.expense_date).toLocaleDateString()}</td>
                      <td>{e.category}</td>
                      <td className="text-loss">${fmt(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">🧾</span>
              <span className="dash-empty-text">No expenses recorded</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FinancialAnalystDashboard;
