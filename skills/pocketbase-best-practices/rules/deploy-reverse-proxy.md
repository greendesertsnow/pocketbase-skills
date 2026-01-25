---
title: Configure Reverse Proxy Correctly
impact: LOW-MEDIUM
impactDescription: HTTPS, caching, rate limiting, and security headers
tags: production, nginx, caddy, https, proxy
---

## Configure Reverse Proxy Correctly

Use a reverse proxy (Nginx, Caddy) for HTTPS termination, caching, rate limiting, and security headers.

**Incorrect (exposing PocketBase directly):**

```bash
# Direct exposure - no HTTPS, no rate limiting
./pocketbase serve --http="0.0.0.0:8090"

# Port forwarding without proxy
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8090
# Still no HTTPS!
```

**Correct (Caddy - simplest option):**

```caddyfile
# /etc/caddy/Caddyfile
myapp.com {
    # Automatic HTTPS via Let's Encrypt
    reverse_proxy 127.0.0.1:8090 {
        # Required for SSE/Realtime
        flush_interval -1
    }

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Rate limiting (requires caddy-ratelimit plugin)
    # rate_limit {
    #     zone api {
    #         key {remote_host}
    #         events 100
    #         window 1m
    #     }
    # }
}
```

**Correct (Nginx configuration):**

```nginx
# /etc/nginx/sites-available/pocketbase
upstream pocketbase {
    server 127.0.0.1:8090;
    keepalive 64;
}

server {
    listen 80;
    server_name myapp.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name myapp.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://pocketbase;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE/Realtime support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;

        # Timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Rate limit API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://pocketbase;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';
        proxy_buffering off;
    }

    # Static file caching
    location /api/files/ {
        proxy_pass http://pocketbase;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;
}
```

**Docker Compose with Caddy:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    restart: unless-stopped
    volumes:
      - ./pb_data:/pb_data
    environment:
      - PB_ENCRYPTION_KEY=${PB_ENCRYPTION_KEY}

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - pocketbase

volumes:
  caddy_data:
  caddy_config:
```

**Key configuration points:**

| Feature | Why It Matters |
|---------|---------------|
| HTTPS | Encrypts traffic, required for auth |
| SSE support | `proxy_buffering off` for realtime |
| Rate limiting | Prevents abuse |
| Security headers | XSS/clickjacking protection |
| Keepalive | Connection reuse, better performance |

Reference: [PocketBase Going to Production](https://pocketbase.io/docs/going-to-production/)
