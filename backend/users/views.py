from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        # Debug Logging
        print("--- LOGIN ATTEMPT ---")
        print(f"Received Username: '{username}'")

        # Authenticate User
        user = authenticate(username=username, password=password)

        if user is not None:
            if not user.is_active:
                return Response(
                    {"detail": "User account is disabled."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Determine Role Priority
            user_role = getattr(user, 'role', None)
            if not user_role:
                user_role = "doctor" if (user.is_staff or user.is_superuser) else "patient"
            
            user_role = str(user_role).lower()

            # Add custom claims to JWT token
            refresh = RefreshToken.for_user(user)
            refresh['role'] = user_role
            refresh['email'] = user.email

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user_role
                },
                "role": user_role
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )