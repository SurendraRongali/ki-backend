AWS EC2 Deployment Configuration
Server Configuration
Port Binding
Development: 0.0.0.0:5000 (Replit environment)
Production: 0.0.0.0:8080 (AWS EC2 default)
Custom Port: Use PORT environment variable to override
Public Access on EC2
Option 1: Direct Public IP Access
# Your API will be accessible at:
http://YOUR_EC2_PUBLIC_IP:8080
# Example:
http://52.91.123.456:8080/api/health
Option 2: Load Balancer (Recommended)
# Application Load Balancer forwards to EC2 instances
http://your-alb-dns-name.us-east-1.elb.amazonaws.com/api/health
# Custom domain with ALB
https://api.yourdomain.com/api/health
Option 3: Reverse Proxy (Nginx)
# Nginx configuration on EC2
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
Security Groups Configuration
Inbound Rules Required
Type: HTTP
Protocol: TCP
Port: 8080
Source: 0.0.0.0/0 (or specific IP ranges)
Type: HTTPS  
Protocol: TCP
Port: 443
Source: 0.0.0.0/0 (if using SSL)
Type: SSH
Protocol: TCP
Port: 22
Source: Your IP address
Environment Variables for EC2
# Required environment variables
export NODE_ENV=production
export PORT=8080
export DATABASE_URL=postgresql://username:password@rds-endpoint:5432/dbname
export STRIPE_SECRET_KEY=sk_live_...
export VITE_STRIPE_PUBLIC_KEY=pk_live_...
export SESSION_SECRET=your-session-secret
# Optional
export AWS_REGION=us-east-1
export S3_BUCKET=your-bucket-name
Deployment Commands
1. Build and Start
npm run build
npm run production:start
2. PM2 Process Manager (Recommended)
# Install PM2
npm install -g pm2
# Start with PM2
pm2 start ecosystem.config.js
# Monitor
pm2 status
pm2 logs
3. Systemd Service
# Create service file
sudo nano /etc/systemd/system/krugman-api.service
# Service configuration:
[Unit]
Description=Krugman Insights API
After=network.target
[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/backend
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=8080
[Install]
WantedBy=multi-user.target
Health Check Endpoints
The server provides health check endpoints for load balancers:

# Basic health check
GET /api/health
# Database health check  
GET /api/cache/health
# Detailed system status
GET /api/status
SSL/HTTPS Configuration
Option 1: ALB with SSL Certificate
Configure SSL certificate in Application Load Balancer
ALB handles SSL termination
Backend runs HTTP on port 8080
Option 2: Direct SSL (Nginx + Let's Encrypt)
# Install Certbot
sudo yum install certbot python3-certbot-nginx
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
Public IP Access Flow
Internet → EC2 Public IP:8080 → Your API Server
Internet → Load Balancer → EC2 Private IP:8080 → Your API Server
Internet → CloudFront → Load Balancer → EC2:8080 → Your API Server
Frontend Connection
Your frontend will connect to the backend using:

// Production API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';
// API calls
fetch(`${API_BASE_URL}/api/articles`)
Example EC2 Setup Script
#!/bin/bash
# EC2 setup script
# Update system
sudo yum update -y
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
# Install PM2
npm install -g pm2
# Clone and setup application
git clone https://github.com/yourusername/krugman-backend.git
cd krugman-backend/backend
npm install
npm run build
# Set environment variables
export NODE_ENV=production
export PORT=8080
# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
# Configure firewall (if needed)
sudo ufw allow 8080
sudo ufw enable