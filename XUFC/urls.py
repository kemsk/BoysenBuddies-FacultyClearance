"""
URL configuration for XUFC project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from FC import views as fc_views

urlpatterns = [
    path('admin/xu-faculty-clearance/', include('FC.urls')),
    path('accounts/login/google/', fc_views.google_oauth_start, name='google_oauth_start'),
    path('accounts/login/google/callback/', fc_views.google_oauth_callback, name='google_oauth_callback'),
    path('login/check-email/', fc_views.check_email_api, name='check_email_api'),
    path('login/request-otp/', fc_views.request_otp_api, name='request_otp_api'),
    path('login/verify-otp/', fc_views.verify_otp_api, name='verify_otp_api'),
]

