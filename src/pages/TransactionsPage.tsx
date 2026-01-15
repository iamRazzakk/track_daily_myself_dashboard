import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { transactionsService } from "../services/api";
import { formatDate, formatCurrency } from "../lib/utils";
import {
  Card,
  CardBody,
  Button,
  Input,
  // 
  Badge,
  Pagination,
  LoadingSpinner,
  EmptyState,
} from "../components/ui";
import type { Transaction } from "../types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    type: "" as "" | "income" | "expense",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await transactionsService.getTransactions({
        page: pagination.page,
        limit: pagination.limit,
        type: filters.type || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minAmount: filters.minAmount
          ? parseFloat(filters.minAmount)
          : undefined,
        maxAmount: filters.maxAmount
          ? parseFloat(filters.maxAmount)
          : undefined,
      });
      setTransactions(data.transactions);
      setPagination((prev) => ({
        ...prev,
        ...data.pagination,
      }));
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const getUserInfo = (userId: Transaction["userId"]) => {
    if (typeof userId === "object" && userId !== null) {
      return { name: userId.name, email: userId.email };
    }
    return { name: "Unknown", email: userId as string };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            All Transactions
          </h2>
          <p className="text-sm text-gray-500">
            {pagination.total.toLocaleString()} total transactions
          </p>
        </div>
        <Button
          variant={showFilters ? "primary" : "secondary"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-200 text-primary-800 rounded-full">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="animate-slide-in">
          <CardBody>
            <form onSubmit={handleFilter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: e.target.value as "" | "income" | "expense",
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <Input
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
                <Input
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  label="Min Amount"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minAmount: e.target.value,
                    }))
                  }
                />
                <Input
                  type="number"
                  label="Max Amount"
                  placeholder="10000"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxAmount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<Search className="w-12 h-12" />}
              title="No transactions found"
              description="Try adjusting your filters"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Note
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction) => {
                    const userInfo = getUserInfo(transaction.userId);
                    return (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {transaction.type === "income" ? (
                              <div className="p-1.5 rounded-full bg-green-100">
                                <ArrowUpRight className="w-4 h-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-full bg-red-100">
                                <ArrowDownRight className="w-4 h-4 text-red-600" />
                              </div>
                            )}
                            <Badge
                              variant={
                                transaction.type === "income"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {userInfo.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {userInfo.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-semibold ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 truncate max-w-xs block">
                            {transaction.note || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
