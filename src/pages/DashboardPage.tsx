import { useState, useEffect } from 'react';
import { Users, Receipt, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { statsService } from '../services/api';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  StatCard,
  RecentUsersCard,
  TransactionChart,
  UserRegistrationChart,
  CategoryChart,
} from '../components/dashboard';
import { LoadingSpinner, Button } from '../components/ui';
import type { OverviewStats, ChartData } from '../types';

type ChartPeriod = '7d' | '30d' | '90d';

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartPeriod]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [overviewData, charts] = await Promise.all([
        statsService.getOverview(),
        statsService.getCharts(chartPeriod),
      ]);
      setStats(overviewData);
      setChartData(charts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const charts = await statsService.getCharts(chartPeriod);
      setChartData(charts);
    } catch (err) {
      console.error('Failed to load chart data:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadDashboardData}>Retry</Button>
      </div>
    );
  }

  if (!stats) return null;

  const periodLabels: Record<ChartPeriod, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.users.total)}
          subtitle={`+${stats.users.today} today`}
          icon={<Users className="w-6 h-6" />}
          variant="info"
        />
        <StatCard
          title="Total Transactions"
          value={formatNumber(stats.transactions.total)}
          subtitle={`${stats.transactions.today} today`}
          icon={<Receipt className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(stats.financials.totalIncome)}
          subtitle={`${formatNumber(stats.financials.incomeCount)} transactions`}
          icon={<ArrowUpRight className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.financials.totalExpense)}
          subtitle={`${formatNumber(stats.financials.expenseCount)} transactions`}
          icon={<ArrowDownRight className="w-6 h-6" />}
          variant="danger"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Net Balance"
          value={formatCurrency(stats.financials.netBalance)}
          icon={<DollarSign className="w-6 h-6" />}
          variant={stats.financials.netBalance >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="This Week"
          value={formatNumber(stats.transactions.thisWeek)}
          subtitle="transactions"
          icon={<TrendingUp className="w-6 h-6" />}
          variant="info"
        />
        <StatCard
          title="This Month"
          value={formatNumber(stats.transactions.thisMonth)}
          subtitle="transactions"
          icon={<Receipt className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      {/* Chart Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Period:</span>
        {(['7d', '30d', '90d'] as ChartPeriod[]).map((period) => (
          <Button
            key={period}
            variant={chartPeriod === period ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setChartPeriod(period)}
          >
            {periodLabels[period]}
          </Button>
        ))}
      </div>

      {/* Charts Grid */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionChart
            data={chartData.transactionVolume}
            period={periodLabels[chartPeriod]}
          />
          <UserRegistrationChart data={chartData.userRegistrations} />
        </div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData && <CategoryChart data={chartData.categoryDistribution} />}
        <RecentUsersCard users={stats.recentUsers} />
      </div>
    </div>
  );
}
