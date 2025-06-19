# AWS EC2 Production Deployment Checklist

## Pre-Deployment Requirements

### AWS Infrastructure Setup
- [ ] **EC2 Instance**: t3.medium or larger with Ubuntu 22.04 LTS
- [ ] **RDS PostgreSQL**: db.t3.micro or larger with backup enabled
- [ ] **S3 Bucket**: `krugman-insights-uploads` with public read access
- [ ] **IAM User**: EC2 and S3 permissions configured
- [ ] **Security Groups**: Port 80, 443, and 22 open
- [ ] **Elastic IP**: Assigned to EC2 instance for consistent access

### Domain and SSL
- [ ] **Domain**: krugmaninsights.com pointed to Elastic IP
- [ ] **SSL Certificate**: Let's Encrypt or AWS Certificate Manager
- [ ] **DNS Records**: A record for domain and www subdomain

## Environment Variables Configuration

### Critical Variables
```bash
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/krugman_insights
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters
```

### Stripe Configuration
- [ ] **Live Keys**: Production Stripe keys configured
- [ ] **Price IDs**: Monthly, annual, and student prices set
- [ ] **Webhooks**: Stripe webhook endpoint configured
- [ ] **Payment Methods**: Credit cards and ACH enabled

### Email Service (AWS SES)
- [ ] **Domain Verification**: krugmaninsights.com verified in SES
- [ ] **DKIM Setup**: Email authentication configured
- [ ] **Sending Limits**: Production limits requested and approved
- [ ] **Templates**: Welcome and transaction email templates ready

## Server Setup Checklist

### System Dependencies
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 Process Manager
sudo npm install -g pm2

# Nginx Reverse Proxy
sudo apt install nginx -y

# Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Application Deployment
- [ ] **Repository Clone**: Latest code deployed to `/var/www/krugman-backend`
- [ ] **Dependencies**: `npm ci --only=production` completed
- [ ] **Build Process**: `npm run build` successful
- [ ] **Environment File**: `.env.production` with all variables
- [ ] **Permissions**: Correct file ownership and permissions set

### Database Setup
- [ ] **Connection Test**: Backend can connect to RDS instance
- [ ] **Schema Migration**: `npm run db:push` completed
- [ ] **Admin User**: Default admin account created
- [ ] **Sample Data**: Basic categories and settings configured

## Service Configuration

### PM2 Configuration
```bash
# Start application
pm2 start ecosystem.config.js

# Enable startup
pm2 startup
pm2 save

# Monitor status
pm2 status
pm2 logs
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name krugmaninsights.com www.krugmaninsights.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name krugmaninsights.com www.krugmaninsights.com;

    ssl_certificate /etc/letsencrypt/live/krugmaninsights.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/krugmaninsights.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Hardening

### System Security
- [ ] **Firewall**: UFW configured with necessary ports only
- [ ] **SSH**: Key-based authentication, password login disabled
- [ ] **Updates**: System packages updated to latest versions
- [ ] **User Access**: Non-root user for application deployment
- [ ] **Fail2Ban**: Intrusion prevention system configured

### Application Security
- [ ] **Rate Limiting**: API endpoints protected against abuse
- [ ] **CORS**: Proper origin restrictions configured
- [ ] **Headers**: Security headers (HSTS, CSP, etc.) enabled
- [ ] **Input Validation**: All user inputs sanitized and validated
- [ ] **Session Security**: Secure cookies and session management

## Testing and Validation

### Functional Tests
- [ ] **Health Check**: `/api/health` returns 200 OK
- [ ] **Database**: Article creation and retrieval working
- [ ] **File Upload**: Image upload to S3 functional
- [ ] **Authentication**: Login/logout flow working
- [ ] **Stripe**: Payment processing functional
- [ ] **Email**: Welcome emails sending successfully

### Performance Tests
- [ ] **Load Test**: Application handles expected traffic
- [ ] **Memory Usage**: Within acceptable limits under load
- [ ] **Response Times**: API endpoints respond within 500ms
- [ ] **Database Queries**: Optimized for production load
- [ ] **Cache Performance**: Multi-layer caching working

### Monitoring Setup
- [ ] **PM2 Monitoring**: Process health monitoring active
- [ ] **Log Rotation**: Application logs rotating properly
- [ ] **Error Tracking**: Critical errors being captured
- [ ] **Uptime Monitoring**: External monitoring service configured
- [ ] **Backup Verification**: Database backups working

## Go-Live Checklist

### Final Verification
- [ ] **SSL Certificate**: HTTPS working correctly
- [ ] **Domain Resolution**: Both www and non-www resolving
- [ ] **Stripe Webhooks**: Test webhook delivery working
- [ ] **Email Delivery**: Test emails reaching recipients
- [ ] **File Uploads**: Test image upload and display
- [ ] **Admin Panel**: Admin authentication and article creation

### Post-Deployment
- [ ] **Performance Monitoring**: Response times acceptable
- [ ] **Error Monitoring**: No critical errors in logs
- [ ] **User Registration**: New user flow working
- [ ] **Payment Processing**: Test subscription creation
- [ ] **Content Management**: Admin can create/edit articles
- [ ] **Email Notifications**: All email types sending correctly

## Rollback Plan

### Emergency Procedures
- [ ] **Database Backup**: Recent backup available for restore
- [ ] **Code Rollback**: Previous version tagged and deployable
- [ ] **Service Restart**: PM2 restart procedure documented
- [ ] **Emergency Contacts**: Team contacts for critical issues
- [ ] **Monitoring Alerts**: Immediate notification setup

## Success Criteria

### Performance Metrics
- API response time < 500ms average
- 99.9% uptime target
- Zero critical security vulnerabilities
- All payment processing functional
- Email delivery rate > 95%

### Business Requirements
- User registration and authentication working
- Article creation and publishing functional
- Subscription management operational
- File upload and storage working
- Admin panel fully functional

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Verified By**: ___________
**Status**: ___________