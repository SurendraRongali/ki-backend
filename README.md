
# Krugman Insights Backend API

Production-ready backend server for AWS EC2 deployment with complete Stripe integration, AWS S3 file storage, and PostgreSQL database support.

## Architecture Overview

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Amazon RDS)
- **File Storage**: AWS S3 (production) / Local storage (development)
- **Authentication**: Session-based with Passport.js
- **Payment Processing**: Stripe with subscription management
- **Email Service**: AWS SES
- **Caching**: Multi-layer caching with Redis support
- **Process Management**: PM2 with cluster mode

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
# Build and deploy
./deploy.sh

# Start with PM2
pm2 start ecosystem.config.js
```

## Environment Configuration

Copy `.env.production` and configure your values:

### Required Environment Variables

```bash
# Database (Amazon RDS)
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/krugman_insights

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=krugman-insights-uploads

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_MONTHLY_PRICE_ID=price_1RUXrHGAixSTaxqag9FihzM6
STRIPE_ANNUAL_PRICE_ID=price_1RUXtUGAixSTaxqalX2E5YkM
STRIPE_STUDENT_PRICE_ID=price_1RUXocGAixSTaxqavdSrD6GC

# Session Security
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/user` - Get current user

### Articles
- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get specific article
- `POST /api/admin/articles` - Create article (admin only)
- `PUT /api/admin/articles/:id` - Update article (admin only)

### Subscription Management
- `POST /api/create-subscription` - Create Stripe subscription
- `GET /api/subscription-details` - Get user subscription
- `POST /api/cancel-subscription` - Cancel subscription
- `GET /api/payment-methods` - Get user payment methods

### File Upload
- `POST /api/admin/articles` - Upload images with articles (S3/local)

## AWS S3 Integration

The system automatically detects the environment:
- **Production**: Uses AWS S3 for file storage
- **Development**: Uses local file storage

### S3 Configuration
1. Create S3 bucket: `krugman-insights-uploads`
2. Set bucket policy for public read access
3. Configure CORS for web uploads
4. Set up IAM user with S3 permissions

## Database Schema

Database schema is managed through Drizzle ORM:

```bash
# Push schema changes
npm run db:push

# Generate migrations
npm run db:migrate

# Open database studio
npm run db:studio
```

## Security Features

- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection prevention
- XSS protection
- Session security with secure cookies

## Production Deployment

### 1. Server Setup (EC2)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install nginx -y
```

### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url>
cd backend

# Run deployment script
./deploy.sh

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

## Monitoring and Logs

### PM2 Monitoring
```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart application
pm2 restart krugman-insights-backend
```

### Health Checks
- `GET /api/health` - Application health status
- `GET /api/cache/health` - Cache system status

## Performance Optimization

- Multi-layer caching system
- Database query optimization
- Gzip compression
- Static file serving
- Connection pooling
- Memory usage monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check environment variables
   echo $DATABASE_URL
   
   # Test connection
   npm run db:push
   ```

2. **File Upload Issues**
   ```bash
   # Check AWS credentials
   aws s3 ls s3://krugman-insights-uploads
   
   # Verify S3 permissions
   aws iam get-user
   ```

3. **Stripe Integration**
   ```bash
   # Verify Stripe keys
   curl -u $STRIPE_SECRET_KEY: https://api.stripe.com/v1/customers
   ```

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Contributing

1. Follow TypeScript strict mode
2. Use Drizzle ORM for database operations
3. Add proper error handling
4. Include tests for new features
5. Update documentation

## Support

For production issues:
- Check PM2 logs: `pm2 logs`
- Monitor system resources: `htop`
- Review nginx logs: `sudo tail -f /var/log/nginx/error.log`
>>>>>>> 9943aa5 (Initial commit for krugman main website backend code)
