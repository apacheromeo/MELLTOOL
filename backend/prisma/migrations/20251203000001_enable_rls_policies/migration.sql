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

-- ============================================
-- RESOLVE FAILED MIGRATION STATE
-- ============================================
-- Clean up any failed migration records first
DO $$
BEGIN
  -- Delete the failed migration record if it exists
  DELETE FROM "_prisma_migrations"
  WHERE migration_name = '20251203_enable_rls_policies'
  AND finished_at IS NOT NULL;

  RAISE NOTICE 'Cleaned up any failed migration state';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Prisma migrations table not found, skipping cleanup';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not clean up failed migration: %', SQLERRM;
END $$;

-- ============================================
-- RLS HELPER FUNCTIONS
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

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO PUBLIC;

-- ============================================
-- HELPER FUNCTION TO SAFELY ENABLE RLS
-- ============================================
CREATE OR REPLACE FUNCTION enable_rls_if_exists(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name = p_table_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
    RAISE NOTICE 'RLS enabled for table: %', p_table_name;
  ELSE
    RAISE NOTICE 'Table does not exist, skipping: %', p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE RLS ON ALL EXISTING TABLES
-- ============================================
SELECT enable_rls_if_exists('users');
SELECT enable_rls_if_exists('categories');
SELECT enable_rls_if_exists('brands');
SELECT enable_rls_if_exists('products');
SELECT enable_rls_if_exists('product_compatibilities');
SELECT enable_rls_if_exists('stock_ins');
SELECT enable_rls_if_exists('stock_in_items');
SELECT enable_rls_if_exists('stock_adjustments');
SELECT enable_rls_if_exists('sales_orders');
SELECT enable_rls_if_exists('sales_items');
SELECT enable_rls_if_exists('cancellation_requests');
SELECT enable_rls_if_exists('expenses');
SELECT enable_rls_if_exists('expense_categories');
SELECT enable_rls_if_exists('payment_methods');
SELECT enable_rls_if_exists('shopee_shops');
SELECT enable_rls_if_exists('shopee_items');
SELECT enable_rls_if_exists('shopee_sync_logs');
SELECT enable_rls_if_exists('print_jobs');
SELECT enable_rls_if_exists('print_job_products');
SELECT enable_rls_if_exists('settings');
SELECT enable_rls_if_exists('audit_logs');
SELECT enable_rls_if_exists('daily_sales_summaries');
SELECT enable_rls_if_exists('monthly_financial_summaries');

-- ============================================
-- CREATE POLICIES (WITH TABLE EXISTENCE CHECKS)
-- ============================================

-- USERS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS users_select_policy ON users;
    CREATE POLICY users_select_policy ON users FOR SELECT USING (
      get_user_role() IN ('OWNER', 'MOD') OR id = get_current_user_id()
    );

    DROP POLICY IF EXISTS users_insert_policy ON users;
    CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (get_user_role() = 'OWNER');

    DROP POLICY IF EXISTS users_update_policy ON users;
    CREATE POLICY users_update_policy ON users FOR UPDATE USING (
      get_user_role() = 'OWNER' OR id = get_current_user_id()
    );

    DROP POLICY IF EXISTS users_delete_policy ON users;
    CREATE POLICY users_delete_policy ON users FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- CATEGORIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    DROP POLICY IF EXISTS categories_select_policy ON categories;
    CREATE POLICY categories_select_policy ON categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS categories_insert_policy ON categories;
    CREATE POLICY categories_insert_policy ON categories FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS categories_update_policy ON categories;
    CREATE POLICY categories_update_policy ON categories FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS categories_delete_policy ON categories;
    CREATE POLICY categories_delete_policy ON categories FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- BRANDS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    DROP POLICY IF EXISTS brands_select_policy ON brands;
    CREATE POLICY brands_select_policy ON brands FOR SELECT USING (true);

    DROP POLICY IF EXISTS brands_insert_policy ON brands;
    CREATE POLICY brands_insert_policy ON brands FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS brands_update_policy ON brands;
    CREATE POLICY brands_update_policy ON brands FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS brands_delete_policy ON brands;
    CREATE POLICY brands_delete_policy ON brands FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- PRODUCTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DROP POLICY IF EXISTS products_select_policy ON products;
    CREATE POLICY products_select_policy ON products FOR SELECT USING (true);

    DROP POLICY IF EXISTS products_insert_policy ON products;
    CREATE POLICY products_insert_policy ON products FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS products_update_policy ON products;
    CREATE POLICY products_update_policy ON products FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS products_delete_policy ON products;
    CREATE POLICY products_delete_policy ON products FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- PRODUCT COMPATIBILITIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_compatibilities') THEN
    DROP POLICY IF EXISTS product_compatibilities_select_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_select_policy ON product_compatibilities FOR SELECT USING (true);

    DROP POLICY IF EXISTS product_compatibilities_insert_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_insert_policy ON product_compatibilities FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS product_compatibilities_update_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_update_policy ON product_compatibilities FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS product_compatibilities_delete_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_delete_policy ON product_compatibilities FOR DELETE USING (get_user_role() IN ('OWNER', 'MOD'));
  END IF;
END $$;

-- STOCK INS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_ins') THEN
    DROP POLICY IF EXISTS stock_ins_select_policy ON stock_ins;
    CREATE POLICY stock_ins_select_policy ON stock_ins FOR SELECT USING (true);

    DROP POLICY IF EXISTS stock_ins_insert_policy ON stock_ins;
    CREATE POLICY stock_ins_insert_policy ON stock_ins FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS stock_ins_update_policy ON stock_ins;
    CREATE POLICY stock_ins_update_policy ON stock_ins FOR UPDATE USING (
      get_user_role() IN ('OWNER', 'MOD') OR ("userId" = get_current_user_id() AND status = 'PENDING')
    );

    DROP POLICY IF EXISTS stock_ins_delete_policy ON stock_ins;
    CREATE POLICY stock_ins_delete_policy ON stock_ins FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- STOCK IN ITEMS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_in_items') THEN
    DROP POLICY IF EXISTS stock_in_items_select_policy ON stock_in_items;
    CREATE POLICY stock_in_items_select_policy ON stock_in_items FOR SELECT USING (true);

    DROP POLICY IF EXISTS stock_in_items_insert_policy ON stock_in_items;
    CREATE POLICY stock_in_items_insert_policy ON stock_in_items FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS stock_in_items_update_policy ON stock_in_items;
    CREATE POLICY stock_in_items_update_policy ON stock_in_items FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_in_items_delete_policy ON stock_in_items;
    CREATE POLICY stock_in_items_delete_policy ON stock_in_items FOR DELETE USING (get_user_role() IN ('OWNER', 'MOD'));
  END IF;
END $$;

-- STOCK ADJUSTMENTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_adjustments') THEN
    DROP POLICY IF EXISTS stock_adjustments_select_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_select_policy ON stock_adjustments FOR SELECT USING (true);

    DROP POLICY IF EXISTS stock_adjustments_insert_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_insert_policy ON stock_adjustments FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_adjustments_update_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_update_policy ON stock_adjustments FOR UPDATE USING (get_user_role() = 'OWNER');

    DROP POLICY IF EXISTS stock_adjustments_delete_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_delete_policy ON stock_adjustments FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- SALES ORDERS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
    DROP POLICY IF EXISTS sales_orders_select_policy ON sales_orders;
    CREATE POLICY sales_orders_select_policy ON sales_orders FOR SELECT USING (
      get_user_role() IN ('OWNER', 'MOD') OR "staffId" = get_current_user_id()
    );

    DROP POLICY IF EXISTS sales_orders_insert_policy ON sales_orders;
    CREATE POLICY sales_orders_insert_policy ON sales_orders FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS sales_orders_update_policy ON sales_orders;
    CREATE POLICY sales_orders_update_policy ON sales_orders FOR UPDATE USING (
      get_user_role() IN ('OWNER', 'MOD') OR ("staffId" = get_current_user_id() AND status = 'DRAFT')
    );

    DROP POLICY IF EXISTS sales_orders_delete_policy ON sales_orders;
    CREATE POLICY sales_orders_delete_policy ON sales_orders FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- SALES ITEMS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_items') THEN
    DROP POLICY IF EXISTS sales_items_select_policy ON sales_items;
    CREATE POLICY sales_items_select_policy ON sales_items FOR SELECT USING (true);

    DROP POLICY IF EXISTS sales_items_insert_policy ON sales_items;
    CREATE POLICY sales_items_insert_policy ON sales_items FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS sales_items_update_policy ON sales_items;
    CREATE POLICY sales_items_update_policy ON sales_items FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS sales_items_delete_policy ON sales_items;
    CREATE POLICY sales_items_delete_policy ON sales_items FOR DELETE USING (get_user_role() IN ('OWNER', 'MOD'));
  END IF;
END $$;

-- EXPENSES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    DROP POLICY IF EXISTS expenses_select_policy ON expenses;
    CREATE POLICY expenses_select_policy ON expenses FOR SELECT USING (
      get_user_role() IN ('OWNER', 'MOD') OR "createdBy" = get_current_user_id()
    );

    DROP POLICY IF EXISTS expenses_insert_policy ON expenses;
    CREATE POLICY expenses_insert_policy ON expenses FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS expenses_update_policy ON expenses;
    CREATE POLICY expenses_update_policy ON expenses FOR UPDATE USING (
      get_user_role() IN ('OWNER', 'MOD') OR ("createdBy" = get_current_user_id() AND status = 'PENDING')
    );

    DROP POLICY IF EXISTS expenses_delete_policy ON expenses;
    CREATE POLICY expenses_delete_policy ON expenses FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- EXPENSE CATEGORIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
    DROP POLICY IF EXISTS expense_categories_select_policy ON expense_categories;
    CREATE POLICY expense_categories_select_policy ON expense_categories FOR SELECT USING (true);

    DROP POLICY IF EXISTS expense_categories_insert_policy ON expense_categories;
    CREATE POLICY expense_categories_insert_policy ON expense_categories FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS expense_categories_update_policy ON expense_categories;
    CREATE POLICY expense_categories_update_policy ON expense_categories FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS expense_categories_delete_policy ON expense_categories;
    CREATE POLICY expense_categories_delete_policy ON expense_categories FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- PAYMENT METHODS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    DROP POLICY IF EXISTS payment_methods_select_policy ON payment_methods;
    CREATE POLICY payment_methods_select_policy ON payment_methods FOR SELECT USING (true);

    DROP POLICY IF EXISTS payment_methods_insert_policy ON payment_methods;
    CREATE POLICY payment_methods_insert_policy ON payment_methods FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS payment_methods_update_policy ON payment_methods;
    CREATE POLICY payment_methods_update_policy ON payment_methods FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS payment_methods_delete_policy ON payment_methods;
    CREATE POLICY payment_methods_delete_policy ON payment_methods FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- SHOPEE SHOPS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopee_shops') THEN
    DROP POLICY IF EXISTS shopee_shops_select_policy ON shopee_shops;
    CREATE POLICY shopee_shops_select_policy ON shopee_shops FOR SELECT USING (
      get_user_role() IN ('OWNER', 'MOD') OR "userId" = get_current_user_id()
    );

    DROP POLICY IF EXISTS shopee_shops_insert_policy ON shopee_shops;
    CREATE POLICY shopee_shops_insert_policy ON shopee_shops FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS shopee_shops_update_policy ON shopee_shops;
    CREATE POLICY shopee_shops_update_policy ON shopee_shops FOR UPDATE USING (
      get_user_role() IN ('OWNER', 'MOD') OR "userId" = get_current_user_id()
    );

    DROP POLICY IF EXISTS shopee_shops_delete_policy ON shopee_shops;
    CREATE POLICY shopee_shops_delete_policy ON shopee_shops FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- SHOPEE ITEMS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopee_items') THEN
    DROP POLICY IF EXISTS shopee_items_select_policy ON shopee_items;
    CREATE POLICY shopee_items_select_policy ON shopee_items FOR SELECT USING (true);

    DROP POLICY IF EXISTS shopee_items_insert_policy ON shopee_items;
    CREATE POLICY shopee_items_insert_policy ON shopee_items FOR INSERT WITH CHECK (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS shopee_items_update_policy ON shopee_items;
    CREATE POLICY shopee_items_update_policy ON shopee_items FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS shopee_items_delete_policy ON shopee_items;
    CREATE POLICY shopee_items_delete_policy ON shopee_items FOR DELETE USING (get_user_role() IN ('OWNER', 'MOD'));
  END IF;
END $$;

-- SHOPEE SYNC LOGS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopee_sync_logs') THEN
    DROP POLICY IF EXISTS shopee_sync_logs_select_policy ON shopee_sync_logs;
    CREATE POLICY shopee_sync_logs_select_policy ON shopee_sync_logs FOR SELECT USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS shopee_sync_logs_insert_policy ON shopee_sync_logs;
    CREATE POLICY shopee_sync_logs_insert_policy ON shopee_sync_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- PRINT JOBS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'print_jobs') THEN
    DROP POLICY IF EXISTS print_jobs_select_policy ON print_jobs;
    CREATE POLICY print_jobs_select_policy ON print_jobs FOR SELECT USING (
      get_user_role() IN ('OWNER', 'MOD') OR "userId" = get_current_user_id()
    );

    DROP POLICY IF EXISTS print_jobs_insert_policy ON print_jobs;
    CREATE POLICY print_jobs_insert_policy ON print_jobs FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS print_jobs_update_policy ON print_jobs;
    CREATE POLICY print_jobs_update_policy ON print_jobs FOR UPDATE USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS print_jobs_delete_policy ON print_jobs;
    CREATE POLICY print_jobs_delete_policy ON print_jobs FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- PRINT JOB PRODUCTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'print_job_products') THEN
    DROP POLICY IF EXISTS print_job_products_select_policy ON print_job_products;
    CREATE POLICY print_job_products_select_policy ON print_job_products FOR SELECT USING (true);

    DROP POLICY IF EXISTS print_job_products_insert_policy ON print_job_products;
    CREATE POLICY print_job_products_insert_policy ON print_job_products FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- SETTINGS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings') THEN
    DROP POLICY IF EXISTS settings_select_policy ON settings;
    CREATE POLICY settings_select_policy ON settings FOR SELECT USING (
      "isPublic" = true OR get_user_role() IN ('OWNER', 'MOD')
    );

    DROP POLICY IF EXISTS settings_insert_policy ON settings;
    CREATE POLICY settings_insert_policy ON settings FOR INSERT WITH CHECK (get_user_role() = 'OWNER');

    DROP POLICY IF EXISTS settings_update_policy ON settings;
    CREATE POLICY settings_update_policy ON settings FOR UPDATE USING (get_user_role() = 'OWNER');

    DROP POLICY IF EXISTS settings_delete_policy ON settings;
    CREATE POLICY settings_delete_policy ON settings FOR DELETE USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- AUDIT LOGS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
    CREATE POLICY audit_logs_select_policy ON audit_logs FOR SELECT USING (get_user_role() = 'OWNER');

    DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
    CREATE POLICY audit_logs_insert_policy ON audit_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- DAILY SALES SUMMARIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_sales_summaries') THEN
    DROP POLICY IF EXISTS daily_sales_summaries_select_policy ON daily_sales_summaries;
    CREATE POLICY daily_sales_summaries_select_policy ON daily_sales_summaries FOR SELECT USING (get_user_role() IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS daily_sales_summaries_all_policy ON daily_sales_summaries;
    CREATE POLICY daily_sales_summaries_all_policy ON daily_sales_summaries FOR ALL USING (get_user_role() IN ('OWNER', 'MOD'));
  END IF;
END $$;

-- MONTHLY FINANCIAL SUMMARIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_financial_summaries') THEN
    DROP POLICY IF EXISTS monthly_financial_summaries_select_policy ON monthly_financial_summaries;
    CREATE POLICY monthly_financial_summaries_select_policy ON monthly_financial_summaries FOR SELECT USING (get_user_role() = 'OWNER');

    DROP POLICY IF EXISTS monthly_financial_summaries_all_policy ON monthly_financial_summaries;
    CREATE POLICY monthly_financial_summaries_all_policy ON monthly_financial_summaries FOR ALL USING (get_user_role() = 'OWNER');
  END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS enable_rls_if_exists(TEXT);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- RLS has been enabled on all existing tables with appropriate policies
