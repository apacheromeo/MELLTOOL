#!/bin/bash

# ============================================
# Health Check Script
# ============================================
# Checks if all services are running correctly
# Usage: ./scripts/health-check.sh
# ============================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${NC}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

ERRORS=0

echo "============================================"
echo "  Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# 1. Check Docker
print_info "Checking Docker..."
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        print_success "Docker is running"
    else
        print_error "Docker is installed but not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "Docker is not installed"
    ERRORS=$((ERRORS + 1))
fi

# 2. Check containers
print_info "Checking containers..."

CONTAINERS=("inventory_postgres" "inventory_redis" "inventory_backend" "inventory_frontend")

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        # Check if healthy
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

        if [ "$HEALTH" == "healthy" ]; then
            print_success "$container is healthy"
        elif [ "$HEALTH" == "none" ]; then
            # No health check defined, just check if running
            print_success "$container is running"
        else
            print_warning "$container is running but health status: $HEALTH"
        fi
    else
        print_error "$container is not running"
        ERRORS=$((ERRORS + 1))
    fi
done

# 3. Check backend API
print_info "Checking backend API..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")

if [ "$BACKEND_RESPONSE" == "200" ]; then
    print_success "Backend API is responding (HTTP 200)"
elif [ "$BACKEND_RESPONSE" == "000" ]; then
    print_error "Backend API is not accessible"
    ERRORS=$((ERRORS + 1))
else
    print_warning "Backend API returned HTTP $BACKEND_RESPONSE"
fi

# 4. Check frontend
print_info "Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$FRONTEND_RESPONSE" == "200" ] || [ "$FRONTEND_RESPONSE" == "304" ]; then
    print_success "Frontend is responding (HTTP $FRONTEND_RESPONSE)"
elif [ "$FRONTEND_RESPONSE" == "000" ]; then
    print_error "Frontend is not accessible"
    ERRORS=$((ERRORS + 1))
else
    print_warning "Frontend returned HTTP $FRONTEND_RESPONSE"
fi

# 5. Check database connectivity
print_info "Checking database..."
if docker exec inventory_postgres pg_isready -U postgres &> /dev/null; then
    print_success "PostgreSQL is ready"

    # Check if database exists
    DB_EXISTS=$(docker exec inventory_postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='inventory_db'" 2>/dev/null || echo "0")

    if [ "$DB_EXISTS" == "1" ]; then
        print_success "Database 'inventory_db' exists"

        # Count tables
        TABLE_COUNT=$(docker exec inventory_postgres psql -U postgres -d inventory_db -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "0")
        print_info "Database has $TABLE_COUNT tables"

        if [ "$TABLE_COUNT" -lt 5 ]; then
            print_warning "Low table count. Database may not be properly migrated."
        fi
    else
        print_error "Database 'inventory_db' does not exist"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "PostgreSQL is not ready"
    ERRORS=$((ERRORS + 1))
fi

# 6. Check Redis
print_info "Checking Redis..."
if docker exec inventory_redis redis-cli ping &> /dev/null; then
    print_success "Redis is responding"
else
    print_error "Redis is not responding"
    ERRORS=$((ERRORS + 1))
fi

# 7. Check disk space
print_info "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -lt 70 ]; then
    print_success "Disk usage: ${DISK_USAGE}% (healthy)"
elif [ "$DISK_USAGE" -lt 85 ]; then
    print_warning "Disk usage: ${DISK_USAGE}% (moderate)"
else
    print_error "Disk usage: ${DISK_USAGE}% (critical!)"
    ERRORS=$((ERRORS + 1))
fi

# 8. Check memory
print_info "Checking memory..."
if command -v free &> /dev/null; then
    MEM_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')
    MEM_TOTAL=$(free -m | awk 'NR==2 {print $2}')
    MEM_PERCENT=$((100 - (MEM_AVAILABLE * 100 / MEM_TOTAL)))

    if [ "$MEM_PERCENT" -lt 80 ]; then
        print_success "Memory usage: ${MEM_PERCENT}% (healthy)"
    elif [ "$MEM_PERCENT" -lt 90 ]; then
        print_warning "Memory usage: ${MEM_PERCENT}% (high)"
    else
        print_error "Memory usage: ${MEM_PERCENT}% (critical!)"
    fi
fi

# 9. Check logs for errors
print_info "Checking recent logs for errors..."
ERROR_COUNT=$(docker-compose logs --tail=100 backend 2>/dev/null | grep -i "error\|exception\|fatal" | wc -l || echo "0")

if [ "$ERROR_COUNT" -eq 0 ]; then
    print_success "No recent errors in backend logs"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    print_warning "$ERROR_COUNT errors found in recent backend logs"
else
    print_error "$ERROR_COUNT errors found in recent backend logs!"
    print_info "Check logs: docker-compose logs backend"
fi

# 10. Check SSL (if in production)
if [ -f "/etc/nginx/nginx.conf" ]; then
    print_info "Checking Nginx..."

    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"

        # Check SSL certificates
        if [ -d "/etc/letsencrypt/live" ]; then
            # Find most recent cert
            CERT_DIR=$(find /etc/letsencrypt/live -maxdepth 1 -type d | tail -1)

            if [ -n "$CERT_DIR" ] && [ -f "$CERT_DIR/cert.pem" ]; then
                EXPIRY=$(openssl x509 -in "$CERT_DIR/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
                EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || echo "0")
                NOW_EPOCH=$(date +%s)
                DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

                if [ "$DAYS_LEFT" -gt 30 ]; then
                    print_success "SSL certificate valid for $DAYS_LEFT days"
                elif [ "$DAYS_LEFT" -gt 7 ]; then
                    print_warning "SSL certificate expires in $DAYS_LEFT days"
                elif [ "$DAYS_LEFT" -gt 0 ]; then
                    print_error "SSL certificate expires in $DAYS_LEFT days! Renew now!"
                    ERRORS=$((ERRORS + 1))
                else
                    print_error "SSL certificate has EXPIRED!"
                    ERRORS=$((ERRORS + 1))
                fi
            fi
        fi
    else
        print_warning "Nginx is installed but not running"
    fi
else
    print_info "Nginx not detected (development mode?)"
fi

# Summary
echo ""
echo "============================================"
echo "  Health Check Summary"
echo "============================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    print_success "All checks passed! System is healthy."
    EXIT_CODE=0
elif [ $ERRORS -lt 3 ]; then
    print_warning "$ERRORS issues found. Review needed."
    EXIT_CODE=1
else
    print_error "$ERRORS critical issues found! Immediate action required."
    EXIT_CODE=2
fi

echo ""
print_info "Container status:"
docker-compose ps

echo ""
print_info "System resources:"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory: $(free -h | awk 'NR==2 {printf "%s / %s (%.0f%%)", $3, $2, $3/$2*100}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 " / " $2 " (" $5 ")"}')"

echo ""
print_info "Quick actions:"
echo "  View logs: docker-compose logs -f [service]"
echo "  Restart service: docker-compose restart [service]"
echo "  Full restart: docker-compose restart"

# Log health check
mkdir -p logs
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Health check: $ERRORS errors" >> logs/health-check.log

exit $EXIT_CODE
