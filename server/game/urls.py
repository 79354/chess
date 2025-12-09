from django.urls import path
from . import views

urlpatterns = [
    path('games/', views.list_games, name='list_games'),
    path('games/<str:game_id>/', views.get_game, name='get_game'),
    path('games/<str:game_id>/moves/', views.get_game_moves, name='game_moves'),
    path('user-games/<str:username>/', views.get_user_games, name='user_games'),

    # Challenge endpoints
    path('challenges/send/', challenge_views.send_challenge, name='send_challenge'),
    path('challenges/accept/', challenge_views.accept_challenge, name='accept_challenge'),
    path('challenges/reject/', challenge_views.reject_challenge, name='reject_challenge'),
    path('challenges/pending/', challenge_views.get_pending_challenges, name='pending_challenges'),
    path('challenges/<int:challenge_id>/cancel/', challenge_views.cancel_challenge, name='cancel_challenge'),
]