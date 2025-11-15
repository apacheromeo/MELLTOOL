'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [expensesData, categoriesData, paymentMethodsData] = await Promise.all([
        api.getExpenses({ status: filter === 'ALL' ? undefined : filter }),
        api.getExpenseCategories(),
        api.getPaymentMethods(),
      ])
      setExpenses(expensesData.expenses || [])
      setCategories(categoriesData.categories || [])
      setPaymentMethods(paymentMethodsData.paymentMethods || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses')
      console.error('Expenses error:', err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await api.deleteExpense(id)
      loadData()
    } catch (err: any) {
      alert('Failed to delete expense: ' + err.message)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-600 mt-1">Track and manage all business expenses</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card p-6 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-900 font-medium">{error}</p>
              </div>
              <button onClick={loadData} className="btn-secondary">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Expenses List */}
        {!loading && expenses.length > 0 && (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && expenses.length === 0 && (
          <div className="text-center py-20">
            <div className="card max-w-2xl mx-auto p-12">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {filter === 'ALL' ? 'No expenses yet' : `No ${filter.toLowerCase()} expenses`}
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                {filter === 'ALL' ? 'Start tracking your business expenses' : 'Try a different filter'}
              </p>
              {filter === 'ALL' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Expense
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ExpenseCard({ expense, onDelete }: any) {
  return (
    <div className="card p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md"
              style={{ backgroundColor: `${expense.category.color}20` }}
            >
              {expense.category.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{expense.title}</h3>
              <p className="text-sm text-gray-600">{expense.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Category</div>
              <div className="text-sm font-medium text-gray-900">{expense.category.name}</div>
              <div className="text-xs text-gray-500">{expense.category.nameTh}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Payment Method</div>
              <div className="text-sm font-medium text-gray-900">{expense.paymentMethod.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Vendor</div>
              <div className="text-sm font-medium text-gray-900">{expense.vendor || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Date</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(expense.expenseDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {expense.invoiceNumber && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-block">
              <span className="text-xs text-gray-600">Invoice: </span>
              <span className="text-sm font-mono font-semibold text-gray-900">{expense.invoiceNumber}</span>
            </div>
          )}
        </div>

        <div className="text-right ml-6">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ฿{expense.amount.toLocaleString()}
          </div>
          <span className={`badge ${
            expense.status === 'PAID' ? 'badge-green' :
            expense.status === 'APPROVED' ? 'badge-blue' :
            expense.status === 'PENDING' ? 'badge-yellow' :
            'badge-red'
          }`}>
            {expense.status}
          </span>
          <div className="flex gap-2 mt-4">
            <button className="btn-secondary text-sm px-3 py-1">
              Edit
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className="btn-danger text-sm px-3 py-1"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

