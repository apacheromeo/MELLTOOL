# Owner Configuration Guide

This guide explains how to configure system settings as the Owner.

## Session Timeout Configuration

### Current Default
- **Session Duration**: 7 days
- **Location**: Backend environment variable `JWT_EXPIRES_IN`

### How to Change Session Timeout

#### Option 1: Via Fly.io Secrets (Recommended for Production)

1. **Set the environment variable on Fly.io:**
```bash
fly secrets set JWT_EXPIRES_IN=14d
```

Available values:
- `1h` - 1 hour
- `12h` - 12 hours
- `1d` - 1 day
- `7d` - 7 days (current default)
- `14d` - 14 days
- `30d` - 30 days

2. **Restart the app:**
```bash
fly deploy
```

#### Option 2: Via .env File (Development)

1. Edit `backend/.env`:
```bash
JWT_EXPIRES_IN=14d
```

2. Restart the backend server

### Security Recommendations

**Shorter sessions (More Secure):**
- Better for multi-user environments
- Recommended: 1-7 days
- Forces users to re-authenticate regularly

**Longer sessions (More Convenient):**
- Better for single-user/trusted environments
- Recommended: 7-30 days
- Less frequent login required

**⚠️ Security Note:** Sessions longer than 30 days are not recommended for security reasons.

### Refresh Token Behavior

The system also uses refresh tokens:
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (configured by JWT_EXPIRES_IN)
- Users stay logged in as long as the refresh token is valid
- After expiration, users must log in again

---

## Bulk Stock Adjustment (Owner Only)

### How to Use

1. **Export Current Stock**
   - Go to Inventory page
   - Click "Export Stock" button (green, Owner only)
   - Downloads Excel file with current inventory levels

2. **Edit Stock Quantities**
   - Open the downloaded Excel file
   - Update the "New Stock" column with correct quantities
   - You can also update Cost Price and Sell Price if needed
   - **Do NOT modify the SKU column** (used to identify products)

3. **Import Updated Stock**
   - Save the Excel file
   - Click "Import from Excel" on Inventory page
   - Check "Update existing products" option
   - Select your edited file
   - Click "Import Products"

### Important Notes

- ✅ Product images are preserved during import
- ✅ Barcodes are preserved during import
- ✅ Stock is REPLACED with "New Stock" value (not added)
- ✅ Instructions are included in the exported Excel file
- ⚠️ Invalid SKUs will be skipped

### Use Cases

- **Physical inventory count**: Export, count physical stock, update Excel, import
- **Bulk price updates**: Update Cost Price and Sell Price columns
- **Stock corrections**: Fix inventory discrepancies in bulk
- **End of month reconciliation**: Adjust stock to match actual levels

---

## Other Owner Privileges

As the Owner, you have exclusive access to:

- ✅ View cost prices and profit margins
- ✅ Delete products
- ✅ Export stock data
- ✅ Manage all users
- ✅ Access all financial reports
- ✅ Configure system settings

---

For technical support or questions, refer to the main README.md or contact your system administrator.
