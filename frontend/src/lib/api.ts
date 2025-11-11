// API Client for backend communication

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
console.log('🔧 API URL configured:', API_URL);

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Try to get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Dashboard endpoints
  async getDashboardOverview() {
    return this.request('/dashboard/overview');
  }

  async getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  async getRecentActivities() {
    return this.request('/dashboard/recent-activities');
  }

  // Inventory endpoints
  async getProducts(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/inventory/products?${query}`);
  }

  async getProduct(id: string) {
    return this.request(`/inventory/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/inventory/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/inventory/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/inventory/products/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadProductImage(productId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${this.baseURL}/inventory/products/${productId}/image`,
      {
        method: 'POST',
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getCategories() {
    return this.request('/inventory/categories');
  }

  async getBrands() {
    return this.request('/inventory/brands');
  }

  // Product Import endpoints
  async importProducts(file: File, options?: { updateExisting?: boolean; skipErrors?: boolean }) {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (options?.updateExisting) queryParams.append('updateExisting', 'true');
    if (options?.skipErrors === false) queryParams.append('skipErrors', 'false');

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${this.baseURL}/inventory/products/import?${queryParams.toString()}`,
      {
        method: 'POST',
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Import failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async downloadImportTemplate() {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      console.warn('No auth token found for template download');
    }

    const url = `${this.baseURL}/inventory/products/import/template`;
    console.log('Downloading template from:', url);
    console.log('Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Check response status
      if (!response.ok) {
        // Try to get error message
        let errorMessage = `Failed to download template (${response.status})`;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorJson = await response.json();
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText) {
              try {
                const parsed = JSON.parse(errorText);
                errorMessage = parsed.message || parsed.error || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }
            }
          }
        } catch (parseError) {
          // Use default error message
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty or invalid');
      }

      // Check if response is actually an Excel file (should be application/vnd.openxmlformats...)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('spreadsheet') && !contentType.includes('excel') && !contentType.includes('octet-stream')) {
        // Might be an error JSON instead of file
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || json.error || 'Server returned an error instead of file');
        } catch {
          // Not JSON, continue with download
        }
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'product-import-template.xlsx';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      console.error('Template download error:', error);
      throw new Error(error.message || 'Failed to download template');
    }
  }

  // Forecasting endpoints
  async getStockPrediction(productId: string, days: number = 30) {
    return this.request(`/forecasting/predict/${productId}?days=${days}`);
  }

  async getPromotionForecast(data: {
    promotionDate: string;
    promotionType: string;
    expectedMultiplier?: number;
  }) {
    return this.request('/forecasting/promotion/forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPromotionTemplates() {
    return this.request('/forecasting/promotion/templates');
  }

  async getReorderPoint(productId: string) {
    return this.request(`/forecasting/reorder-point/${productId}`);
  }

  async getForecastingInsights() {
    return this.request('/forecasting/insights/dashboard');
  }

  async getLowStockAlerts() {
    return this.request('/forecasting/alerts/low-stock');
  }

  // Stock-in endpoints
  async getStockIns(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/stock-in?${query}`);
  }

  async createStockIn(data: any) {
    return this.request('/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async receiveStockIn(id: string) {
    return this.request(`/stock-in/${id}/receive`, {
      method: 'POST',
    });
  }

  // Shopee endpoints
  async getShopeeShops() {
    return this.request('/shopee/shops');
  }

  async syncShopeeCatalog(shopId: string) {
    return this.request(`/shopee/shops/${shopId}/sync/catalog`, {
      method: 'POST',
    });
  }

  async syncShopeeStock(shopId: string) {
    return this.request(`/shopee/shops/${shopId}/sync/stock`, {
      method: 'POST',
    });
  }

  // Print endpoints
  async createPrintJob(productIds: string[], copiesPerProduct: number = 1) {
    return this.request('/print/barcode', {
      method: 'POST',
      body: JSON.stringify({ productIds, copiesPerProduct }),
    });
  }

  async getPrintJobs() {
    return this.request('/print/jobs');
  }

  // Sales / POS endpoints
  async startSale(data?: {
    orderNumber?: string;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) {
    return this.request('/sales/start', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async addItemToSale(data: {
    orderId: string;
    sku: string;
    quantity?: number;
    unitPrice?: number;
  }) {
    return this.request('/sales/add-item', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanBarcode(orderId: string, barcodeValue: string) {
    return this.request('/sales/scan', {
      method: 'POST',
      body: JSON.stringify({ orderId, barcodeValue }),
    });
  }

  async addProductToSale(orderId: string, productId: string, quantity: number = 1) {
    // First get the product to get its SKU
    const product = await this.getProduct(productId);
    // Then add it by SKU
    return this.addItemToSale({
      orderId,
      sku: product.sku,
      quantity,
    });
  }

  async updateSalesItem(itemId: string, data: {
    quantity?: number;
    unitPrice?: number;
  }) {
    return this.request('/sales/item', {
      method: 'PATCH',
      body: JSON.stringify({ itemId, ...data }),
    });
  }

  async removeSalesItem(itemId: string) {
    return this.request(`/sales/item/${itemId}`, {
      method: 'DELETE',
    });
  }

  async confirmSale(data: {
    orderId: string;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
  }) {
    return this.request('/sales/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelSale(orderId: string) {
    return this.request(`/sales/${orderId}/cancel`, {
      method: 'POST',
    });
  }

  async getSalesOrder(orderId: string) {
    return this.request(`/sales/${orderId}`);
  }

  async getSalesOrderByNumber(orderNumber: string) {
    return this.request(`/sales/by-order-number/${orderNumber}`);
  }

  async getSalesHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sales?${query}`);
  }

  async getDailySalesReport(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request(`/sales/report/daily${query}`);
  }

  // ============================================
  // ACCOUNTING METHODS
  // ============================================

  async getAccountingOverview() {
    return this.request('/accounting/overview');
  }

  async getExpenseCategories() {
    return this.request('/accounting/categories');
  }

  async getPaymentMethods() {
    return this.request('/accounting/payment-methods');
  }

  async getExpenses(params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/accounting/expenses?${query}`);
  }

  async getExpense(id: string) {
    return this.request(`/accounting/expenses/${id}`);
  }

  async createExpense(data: any) {
    return this.request('/accounting/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: any) {
    return this.request(`/accounting/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request(`/accounting/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getProfitLossReport(params?: { year?: number; month?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/accounting/reports/profit-loss?${query}`);
  }

  async getCashFlowReport(params?: { year?: number; month?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/accounting/reports/cash-flow?${query}`);
  }
}

export const api = new ApiClient(API_URL);
export default api;
