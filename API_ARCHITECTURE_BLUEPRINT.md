# ReactKit API Architecture Blueprint

## 1. System Architecture & Flow

### High-Level Data Flow
```
Client (React Components)
    ↓
React Query Hooks (useLogin, useSignup, useUserProfile, useUpdateProfile)
    ↓
Axios Interceptors (Auth + Error)
    ↓
Axios Instance (with baseURL, timeout, headers)
    ↓
External API (https://dummyjson.com)
```

### Core Tech Stack
- **Frontend**: React 19 + TypeScript
- **State Management**: Redux Toolkit + TanStack Query (React Query)
- **HTTP Client**: Axios
- **Form Handling**: Formik
- **Validation**: Yup
- **Toast Notifications**: react-hot-toast
- **Routing**: React Router

---

## 2. Folder & File Structure

```
src/
├── api/
│   ├── client/
│   │   ├── axios.ts           # Axios instance configuration
│   │   ├── interceptor.ts     # Main interceptor setup
│   │   ├── auth.interceptor.ts # Authentication interceptors
│   │   └── error.interceptor.ts # Error handling interceptors
│   ├── endpoints/
│   │   ├── auth.endpoint.ts   # Auth endpoint definitions
│   │   ├── user.endpoint.ts   # User endpoint definitions
│   │   └── index.ts           # Barrel export
│   ├── services/
│   │   ├── auth.service.ts    # Auth API services
│   │   ├── user.service.ts    # User API services
│   │   └── index.ts           # Barrel export
│   ├── hooks/
│   │   ├── useLogin.ts        # Login mutation hook
│   │   ├── useSignup.ts       # Signup mutation hook
│   │   ├── useLogout.ts       # Logout mutation hook
│   │   ├── useUserProfile.ts  # Profile query hook
│   │   ├── useUpdateProfile.ts # Profile update mutation hook
│   │   └── index.ts           # Barrel export
│   ├── query/
│   │   ├── queryClient.ts     # TanStack Query client
│   │   ├── queryKeys.ts       # Query key factories
│   │   ├── mutationKeys.ts    # Mutation key factories
│   │   └── index.ts           # Barrel export
│   ├── types/
│   │   ├── api.types.ts       # Core API types
│   │   ├── auth.types.ts      # Auth types
│   │   ├── user.types.ts      # User types
│   │   └── index.ts           # Barrel export
│   ├── transformers/
│   │   ├── auth.mapper.ts     # Auth data transformers
│   │   ├── user.mapper.ts     # User data transformers
│   │   └── index.ts           # Barrel export
│   ├── auth.storage.ts        # Token storage utilities
│   └── index.ts               # Main barrel export
├── store/
│   ├── slices/
│   │   ├── authSlice.ts       # Auth Redux slice
│   │   └── appSlice.ts        # App Redux slice
│   ├── selectors/
│   │   ├── auth.selector.ts   # Auth selectors
│   │   └── index.ts           # Barrel export
│   ├── hooks.ts               # Typed Redux hooks
│   ├── rootReducer.ts         # Combined reducers
│   └── index.ts               # Store configuration
└── config/
    ├── app.config.ts          # Application configuration
    ├── api.config.ts          # API configuration
    └── auth.config.ts         # Auth configuration
```

---

## 3. Complete Endpoint Registry

### Authentication Endpoints

| Method | Path | Description | Middleware | Request | Success Response | Error Responses |
|--------|------|-------------|------------|---------|-----------------|----------------|
| POST | `/auth/login` | Login with username/password | None | `{ username: string, password: string }` | `200: { accessToken, refreshToken, id, username, email, firstName, lastName, gender, image }` | 400, 401, 500 |
| POST | `/auth/signup` | Register new user | None | `{ email, password, name, avatar?, role? }` | `200: { id, email, name, role, avatar, creationAt }` | 400, 401, 500 |
| GET | `/auth/me` | Get current user profile | Bearer Token | None | `200: { id, email, firstName, lastName, username, image, phone?, address? }` | 401, 403, 404, 500 |
| POST | `/auth/logout` | Logout user | Bearer Token | None | `200: { }` | 401, 403, 500 |
| POST | `/auth/refresh` | Refresh access token | None | `{ refreshToken }` | `200: { accessToken, refreshToken }` | 400, 401, 500 |

### User Endpoints

| Method | Path | Description | Middleware | Request | Success Response | Error Responses |
|--------|------|-------------|------------|---------|-----------------|----------------|
| GET | `/users/` | Get all users (paginated) | Bearer Token | `?offset?, ?limit?, ?role?` | `200: { users: User[], total, skip, limit }` | 401, 403, 500 |
| GET | `/users/{id}` | Get user by ID | Bearer Token | None | `200: { id, email, name, role, avatar, ... }` | 401, 403, 404, 500 |
| POST | `/users/` | Create new user | Bearer Token | `{ email, password, name, avatar?, role? }` | `201: { id, email, name, role, avatar, ... }` | 400, 401, 403, 500 |
| PUT | `/users/{id}` | Update user profile | Bearer Token | `{ email?, password?, name?, avatar?, address? }` | `200: { id, email, name, role, avatar, ... }` | 400, 401, 403, 404, 500 |
| DELETE | `/users/{id}` | Delete user | Bearer Token | None | `200: { deleted: true }` | 401, 403, 404, 500 |

---

## 4. Global Configurations & Conventions

### Base URL
- **Base URL**: `https://dummyjson.com` (from `VITE_API_BASE_URL` env var)
- **No prefix** (e.g., `/api/v1` is not used)

### Authentication
- **Method**: Bearer JWT token in `Authorization` header
- **Token Storage**: localStorage with keys:
  - `access_token` (configurable via `VITE_TOKEN_KEY`)
  - `refresh_token` (configurable via `VITE_REFRESH_TOKEN_KEY`)
  - `token_expiry` (configurable via `VITE_TOKEN_EXPIRY_KEY`)

### Standard Error Response Format
```typescript
interface ApiError {
  code: string;           // e.g., "UNAUTHORIZED", "NOT_FOUND", "SERVER_ERROR"
  message: string;        // Human-readable error message
  status: number;         // HTTP status code
  details?: Record<string, unknown>;  // Additional error details
  timestamp: string;      // ISO timestamp
}
```

### Standard Success Response Format
```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}
```

### HTTP Status Code Mapping
- `401` → `UNAUTHORIZED` - Authentication required
- `403` → `FORBIDDEN` - Permission denied
- `404` → `NOT_FOUND` - Resource not found
- `500` → `SERVER_ERROR` - Server error
- No response → `NETWORK_ERROR` - Network error
- Timeout → `TIMEOUT` - Request timeout
- Other → `UNKNOWN` - Unknown error

### Query Client Configuration
```typescript
{
  retry: 3,
  retryDelay: exponential backoff,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,    // 10 minutes
  refetchOnWindowFocus: false,
  errorBoundary: true,
}
```

### Environment Variables
```bash
VITE_API_BASE_URL=https://dummyjson.com
VITE_API_TIMEOUT=30000
VITE_API_LOGGING=true
VITE_TOKEN_KEY=access_token
VITE_REFRESH_TOKEN_KEY=refresh_token
VITE_TOKEN_EXPIRY_KEY=token_expiry
VITE_ENABLE_REFRESH_TOKEN=true
VITE_ENABLE_ROLE_BASED_ACCESS=false
```

---

## 5. Type Schemas

### LoginPayload
```typescript
{
  username: string;
  password: string;
}
```

### LoginResponse
```typescript
{
  accessToken: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}
```

### UserProfile
```typescript
{
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  phone?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    postalCode?: string;
    country?: string;
  };
}
```

### User
```typescript
{
  id: number;
  email: string;
  password?: string;
  name: string;
  role: string;
  avatar: string;
  creationAt: string;
}
```

### CreateUserPayload
```typescript
{
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role?: string;
}
```

### UpdateUserPayload
```typescript
{
  email?: string;
  password?: string;
  name?: string;
  avatar?: string;
  role?: string;
}
```

### UserQueryParams
```typescript
{
  offset?: number;
  limit?: number;
  role?: string;
}
```

---

## 6. Query & Mutation Keys

### AUTH_QUERY_KEYS
```typescript
{
  ALL: ["auth"]
  LOGIN: (payload: { email: string }) => ["auth", "login", email]
  PROFILE: () => ["auth", "profile"]
  REFRESH: () => ["auth", "refresh"]
}
```

### USER_QUERY_KEYS
```typescript
{
  ALL: ["users"]
  LISTS: () => ["users", "list"]
  LIST: (filters?: Record<string, unknown>) => ["users", "list", filters]
  DETAILS: () => ["users", "detail"]
  DETAIL: (id: number) => ["users", "detail", id]
}
```

### AUTH_MUTATION_KEYS
```typescript
{
  LOGIN: () => ["auth", "login"]
  SIGNUP: () => ["auth", "signup"]
  LOGOUT: () => ["auth", "logout"]
}
```

### USER_MUTATION_KEYS
```typescript
{
  CREATE: () => ["users", "create"]
  UPDATE: (id: number) => ["users", "update", id]
  DELETE: (id: number) => ["users", "delete", id]
}
```

---

## 7. Redux State Structure

### AuthState
```typescript
{
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### Auth Slice Actions
- `setCredentials` - Set user and tokens
- `setUserProfile` - Set user profile
- `setLoading` - Set loading state
- `setError` - Set error state
- `logout` - Clear auth state
- `updateAccessToken` - Update access token

---

## 8. Available Hooks

| Hook | Type | Endpoint | Description |
|------|------|----------|-------------|
| `useLogin` | Mutation | POST /auth/login | Login with credentials |
| `useSignup` | Mutation | POST /users/ | Register new user |
| `useLogout` | Mutation | POST /auth/logout | Logout user |
| `useUserProfile` | Query | GET /auth/me | Fetch current user profile |
| `useUpdateProfile` | Mutation | PUT /users/{id} | Update user profile |
| `useUsers` | Query | GET /users/ | Fetch all users (paginated) |
| `useUser` | Query | GET /users/{id} | Fetch user by ID |
| `useCreateUser` | Mutation | POST /users/ | Create new user |
| `useUpdateUser` | Mutation | PUT /users/{id} | Update user |
| `useDeleteUser` | Mutation | DELETE /users/{id} | Delete user |