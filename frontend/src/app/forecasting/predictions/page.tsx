'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'
import { api } from '@/lib/api'

interface Prediction {
  date: string
  predictedStock: number
  lowerBound: number
  upperBound: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface ProductPrediction {
  productId: string
  productName: string
  productSku: string
  currentStock: number
  minStock: number
  predictions: Prediction[]
  averageDaily: number
  stockoutRisk: number
  restockDate?: string
}

export default function StockPredictionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [predictionData, setPredictionData] = useState<ProductPrediction | null>(null)
  const [forecastDays, setForecastDays] = useState(30)
  const [predicting, setPredicting] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts({ limit: 100 })
      setProducts(data.products || [])
    } catch (err: any) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePrediction = async () => {
    if (!selectedProduct) {
      alert('Please select a product')
      return
    }

    try {
      setPredicting(true)

      // Find selected product
      const product = products.find(p => p.id === selectedProduct)
      if (!product) return

      // Generate mock prediction data (in production, this would call the AI API)
      const predictions: Prediction[] = []
      let currentStock = product.stockQty || 100
      const dailyAverage = Math.random() * 5 + 2 // 2-7 units per day

      for (let i = 0; i < forecastDays; i++) {
        const variance = (Math.random() - 0.5) * dailyAverage * 0.3
        const predicted = Math.max(0, currentStock - (dailyAverage + variance) * (i + 1))

        predictions.push({
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          predictedStock: Math.round(predicted),
          lowerBound: Math.max(0, Math.round(predicted - dailyAverage * 2)),
          upperBound: Math.round(predicted + dailyAverage * 2),
          confidence: 85 + Math.random() * 10,
          trend: predicted > currentStock * 0.8 ? 'stable' : predicted > currentStock * 0.5 ? 'decreasing' : 'decreasing'
        })
      }

      // Calculate stockout risk
      const daysUntilStockout = predictions.findIndex(p => p.predictedStock <= (product.minStock || 10))
      const stockoutRisk = daysUntilStockout > 0
        ? Math.min(100, Math.max(0, 100 - (daysUntilStockout / forecastDays) * 100))
        : 0

      const restockDate = daysUntilStockout > 0
        ? predictions[Math.max(0, daysUntilStockout - 7)]?.date
        : undefined

      setPredictionData({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        currentStock: product.stockQty || 0,
        minStock: product.minStock || 10,
        predictions,
        averageDaily: dailyAverage,
        stockoutRisk,
        restockDate,
      })
    } catch (err: any) {
      alert('Failed to generate prediction: ' + err.message)
    } finally {
      setPredicting(false)
    }
  }

  const getStockoutRiskColor = (risk: number) => {
    if (risk > 70) return 'text-red-600'
    if (risk > 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStockoutRiskBg = (risk: number) => {
    if (risk > 70) return 'bg-red-100 border-red-500'
    if (risk > 40) return 'bg-yellow-100 border-yellow-500'
    return 'bg-green-100 border-green-500'
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Predictions</h1>
            <p className="text-gray-600 mt-1">AI-powered stock level predictions</p>
            <p className="text-sm text-gray-500">ทำนายระดับสต็อกด้วย AI</p>
          </div>
        </div>

        {/* Prediction Form */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Stock Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="select"
                disabled={loading}
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - Stock: {product.stockQty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Period
              </label>
              <select
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="select"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={generatePrediction}
                disabled={!selectedProduct || predicting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {predicting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Generate Forecast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Prediction Results */}
        {predictionData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                    <p className="text-3xl font-bold text-gray-900">{predictionData.currentStock}</p>
                    <p className="text-xs text-gray-500 mt-1">units</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>

              <div className="card p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Daily Usage</p>
                    <p className="text-3xl font-bold text-gray-900">{predictionData.averageDaily.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">units/day</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className={`card p-6 border-l-4 ${getStockoutRiskBg(predictionData.stockoutRisk)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stockout Risk</p>
                    <p className={`text-3xl font-bold ${getStockoutRiskColor(predictionData.stockoutRisk)}`}>
                      {predictionData.stockoutRisk.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {predictionData.stockoutRisk > 70 ? 'High risk' : predictionData.stockoutRisk > 40 ? 'Medium risk' : 'Low risk'}
                    </p>
                  </div>
                  <div className="text-4xl">
                    {predictionData.stockoutRisk > 70 ? '🚨' : predictionData.stockoutRisk > 40 ? '⚠️' : '✅'}
                  </div>
                </div>
              </div>

              <div className="card p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Restock By</p>
                    <p className="text-lg font-bold text-gray-900">
                      {predictionData.restockDate
                        ? new Date(predictionData.restockDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {predictionData.restockDate ? 'recommended' : 'stock sufficient'}
                    </p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="card p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Forecast for: {predictionData.productName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-mono bg-gray-100 px-3 py-1 rounded">SKU: {predictionData.productSku}</span>
                <span>•</span>
                <span>Min Stock Level: {predictionData.minStock} units</span>
                <span>•</span>
                <span>Forecast Period: {forecastDays} days</span>
              </div>
            </div>

            {/* Prediction Chart */}
            <div className="card p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Level Forecast</h3>
              <div className="space-y-2">
                {predictionData.predictions.filter((_, index) => index % Math.ceil(forecastDays / 15) === 0).map((prediction, index) => {
                  const percentage = (prediction.predictedStock / predictionData.currentStock) * 100
                  const isBelowMin = prediction.predictedStock <= predictionData.minStock

                  return (
                    <div key={prediction.date} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-gray-600">
                        {new Date(prediction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                            <div
                              className={`h-full flex items-center justify-end px-3 transition-all ${
                                isBelowMin ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
                            >
                              <span className="text-white text-xs font-semibold">
                                {prediction.predictedStock} units
                              </span>
                            </div>
                          </div>
                          {/* Min stock line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
                            style={{ left: `${(predictionData.minStock / predictionData.currentStock) * 100}%` }}
                            title={`Min stock: ${predictionData.minStock}`}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Confidence: {prediction.confidence.toFixed(0)}%</span>
                          <span className="capitalize">{prediction.trend}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Normal Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Below Min Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-yellow-500"></div>
                  <span>Minimum Stock Threshold</span>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Predictions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Predicted Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Range</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {predictionData.predictions.map((prediction) => {
                      const isBelowMin = prediction.predictedStock <= predictionData.minStock

                      return (
                        <tr key={prediction.date} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">
                              {new Date(prediction.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-lg font-bold ${isBelowMin ? 'text-red-600' : 'text-gray-900'}`}>
                              {prediction.predictedStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {prediction.lowerBound} - {prediction.upperBound}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${prediction.confidence}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12">
                                {prediction.confidence.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`badge capitalize ${
                              prediction.trend === 'increasing' ? 'badge-green' :
                              prediction.trend === 'decreasing' ? 'badge-red' :
                              'badge-gray'
                            }`}>
                              {prediction.trend}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isBelowMin ? (
                              <span className="badge badge-red">⚠️ Low Stock</span>
                            ) : (
                              <span className="badge badge-green">✓ Normal</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!predictionData && !predicting && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔮</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generate Your First Forecast
            </h3>
            <p className="text-gray-600">
              Select a product and forecast period above to see AI-powered stock predictions
            </p>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
