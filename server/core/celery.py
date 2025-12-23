import os
from celery import Celery
from celery.schedules import crontab

# MUST match settings.py location
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Load CELERY_* settings from Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in INSTALLED_APPS
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'cleanup-stale-matchmaking-queues': {
        'task': 'game.tasks.cleanup_stale_queues',
        'schedule': crontab(minute='*/5'),
    },
}