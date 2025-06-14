from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from assessments.authentication import SupabaseAuthentication
from services.roadmap_service import generate_user_roadmap

@api_view(['POST'])
@authentication_classes([SupabaseAuthentication])
def generate_roadmap(request):
    """
    Generate a personalized learning roadmap for the authenticated user.
    """
    user_id = getattr(request.user, 'username', None) or getattr(request.user, 'id', None)
    if not user_id:
        return Response({"error": "User ID not found in request"}, status=status.HTTP_400_BAD_REQUEST)
    result = generate_user_roadmap(user_id)
    if not result.get('success'):
        return Response({"error": result.get('message', 'Unknown error')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(result['data'], status=status.HTTP_200_OK) 