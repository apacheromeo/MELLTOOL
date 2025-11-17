# Redis Setup Guide

This guide will help you set up Redis for your MELLTOOL inventory management system.

## Why Redis?

Redis is used for:
- **Caching**: Improve API response times
- **Session Management**: Store user sessions
- **Queue Management**: Background job processing
- **Real-time Features**: WebSocket connections and live updates

## Local Development

### Option 1: Using Docker (Recommended)

```bash
# Start Redis using Docker
docker run -d --name melltool-redis -p 6379:6379 redis:7-alpine

# Verify it's running
docker ps | grep melltool-redis
```

### Option 2: Install Locally

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL2 with Ubuntu

### Configuration

Add to your `.env` file:
```bash
REDIS_URL=redis://localhost:6379
```

## Production Setup on Fly.io

### Option 1: Upstash Redis (Recommended - Free Tier Available)

1. **Sign up for Upstash**
   - Visit: https://upstash.com/
   - Create a free account
   - Click "Create Database"

2. **Configure Database**
   - Choose a name (e.g., `melltool-redis`)
   - Select region closest to your Fly.io deployment (Singapore for `sin` region)
   - Click "Create"

3. **Get Connection Details**
   - Copy the connection details from the Upstash dashboard
   - You'll need: Host, Port, and Password

4. **Set Fly.io Secrets**

```bash
# Set Redis configuration as Fly.io secrets
flyctl secrets set \
  REDIS_HOST="your-redis-host.upstash.io" \
  REDIS_PORT="6379" \
  REDIS_PASSWORD="your-redis-password" \
  REDIS_TLS="true"

# Or use a Redis URL (alternative)
flyctl secrets set REDIS_URL="rediss://default:your-password@your-redis-host.upstash.io:6379"
```

**Important:**
- Use `REDIS_TLS=true` for Upstash and most cloud Redis providers
- The `rediss://` protocol (with double 's') indicates TLS/SSL connection

### Option 2: Fly.io Redis

Fly.io doesn't have native Redis, but you can:

1. **Deploy Redis as a separate app**
```bash
# Create a new app for Redis
fly apps create melltool-redis

# Deploy using the official Redis image
fly deploy --image redis:7-alpine -a melltool-redis

# Get the internal URL
fly ips list -a melltool-redis
```

2. **Configure connection**
```bash
# Use internal Fly.io DNS
flyctl secrets set REDIS_URL="redis://melltool-redis.internal:6379"
```

### Option 3: AWS ElastiCache

If you're using AWS:

```bash
flyctl secrets set \
  REDIS_HOST="your-cluster.cache.amazonaws.com" \
  REDIS_PORT="6379" \
  REDIS_TLS="true"
```

## Verifying Redis Connection

After deploying, check your Fly.io logs:

```bash
flyctl logs
```

You should see:
```
✅ Redis connected successfully to your-host:6379 (TLS: true)
✅ Redis client is ready to accept commands
```

If you see warnings like:
```
⚠️ Redis not connected, skipping set operation
```

This means Redis is not properly configured. Check:

1. **Environment variables are set:**
   ```bash
   flyctl secrets list
   ```

2. **Redis host is accessible:**
   - Verify firewall rules allow connections
   - Check if Redis host is online

3. **Credentials are correct:**
   - Double-check password
   - Verify host and port

## Troubleshooting

### Connection Timeouts

If you see timeout errors:

1. **Check TLS setting:**
   ```bash
   # Make sure REDIS_TLS is set to "true" for cloud providers
   flyctl secrets set REDIS_TLS="true"
   ```

2. **Verify network access:**
   - Upstash: Allow connections from all IPs (default)
   - AWS ElastiCache: Add Fly.io IP ranges to security groups

### Authentication Errors

```bash
# Ensure password is correctly set
flyctl secrets set REDIS_PASSWORD="your-actual-password"
```

### TLS/SSL Errors

For cloud Redis providers like Upstash:
```bash
# This is required for TLS connections
flyctl secrets set REDIS_TLS="true"
```

## Optional: Redis Without Cloud Provider

You can run without Redis for development/testing:

1. **Don't set REDIS_URL or REDIS_HOST**
   - The app will run without caching
   - You'll see: `⚠️ Redis unavailable - continuing without cache`

2. **This is fine for:**
   - Local development
   - Small deployments
   - Testing

3. **Not recommended for:**
   - Production with multiple users
   - High-traffic applications
   - Apps requiring real-time features

## Cost Considerations

### Upstash (Recommended)
- **Free Tier:** 10,000 commands/day
- **Pro:** Pay-per-use, starts at $0.20/100K commands
- **Best for:** Most deployments

### Fly.io Redis (Self-hosted)
- **Cost:** Based on VM size (~$3-10/month)
- **Setup:** More complex
- **Best for:** High traffic, full control needed

### AWS ElastiCache
- **Cost:** Starts at ~$15/month
- **Best for:** Enterprise deployments

## Best Practices

1. **Always use TLS in production:**
   ```bash
   REDIS_TLS=true
   ```

2. **Set strong passwords:**
   ```bash
   # Generate a strong password
   openssl rand -base64 32
   ```

3. **Monitor usage:**
   - Check Upstash dashboard for command count
   - Set up alerts for quota limits

4. **Use appropriate TTL:**
   - Cache frequently accessed data
   - Set reasonable expiration times (1-24 hours)

5. **Test failover:**
   - Ensure app works without Redis
   - Don't rely on Redis for critical data storage

## Next Steps

After setting up Redis:

1. **Verify connection** in Fly.io logs
2. **Test caching** by making API requests
3. **Monitor performance** improvements
4. **Set up alerts** for Redis issues

## Support

If you encounter issues:
1. Check Fly.io logs: `flyctl logs`
2. Verify secrets: `flyctl secrets list`
3. Test Redis connection locally
4. Review Upstash dashboard for errors

For more help, see:
- Upstash Docs: https://docs.upstash.com/redis
- Fly.io Docs: https://fly.io/docs/
- Redis Docs: https://redis.io/docs/
