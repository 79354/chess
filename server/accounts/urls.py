from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('me/', views.get_current_user, name='current_user'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('password/change/', views.change_password, name='change_password'),
    path('users/<str:username>/', views.get_user_profile, name='user_profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]