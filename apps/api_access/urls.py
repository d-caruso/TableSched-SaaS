from django.urls import path

from apps.api_access.views import APIKeyListCreateView, APIKeyRevokeView, APIUsageLogView

urlpatterns = [
    path("api-keys/", APIKeyListCreateView.as_view(), name="api-key-list-create"),
    path("api-keys/<int:pk>/", APIKeyRevokeView.as_view(), name="api-key-revoke"),
    path("api-keys/<int:pk>/usage/", APIUsageLogView.as_view(), name="api-key-usage"),
]
