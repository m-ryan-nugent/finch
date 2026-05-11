import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useCategories } from '../hooks/useCategories';
import Badge from '../components/Badge';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate, formatAccountType, isOverdue } from '../utils/format';
import { ASSET_TYPES } from '../types/enums';

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    if (!categories) return new Map<number, string>();
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const chartData = useMemo(() => {
    if (!data?.budget_vs_actual) return [];
    return data.budget_vs_actual.map((b) => ({
      name: categoryMap.get(b.category_id) ?? `Category ${b.category_id}`,
      Budget: parseFloat(b.amount),
      Actual: parseFloat(b.actual_spent),
    }));
  }, [data?.budget_vs_actual, categoryMap]);

  const assetAccounts = useMemo(
    () => data?.accounts.filter((a) => ASSET_TYPES.includes(a.type)) ?? [],
    [data?.accounts],
  );

  const liabilityAccounts = useMemo(
    () => data?.accounts.filter((a) => !ASSET_TYPES.includes(a.type)) ?? [],
    [data?.accounts],
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600 text-sm py-8 text-center">{error.message}</p>;
  if (!data) return null;

  const netValue = parseFloat(data.month_summary.net);

  return (
    <div className="space-y-6">
      {/* Net Worth */}
      <Card>
        <p className="text-sm font-medium text-gray-500">Net Worth</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(data.net_worth)}</p>
        <div className="flex gap-6 mt-3 text-sm">
          <span className="text-gray-500">
            Assets: <span className="font-medium text-gray-900">{formatCurrency(data.total_assets)}</span>
          </span>
          <span className="text-gray-500">
            Liabilities: <span className="font-medium text-gray-900">{formatCurrency(data.total_liabilities)}</span>
          </span>
        </div>
      </Card>

      {/* Accounts */}
      {assetAccounts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Assets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetAccounts.map((account) => (
              <Card key={account.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    {account.institution && (
                      <p className="text-xs text-gray-500 mt-0.5">{account.institution}</p>
                    )}
                  </div>
                  <Badge variant="neutral">{formatAccountType(account.type)}</Badge>
                </div>
                <p className="text-xl font-semibold text-gray-900 mt-3">
                  {formatCurrency(account.balance)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {liabilityAccounts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Liabilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liabilityAccounts.map((account) => (
              <Card key={account.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    {account.institution && (
                      <p className="text-xs text-gray-500 mt-0.5">{account.institution}</p>
                    )}
                  </div>
                  <Badge variant="neutral">{formatAccountType(account.type)}</Badge>
                </div>
                <p className="text-xl font-semibold text-gray-900 mt-3">
                  {formatCurrency(account.balance)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          This Month
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Income</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(data.month_summary.total_income)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(data.month_summary.total_expenses)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Net</p>
            <p
              className={`text-lg font-semibold ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(data.month_summary.net)}
            </p>
          </div>
        </div>
      </Card>

      {/* Budget vs Actual Chart */}
      {chartData.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Budget vs Actual
          </h2>
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 50, 200)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v: number) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Budget" fill="#d1d5db" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Actual" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Recent Transactions
          </h2>
          <Link to="/transactions" className="text-sm text-teal-600 hover:text-teal-700">
            View all
          </Link>
        </div>
        {data.recent_transactions.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recent_transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {txn.description || '(no description)'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {txn.is_pending && <Badge variant="warning">Pending</Badge>}
                  <span
                    className={`text-sm font-medium ${
                      txn.type === 'income'
                        ? 'text-green-600'
                        : txn.type === 'expense'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Recurring */}
      {data.upcoming_recurring.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Upcoming (Next 7 Days)
            </h2>
            <Link to="/recurring" className="text-sm text-teal-600 hover:text-teal-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.upcoming_recurring.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formatDate(item.next_due_date)}</span>
                    {isOverdue(item.next_due_date) && <Badge variant="danger">Overdue</Badge>}
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    item.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
