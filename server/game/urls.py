from django.urls import path
from . import views

urlpatterns = [
    path('games/', views.list_games, name='list_games'),
    path('games/<str:game_id>/', views.get_game, name='get_game'),
    path('games/<str:game_id>/moves/', views.get_game_moves, name='game_moves'),
    path('user-games/<str:username>/', views.get_user_games, name='user_games'),
]