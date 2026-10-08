import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import './FinancialAnalystDashboard.css';

const fmt = (n) =>
  n === undefined || n === null
    ? '—'
    : parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FinancialAnalystDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getDashboardMetrics();
      setData(result);
    } catch (err) {
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading financial dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={load} className="btn-retry">Retry</button>
      </div>
    );
  }

  const { financial } = data;

  if (!financial) {
    return (
      <div className="dashboard-error">
        <p>No financial data available</p>
      </div>
    );
  }

  const { 
    totalRevenue, 
    totalExpenses, 
    netProfit, 
    profitMargin,
    avgRevenuePerTrip,
    expensesByCategory,
    revenueByVehicle,
    vehicleROI,
    recentExpenses,
    monthlyProfitability 
  } = financial;

  // Format expense chart data
  const expenseChartData = (expensesByCategory || []).map((cat) => ({
    name: cat.category,
    amount: parseFloat(cat.total),
  })).sort((a, b) => b.amount - a.amount);

  // Format monthly profitability data
  const profitabilityData = [...(monthlyProfitability || [])].reverse().map((m) => ({
    name: new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: parseFloat(m.revenue),
    expenses: parseFloat(m.expenses),
  }));

  return (
    <div className="financial-analyst-dashboard">
      <div className="dashboard-header">
        <h1>Financial Analyst Dashboard</h1>
        <p className="dashboard-subtitle">Financial performance and expense analysis</p>
      </div>

      {/* Financial KPIs */}
      <div className="kpi-grid">
        <KpiCard title="Total Revenue" value={`$${fmt(totalRevenue)}`} icon="💰" color="success" />
        <KpiCard title="Total Expenses" value={`$${fmt(totalExpenses)}`} icon="📊" color="danger" />
        <KpiCard title="Net Profit" value={`$${fmt(netProfit)}`} icon="📈" color={netProfit >= 0 ? 'success' : 'danger'} />
        <KpiCard title="Profit Margin" value={`${profitMargin || 0}%`} icon="📉" color={profitMargin >= 0 ? 'success' : 'danger'} />
        <KpiCard title="Avg Revenue/Trip" value={`$${fmt(avgRevenuePerTrip)}`} icon="🚚" color="primary" />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => window.location.href = '/expenses'}>
            📊 View All Expenses
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/expenses'}>
            ➕ Add Expense
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Expenses by Category */}
        <div className="dash-card">
          <h2>Expenses by Category</h2>
          {expenseChartData && expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseChartData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => `$${fmt(value)}`} />
                <Bar dataKey="amount" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No expense data available</p>
          )}
        </div>

        {/* Monthly Profitability Trend */}
        <div className="dash-card wide">
          <h2>Monthly Profitability Trend</h2>
          {profitabilityData && profitabilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitabilityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${fmt(value)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No profitability data available</p>
          )}
        </div>

        {/* Revenue by Vehicle */}
        <div className="dash-card">
          <h2>Revenue by Vehicle (Top 10)</h2>
          {revenueByVehicle && revenueByVehicle.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Trips</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByVehicle.slice(0, 10).map((vehicle) => (
                    <tr key={vehicle.vehicle_id}>
                      <td>{vehicle.registration_no}</td>
                      <td>{vehicle.trip_count}</td>
                      <td>${fmt(vehicle.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No revenue data available</p>
          )}
        </div>

        {/* Vehicle Profitability (ROI) */}
        <div className="dash-card wide">
          <h2>Vehicle Profitability Analysis</h2>
          {vehicleROI && vehicleROI.length > 0 ? (
            <div className="dash-table-container">
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
                  {vehicleROI.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.registration_no}</td>
                      <td>${fmt(vehicle.total_revenue)}</td>
                      <td>${fmt(vehicle.total_expenses)}</td>
                      <td className={parseFloat(vehicle.net_profit) >= 0 ? 'profit-positive' : 'profit-negative'}>
                        ${fmt(vehicle.net_profit)}
                      </td>
                      <td className={parseFloat(vehicle.roi_percentage) >= 0 ? 'profit-positive' : 'profit-negative'}>
                        {vehicle.roi_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No profitability data available</p>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="dash-card wide">
          <h2>Recent Expenses (Last 10)</h2>
          {recentExpenses && recentExpenses.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td>{expense.category}</td>
                      <td>{expense.description || '—'}</td>
                      <td>${fmt(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No expenses recorded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalystDashboard;
