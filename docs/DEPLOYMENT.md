# Deployment Guide

## Overview

DIY Indie Empire is a PWA that can be deployed to web hosting platforms and packaged as native apps for iOS and Android.

## Web Deployment

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Environment Variables

Create a `.env.production` file:

```env
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://api.yourdomain.com
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

### Build Process

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build for production
npm run build

# Preview build locally
npm run preview
```

### Deployment Platforms

#### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Follow prompts
4. Set environment variables in Vercel dashboard

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

#### Netlify

1. Connect GitHub repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

#### AWS S3 + CloudFront

```bash
# Build the app
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Web Server Configuration

#### nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/diy-indie-empire;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/diy-indie-empire
    
    <Directory /var/www/diy-indie-empire>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>
    
    # Cache headers
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>
</VirtualHost>
```

## iOS Deployment

### Prerequisites
- macOS with Xcode 14+
- Apple Developer Account ($99/year)
- Valid certificates and provisioning profiles

### Build Process

```bash
# Add iOS platform if not already added
npm run cap:add:ios

# Build web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npm run cap:open:ios
```

### Xcode Configuration

1. **Bundle Identifier**: `com.yourdomain.diyindieempire`
2. **Display Name**: "DIY Empire"
3. **Version**: Match package.json version
4. **Build Number**: Increment for each upload

### App Store Submission

1. **Archive Build**
   - Select "Generic iOS Device"
   - Product → Archive
   - Validate archive
   - Upload to App Store Connect

2. **App Store Connect**
   - Create new app
   - Fill in metadata
   - Upload screenshots (6.5", 5.5", iPad)
   - Submit for review

3. **Required Assets**
   - App icon (1024x1024)
   - Screenshots for all device sizes
   - App preview video (optional)
   - Privacy policy URL
   - Support URL

## Android Deployment

### Prerequisites
- Android Studio
- Google Play Developer Account ($25 one-time)
- Signing keystore

### Build Process

```bash
# Add Android platform if not already added
npm run cap:add:android

# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npm run cap:open:android
```

### Generate Signed APK/AAB

1. **Create Keystore** (first time only)
   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
   ```

2. **Build Release**
   - Build → Generate Signed Bundle/APK
   - Choose Android App Bundle
   - Select keystore
   - Build release

3. **Gradle Configuration**
   ```gradle
   android {
       defaultConfig {
           applicationId "com.yourdomain.diyindieempire"
           versionCode 1
           versionName "1.0.0"
       }
       
       signingConfigs {
           release {
               storeFile file("release-key.jks")
               storePassword System.getenv("KEYSTORE_PASSWORD")
               keyAlias "my-alias"
               keyPassword System.getenv("KEY_PASSWORD")
           }
       }
   }
   ```

### Google Play Console

1. **Create Application**
   - Set up store listing
   - Upload AAB file
   - Fill in content rating
   - Set pricing ($6.99)

2. **Required Assets**
   - Feature graphic (1024x500)
   - Screenshots (min 2, max 8)
   - High-res icon (512x512)
   - Privacy policy
   - Store description

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  build-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist

  deploy-vercel:
    needs: build-web
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Monitoring

### Error Tracking (Sentry)

```typescript
// src/utils/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Analytics

```typescript
// src/utils/analytics.ts
export const analytics = {
  track(event: string, properties?: Record<string, any>) {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', event, properties);
    }
    
    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(event, properties);
    }
  }
};
```

### Performance Monitoring

- Use Lighthouse CI in deployment pipeline
- Monitor Core Web Vitals
- Set up alerts for performance regressions

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Content Security Policy implemented
- [ ] API keys not exposed in client code
- [ ] Input validation on all forms
- [ ] XSS protection
- [ ] CSRF protection if applicable
- [ ] Regular dependency updates
- [ ] Code signing for native apps

## Post-Deployment

1. **Verify Deployment**
   - Test all critical paths
   - Check offline functionality
   - Verify PWA installation
   - Test on multiple devices

2. **Monitor**
   - Error rates
   - Performance metrics
   - User analytics
   - Crash reports

3. **Iterate**
   - A/B testing
   - Feature flags
   - Gradual rollouts
   - User feedback integration