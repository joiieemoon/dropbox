# ReactKit API Architecture

A production-grade, enterprise-ready API architecture for React 19 applications.

## Architecture Overview

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
├── config/
│   ├── app.config.ts          # Application configuration
│   ├── api.config.ts          # API configuration
│   └── auth.config.ts         # Auth configuration
└── components/common/routes/
    ├── PublicRoute.tsx        # Public route component
    ├── ProtectedRoute.tsx     # Protected route component
    ├── GuestRoute.tsx         # Guest route component
    └── AuthGuard.tsx          # Auth guard component
```

## Key Features

### 1. Axios Client (`src/api/client/`)

**axios.ts** - Creates a reusable axios instance with:

- Base URL from environment variables
- Default timeout (30s)
- JSON content type headers
- Request cancellation support

**interceptor.ts** - Configures interceptors:

- Request logging in development
- Response logging in development
- Authentication header injection
- Error normalization

**auth.interceptor.ts** - Authentication interceptors:

- Bearer token injection
- Refresh token support (future-ready)

**error.interceptor.ts** - Error handling:

- 401/403/404/500 error normalization
- Network error handling
- Consistent error structure

### 2. Types (`src/api/types/`)

**api.types.ts** - Core types:

- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - Normalized error structure
- `PaginatedResponse<T>` - Paginated response type
- `HttpMethod` - HTTP method enum

**auth.types.ts** - Auth types:

- `LoginPayload` - Login request
- `LoginResponse` - Login response
- `SignupPayload` - Signup request
- `SignupResponse` - Signup response
- `UserProfile` - User profile
- `AuthState` - Redux auth state

**user.types.ts** - User types:

- `User` - User entity
- `CreateUserPayload` - Create user request
- `UpdateUserPayload` - Update user request

### 3. Services (`src/api/services/`)

**auth.service.ts** - Authentication services:

- `login()` - Login with credentials
- `signup()` - Register new user
- `getCurrentUser()` - Get user profile
- `logout()` - Logout user
- `storeToken()` - Store tokens
- `removeTokens()` - Remove tokens
- `refreshToken()` - Refresh token (future-ready)

**user.service.ts** - User services:

- `getUsers()` - Get all users
- `getUserById()` - Get user by ID
- `createUser()` - Create user
- `updateUser()` - Update user
- `deleteUser()` - Delete user

### 4. Hooks (`src/api/hooks/`)

**useLogin.ts** - Login mutation hook:

- Automatic token storage
- Query invalidation
- Success/error callbacks
- Redirect support

**useSignup.ts** - Signup mutation hook:

- User profile mapping
- Success/error callbacks
- Redirect support

### 5. Query (`src/api/query/`)

**queryClient.ts** - TanStack Query client:

- 3 retry attempts with exponential backoff
- 5 minute stale time
- 10 minute cache time
- No refetch on window focus
- Error boundary support

**queryKeys.ts** - Query key factories:

- `AUTH_QUERY_KEYS` - Auth query keys
- `USER_QUERY_KEYS` - User query keys
- `PROFILE_QUERY_KEYS` - Profile query keys
- `ROLE_QUERY_KEYS` - Role query keys

**mutationKeys.ts** - Mutation key factories:

- `AUTH_MUTATION_KEYS` - Auth mutation keys
- `USER_MUTATION_KEYS` - User mutation keys

### 6. Redux Store (`src/store/`)

**slices/authSlice.ts** - Auth slice:

- `setCredentials` - Set user and tokens
- `setUserProfile` - Set user profile
- `setLoading` - Set loading state
- `setError` - Set error state
- `logout` - Clear auth state
- `updateAccessToken` - Update token (for refresh)

**selectors/auth.selector.ts** - Auth selectors:

- `selectUser` - Get current user
- `selectAccessToken` - Get access token
- `selectIsAuthenticated` - Get auth status
- `selectAuthLoading` - Get loading state
- `selectAuthError` - Get error state
- `selectUserRole` - Get user role

### 7. Token Storage (`src/api/auth.storage.ts`)

- `setToken()` - Store access token
- `getToken()` - Get access token
- `setRefreshToken()` - Store refresh token
- `getRefreshToken()` - Get refresh token
- `removeToken()` - Remove access token
- `removeRefreshToken()` - Remove refresh token
- `clearAuth()` - Clear all auth data
- `setTokenWithExpiry()` - Store token with expiration
- `isTokenExpired()` - Check token expiration
- `getValidToken()` - Get valid (non-expired) token

### 8. Route Guards (`src/components/common/routes/`)

**PublicRoute** - For unauthenticated users only
**ProtectedRoute** - For authenticated users only
**GuestRoute** - Alias for PublicRoute
**AuthGuard** - Loading state wrapper

## Usage Examples

### Using the Login Hook

```typescript
import { useLogin } from "@/api/hooks";

function LoginForm() {
  const {
    mutate: login,
    isPending,
    error,
  } = useLogin({
    onSuccessRedirect: "/documents",
    onError: (error) => console.error(error),
  });

  const handleSubmit = (values) => {
    login({ email: values.email, password: values.password });
  };
}
```

### Using Protected Routes

```typescript
import { ProtectedRoute } from "@/components/common/routes";

function AppLayout() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Using Redux Selectors

```typescript
import { useAppSelector } from "@/store/hooks";
import { selectUser, selectIsAuthenticated } from "@/store/selectors";

function UserProfile() {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) return <Navigate to="/signin" />;

  return <div>{user?.name}</div>;
}
```

## Environment Variables

```bash
# .env
VITE_API_BASE_URL=https://dummyjson.com
VITE_APP_NAME=ReactKit
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_TOKEN_KEY=access_token
VITE_REFRESH_TOKEN_KEY=refresh_token
VITE_TOKEN_EXPIRY_KEY=token_expiry
VITE_ENABLE_REFRESH_TOKEN=true
VITE_ENABLE_ROLE_BASED_ACCESS=false
VITE_API_LOGGING=true
```

## Best Practices

1. **Never call Axios directly** - Always use custom hooks
2. **Type safety** - All types are strictly defined
3. **Single responsibility** - Each file has one purpose
4. **Barrel exports** - Clean import paths
5. **Error normalization** - Consistent error handling
6. **Token security** - Secure storage with expiration
7. **Future-ready** - Refresh token and role-based access support
8. **Production optimized** - Caching, retry, and performance settings

## Future Enhancements

- Role-based access control (RBAC)
- Token refresh automation
- Request retry with exponential backoff
- API response caching strategies
- Request/response logging middleware
- API rate limiting
- Request batching
