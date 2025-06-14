from django.urls import path
from .views_roadmap import generate_roadmap

urlpatterns = [
    path('generate-roadmap/', generate_roadmap, name='generate_roadmap'),
] 