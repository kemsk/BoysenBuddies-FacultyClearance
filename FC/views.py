from django.shortcuts import render
from datetime import datetime
from .models import * 

def dashboard_view(request):
    return render(request, 'system/dashboard.html')
