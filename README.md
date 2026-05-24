# BoysenBuddies Faculty Clearance System

A comprehensive faculty clearance management system designed to streamline the clearance process for academic institutions. The system automates and digitizes the traditional paper-based clearance workflow, enabling faculty members to complete their clearance requirements efficiently while providing administrators with real-time tracking and monitoring capabilities.

## 📁 Table of Contents
- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Environment Configuration](#environment-configuration)
  - [Docker Setup](#docker-setup)
- [Usage](#usage)
- [Directory Structure](#directory-structure)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## About
The BoysenBuddies Faculty Clearance System aims to modernize and digitize the faculty clearance process within academic institutions. By replacing traditional manual paperwork with an automated digital workflow, the system enhances efficiency, reduces processing time, and provides transparency throughout the clearance lifecycle. This solution addresses common challenges such as lost paperwork, delayed approvals, and lack of real-time status tracking.

## Features

### 📋 Feature 1 - Digital Clearance Forms
Electronic clearance forms that replace paper-based documentation with customizable digital forms tailored to different clearance requirements.

**Key Capabilities:**
- Dynamic form generation based on faculty type and department
- Real-time form validation and error checking
- Auto-save functionality to prevent data loss
- Digital signature integration
- Historical record keeping

### 🔍 Feature 2 - Department Integration
Seamless integration with various academic departments to automate clearance verification and approval workflows.

**Key Capabilities:**
- Multi-department clearance tracking
- Automated notification systems
- Department-specific clearance requirements
- Real-time status updates across departments
- Escalation management for pending clearances

### 👤 Feature 3 - Faculty Dashboard
Comprehensive dashboard providing faculty members with a centralized view of their clearance status and requirements.

**Key Capabilities:**
- Personal clearance status overview
- Pending and completed requirements display
- Department-specific clearance progress
- Document upload and management
- Clearance history and archives

### 📊 Feature 4 - Administrative Analytics
Advanced reporting and analytics tools for administrators to monitor clearance trends and process efficiency.

**Key Capabilities:**
- Real-time clearance statistics
- Department-wise completion rates
- Processing time analytics
- Bottleneck identification
- Exportable reports and data visualization

### 🔔 Feature 5 - Notification System
Automated notification system that keeps all stakeholders informed about clearance status updates and actions required.

**Key Capabilities:**
- Email notifications for status changes
- SMS alerts for urgent clearances
- In-app messaging system
- Reminder scheduling
- Custom notification templates

### 🔐 Feature 6 - Role-Based Access Control
Comprehensive security system with role-based permissions to ensure data integrity and appropriate access levels.

**Key Capabilities:**
- Multi-tier user roles (Faculty, Department Head, Admin)
- Granular permission controls
- Audit trail for all actions
- Secure authentication system
- Session management and timeout

## Tech Stack
- **Python 3.11+**
- **PostgreSQL 14+**
- **Django 4.2+**
- **Docker & Docker Compose**
- **Redis** (for caching and sessions)
- **Celery** (for background tasks)
- **JWT Authentication**
- **Bootstrap 5** (Frontend Framework)

## Prerequisites
Before running the project, ensure you have the following installed:
- Docker Desktop
- Docker Compose
- Git
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/your-username/BoysenBuddies-FacultyClearance.git
cd BoysenBuddies-FacultyClearance
```

### Environment Configuration
1. Copy the environment file sample:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
- Database credentials
- Email server settings
- Redis configuration
- Secret key settings
- Application ports

### Docker Setup
1. Build and start the services:
```bash
docker-compose up --build
```

2. Access the application:
   - **Faculty Clearance System**: http://localhost:443

3. Stop the services:
```bash
docker-compose down
```

## Usage

### For Faculty Members
1. **Login**: Use institutional credentials or create an account
2. **View Dashboard**: Check current clearance status and requirements
3. **Submit Clearances**: Complete digital forms for each department
4. **Upload Documents**: Attach required documentation
5. **Track Progress**: Monitor real-time clearance approval status

### For Department Heads
1. **Review Requests**: Access pending clearance requests from faculty
2. **Verify Requirements**: Check submitted documents and forms
3. **Approve/Deny**: Process clearance requests with comments
4. **Generate Reports**: Create department-specific clearance reports

### For System Administrators
1. **User Management**: Create and manage faculty and staff accounts
2. **System Configuration**: Set up departments and clearance requirements
3. **Monitor Performance**: Track system usage and processing times
4. **Generate Analytics**: Create comprehensive clearance reports

## Directory Structure
```
├── FC/                          # Main Django application
├── Frontend/                    # Frontend application
├── static/                      # Static files (CSS, JS, images)
├── XUFC/                        # XUFC files
├── cert.pem                     # SSL certificate
├── key.pem                      # SSL key
├── entrypoint.sh                # Entry point script
├── Dockerfile                   # Main Dockerfile
├── compose.prod.yml             # Production setup
├── .dockerignore                # Docker ignore file
├── .gitignore                   # Git ignore file
├── manage.py                    # Django management script
├── .env                         # Environment variables
├── README.md                    # This file
├── requirements.txt             # Python dependencies
```

## Troubleshooting

### Common Issues

**🔧 ISSUE 1: Docker Build Fails**
- **Cause**: Docker not running or .env file misconfigured
- **Solution**: 
  - Ensure Docker Desktop is running
  - Verify `.env` file exists with correct values
  - Check all required environment variables are set

**🔧 ISSUE 2: Database Connection Errors**
- **Cause**: PostgreSQL service not running or incorrect credentials
- **Solution**:
  - Check PostgreSQL container status: `docker ps`
  - Verify database credentials in `.env`
  - Restart database service: `docker-compose restart db`

**🔧 ISSUE 3: Port Already in Use**
- **Cause**: Conflicting service using the same ports
- **Solution**:
  - Change `PORT` values in `.env` file
  - Stop conflicting services: `netstat -ano | findstr :8000`
  - Use different ports and update configuration

**🔧 ISSUE 4: Email Notifications Not Working**
- **Cause**: SMTP configuration issues or blocked ports
- **Solution**:
  - Verify email server settings in `.env`
  - Check firewall and port 587/465 availability
  - Test SMTP connection manually

**🔧 ISSUE 5: File Upload Failures**
- **Cause**: Insufficient permissions or storage space
- **Solution**:
  - Check media directory permissions
  - Verify available disk space
  - Ensure proper file size limits in settings

**🔧 ISSUE 6: Redis Connection Issues**
- **Cause**: Redis service not running or network issues
- **Solution**:
  - Check Redis container status: `docker ps`
  - Verify Redis configuration in `.env`
  - Restart Redis service: `docker-compose restart redis`

## System Architecture

### Application Flow
```
Faculty Dashboard (Port 8000)
    ↓ (Clearance Requests)
Department Modules (Port 8000)
    ↓ (Approvals/Updates)
Administrative Panel (Port 8000)
    ↓ (Data Persistence)
PostgreSQL Database (Port 5432)
```

### Service Integration
- **PostgreSQL**: Primary data storage
- **Redis**: Caching and session management
- **Celery**: Background task processing
- **SMTP**: Email notification delivery
- **JWT**: Authentication and authorization

## Development Guidelines

### Code Standards
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Document all API endpoints and models
- Implement comprehensive error handling
- Write unit tests for all major functions

### Security Best Practices
- Validate all user inputs and file uploads
- Sanitize database queries to prevent SQL injection
- Use HTTPS in production environments
- Implement proper session management
- Regular security audits and dependency updates
- Encrypt sensitive data at rest and in transit

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature description'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request with detailed description

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User authentication
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Token refresh

### Clearance Endpoints
- `GET /api/clearance/status/` - Get clearance status
- `POST /api/clearance/submit/` - Submit clearance request
- `GET /api/clearance/history/` - Get clearance history

### Department Endpoints
- `GET /api/departments/` - List all departments
- `POST /api/departments/{id}/approve/` - Approve clearance
- `GET /api/departments/{id}/pending/` - Get pending requests

## License

This project is proprietary to BoysenBuddies Development Team and partner academic institutions.

## References

### Django & Web Development
- [Django Official Documentation](https://docs.djangoproject.com/)
- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)

### Docker & Deployment
- [Docker Django Guide](https://www.docker.com/blog/how-to-dockerize-django-app/)
- [Production Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Docker Compose Best Practices](https://docs.docker.com/compose/compose-file/)

### Database & Backend
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Celery Documentation](https://docs.celeryproject.org/)

### Security & Authentication
- [Django Security Best Practices](https://docs.djangoproject.com/en/stable/topics/security/)
- [JWT Authentication Guide](https://jwt.io/)
- [OWASP Security Guidelines](https://owasp.org/)

---

**Development Team**: BoysenBuddies Development Team  
**Project Type**: Faculty Clearance Management System  
**Target Institutions**: Academic Institutions and Universities