from django.apps import AppConfig

class PatientsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'patients'

    def ready(self):
        from .consul import register_service
        try:
            register_service()
        except Exception as e:
            print(f"Consul registration failed: {e}")
