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
            status_color = "#22c55e"
            status_badge_color = "#dcfce7"
            status_text_color = "#166534"
            message_text = "Your submission has been approved."
        else:
            subject = f"Your Clearance Has Been Rejected - {requirement_title}"
            status_text = "REJECTED"
            status_color = "#ef4444"
            status_badge_color = "#fee2e2"
            status_text_color = "#991b1b"
            message_text = "Your submission has been reviewed. Please check the details below and resubmit after addressing the remarks."
        
        html_message = f"""
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; width: 100%;">
                <table width="100%" style="background-color: #f5f5f5; border-collapse: collapse; margin: 0; padding: 0;">
                    <tr>
                        <td style="padding: 20px;">
                            <div style="max-width: 640px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: visible; width: 100%;">
                    <!-- Header with Icon -->
                    <table width="100%" style="background-color: #1e293b; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 16px 28px; vertical-align: middle;">
                                <table style="border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 0; vertical-align: middle; padding-right: 12px;">
                                            <div style="width: 40px; height: 40px; background-color: rgba(255,255,255,0.25); border-radius: 50%; text-align: center; line-height: 40px; font-size: 24px;">
                                                🎓
                                            </div>
                                        </td>
                                        <td style="padding: 0; vertical-align: middle;">
                                            <div style="font-size: 16px; font-weight: 600; color: white;">Faculty Clearance System</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Main Content -->
                    <table width="100%" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 16px 20px;">
                                <!-- Title with Status Badge -->
                                <table width="100%" style="border-collapse: collapse; margin-bottom: 2px;">
                                    <tr>
                                        <td style="vertical-align: top;">
                                            <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1e293b;">Clearance decision</h1>
                                        </td>
                                        <td style="text-align: right; vertical-align: top;">
                                            <div style="background-color: {status_badge_color}; color: {status_text_color}; padding: 3px 8px; border-radius: 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                                                {status_text}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 0 0 6px 0; font-size: 12px; color: #999;">Automated notification — do not reply</p>
                                
                                <!-- Greeting and Message -->
                                <p style="margin: 0 0 6px 0; font-size: 12px; color: #555; line-height: 1.2;">
                                    Dear {faculty_name}, your submission has been reviewed.
                                </p>
                                
                                <!-- Details Section - 2 Column Table -->
                                <table width="100%" style="background-color: #f5f5f5; margin-bottom: 8px; border-collapse: collapse; border-radius: 6px; overflow: hidden;">
                                    <tr>
                                        <td style="padding: 10px 14px; vertical-align: middle; width: 50%; border-right: 1px solid #e5e7eb;">
                                            <div style="color: #999; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 3px;">Requirement</div>
                                            <div style="color: #1e293b; font-weight: 500; font-size: 12px; margin-bottom: 10px;">{requirement_title}</div>
                                            
                                            <div style="color: #999; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 3px;">Reviewed By</div>
                                            <div style="color: #1e293b; font-weight: 500; font-size: 12px;">{approver_name}</div>
                                        </td>
                                        <td style="padding: 10px 14px; vertical-align: middle; width: 50%;">
                                            <div style="color: #999; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 3px;">Status</div>
                                            <div style="color: {status_text_color}; font-weight: 600; font-size: 12px; margin-bottom: 10px;">● {status_text}</div>
                                            
                                            <div style="color: #999; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 3px;">Date</div>
                                            <div style="color: #1e293b; font-weight: 500; font-size: 12px;">Today</div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Remarks Section -->
                                <table width="100%" style="border: 1px solid #ddd; border-collapse: collapse; margin-bottom: 0; border-radius: 4px;">
                                    <tr>
                                        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; background-color: #fafafa;">
                                            <span style="color: #666; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">💬 Remarks</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 10px; font-size: 12px; color: #333; line-height: 1.3;">
                                            {remarks if remarks else "No remarks"}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer with Button -->
                    <table width="100%" style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 20px; vertical-align: middle;">
                                <p style="margin: 0; font-size: 11px; color: #666;">Xavier University — Faculty Clearance Portal</p>
                                <p style="margin: 2px 0 0 0; color: #999; font-size: 10px;">This is an automated notification. Please do not reply to this email.</p>
                            </td>
                            <td style="padding: 12px 20px; text-align: right; vertical-align: middle;">
                                <a href="https://localhost:4433/faculty-dashboard" style="display: inline-block; background-color: #1e293b; color: white; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 12px; white-space: nowrap;">
                                    View portal →
                                </a>
                            </td>
                        </tr>
                    </table>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
        """
        
        plain_message = f"""
FACULTY CLEARANCE SYSTEM
========================

CLEARANCE DECISION - {status_text}

Dear {faculty_name},

Your submission has been reviewed. Please check the details below and resubmit after addressing the remarks.

DETAILS
-------
Requirement:  {requirement_title}
Status:       {status_text}
Reviewed By:  {approver_name}
Date:         Today

REMARKS FROM REVIEWER
---------------------
{remarks if remarks else "No remarks provided"}

---

Xavier University — Faculty Clearance Portal
This is an automated notification. Please do not reply to this email.
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
