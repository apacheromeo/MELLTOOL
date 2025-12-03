-- ============================================
-- MELLTOOL Row Level Security (RLS) Policies
-- ============================================
-- This migration enables RLS on all tables and creates appropriate policies
-- based on user roles: OWNER, MOD, STAFF
--
-- Security Model:
-- - OWNER: Full access to everything
-- - MOD: Full operational access, limited admin access
-- - STAFF: Limited operational access, no sensitive data
-- ============================================

-- Create a helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.user_role', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to get current user's id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- OWNER and MOD can view all users
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR id = get_current_user_id()
  );

-- Only OWNER can insert new users
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (get_user_role() = 'OWNER');

-- OWNER can update all users, users can update themselves
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (
    get_user_role() = 'OWNER'
    OR id = get_current_user_id()
  );

-- Only OWNER can delete users
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- CATEGORIES TABLE
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view categories
CREATE POLICY categories_select_policy ON categories
  FOR SELECT
  USING (true);

-- OWNER and MOD can insert categories
CREATE POLICY categories_insert_policy ON categories
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can update categories
CREATE POLICY categories_update_policy ON categories
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete categories
CREATE POLICY categories_delete_policy ON categories
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- BRANDS TABLE
-- ============================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view brands
CREATE POLICY brands_select_policy ON brands
  FOR SELECT
  USING (true);

-- OWNER and MOD can insert brands
CREATE POLICY brands_insert_policy ON brands
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can update brands
CREATE POLICY brands_update_policy ON brands
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete brands
CREATE POLICY brands_delete_policy ON brands
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- PRODUCTS TABLE
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view products
CREATE POLICY products_select_policy ON products
  FOR SELECT
  USING (true);

-- OWNER and MOD can insert products
CREATE POLICY products_insert_policy ON products
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can update products
CREATE POLICY products_update_policy ON products
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete products
CREATE POLICY products_delete_policy ON products
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- PRODUCT COMPATIBILITIES TABLE
-- ============================================
ALTER TABLE product_compatibilities ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view compatibilities
CREATE POLICY product_compatibilities_select_policy ON product_compatibilities
  FOR SELECT
  USING (true);

-- OWNER and MOD can insert compatibilities
CREATE POLICY product_compatibilities_insert_policy ON product_compatibilities
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can update compatibilities
CREATE POLICY product_compatibilities_update_policy ON product_compatibilities
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can delete compatibilities
CREATE POLICY product_compatibilities_delete_policy ON product_compatibilities
  FOR DELETE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- ============================================
-- STOCK INS TABLE
-- ============================================
ALTER TABLE stock_ins ENABLE ROW LEVEL SECURITY;

-- All users can view stock ins
CREATE POLICY stock_ins_select_policy ON stock_ins
  FOR SELECT
  USING (true);

-- All users can create stock ins
CREATE POLICY stock_ins_insert_policy ON stock_ins
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own stock ins if pending, OWNER/MOD can update all
CREATE POLICY stock_ins_update_policy ON stock_ins
  FOR UPDATE
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR ("userId" = get_current_user_id() AND status = 'PENDING')
  );

-- Only OWNER can delete stock ins
CREATE POLICY stock_ins_delete_policy ON stock_ins
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- STOCK IN ITEMS TABLE
-- ============================================
ALTER TABLE stock_in_items ENABLE ROW LEVEL SECURITY;

-- All users can view stock in items
CREATE POLICY stock_in_items_select_policy ON stock_in_items
  FOR SELECT
  USING (true);

-- All users can insert stock in items
CREATE POLICY stock_in_items_insert_policy ON stock_in_items
  FOR INSERT
  WITH CHECK (true);

-- OWNER and MOD can update stock in items
CREATE POLICY stock_in_items_update_policy ON stock_in_items
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can delete stock in items
CREATE POLICY stock_in_items_delete_policy ON stock_in_items
  FOR DELETE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- ============================================
-- STOCK ADJUSTMENTS TABLE
-- ============================================
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- All users can view stock adjustments
CREATE POLICY stock_adjustments_select_policy ON stock_adjustments
  FOR SELECT
  USING (true);

-- OWNER and MOD can create adjustments
CREATE POLICY stock_adjustments_insert_policy ON stock_adjustments
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can update adjustments
CREATE POLICY stock_adjustments_update_policy ON stock_adjustments
  FOR UPDATE
  USING (get_user_role() = 'OWNER');

-- Only OWNER can delete adjustments
CREATE POLICY stock_adjustments_delete_policy ON stock_adjustments
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- SALES ORDERS TABLE
-- ============================================
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- STAFF can view their own orders, OWNER/MOD can view all
CREATE POLICY sales_orders_select_policy ON sales_orders
  FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR "staffId" = get_current_user_id()
  );

-- All users can create sales orders
CREATE POLICY sales_orders_insert_policy ON sales_orders
  FOR INSERT
  WITH CHECK (true);

-- STAFF can update their own draft orders, OWNER/MOD can update all
CREATE POLICY sales_orders_update_policy ON sales_orders
  FOR UPDATE
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR ("staffId" = get_current_user_id() AND status = 'DRAFT')
  );

-- Only OWNER can delete sales orders
CREATE POLICY sales_orders_delete_policy ON sales_orders
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- SALES ITEMS TABLE
-- ============================================
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- All users can view sales items
CREATE POLICY sales_items_select_policy ON sales_items
  FOR SELECT
  USING (true);

-- All users can insert sales items
CREATE POLICY sales_items_insert_policy ON sales_items
  FOR INSERT
  WITH CHECK (true);

-- OWNER and MOD can update sales items
CREATE POLICY sales_items_update_policy ON sales_items
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can delete sales items
CREATE POLICY sales_items_delete_policy ON sales_items
  FOR DELETE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- ============================================
-- CANCELLATION REQUESTS TABLE
-- ============================================
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- All users can view cancellation requests
CREATE POLICY cancellation_requests_select_policy ON cancellation_requests
  FOR SELECT
  USING (true);

-- All users can create cancellation requests
CREATE POLICY cancellation_requests_insert_policy ON cancellation_requests
  FOR INSERT
  WITH CHECK (true);

-- OWNER and MOD can update cancellation requests
CREATE POLICY cancellation_requests_update_policy ON cancellation_requests
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete cancellation requests
CREATE POLICY cancellation_requests_delete_policy ON cancellation_requests
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- EXPENSES TABLE
-- ============================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- OWNER and MOD can view all expenses, STAFF can view their own
CREATE POLICY expenses_select_policy ON expenses
  FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR "createdBy" = get_current_user_id()
  );

-- All users can create expenses
CREATE POLICY expenses_insert_policy ON expenses
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own pending expenses, OWNER/MOD can update all
CREATE POLICY expenses_update_policy ON expenses
  FOR UPDATE
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR ("createdBy" = get_current_user_id() AND status = 'PENDING')
  );

-- Only OWNER can delete expenses
CREATE POLICY expenses_delete_policy ON expenses
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- EXPENSE CATEGORIES TABLE
-- ============================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- All users can view expense categories
CREATE POLICY expense_categories_select_policy ON expense_categories
  FOR SELECT
  USING (true);

-- OWNER and MOD can insert expense categories
CREATE POLICY expense_categories_insert_policy ON expense_categories
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can update expense categories
CREATE POLICY expense_categories_update_policy ON expense_categories
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete expense categories
CREATE POLICY expense_categories_delete_policy ON expense_categories
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- PAYMENT METHODS TABLE
-- ============================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- All users can view payment methods
CREATE POLICY payment_methods_select_policy ON payment_methods
  FOR SELECT
  USING (true);

-- OWNER and MOD can insert payment methods
CREATE POLICY payment_methods_insert_policy ON payment_methods
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

-- OWNER and MOD can update payment methods
CREATE POLICY payment_methods_update_policy ON payment_methods
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete payment methods
CREATE POLICY payment_methods_delete_policy ON payment_methods
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- SHOPEE SHOPS TABLE
-- ============================================
ALTER TABLE shopee_shops ENABLE ROW LEVEL SECURITY;

-- OWNER and MOD can view all shops, others can view their own
CREATE POLICY shopee_shops_select_policy ON shopee_shops
  FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR "userId" = get_current_user_id()
  );

-- All users can insert shops
CREATE POLICY shopee_shops_insert_policy ON shopee_shops
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own shops, OWNER/MOD can update all
CREATE POLICY shopee_shops_update_policy ON shopee_shops
  FOR UPDATE
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR "userId" = get_current_user_id()
  );

-- Only OWNER can delete shops
CREATE POLICY shopee_shops_delete_policy ON shopee_shops
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- SHOPEE ITEMS TABLE
-- ============================================
ALTER TABLE shopee_items ENABLE ROW LEVEL SECURITY;

-- All users can view shopee items
CREATE POLICY shopee_items_select_policy ON shopee_items
  FOR SELECT
  USING (true);

-- OWNER and MOD can manage shopee items
CREATE POLICY shopee_items_insert_policy ON shopee_items
  FOR INSERT
  WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

CREATE POLICY shopee_items_update_policy ON shopee_items
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

CREATE POLICY shopee_items_delete_policy ON shopee_items
  FOR DELETE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- ============================================
-- SHOPEE SYNC LOGS TABLE
-- ============================================
ALTER TABLE shopee_sync_logs ENABLE ROW LEVEL SECURITY;

-- OWNER and MOD can view all sync logs
CREATE POLICY shopee_sync_logs_select_policy ON shopee_sync_logs
  FOR SELECT
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- System can insert sync logs
CREATE POLICY shopee_sync_logs_insert_policy ON shopee_sync_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- PRINT JOBS TABLE
-- ============================================
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own print jobs, OWNER/MOD can view all
CREATE POLICY print_jobs_select_policy ON print_jobs
  FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'MOD')
    OR "userId" = get_current_user_id()
  );

-- All users can create print jobs
CREATE POLICY print_jobs_insert_policy ON print_jobs
  FOR INSERT
  WITH CHECK (true);

-- OWNER and MOD can update print jobs
CREATE POLICY print_jobs_update_policy ON print_jobs
  FOR UPDATE
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only OWNER can delete print jobs
CREATE POLICY print_jobs_delete_policy ON print_jobs
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- PRINT JOB PRODUCTS TABLE
-- ============================================
ALTER TABLE print_job_products ENABLE ROW LEVEL SECURITY;

-- All users can view print job products
CREATE POLICY print_job_products_select_policy ON print_job_products
  FOR SELECT
  USING (true);

-- All users can insert print job products
CREATE POLICY print_job_products_insert_policy ON print_job_products
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SETTINGS TABLE
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- All users can view public settings, OWNER/MOD can view all
CREATE POLICY settings_select_policy ON settings
  FOR SELECT
  USING (
    "isPublic" = true
    OR get_user_role() IN ('OWNER', 'MOD')
  );

-- Only OWNER can manage settings
CREATE POLICY settings_insert_policy ON settings
  FOR INSERT
  WITH CHECK (get_user_role() = 'OWNER');

CREATE POLICY settings_update_policy ON settings
  FOR UPDATE
  USING (get_user_role() = 'OWNER');

CREATE POLICY settings_delete_policy ON settings
  FOR DELETE
  USING (get_user_role() = 'OWNER');

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only OWNER can view audit logs
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (get_user_role() = 'OWNER');

-- System can insert audit logs
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- DAILY SALES SUMMARIES TABLE
-- ============================================
ALTER TABLE daily_sales_summaries ENABLE ROW LEVEL SECURITY;

-- OWNER and MOD can view daily sales summaries
CREATE POLICY daily_sales_summaries_select_policy ON daily_sales_summaries
  FOR SELECT
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- Only system can manage summaries
CREATE POLICY daily_sales_summaries_all_policy ON daily_sales_summaries
  FOR ALL
  USING (get_user_role() IN ('OWNER', 'MOD'));

-- ============================================
-- MONTHLY FINANCIAL SUMMARIES TABLE
-- ============================================
ALTER TABLE monthly_financial_summaries ENABLE ROW LEVEL SECURITY;

-- Only OWNER can view financial summaries
CREATE POLICY monthly_financial_summaries_select_policy ON monthly_financial_summaries
  FOR SELECT
  USING (get_user_role() = 'OWNER');

-- Only OWNER can manage financial summaries
CREATE POLICY monthly_financial_summaries_all_policy ON monthly_financial_summaries
  FOR ALL
  USING (get_user_role() = 'OWNER');

-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================
-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO PUBLIC;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables now have RLS enabled with appropriate policies
-- based on user roles: OWNER, MOD, STAFF
