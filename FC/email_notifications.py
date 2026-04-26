import os
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import smtplib


def test_email_configuration():
    """Test if email configuration is correct"""
    try:
        print("=" * 60)
        print("TESTING EMAIL CONFIGURATION")
        print("=" * 60)
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        
        # Try to connect to SMTP server
        print("\nAttempting SMTP connection...")
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
        print(f"✓ Connected to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        
        # Try STARTTLS
        if settings.EMAIL_USE_TLS:
            server.starttls()
            print("✓ STARTTLS enabled")
        
        # Try to login
        password = settings.EMAIL_HOST_PASSWORD
        print(f"Attempting login with user: {settings.EMAIL_HOST_USER}")
        print(f"Password length: {len(password)} characters")
        
        server.login(settings.EMAIL_HOST_USER, password)
        print("✓ Authentication successful!")
        
        server.quit()
        print("\n✓ Email configuration is correct!")
        print("=" * 60)
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"✗ SMTP Authentication Failed: {str(e)}")
        print("  Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD")
        print("=" * 60)
        return False
    except smtplib.SMTPException as e:
        print(f"✗ SMTP Error: {str(e)}")
        print("=" * 60)
        return False
    except Exception as e:
        print(f"✗ Connection Error: {str(e)}")
        print("=" * 60)
        return False


def send_approver_notification_email(approver_email, faculty_name, requirement_title, action, remarks):
    """
    Send email notification to approver when a faculty is approved or rejected.
    
    Args:
        approver_email (str): Email address of the approver
        faculty_name (str): Name of the faculty member
        requirement_title (str): Title of the requirement
        action (str): "approve" or "reject"
        remarks (str): Remarks provided by the approver
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if action == "approve":
            subject = f"Faculty Clearance Approved - {faculty_name}"
            status_text = "APPROVED"
            status_color = "#28a745"
        else:
            subject = f"Faculty Clearance Rejected - {faculty_name}"
            status_text = "REJECTED"
            status_color = "#dc3545"
        
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Faculty Clearance Notification</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Faculty Name:</strong> {faculty_name}</p>
                        <p><strong>Requirement:</strong> {requirement_title}</p>
                        <p><strong>Status:</strong> <span style="background-color: {status_color}; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;">{status_text}</span></p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2c3e50;">Remarks:</h3>
                        <p style="background-color: #f0f0f0; padding: 10px; border-left: 4px solid {status_color}; border-radius: 3px;">
                            {remarks if remarks else "No remarks provided"}
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #666;">
                        This is an automated notification from the Faculty Clearance System. 
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        plain_message = f"""
Faculty Clearance Notification

Faculty Name: {faculty_name}
Requirement: {requirement_title}
Status: {status_text}

Remarks:
{remarks if remarks else "No remarks provided"}

---
This is an automated notification from the Faculty Clearance System.
Please do not reply to this email.
        """
        
        from_email = os.getenv('DEFAULT_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[approver_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
    
    except Exception as e:
        print(f"Error sending email notification: {str(e)}")
        return False


def send_faculty_notification_email(faculty_email, faculty_name, requirement_title, action, remarks, approver_name=""):
    """
    Send email notification to faculty when their clearance is approved or rejected.
    
    Args:
        faculty_email (str): Email address of the faculty member
        faculty_name (str): Name of the faculty member
        requirement_title (str): Title of the requirement
        action (str): "approve" or "reject"
        remarks (str): Remarks provided by the approver
        approver_name (str): Name of the approver
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        print(f"DEBUG: Starting email send to {faculty_email}")
        print(f"DEBUG: EMAIL_HOST={settings.EMAIL_HOST}, EMAIL_PORT={settings.EMAIL_PORT}, EMAIL_USE_TLS={settings.EMAIL_USE_TLS}")
        print(f"DEBUG: EMAIL_HOST_USER={settings.EMAIL_HOST_USER}")
        if action == "approve":
            subject = f"Your Clearance Has Been Approved - {requirement_title}"
            status_text = "APPROVED"
            status_color = "#28a745"
            message_text = "Your submission has been approved."
        else:
            subject = f"Your Clearance Has Been Rejected - {requirement_title}"
            status_text = "REJECTED"
            status_color = "#dc3545"
            message_text = "Your submission has been rejected. Please review the remarks below and resubmit if necessary."
        
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Faculty Clearance Decision</h2>
                    
                    <p style="font-size: 16px; margin: 20px 0;">Dear {faculty_name},</p>
                    
                    <p style="font-size: 14px; margin: 20px 0;">{message_text}</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Requirement:</strong> {requirement_title}</p>
                        <p><strong>Status:</strong> <span style="background-color: {status_color}; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;">{status_text}</span></p>
                        {f'<p><strong>Approved By:</strong> {approver_name}</p>' if approver_name else ''}
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2c3e50;">Remarks:</h3>
                        <p style="background-color: #f0f0f0; padding: 10px; border-left: 4px solid {status_color}; border-radius: 3px;">
                            {remarks if remarks else "No remarks provided"}
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #666;">
                        This is an automated notification from the Faculty Clearance System. 
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        plain_message = f"""
Faculty Clearance Decision

Dear {faculty_name},

{message_text}

Requirement: {requirement_title}
Status: {status_text}
{f'Approved By: {approver_name}' if approver_name else ''}

Remarks:
{remarks if remarks else "No remarks provided"}

---
This is an automated notification from the Faculty Clearance System.
Please do not reply to this email.
        """
        
        from_email = os.getenv('DEFAULT_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL)
        print(f"DEBUG: from_email={from_email}, recipient={faculty_email}")
        
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[faculty_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"DEBUG: send_mail returned {result}")
        return True
    
    except Exception as e:
        print(f"Error sending email notification to faculty: {str(e)}")
        print(f"DEBUG: Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False
