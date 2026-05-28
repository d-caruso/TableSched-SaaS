from django.urls import path

from apps.platform import views

urlpatterns = [
    path("tenants/", views.TenantListView.as_view(), name="platform-tenant-list"),
    path("tenants/<int:pk>/", views.TenantDetailView.as_view(), name="platform-tenant-detail"),
    path("tenants/<int:pk>/suspend/", views.TenantSuspendView.as_view(), name="platform-tenant-suspend"),
    path("tenants/<int:pk>/reactivate/", views.TenantReactivateView.as_view(), name="platform-tenant-reactivate"),
    path("tenants/<int:pk>/cancel/", views.TenantCancelView.as_view(), name="platform-tenant-cancel"),
    path("tenants/<int:pk>/delete/", views.TenantDeleteView.as_view(), name="platform-tenant-delete"),
    path("tenants/<int:pk>/subscription/", views.SubscriptionOverrideView.as_view(), name="platform-subscription-override"),
    path("tenants/<int:pk>/lifecycle-events/", views.TenantLifecycleEventListView.as_view(), name="platform-lifecycle-events"),
    path("action-log/", views.PlatformActionLogListView.as_view(), name="platform-action-log"),
    path("tenants/<int:pk>/impersonate/", views.ImpersonateView.as_view(), name="platform-impersonate"),
    path("auth/impersonate-exchange/", views.ImpersonateExchangeView.as_view(), name="platform-impersonate-exchange"),
]
