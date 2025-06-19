# AWS EC2 Backend Deployment with Amazon RDS PostgreSQL

## Overview
This is a clean, production-ready Node.js backend for the Krugman Insights application, designed for deployment on AWS EC2 with Amazon RDS PostgreSQL.

## Architecture
- **Backend**: Node.js + Express + TypeScript
- **Database**: Amazon RDS PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (Local + Google OAuth)
- **Security**: Helmet, CORS, Rate limiting
- **Session Store**: PostgreSQL sessions

## Prerequisites

### AWS Setup
1. AWS account with EC2 and RDS access
2. EC2 instance (t3.medium or larger recommended)
3. Amazon RDS PostgreSQL instance
4. Security groups configured for HTTP/HTTPS traffic

### Local Requirements
- Node.js 18+
- npm or yarn
- Git

## Backend Directory Structure

```
backend/
├── src/
│   ├── schema/
│   │   └── index.ts          # Database schema
│   ├── routes/
│   │   └── index.ts          # API routes
│   ├── auth/
│   │   └── index.ts          # Authentication
│   └── index.ts              # Main server file
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
└── AWS_EC2_DEPLOYMENT.md
```

## Database Setup (Amazon RDS)

### 1. Create RDS PostgreSQL Instance
```bash
# Via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier krugman-insights-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx
```

### 2. Security Group Configuration
- Allow inbound connections on port 5432 from your EC2 instance
- Allow outbound connections from EC2 to RDS

### 3. Database Connection String
```
postgresql://postgres:password@your-rds-endpoint.amazonaws.com:5432/postgres
```

## EC2 Instance Setup

### 1. Launch EC2 Instance
- Instance type: t3.medium (minimum)
- OS: Ubuntu 22.04 LTS
- Security group: Allow HTTP (80), HTTPS (443), SSH (22)

### 2. Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

## Backend Deployment

### 1. Clone and Setup
```bash
# Clone your repository
git clone your-repo-url
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Environment Configuration
```bash
# Edit .env file
nano .env
```

Required environment variables:
```bash
DATABASE_URL=postgresql://postgres:password@your-rds-endpoint.amazonaws.com:5432/postgres
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-32-character-secret
FRONTEND_URL=https://your-frontend-domain.com
```

Optional (for full functionality):
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SENDGRID_API_KEY=your_sendgrid_api_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
```

### 3. Database Migration
```bash
# Push schema to database
npm run db:push

# Verify connection
npm run db:studio
```

### 4. Build and Start
```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name krugman-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

## Nginx Configuration

### 1. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/krugman-backend
```

```nginx
server {
    listen 80;
    server_name your-api-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
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

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/krugman-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-api-domain.com
```

## API Endpoints

The backend provides the following endpoints:

### Public Endpoints
- `GET /health` - Health check
- `GET /api/articles` - Get published articles
- `GET /api/articles/:id` - Get article by ID
- `GET /api/articles/slug/:slug` - Get article by slug
- `GET /api/featured` - Get featured article
- `GET /api/trending-now` - Get trending articles
- `GET /api/categories` - Get categories
- `GET /api/search?q=term` - Search articles
- `POST /api/newsletter/subscribe` - Newsletter subscription
- `POST /api/contact` - Contact form

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/google` - Google OAuth
- `POST /auth/logout` - User logout
- `GET /auth/status` - Authentication status

## Monitoring and Logs

### PM2 Monitoring
```bash
# View processes
pm2 list

# View logs
pm2 logs krugman-backend

# Restart application
pm2 restart krugman-backend

# Monitor resources
pm2 monit
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Database Management

### Backup
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql
```

### Schema Updates
```bash
# After schema changes
npm run db:push

# Generate migrations (if needed)
npm run db:migrate
```

## Security Considerations

1. **Environment Variables**: Never commit .env files
2. **Database**: Use strong passwords and enable SSL
3. **API Keys**: Store securely and rotate regularly
4. **HTTPS**: Always use SSL certificates in production
5. **Rate Limiting**: Configured for 1000 requests per 15 minutes
6. **CORS**: Configured to allow only your frontend domain

## Performance Optimization

1. **Database**: Enable connection pooling
2. **Caching**: Redis can be added for session caching
3. **CDN**: Use CloudFront for static assets
4. **Monitoring**: Set up CloudWatch for metrics
5. **Auto Scaling**: Configure Auto Scaling groups

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify RDS security groups
   - Check DATABASE_URL format
   - Ensure RDS instance is running

2. **502 Bad Gateway**
   - Check if Node.js process is running
   - Verify PM2 status
   - Check Nginx configuration

3. **CORS Errors**
   - Verify FRONTEND_URL in .env
   - Check Nginx proxy headers

### Debug Commands
```bash
# Check application status
pm2 status

# View application logs
pm2 logs krugman-backend --lines 100

# Test database connection
npm run db:studio

# Check Nginx configuration
sudo nginx -t
```

## Cost Estimation

**Monthly AWS Costs:**
- EC2 t3.medium: ~$30-40
- RDS db.t3.micro: ~$15-20
- Data transfer: ~$5-10
- **Total: ~$50-70/month**

This clean backend is production-ready and includes all essential features for the Krugman Insights application without the complexity of frontend dependencies or Vite configurations.