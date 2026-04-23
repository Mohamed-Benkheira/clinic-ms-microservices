from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        from .consul import register_service
        try:
            register_service()
        except Exception as e:
            print(f"Consul registration failed: {e}")
