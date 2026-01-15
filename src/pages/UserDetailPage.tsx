import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Target, Trash2 } from 'lucide-react';
import { usersService } from '../services/api';
import { formatDate, formatCurrency } from '../lib/utils';
import { Card, CardHeader, CardBody, Button, Avatar, Badge, LoadingSpinner } from '../components/ui';
import { StatCard } from '../components/dashboard';
import { useAuth } from '../contexts/AuthContext';
import type { User, Transaction } from '../types';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Array<{ _id: string; total: number; count: number }>>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadUserDetails();
    }
  }, [id]);

  const loadUserDetails = async () => {
    try {
      setIsLoading(true);
      const data = await usersService.getUserById(id!);
      setUser(data.user);
      setStats(data.stats);
      setRecentTransactions(data.recentTransactions);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? All their data will be permanently removed.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await usersService.deleteUser(id!);
      navigate('/users');
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Button onClick={() => navigate('/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  const incomeStats = stats.find((s) => s._id === 'income');
  const expenseStats = stats.find((s) => s._id === 'expense');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/users')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Button>

      {/* User Header */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} src={user.profileImage} size="xl" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
            {isSuperAdmin && (
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(incomeStats?.total || 0)}
          subtitle={`${incomeStats?.count || 0} transactions`}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(expenseStats?.total || 0)}
          subtitle={`${expenseStats?.count || 0} transactions`}
          variant="danger"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency((incomeStats?.total || 0) - (expenseStats?.total || 0))}
          variant="info"
        />
        <StatCard
          title="Monthly Budget"
          value={formatCurrency(user.monthlyExpenseBudget)}
          subtitle="expense limit"
          icon={<Target className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      {/* Targets */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">User Targets</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Daily Expense Target</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(user.dailyExpenseTarget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Income Target</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(user.dailyIncomeTarget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Expense Budget</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(user.monthlyExpenseBudget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Income Goal</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(user.monthlyIncomeGoal)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </CardHeader>
        <CardBody className="p-0">
          {recentTransactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.category}
                    </p>
                    {transaction.note && (
                      <p className="text-xs text-gray-500">{transaction.note}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
