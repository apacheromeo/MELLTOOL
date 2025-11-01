'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function ForecastingPage() {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [prediction, setPrediction] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [insightsData, alertsData, productsData] = await Promise.all([
        api.getForecastingInsights(),
        api.getLowStockAlerts(),
        api.getProducts({ limit: 100 }),
      ])
      setInsights(insightsData)
      setAlerts(alertsData)
      setProducts(productsData.products || [])
    } catch (err) {
      console.error('Failed to load forecasting data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePredictStock = async () => {
    if (!selectedProduct) return
    
    try {
      const data = await api.getStockPrediction(selectedProduct, 30)
      setPrediction(data)
    } catch (err: any) {
      alert('Failed to get prediction: ' + err.message)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Forecasting</h1>
              <p className="text-gray-600 mt-1">Smart predictions powered by machine learning</p>
            </div>
            <button onClick={loadData} className="btn-secondary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="metric-card border-red-500">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{alerts.length}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Low Stock Alerts</div>
                <div className="text-xs text-gray-600">Items need attention</div>
              </div>

              <div className="metric-card border-green-500">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{insights?.averageAccuracy || 0}%</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Forecast Accuracy</div>
                <div className="text-xs text-gray-600">Last 30 days</div>
              </div>

              <div className="metric-card border-yellow-500">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{insights?.predictedStockouts || 0}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Predicted Stockouts</div>
                <div className="text-xs text-gray-600">Next 7 days</div>
              </div>
            </div>

            {/* Stock Prediction Tool */}
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Prediction Tool</h2>
              <p className="text-gray-600 mb-6">
                Select a product to see AI-powered stock predictions for the next 30 days
              </p>
              <div className="flex gap-4 mb-6">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="select flex-1"
                >
                  <option value="">Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handlePredictStock}
                  disabled={!selectedProduct}
                  className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Predict
                </button>
              </div>

              {/* Prediction Results */}
              {prediction && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-4">Prediction Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Current Stock</p>
                      <p className="text-4xl font-bold text-gray-900">{prediction.currentStock}</p>
                      <p className="text-xs text-gray-600 mt-1">units</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Predicted in 30 days</p>
                      <p className="text-4xl font-bold text-blue-600">{prediction.predictedStock}</p>
                      <p className="text-xs text-gray-600 mt-1">units</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Trend</p>
                      <p className="text-4xl font-bold">
                        {prediction.trend > 0 ? (
                          <span className="text-green-600">↗ {Math.abs(prediction.trend).toFixed(1)}%</span>
                        ) : prediction.trend < 0 ? (
                          <span className="text-red-600">↘ {Math.abs(prediction.trend).toFixed(1)}%</span>
                        ) : (
                          <span className="text-yellow-600">→ 0%</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {prediction.recommendation && (
                    <div className="mt-6 p-4 bg-white border border-blue-300 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Recommendation:</p>
                      <p className="text-sm text-gray-700">{prediction.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            {alerts.length > 0 && (
              <div className="card p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Low Stock Alerts</h2>
                <div className="space-y-3">
                  {alerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{alert.product?.name}</div>
                          <div className="text-sm text-gray-700">
                            Current: <span className="font-semibold text-red-600">{alert.currentStock}</span> units • 
                            Min: <span className="font-semibold text-gray-900">{alert.product?.minStock}</span> units
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${
                            alert.severity === 'CRITICAL' ? 'badge-red' : 'badge-yellow'
                          }`}>
                            {alert.severity === 'CRITICAL' ? '🔴 Critical' : '🟡 Warning'}
                          </span>
                          <div className="text-xs text-gray-600 mt-2">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
