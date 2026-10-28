# MedFlow Mobile Frontend Backend Integration Guide

This guide is the complete backend and API integration reference for the **React Native / Expo** mobile application (`med-frontend-mobile`). It documents every HTTP and WebSocket endpoint, payload structure, data types, authentication mechanisms, and integration requirements.

---

## Table of Contents

1. [Architecture & Network Configuration](#1-architecture--network-configuration)
2. [Authentication & Session Protocol](#2-authentication--session-protocol)
3. [Media & Image Handling](#3-media--image-handling)
4. [Push Notifications & Real-Time Gateway](#4-push-notifications--real-time-gateway)
5. [Complete API Endpoint Reference](#5-complete-api-endpoint-reference)
   - [5.1 Health & Documentation](#51-health--documentation)
   - [5.2 Authentication (`/api/auth`)](#52-authentication-apiauth)
   - [5.3 MR Self-Registration (`/registrations`)](#53-mr-self-registration-registrations)
   - [5.4 Password Reset (`/password-reset`)](#54-password-reset-password-reset)
   - [5.5 Dashboard & Statistics (`/dashboard`)](#55-dashboard--statistics-dashboard)
   - [5.6 Catalog Metadata (`/catalog`)](#56-catalog-metadata-catalog)
   - [5.7 Products Catalogue (`/products`)](#57-products-catalogue-products)
   - [5.8 Stockists (`/stockists`)](#58-stockists-stockists)
   - [5.9 Orders / Medicine Requests (`/orders`)](#59-orders--medicine-requests-orders)
   - [5.10 Notifications (`/notifications`)](#510-notifications-notifications)
   - [5.11 Users & User Profile (`/users`)](#511-users--user-profile-users)
   - [5.12 Branches (`/branches`)](#512-branches-branches)
   - [5.13 Documents (`/documents`)](#513-documents-documents)
   - [5.14 Upload Maintenance (`/uploads`)](#514-upload-maintenance-uploads)
6. [TypeScript Interfaces & Models](#6-typescript-interfaces--models)
7. [Mobile Frontend Gap Analysis & Migration Guide](#7-mobile-frontend-gap-analysis--migration-guide)
8. [Error Handling, Rate Limiting & Validation](#8-error-handling-rate-limiting--validation)

---

## 1. Architecture & Network Configuration

### 1.1 Server Stack
- **Backend Framework:** NestJS 11 (Express platform)
- **Database / ORM:** PostgreSQL 15+ via Prisma ORM 6
- **Auth Engine:** `better-auth` (Email/Password + Google OAuth) mounted at `/api/auth`
- **Default Port:** `8000` (`http://localhost:8000`)
- **Global API Route Prefix:** None (business routes live at the root: `/products`, `/orders`, `/stockists`, etc.)
- **Interactive Swagger Documentation:** `http://<backend-host>:8000/api/docs`

### 1.2 Mobile Base URLs
React Native running on an emulator or physical device cannot reach `localhost:8000` directly:
- **Android Emulator:** Uses `http://10.0.2.2:8000`
- **Physical Device (Expo Go / Dev Build):** Must use your LAN IP (e.g., `http://192.168.1.105:8000`) or a Cloudflare Tunnel URL (e.g., `https://your-tunnel.trycloudflare.com`).

Set this in `.env` inside `medicine_ordering_mobile_app`:
```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-host.trycloudflare.com
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

```typescript
// Derived URLs inside src/config/api.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!.replace(/\/+$/, "");
export const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;
```

---

## 2. Authentication & Session Protocol

### 2.1 Cookie-Based Sessions in React Native
The backend uses **`better-auth` cookie sessions**. There is no bearer JWT plugin installed.

Because native React Native `fetch` does not manage cookies automatically across requests, the mobile client must:
1. Extract the `token` string returned in the JSON body of a successful login:
   `POST /api/auth/sign-in/email` returns:
   ```json
   {
     "redirect": false,
     "token": "d7a48fb...session_token...",
     "url": null,
     "user": { ... }
   }
   ```
2. Store this token securely via `expo-secure-store`.
3. Pass it manually on every authenticated request inside the `Cookie` header:
   ```http
   Cookie: better-auth.session_token=<token>
   ```
4. If the server returns **401 Unauthorized**, clear the stored token and navigate the user back to the login screen.

> **Implementation Note:** The centralized client in `src/api/client.ts` already handles attaching `better-auth.session_token=${token}` and wiping storage on 401.

### 2.2 Roles & Scopes
There are three user roles (exact case-sensitive strings):
- `MR` — Medical Representative. Creates orders, registers stockists, views catalogue, views only **their own** orders.
- `MR-head` — Branch Head. Views orders belonging to **their assigned branch**.
- `superadmin` — Full platform administrator. Approves orders, manages users, catalogue, branches, and rep registrations.

The signed-in user object returned from `GET /api/auth/get-session` contains:
```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: "superadmin" | "MR" | "MR-head";
  branchId?: string | null;
  phoneNumber?: string | null;
  authMethod?: "password" | "google";
  banned?: boolean | null;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Rep Self-Registration Flow
Self-registration via email/password is disabled on the core auth endpoints (`disableSignUp: true`). Field reps must go through the 3-step registration pipeline:

```
[Mobile App]                                               [Backend]
     |                                                         |
     |--- 1. POST /registrations/request-code { email } ------>| (Generates 6-digit OTP,
     |                                                         |  emails to rep)
     |<-- 202 Accepted { status: "sent" } ---------------------|
     |                                                         |
     |--- 2. POST /registrations { name, email, phone, code }->| (Verifies OTP, creates
     |                                                         |  PENDING registration)
     |<-- 201 Created { id, status: "PENDING", ... } ----------|
     |                                                         |
     |                      [Admin Approves in Dashboard]      |
     |                      (Rep gets email with setup token)  |
     |                                                         |
     |--- 3. POST /registrations/password-setup -------------->| (Sets password, activates
     |       { token, newPassword }                            |  User & Account)
     |<-- 200 OK { status: "password_set" } -------------------|
     |                                                         |
     |--- 4. POST /api/auth/sign-in/email { email, password }->| (Normal login)
```

### 2.4 Forgot Password Flow
1. **Request Reset Code:** `POST /password-reset/request` with `{ email }`.
   - Returns `202 Accepted` `{ status: "sent" }`.
   - Rep receives a 6-digit OTP valid for 5 minutes.
2. **Confirm Reset:** `POST /password-reset/confirm` with `{ email, otp, newPassword }`.
   - Returns `200 OK` `{ status: "reset" }`.
   - Automatically revokes all existing active sessions.

---

## 3. Media & Image Handling

### 3.1 Path Transformation
- The backend serves static files at: `http://<host>:8000/uploads/...`
- However, when the backend stores an image URL in the database (e.g. for a product or avatar), it writes:
  ```
  /api/backend/uploads/products/d1e2f3a4-....jpg
  ```
  *(This is because the web frontend has a Next.js rewrite rule that proxies `/api/backend` to the server).*

**Rule for React Native:** Mobile has no proxy. Any URL starting with `/api/backend` must be rewritten before rendering in `<Image source={{ uri }} />`:

```typescript
export function getMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  // External URLs (e.g. Google OAuth avatars)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Strip leading /api/backend and prefix with current backend host
  const cleaned = url.replace(/^\/api\/backend/, "");
  return `${API_BASE_URL}${cleaned}`;
}
```

### 3.2 Upload Requirements
- Allowed types: `image/jpeg`, `image/png`, `image/webp`. (Enforced via magic bytes on server).
- Maximum image size: **5 MB** (`MAX_IMAGE_UPLOAD_BYTES`).
- Multipart field name: Must be strictly named **`file`**.

---

## 4. Push Notifications & Real-Time Gateway

### 4.1 Expo Push Notification Lifecycle
1. App initializes `expo-notifications`, requests push permissions, and acquires the token:
   `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.
2. App sends token to backend:
   ```http
   POST /notifications/push-tokens
   Content-Type: application/json
   Cookie: better-auth.session_token=...

   {
     "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
     "platform": "ios" | "android"
   }
   ```
3. On sign out, app unregisters the token before wiping the session:
   ```http
   DELETE /notifications/push-tokens
   Content-Type: application/json
   Cookie: better-auth.session_token=...

   {
     "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
   }
   ```

### 4.2 Real-Time WebSocket Gateway (Socket.IO)
For instant in-app alerts and badge counter updates without polling:
1. **Request Socket Token:**
   `POST /notifications/socket-token`
   Returns `{ "token": "<jwt-token>", "expiresIn": 300 }` (Token is valid for 5 minutes).
2. **Connect via Socket.IO client:**
   - Host: `${API_BASE_URL}/notifications` (Namespace is `/notifications`)
   - Handshake auth: `{ auth: { token: "<socketToken>" } }` or header `{ authorization: "<socketToken>" }`.
3. **Listen for Events:**
   - Event: `notification:new`
   - Payload: `NotificationView` (see structure below)
   - Event: `notification:error`

---

## 5. Complete API Endpoint Reference

### 5.1 Health & Documentation

#### `GET /`
- **Auth:** Anonymous
- **Response:** Plain text `"Hello World!"`

#### `GET /api/docs`
- **Auth:** Anonymous
- **Response:** OpenAPI 3.0 / Swagger UI interface

---

### 5.2 Authentication (`/api/auth`)

#### `POST /api/auth/sign-in/email`
Log in using email and password.
- **Auth:** Anonymous
- **Body:**
  ```json
  {
    "email": "rep@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "redirect": false,
    "token": "49b2f6795f7041fa904a2982d61a6c47...",
    "url": null,
    "user": {
      "id": "usr_98a72b",
      "name": "Ram Bahadur",
      "email": "rep@example.com",
      "emailVerified": true,
      "image": "/api/backend/uploads/avatars/avatar-uuid.png",
      "role": "MR",
      "branchId": "b1b8e420-9981-4966-9b16-43d7c5be1440",
      "phoneNumber": "+9779800000000",
      "authMethod": "password",
      "banned": false,
      "banReason": null,
      "banExpires": null,
      "createdAt": "2026-10-01T08:00:00.000Z",
      "updatedAt": "2026-10-01T08:00:00.000Z"
    }
  }
  ```

#### `GET /api/auth/get-session`
Retrieve current user session.
- **Auth:** Authenticated (`Cookie: better-auth.session_token=...`)
- **Response (200 OK):**
  ```json
  {
    "session": {
      "id": "sess_1234",
      "userId": "usr_98a72b",
      "token": "49b2f6795f70...",
      "expiresAt": "2026-11-01T08:00:00.000Z",
      "createdAt": "2026-10-01T08:00:00.000Z",
      "updatedAt": "2026-10-01T08:00:00.000Z",
      "ipAddress": "127.0.0.1",
      "userAgent": "MedFlowMobile/1.0"
    },
    "user": {
      "id": "usr_98a72b",
      "name": "Ram Bahadur",
      "email": "rep@example.com",
      "role": "MR",
      "branchId": "b1b8e420-9981-4966-9b16-43d7c5be1440",
      "phoneNumber": "+9779800000000"
    }
  }
  ```
  *(Returns `null` if session is expired or invalid)*.

#### `POST /api/auth/sign-out`
Terminate the current session.
- **Auth:** Authenticated (`Cookie: better-auth.session_token=...`)
- **Body:** None
- **Response (200 OK):**
  ```json
  {
    "success": true
  }
  ```

#### `POST /api/auth/sign-in/social`
Initiate Google OAuth.
- **Auth:** Anonymous
- **Body:**
  ```json
  {
    "provider": "google",
    "callbackURL": "https://<host>/api/auth/callback/google"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "redirect": true
  }
  ```

---

### 5.3 MR Self-Registration (`/registrations`)

#### `POST /registrations/request-code`
Request a 6-digit email verification code.
- **Auth:** Anonymous (Rate limit: 5 req/min, 10 emails/hr per address)
- **Body:**
  ```json
  {
    "email": "applicant@example.com"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "status": "sent"
  }
  ```

#### `POST /registrations`
Submit registration application after verifying the email code.
- **Auth:** Anonymous (Rate limit: 5 req/min)
- **Body:**
  ```json
  {
    "name": "Ram Bahadur",
    "email": "applicant@example.com",
    "phoneNumber": "+9779812345678",
    "code": "482913",
    "branchId": "b1b8e420-9981-4966-9b16-43d7c5be1440"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "reg_a1b2c3d4-...",
    "name": "Ram Bahadur",
    "email": "applicant@example.com",
    "phoneNumber": "+9779812345678",
    "provider": "CREDENTIAL",
    "providerId": null,
    "status": "PENDING",
    "requestedBranchId": "b1b8e420-9981-4966-9b16-43d7c5be1440",
    "rejectionReason": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "userId": null,
    "passwordSetAt": null,
    "createdAt": "2026-10-28T10:00:00.000Z",
    "updatedAt": "2026-10-28T10:00:00.000Z"
  }
  ```

#### `POST /registrations/password-setup`
Set initial account password using single-use emailed token (valid for 24h).
- **Auth:** Anonymous (Rate limit: 10 req/min)
- **Body:**
  ```json
  {
    "token": "64_character_hex_entropy_string...",
    "newPassword": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "password_set"
  }
  ```

#### `GET /registrations`
List registration requests.
- **Auth:** `superadmin`
- **Query Parameters:**
  - `status`: Filter (`PENDING` | `APPROVED` | `REJECTED`, default `PENDING`)
  - `search`: Substring match on name or email
  - `phoneNumber`: Filter by phone
  - `limit`: Number of results
- **Response (200 OK):**
  ```json
  {
    "registrations": [ ... ],
    "total": 3
  }
  ```

#### `GET /registrations/:id`
Fetch single registration request details.
- **Auth:** `superadmin`
- **Response (200 OK):** `Registration` object.

#### `PATCH /registrations/:id/approve`
Approve pending registration and create active user.
- **Auth:** `superadmin`
- **Body:**
  ```json
  {
    "branchId": "b1b8e420-9981-4966-9b16-43d7c5be1440",
    "role": "MR"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "reg_uuid",
    "userId": "usr_uuid",
    "email": "applicant@example.com",
    "branchId": "b1b8e420-...",
    "role": "MR",
    "provider": "CREDENTIAL",
    "status": "APPROVED"
  }
  ```

#### `PATCH /registrations/:id/reject`
Reject pending registration.
- **Auth:** `superadmin`
- **Body:**
  ```json
  {
    "reason": "Incomplete documentation or unverified credentials."
  }
  ```
- **Response (200 OK):** Updated `Registration` object.

---

### 5.4 Password Reset (`/password-reset`)

#### `POST /password-reset/request`
Request password reset code via email.
- **Auth:** Anonymous (Rate limit: 3 req/min)
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "status": "sent"
  }
  ```

#### `POST /password-reset/confirm`
Verify 6-digit OTP and reset password.
- **Auth:** Anonymous (Rate limit: 5 req/min)
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "491823",
    "newPassword": "MyNewSecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "reset"
  }
  ```

---

### 5.5 Dashboard & Statistics (`/dashboard`)

#### `GET /dashboard/stats`
Retrieve analytical summary tiles.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Role Scoping:**
  - `totalUsers` & `productCount`: Company-wide.
  - `totalOrders`, `pendingOrders`, and `approvedRevenue`: Role-scoped. For MRs, this represents **only their own** orders.
- **Response (200 OK):**
  ```json
  {
    "totalUsers": 14,
    "productCount": 128,
    "totalOrders": 42,
    "pendingOrders": 3,
    "approvedRevenue": 48250.0
  }
  ```

---

### 5.6 Catalog Metadata (`/catalog`)

#### `GET /catalog/options`
Fetch active units and product categories for dropdown selectors and filters.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Response (200 OK):**
  ```json
  {
    "units": [
      { "id": "unit_uuid_1", "name": "Bottle of 100ml" },
      { "id": "unit_uuid_2", "name": "Box of 10x10" },
      { "id": "unit_uuid_3", "name": "Strip of 10" }
    ],
    "types": [
      { "id": "type_uuid_1", "name": "Analgesic" },
      { "id": "type_uuid_2", "name": "Antibiotic" },
      { "id": "type_uuid_3", "name": "Antihistamine" }
    ]
  }
  ```

#### `GET /catalog/units` | `POST /catalog/units` | `PATCH /catalog/units/:id` | `DELETE /catalog/units/:id`
Unit CRUD operations.
- **Auth:** `superadmin`
- **Item Body (`POST` / `PATCH`):**
  ```json
  {
    "name": "Strip of 10",
    "description": "Standard blister pack"
  }
  ```

#### `GET /catalog/types` | `POST /catalog/types` | `PATCH /catalog/types/:id` | `DELETE /catalog/types/:id`
Product Type CRUD operations.
- **Auth:** `superadmin`
- **Item Body (`POST` / `PATCH`):**
  ```json
  {
    "name": "Antibiotic",
    "description": "Infection control medicines"
  }
  ```

---

### 5.7 Products Catalogue (`/products`)

#### `GET /products`
List all products in the catalogue. Returns an unpaginated array.
- **Auth:** `superadmin`, `MR`
- **Query Parameters:**
  - `name`: Substring match on product name (case-insensitive)
  - `batch`: Substring match on batch identifier
- **Response (200 OK):**
  ```json
  [
    {
      "id": "p_uuid_1",
      "name": "Paracetamol 500mg",
      "description": "Fast-acting analgesic",
      "unitId": "unit_uuid_3",
      "unit": "Strip of 10",
      "typeId": "type_uuid_1",
      "type": "Analgesic",
      "mrp": "25.00",
      "sales": "22.50",
      "price": "18.00",
      "batch": "BATCH-2026-01",
      "expiry": "2026-12-31T00:00:00.000Z",
      "amount": 250,
      "remarks": "Warehouse A",
      "imageUrl": "/api/backend/uploads/products/d1e2f3a4.jpg",
      "createdAt": "2026-10-01T08:00:00.000Z",
      "updatedAt": "2026-10-01T08:00:00.000Z"
    }
  ]
  ```
  > **Crucial Typing Note:** `mrp`, `sales`, and `price` are returned as **strings** (Prisma Decimals). Mobile components must parse them via `parseFloat(item.price)`.

#### `POST /products`
Create a product.
- **Auth:** `superadmin`
- **Body:**
  ```json
  {
    "name": "Amoxicillin 500mg",
    "unitId": "unit_uuid_3",
    "typeId": "type_uuid_2",
    "mrp": 120.0,
    "sales": 105.0,
    "price": 90.0,
    "batch": "AMX-2026-A",
    "expiry": "2027-06-30",
    "amount": 500,
    "remarks": "Store below 25°C",
    "imageUrl": "/api/backend/uploads/products/d1e2f3a4.jpg"
  }
  ```

#### `PATCH /products/:id`
Update an existing product.
- **Auth:** `superadmin`
- **Body:** Same as `POST /products`, all fields optional. Send `"imageUrl": ""` to remove the image.

#### `POST /products/image`
Upload a product image prior to product creation.
- **Auth:** `superadmin` (Rate limit: 20 req/min)
- **Content-Type:** `multipart/form-data`
- **Payload:** Field `file` (Binary image, max 5 MB).
- **Response (200 OK):**
  ```json
  {
    "url": "/api/backend/uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg",
    "mimeType": "image/jpeg"
  }
  ```

#### `POST /products/bulk`
Bulk import products via CSV file.
- **Auth:** `superadmin`
- **Payload:** Field `file` (.csv file, max 5 MB).
- **Response (200 OK):**
  ```json
  {
    "created": 15,
    "skipped": 2,
    "failed": 0,
    "details": [
      { "row": 2, "name": "Cetirizine 10mg", "status": "created" },
      { "row": 3, "name": "Paracetamol 500mg", "status": "skipped", "reason": "Already in the catalogue" }
    ]
  }
  ```

---

### 5.8 Stockists (`/stockists`)

#### `GET /stockists`
Retrieve all approved stockists/pharmacies.
- **Auth:** `superadmin`, `MR`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "stk_uuid_1",
      "name": "Shree Pharmacy",
      "location": "Tripureshwor, Kathmandu",
      "createdBy": "usr_98a72b",
      "createdAt": "2026-10-10T12:00:00.000Z",
      "updatedAt": "2026-10-10T12:00:00.000Z"
    }
  ]
  ```

#### `POST /stockists`
Add a new stockist. Available to MRs in the field without requiring approval.
- **Auth:** `superadmin`, `MR`
- **Body:**
  ```json
  {
    "name": "Bharat Medical Store",
    "location": "New Road, Pokhara"
  }
  ```
- **Response (201 Created):** `Stockist` object.

---

### 5.9 Orders / Medicine Requests (`/orders`)

#### `POST /orders`
Create a new medicine order request.
- **Auth:** `MR`
- **Body:**
  ```json
  {
    "stockistId": "stk_uuid_1",
    "items": [
      {
        "productName": "Paracetamol 500mg",
        "quantity": 20,
        "bonus": 2,
        "rate": 18.0,
        "productId": "p_uuid_1"
      },
      {
        "productName": "Amoxicillin 500mg",
        "quantity": 5,
        "bonus": 0,
        "rate": 90.0,
        "productId": "p_uuid_2"
      }
    ]
  }
  ```
- **Behavior:**
  - `rate` is the price per unit agreed upon with the stockist.
  - `bonus` are free promotional units (not charged).
  - Server automatically computes `grandTotal = SUM(rate * quantity)` (bonus excluded).
  - Server automatically computes `totalQuantity = SUM(quantity)`.
  - Server generates sequential readable order number: `orderNo` (e.g., `ORD-20261028-A4F1`).
- **Response (201 Created):** `OrderView` object.

#### `GET /orders`
List orders with filtering, sorting, and pagination.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Role Scoping (Enforced Server-Side):**
  - `MR`: Returns **only** orders created by the caller (`createdBy == self.id`).
  - `MR-head`: Returns **only** orders belonging to the caller's assigned branch (`branchId == self.branchId`).
  - `superadmin`: Returns all orders.
- **Query Parameters:**
  - `status`: `pending` | `approved` | `rejected` (lowercase)
  - `createdBy`: Filter by creator user ID
  - `dateFrom`: Start date (`YYYY-MM-DD` or ISO string)
  - `dateTo`: End date (`YYYY-MM-DD` or ISO string)
  - `minTotal`: Minimum `grandTotal` (numeric)
  - `maxTotal`: Maximum `grandTotal` (numeric)
  - `minProducts`: Minimum line item count (integer)
  - `maxProducts`: Maximum line item count (integer)
  - `typeId`: Filter orders containing at least one item of this Product Type ID
  - `sort`: `createdAt` | `grandTotal` | `totalQuantity` (default `createdAt`)
  - `direction`: `asc` | `desc` (default `desc`)
  - `page`: Page number (default `1`)
  - `limit`: Items per page (default `20`, maximum `100`)
- **Response (200 OK):**
  ```json
  {
    "orders": [
      {
        "id": "ord_uuid_1",
        "orderNo": "ORD-20261028-A4F1",
        "stockist": {
          "id": "stk_uuid_1",
          "name": "Shree Pharmacy",
          "location": "Tripureshwor, Kathmandu"
        },
        "items": [
          {
            "id": "item_uuid_1",
            "productName": "Paracetamol 500mg",
            "productId": "p_uuid_1",
            "productType": "Analgesic",
            "quantity": 20,
            "bonus": 2,
            "rate": 18.0,
            "amount": 360.0
          }
        ],
        "grandTotal": 360.0,
        "itemCount": 1,
        "totalQuantity": 20,
        "status": "pending",
        "createdBy": {
          "id": "usr_98a72b",
          "name": "Ram Bahadur",
          "email": "rep@example.com",
          "role": "MR",
          "image": "/api/backend/uploads/avatars/user.png"
        },
        "branchId": "b1b8e420-9981-4966-9b16-43d7c5be1440",
        "approvedBy": null,
        "approvedAt": null,
        "rejectionReason": null,
        "createdAt": "2026-10-28T14:30:00.000Z",
        "updatedAt": "2026-10-28T14:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```

#### `GET /orders/:id`
Retrieve single order details by UUID.
- **Auth:** `superadmin`, `MR`, `MR-head` (Scoped by role: MR cannot access other reps' orders).
- **Response (200 OK):** `OrderView` object.

#### `PATCH /orders/:id/approve`
Approve an order (`pending` → `approved`).
- **Auth:** `superadmin`
- **Response (200 OK):** Updated `OrderView` with `approvedBy` and `approvedAt`.

#### `PATCH /orders/:id/reject`
Reject an order (`pending` → `rejected`).
- **Auth:** `superadmin`
- **Body:**
  ```json
  {
    "reason": "Stockist credit limit exceeded."
  }
  ```
- **Response (200 OK):** Updated `OrderView` with `rejectionReason`.

---

### 5.10 Notifications (`/notifications`)

#### `GET /notifications`
List notifications for the logged-in user, newest first.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Query Parameters:**
  - `page`: Page number (default `1`)
  - `limit`: Items per page (default `20`, max `100`)
  - `unread`: Filter only unread (`true` or `1`)
- **Response (200 OK):**
  ```json
  {
    "notifications": [
      {
        "id": "notif_uuid_1",
        "type": "ORDER_APPROVED",
        "title": "Order ORD-20261028-A4F1 Approved",
        "body": "Your order for Shree Pharmacy has been approved by Admin.",
        "link": "/orders",
        "data": { "orderId": "ord_uuid_1" },
        "readAt": null,
        "createdAt": "2026-10-28T15:00:00.000Z"
      }
    ],
    "total": 12,
    "unreadCount": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```

#### `GET /notifications/unread-count`
Quick unread badge counter.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Response (200 OK):**
  ```json
  {
    "count": 3
  }
  ```

#### `PATCH /notifications/:id/read`
Mark a single notification as read.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Response (200 OK):** Updated `NotificationView` object.

#### `PATCH /notifications/read-all`
Mark all notifications as read.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Response (200 OK):**
  ```json
  {
    "updated": 3
  }
  ```

#### `POST /notifications/socket-token`
Mint a short-lived token to authenticate the Socket.IO connection.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 300
  }
  ```

#### `POST /notifications/push-tokens`
Register device Expo push token.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Body:**
  ```json
  {
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "android"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "registered"
  }
  ```

#### `DELETE /notifications/push-tokens`
Forget device push token on logout.
- **Auth:** `superadmin`, `MR`, `MR-head`
- **Body:**
  ```json
  {
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "removed"
  }
  ```

---

### 5.11 Users & User Profile (`/users`)

#### `PATCH /users/me/image`
Update own profile avatar.
- **Auth:** `superadmin`, `MR`, `MR-head` (Rate limit: 20 req/min)
- **Content-Type:** `multipart/form-data`
- **Payload:** Field `file` (JPEG/PNG/WebP, max 5 MB).
- **Response (200 OK):**
  ```json
  {
    "image": "/api/backend/uploads/avatars/4f1a2b3c-....jpg"
  }
  ```

#### `GET /users`
List users in the system.
- **Auth:** `superadmin`
- **Query Parameters:** `role?`, `branchId?`, `search?`, `limit?` (default 100).
- **Response (200 OK):** `{ "users": [ ... ], "total": 14 }`.

#### `POST /users`
Create a user account directly.
- **Auth:** `superadmin`
- **Body:**
  ```json
  {
    "email": "head@example.com",
    "name": "Sita Thapa",
    "role": "MR-head",
    "authMethod": "password",
    "branchId": "b1b8e420-9981-4966-9b16-43d7c5be1440"
  }
  ```
  *(MR-head requires `branchId`)*.

#### `PATCH /users/:id`
Update user details (`role?`, `branchId?`, `name?`).
- **Auth:** `superadmin`

#### `POST /users/:id/ban` | `POST /users/:id/unban`
Suspend or restore an account.
- **Auth:** `superadmin`
- **Ban Body:** `{ "reason": "Policy violation" }`

---

### 5.12 Branches (`/branches`)

#### `GET /branches`
List company branches.
- **Auth:** `superadmin`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "b1b8e420-9981-4966-9b16-43d7c5be1440",
      "name": "Kathmandu Central",
      "location": "Bagbazar, Kathmandu",
      "managerId": "usr_head_12",
      "createdAt": "2026-09-01T00:00:00.000Z",
      "updatedAt": "2026-10-01T00:00:00.000Z"
    }
  ]
  ```

#### `POST /branches` | `PATCH /branches/:id` | `DELETE /branches/:id` | `PATCH /branches/:id/manager`
Branch CRUD and Manager Assignment.
- **Auth:** `superadmin`
- **Create Body:** `{ "name": "Pokhara West", "location": "Prithvi Chowk" }`
- **Assign Manager Body:** `{ "managerId": "usr_head_12" }` (Must be an `MR-head`).

---

### 5.13 Documents (`/documents`)

#### `GET /documents`
List documents in the library.
- **Auth:** `superadmin`
- **Query Parameters:** `search?`, `sort?` (`createdAt` | `name`), `direction?` (`asc` | `desc`), `page?`, `limit?`.

#### `GET /documents/order/:orderId`
List documents attached to a specific order.
- **Auth:** `superadmin`
- **Response (200 OK):** `Document[]`.

#### `POST /documents`
Upload and attach a document.
- **Auth:** `superadmin` (Rate limit: 20 req/min, max 20 MB).
- **Content-Type:** `multipart/form-data`
- **Payload:** Field `file` (PDF, DOCX, XLSX, etc.), optional field `orderId`.

---

### 5.14 Upload Maintenance (`/uploads`)

#### `DELETE /uploads`
Delete an orphaned file from disk.
- **Auth:** `superadmin` (Rate limit: 30 req/min).
- **Body:** `{ "url": "/api/backend/uploads/products/d1e2f3a4.jpg" }`
- **Response:** Fails with **409 Conflict** if the file is still referenced by any product or user avatar.

---

## 6. TypeScript Interfaces & Models

Create or update these definitions inside `src/types/` in the mobile project:

```typescript
// --- Authentication & User ---
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: "superadmin" | "MR" | "MR-head";
  branchId?: string | null;
  phoneNumber?: string | null;
  authMethod?: "password" | "google";
  banned?: boolean | null;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
  };
  user: AuthUser;
}

// --- Catalogue & Products ---
export interface CatalogOption {
  id: string;
  name: string;
}

export interface CatalogOptions {
  units: CatalogOption[];
  types: CatalogOption[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  unitId: string;
  unit: string;
  typeId: string;
  type: string;
  mrp: string;    // Decimal as string (e.g. "25.00")
  sales: string;  // Decimal as string
  price: string;  // Decimal as string
  batch: string;
  expiry: string; // ISO date string
  amount: number;
  remarks?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Stockists ---
export interface Stockist {
  id: string;
  name: string;
  location: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockistInput {
  name: string;
  location: string;
}

// --- Orders ---
export type OrderStatus = "pending" | "approved" | "rejected";

export interface OrderItemInput {
  productName: string;
  quantity: number;
  bonus: number;
  rate: number;
  productId?: string;
}

export interface CreateOrderInput {
  stockistId: string;
  items: OrderItemInput[];
}

export interface OrderItem {
  id: string;
  productName: string;
  productId: string | null;
  productType: string | null;
  quantity: number;
  bonus: number;
  rate: number;
  amount: number;
}

export interface OrderCreator {
  id: string;
  name: string;
  email: string;
  role: string | null;
  image: string | null;
}

export interface Order {
  id: string;
  orderNo: string;
  stockist: {
    id: string;
    name: string;
    location: string;
  };
  items: OrderItem[];
  grandTotal: number;
  itemCount: number;
  totalQuantity: number;
  status: OrderStatus;
  createdBy: OrderCreator;
  branchId: string | null;
  approvedBy: OrderCreator | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Notifications ---
export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_APPROVED"
  | "ORDER_REJECTED"
  | "REGISTRATION_CREATED"
  | "REGISTRATION_APPROVED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_TYPE_CREATED"
  | "PRODUCT_TYPE_UPDATED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 7. Mobile Frontend Gap Analysis & Migration Guide

The current mobile frontend codebase (`medicine_ordering_mobile_app`) has mock data implementations that need to be aligned with the live backend schema:

### 7.1 Stockist Schema Differences
| Field | Mobile Mock (`StockistContext.tsx`) | Backend Schema (`POST /stockists`) |
| :--- | :--- | :--- |
| `name` | Yes | Yes |
| `location` | Yes | Yes |
| `contactPerson`, `phone`, `email` | Mock only | **Not in backend** (Store in remarks/notes or keep local) |
| `address` | Mock only | Maps to `location` |
| Approval Status (`PENDING`/`APPROVED`) | Mock only | **None.** MRs can create active stockists immediately. |

**Action:** Replace `addStockistRequest` with an API call:
```typescript
await apiRequest<Stockist>("/stockists", {
  method: "POST",
  body: { name: form.name, location: form.location }
});
```

### 7.2 Order / Medicine Request Differences
| Field | Mobile Mock (`RequestContext.tsx`) | Backend Schema (`POST /orders`) |
| :--- | :--- | :--- |
| Status enum | `"PENDING"` \| `"PROCESSING"` \| `"COMPLETED"` \| `"CANCELLED"` | `"pending"` \| `"approved"` \| `"rejected"` (lowercase) |
| Items array | `{ medicineId, medicineName, quantity, unitPrice, subtotal }` | `{ productName, quantity, bonus, rate, productId? }` |
| Calculation | Client calculates `totalAmount` | Server calculates `grandTotal` and `totalQuantity` |
| Reference number | `REQ-1024` | `ORD-20261028-XXXX` |

**Action:** When submitting an order from the mobile cart:
```typescript
const payload: CreateOrderInput = {
  stockistId: selectedStockistId,
  items: cartItems.map(item => ({
    productName: item.medicineName,
    quantity: item.quantity,
    bonus: item.bonus ?? 0,
    rate: item.unitPrice,
    productId: item.medicineId
  }))
};
await apiRequest<Order>("/orders", { method: "POST", body: payload });
```

### 7.3 Products & Catalogue Loading
- Replace `src/mock/medicines.ts` with:
```typescript
const products = await apiRequest<Product[]>("/products", { method: "GET" });
```
- Note that product prices (`mrp`, `sales`, `price`) arrive as **strings** (e.g. `"25.00"`). Parse them when displaying or doing local math: `Number(product.price)`.

---

## 8. Error Handling, Rate Limiting & Validation

### 8.1 Validation Pipe Behavior
The backend uses NestJS `ValidationPipe` with `whitelist: true`:
- Any body or query property **not explicitly declared** in the backend DTO is silently discarded. Ensure exact field name matching.
- Numeric query params arrive as strings and are cast server-side. Pass them as strings in URLs (e.g., `?page=2&limit=20&minTotal=100`).

### 8.2 Error Response Shapes
1. **NestJS Standard Validation Error (HTTP 400):**
   ```json
   {
     "statusCode": 400,
     "message": [
       "phoneNumber must be 7-15 digits, optionally prefixed with \"+\".",
       "code must be exactly 6 digits."
     ],
     "error": "Bad Request"
   }
   ```
2. **Business Exception (HTTP 400 / 403 / 404 / 409):**
   ```json
   {
     "statusCode": 409,
     "message": "Stockist not found or duplicate registration pending.",
     "error": "Conflict"
   }
   ```
3. **Rate Limit Exceeded (HTTP 429):**
   ```json
   {
     "statusCode": 429,
     "message": "ThrottlerException: Too Many Requests"
   }
   ```

### 8.3 Rate Limits Summary
| Route | Limit | Window |
| :--- | :--- | :--- |
| Default (Global) | 300 requests | 60 seconds |
| `POST /registrations/request-code` | 5 requests | 60 seconds |
| `POST /registrations` | 5 requests | 60 seconds |
| `POST /registrations/password-setup` | 10 requests | 60 seconds |
| `POST /password-reset/request` | 3 requests | 60 seconds |
| `POST /password-reset/confirm` | 5 requests | 60 seconds |
| `POST /products/image` & `PATCH /users/me/image` | 20 requests | 60 seconds |
| `DELETE /uploads` | 30 requests | 60 seconds |

