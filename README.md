# tablesched-saas

Private SaaS add-on layer for [TableSched](https://github.com/d-caruso/tablesched).

Adds subscription billing, plan limit enforcement, tenant lifecycle management,
platform staff administration, and Enterprise API access on top of the core
TableSched booking system. Depends on `tablesched` as a base package.

## Requirements

- Python 3.11+
- PostgreSQL 15+
- `tablesched` installed (editable or from a release tarball)

## Structure

```
tablesched-saas/
├── config/          # Django settings extending tablesched core
├── apps/
│   ├── billing/     # Subscriptions, plan limits, SMS quota
│   ├── platform/    # Platform staff admin API, impersonation
│   └── api_access/  # Enterprise API keys, usage tracking, rate limiting
└── manage.py
```

---

Copyright (c) 2024 Domenico Caruso. All rights reserved.

This software is proprietary and confidential. Unauthorised copying, distribution,
modification, or use of this software, in whole or in part, is strictly prohibited
without the express written permission of the copyright holder.
