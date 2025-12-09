"""
Script to create test users for challenge system testing
Run: python manage.py shell < setup_test_users.py
"""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from accounts.models import User, Friendship
from django.db import IntegrityError


def setup_test_users():
    """Create test users and make them friends"""
    
    print("Setting up test users for chess challenge system...")
    
    # User credentials
    users_data = [
        {'username': 'player1', 'email': 'player1@test.com', 'password': 'test123', 'rating': 1200},
        {'username': 'player2', 'email': 'player2@test.com', 'password': 'test123', 'rating': 1250},
        {'username': 'player3', 'email': 'player3@test.com', 'password': 'test123', 'rating': 1180},
    ]
    
    created_users = []

    # Create users
    for data in users_data:
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )
            user.rating = data['rating']
            user.is_email_verified = True
            user.save()
            created_users.append(user)
            print(f" Created user: {user.username} ({user.email})")
        except IntegrityError:
            user = User.objects.get(email=data['email'])
            created_users.append(user)
            print(f" User already exists: {user.username}")
    
    # Make them friends
    friendships = [
        (created_users[0], created_users[1]),  # player1 <-> player2
        (created_users[0], created_users[2]),  # player1 <-> player3
        (created_users[1], created_users[2]),  # player2 <-> player3
    ]
    
    for user1, user2 in friendships:
        try:
            Friendship.objects.create(user1=user1, user2=user2)
            print(f" Created friendship: {user1.username} <-> {user2.username}")
        except IntegrityError:
            print(f" Friendship already exists: {user1.username} <-> {user2.username}")
    
    print("\n" + "="*60)
    print("Test users setup complete!")
    print("="*60)
    print("\n Test Accounts:")
    print("-" * 60)
    for user in created_users:
        print(f"Username: {user.username:10} | Email: {user.email:25} | Password: test123")
    print("-" * 60)
    
    print("\n How to test:")
    print("1. Login as player1 (player1@test.com / test123)")
    print("2. Go to Friends page - you'll see player2 and player3")
    print("3. Click sword icon (⚔️) next to player2 to send challenge")
    print("4. Open incognito/another browser")
    print("5. Login as player2 (player2@test.com / test123)")
    print("6. Go to Friends page - you'll see challenge notification")
    print("7. Click 'Accept' to start the game!")
    print("\n✨ Happy testing!\n")

# Run the setup
setup_test_users()