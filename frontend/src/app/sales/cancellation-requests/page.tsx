'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { useRoleGuard } from '@/hooks/useRoleGuard'

interface CancellationRequest {
  id: string
  reason: string
  approvalStatus: string
  createdAt: string
  approvedAt?: string
  rejectionReason?: string
  order: {
    id: string
    orderNumber: string
    status: string
    totalPrice: number
    createdAt: string
    staff: {
      name: string
      email: string
    }
    items: Array<{
      productName: string
      quantity: number
      unitPrice: number
    }>
  }
  requestedBy: {
    name: string
    email: string
  }
  approvedBy?: {
    name: string
    email: string
  }
}

export default function CancellationRequestsPage() {
  useRoleGuard(['OWNER', 'MOD'])
  const [requests, setRequests] = useState<CancellationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('PENDING_APPROVAL')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getCancellationRequests(filter)
      setRequests(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load cancellation requests')
      console.error('Cancellation requests error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      await api.approveCancellationRequest(selectedRequest.id)
      setShowApproveModal(false)
      setSelectedRequest(null)
      await loadRequests()
      alert('Cancellation request approved successfully')
    } catch (err: any) {
      alert(err.message || 'Failed to approve request')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      await api.rejectCancellationRequest(selectedRequest.id, rejectionReason)
      setShowRejectModal(false)
      setSelectedRequest(null)
      setRejectionReason('')
      await loadRequests()
      alert('Cancellation request rejected')
    } catch (err: any) {
      alert(err.message || 'Failed to reject request')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cancellation Requests</h1>
              <p className="text-gray-600 mt-1">Review and manage order cancellation requests</p>
            </div>
            <button
              onClick={loadRequests}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('PENDING_APPROVAL')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'PENDING_APPROVAL'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'APPROVED'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'REJECTED'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
        </div>

        {loading && (
          <div className="card p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="card p-6 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Requests</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="card p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No cancellation requests found</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Order #{request.order.orderNumber}
                        </h3>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.approvalStatus)}`}>
                          {request.approvalStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested by: <span className="font-medium">{request.requestedBy.name}</span> ({request.requestedBy.email})
                      </p>
                      <p className="text-sm text-gray-600">
                        Order created by: <span className="font-medium">{request.order.staff.name}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Request date: {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ฿{request.order.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{request.order.items.length} items</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Cancellation Reason:</p>
                    <p className="text-gray-900">{request.reason}</p>
                  </div>

                  {request.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Rejection Reason:</p>
                      <p className="text-gray-900">{request.rejectionReason}</p>
                      {request.approvedBy && (
                        <p className="text-sm text-gray-600 mt-2">
                          Rejected by: {request.approvedBy.name} on {formatDate(request.approvedAt!)}
                        </p>
                      )}
                    </div>
                  )}

                  {request.approvalStatus === 'APPROVED' && request.approvedBy && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600">
                        Approved by: <span className="font-medium">{request.approvedBy.name}</span> on {formatDate(request.approvedAt!)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/sales/${request.order.id}`)}
                      className="btn-secondary flex-1"
                    >
                      View Order Details
                    </button>
                    {request.approvalStatus === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowApproveModal(true)
                          }}
                          className="btn-primary flex-1"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowRejectModal(true)
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex-1"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Cancellation</h2>
              <p className="text-gray-700 mb-2">
                Are you sure you want to approve this cancellation request?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Order #{selectedRequest.order.orderNumber} will be canceled and stock will be restored.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false)
                    setSelectedRequest(null)
                  }}
                  disabled={processing}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="btn-primary flex-1"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Cancellation</h2>
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejecting this cancellation request:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="input w-full h-24 mb-6"
                disabled={processing}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedRequest(null)
                    setRejectionReason('')
                  }}
                  disabled={processing}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
