#!/bin/bash

# ============================================
# Generate Secure Secrets
# ============================================
# Generates cryptographically secure secrets
# for production deployment
# Usage: ./scripts/generate-secrets.sh
# ============================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "${BLUE}=== $1 ===${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${NC}$1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo "============================================"
echo "  Secure Secrets Generator"
echo "  2025 Production Standards"
echo "============================================"
echo ""

print_warning "IMPORTANT: Save these secrets in a secure location!"
print_warning "Never commit them to git or share them publicly."
echo ""

# Generate secrets
print_header "Database Credentials"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo ""

print_header "Redis Password"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo ""

print_header "JWT Secrets"
echo "# Access token secret (64 characters):"
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo ""
echo "# Refresh token secret (64 characters):"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo ""

print_header "Session Secret"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo ""

print_header "Encryption Key (for backups)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo ""

print_header "Admin User Password"
echo "# Create a strong password for admin user"
echo "ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')"
echo ""

echo "============================================"
echo ""

print_success "Secrets generated successfully!"
echo ""
print_info "Next steps:"
echo "1. Copy these values to your .env file"
echo "2. Save them in your password manager"
echo "3. Delete this terminal history"
echo "4. Never share these secrets"
echo ""
print_warning "Security reminders:"
echo "• Each secret should be unique"
echo "• Rotate secrets every 90 days"
echo "• Use different secrets for dev and production"
echo "• Enable 2FA on all admin accounts"
echo ""

# Optionally save to file (encrypted)
read -p "Save to encrypted file? (yes/no): " -r
echo

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    SECRETS_FILE="secrets_$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "============================================"
        echo "  Production Secrets"
        echo "  Generated: $(date)"
        echo "============================================"
        echo ""
        echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
        echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
        echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
        echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
        echo "SESSION_SECRET=$(openssl rand -base64 32)"
        echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
        echo "ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')"
    } > "$SECRETS_FILE"

    # Encrypt if GPG is available
    if command -v gpg &> /dev/null; then
        print_info "Enter encryption passphrase (you'll need this to decrypt):"
        gpg --symmetric --cipher-algo AES256 "$SECRETS_FILE"
        rm "$SECRETS_FILE"
        print_success "Secrets saved to: ${SECRETS_FILE}.gpg"
        print_info "To decrypt: gpg -d ${SECRETS_FILE}.gpg"
    else
        print_success "Secrets saved to: $SECRETS_FILE"
        print_warning "File is NOT encrypted. Install GPG for encryption:"
        print_info "sudo apt install gpg"
        chmod 600 "$SECRETS_FILE"
    fi

    echo ""
    print_warning "Remember to delete this file after copying secrets to .env"
fi

echo ""
print_info "Generate new secrets anytime with: ./scripts/generate-secrets.sh"
echo ""

exit 0
