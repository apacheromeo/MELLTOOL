-- ============================================
-- Fix RLS Policies to Use COALESCE
-- ============================================
-- The previous migration used helper functions that didn't work reliably.
-- This migration updates all policies to use COALESCE with current_setting directly.
-- ============================================

-- PRODUCTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DROP POLICY IF EXISTS products_select_policy ON products;
    CREATE POLICY products_select_policy ON products
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS products_insert_policy ON products;
    CREATE POLICY products_insert_policy ON products
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS products_update_policy ON products;
    CREATE POLICY products_update_policy ON products
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS products_delete_policy ON products;
    CREATE POLICY products_delete_policy ON products
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for products table';
  END IF;
END $$;

-- CATEGORIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    DROP POLICY IF EXISTS categories_select_policy ON categories;
    CREATE POLICY categories_select_policy ON categories
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS categories_insert_policy ON categories;
    CREATE POLICY categories_insert_policy ON categories
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS categories_update_policy ON categories;
    CREATE POLICY categories_update_policy ON categories
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS categories_delete_policy ON categories;
    CREATE POLICY categories_delete_policy ON categories
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for categories table';
  END IF;
END $$;

-- BRANDS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    DROP POLICY IF EXISTS brands_select_policy ON brands;
    CREATE POLICY brands_select_policy ON brands
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS brands_insert_policy ON brands;
    CREATE POLICY brands_insert_policy ON brands
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS brands_update_policy ON brands;
    CREATE POLICY brands_update_policy ON brands
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS brands_delete_policy ON brands;
    CREATE POLICY brands_delete_policy ON brands
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for brands table';
  END IF;
END $$;

-- PRODUCT_COMPATIBILITIES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_compatibilities') THEN
    DROP POLICY IF EXISTS product_compatibilities_select_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_select_policy ON product_compatibilities
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS product_compatibilities_insert_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_insert_policy ON product_compatibilities
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS product_compatibilities_update_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_update_policy ON product_compatibilities
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS product_compatibilities_delete_policy ON product_compatibilities;
    CREATE POLICY product_compatibilities_delete_policy ON product_compatibilities
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for product_compatibilities table';
  END IF;
END $$;

-- USERS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS users_select_policy ON users;
    CREATE POLICY users_select_policy ON users
      FOR SELECT
      USING (
        COALESCE(current_setting('app.user_id', true), '') = id::text
        OR COALESCE(current_setting('app.user_role', true), '') = 'OWNER'
      );

    DROP POLICY IF EXISTS users_insert_policy ON users;
    CREATE POLICY users_insert_policy ON users
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    DROP POLICY IF EXISTS users_update_policy ON users;
    CREATE POLICY users_update_policy ON users
      FOR UPDATE
      USING (
        COALESCE(current_setting('app.user_id', true), '') = id::text
        OR COALESCE(current_setting('app.user_role', true), '') = 'OWNER'
      );

    DROP POLICY IF EXISTS users_delete_policy ON users;
    CREATE POLICY users_delete_policy ON users
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for users table';
  END IF;
END $$;

-- STOCK_IN TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_in') THEN
    DROP POLICY IF EXISTS stock_in_select_policy ON stock_in;
    CREATE POLICY stock_in_select_policy ON stock_in
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS stock_in_insert_policy ON stock_in;
    CREATE POLICY stock_in_insert_policy ON stock_in
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_in_update_policy ON stock_in;
    CREATE POLICY stock_in_update_policy ON stock_in
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_in_delete_policy ON stock_in;
    CREATE POLICY stock_in_delete_policy ON stock_in
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for stock_in table';
  END IF;
END $$;

-- STOCK_IN_ITEMS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_in_items') THEN
    DROP POLICY IF EXISTS stock_in_items_select_policy ON stock_in_items;
    CREATE POLICY stock_in_items_select_policy ON stock_in_items
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS stock_in_items_insert_policy ON stock_in_items;
    CREATE POLICY stock_in_items_insert_policy ON stock_in_items
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_in_items_update_policy ON stock_in_items;
    CREATE POLICY stock_in_items_update_policy ON stock_in_items
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_in_items_delete_policy ON stock_in_items;
    CREATE POLICY stock_in_items_delete_policy ON stock_in_items
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for stock_in_items table';
  END IF;
END $$;

-- STOCK_ADJUSTMENTS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_adjustments') THEN
    DROP POLICY IF EXISTS stock_adjustments_select_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_select_policy ON stock_adjustments
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS stock_adjustments_insert_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_insert_policy ON stock_adjustments
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_adjustments_update_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_update_policy ON stock_adjustments
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS stock_adjustments_delete_policy ON stock_adjustments;
    CREATE POLICY stock_adjustments_delete_policy ON stock_adjustments
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for stock_adjustments table';
  END IF;
END $$;

-- SALES_ORDERS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
    DROP POLICY IF EXISTS sales_orders_select_policy ON sales_orders;
    CREATE POLICY sales_orders_select_policy ON sales_orders
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS sales_orders_insert_policy ON sales_orders;
    CREATE POLICY sales_orders_insert_policy ON sales_orders
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD', 'STAFF'));

    DROP POLICY IF EXISTS sales_orders_update_policy ON sales_orders;
    CREATE POLICY sales_orders_update_policy ON sales_orders
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD', 'STAFF'));

    DROP POLICY IF EXISTS sales_orders_delete_policy ON sales_orders;
    CREATE POLICY sales_orders_delete_policy ON sales_orders
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for sales_orders table';
  END IF;
END $$;

-- SALES_ITEMS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_items') THEN
    DROP POLICY IF EXISTS sales_items_select_policy ON sales_items;
    CREATE POLICY sales_items_select_policy ON sales_items
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS sales_items_insert_policy ON sales_items;
    CREATE POLICY sales_items_insert_policy ON sales_items
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD', 'STAFF'));

    DROP POLICY IF EXISTS sales_items_update_policy ON sales_items;
    CREATE POLICY sales_items_update_policy ON sales_items
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD', 'STAFF'));

    DROP POLICY IF EXISTS sales_items_delete_policy ON sales_items;
    CREATE POLICY sales_items_delete_policy ON sales_items
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for sales_items table';
  END IF;
END $$;

-- SETTINGS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings') THEN
    DROP POLICY IF EXISTS settings_select_policy ON settings;
    CREATE POLICY settings_select_policy ON settings
      FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS settings_insert_policy ON settings;
    CREATE POLICY settings_insert_policy ON settings
      FOR INSERT
      WITH CHECK (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    DROP POLICY IF EXISTS settings_update_policy ON settings;
    CREATE POLICY settings_update_policy ON settings
      FOR UPDATE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    DROP POLICY IF EXISTS settings_delete_policy ON settings;
    CREATE POLICY settings_delete_policy ON settings
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for settings table';
  END IF;
END $$;

-- AUDIT_LOGS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
    CREATE POLICY audit_logs_select_policy ON audit_logs
      FOR SELECT
      USING (COALESCE(current_setting('app.user_role', true), '') IN ('OWNER', 'MOD'));

    DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
    CREATE POLICY audit_logs_insert_policy ON audit_logs
      FOR INSERT
      WITH CHECK (true);

    DROP POLICY IF EXISTS audit_logs_update_policy ON audit_logs;
    CREATE POLICY audit_logs_update_policy ON audit_logs
      FOR UPDATE
      USING (false);

    DROP POLICY IF EXISTS audit_logs_delete_policy ON audit_logs;
    CREATE POLICY audit_logs_delete_policy ON audit_logs
      FOR DELETE
      USING (COALESCE(current_setting('app.user_role', true), '') = 'OWNER');

    RAISE NOTICE 'Updated RLS policies for audit_logs table';
  END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '✅ All RLS policies updated to use COALESCE with current_setting';
END $$;
