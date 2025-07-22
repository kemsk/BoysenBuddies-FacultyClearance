from django.urls import path
from . import views

app_name = 'fc'

urlpatterns = [
    path('dashboard', views.dashboard_view, name='Dashboard'),
]