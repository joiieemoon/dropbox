# PDF Viewer Access Fix Design

## Overview

This fix addresses access control issues in the PDF viewer sharing flow. The current `ViewerGate.tsx` implementation always redirects authenticated users to the login page when accessing shared links (`/v/:token`), ignoring that they may already be authenticated via localStorage. The fix will properly handle authenticated users by verifying their identity against document recipients and granting access directly without requiring additional authentication steps. Additionally, the unnecessary dashboard route will be removed.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - authenticated users being incorrectly prompted for login when accessing shared links
- **Property (P)**: The desired behavior - authenticated users should be able to access shared links without additional auth prompts
- **Preservation**: Existing authentication flow for unauthenticated users and email/OTP flow that must remain unchanged by the fix
- **ViewerGate**: The component in `src/features/documents/viewer/components/ViewerGate.tsx` that manages access control state machine
- **SecureViewer**: The component that wraps ViewerGate and renders the PDF viewer
- **userIdentity**: The utility in `src/features/documents/utils/userIdentity.ts` that maps DummyJSON users to recipient IDs
- **ViewerIdentity**: Object containing `username` and `recipientId` used for tracking access permissions
- **Token-based access**: The `/v/:token` route pattern for shared document links

## Bug Details

### Bug Condition

The bug manifests when an authenticated user (stored in localStorage via DummyJSON auth) clicks a shared document link. The `ViewerGate` component checks `isAuthenticated` and `user` state, but always sets the state to `login_required` without first checking if the user is already the intended recipient of the shared link.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ViewerGateProps (contains token, isAuthenticated, user)
  OUTPUT: boolean
  
  RETURN input.isAuthenticated = true
         AND input.user != null
         AND input.token != null
         AND user is the intended recipient of the shared link
         AND state is set to "login_required" instead of "verifying"
END FUNCTION
```

### Examples

1. **Authenticated Recipient Access**: User "emilys" (rec_1) clicks `/v/tok_alice_doc1` - expected: direct access to document, actual: redirected to login page
2. **Authenticated Non-Recipient Access**: User "michaelw" (rec_2) clicks `/v/tok_carol_doc2` - expected: access denied, actual: redirects to login page
3. **Unauthenticated Access**: User not logged in clicks `/v/tok_alice_doc1` - expected: redirect to login, actual: redirect to login (correct, but for wrong reason)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Unauthenticated users must still be redirected to the login page when accessing shared links
- The email/OTP flow must continue to work for cases where email verification is required
- Token validation and recipient verification must remain the same
- Navigation state preservation when redirecting to login (storing the viewer URL)
- Document access verification and session granting must work identically

**Scope:**
All inputs that do NOT involve authenticated users accessing their valid shared links should be completely unaffected by this fix. This includes:
- Unauthenticated access attempts
- Invalid/expired token access
- Non-recipient access attempts
- Email/OTP flow interactions

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Incorrect Authentication Check Order**: The `ViewerGate` component checks `!isAuthenticated || !user` and immediately sets state to `login_required` without first verifying if the user is the intended recipient of the shared link
   - The state machine flow is: `verifying` → `login_required` (even for authenticated users)
   - This happens in the initial useEffect when token is present

2. **Missing Recipient Verification Before Authentication State**: The code should verify the token first to determine if the user is the intended recipient, then decide whether additional authentication is needed
   - For authenticated users who are recipients: skip to `verifying` state
   - For unauthenticated users: set to `login_required` state

3. **Dashboard Route Unnecessary**: The `/dashboard` route in `src/route.tsx` is not needed for the viewer flow and should be removed

## Correctness Properties

Property 1: Bug Condition - Authenticated User Access to Shared Links

_For any_ authenticated user (isAuthenticated=true, user present) who clicks a valid shared link for which they are the intended recipient, the fixed ViewerGate component SHALL verify the token and grant access without setting the state to "login_required" or prompting for additional authentication.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Unauthenticated and Invalid Access

_For any_ input where the user is NOT authenticated OR the token is invalid/expired OR the user is NOT the intended recipient, the fixed ViewerGate component SHALL produce the same behavior as the original component, preserving the authentication flow and access denied handling.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `src/features/documents/viewer/components/ViewerGate.tsx`

**Function**: `ViewerGate` component - initial useEffect hook

**Specific Changes**:
1. **Reorder Authentication Check**: Before setting state to `login_required`, verify that the user is NOT the intended recipient of the shared link
   - If user is authenticated AND is the intended recipient, proceed to `verifying` state
   - If user is authenticated BUT not the intended recipient, proceed to `verifying` state (will be denied)
   - If user is NOT authenticated, set state to `login_required`

2. **Update useEffect Logic**: Move token verification before the login_required check when user is authenticated
   - First check: token exists
   - Second check: if not authenticated, redirect to login
   - Third check: if authenticated, verify token and proceed based on result

3. **Update Access Denied Message**: Change the "Access Denied" message to be more helpful without error styling
   - Current: generic error message
   - New: "This link is invalid or has expired. Please contact the sender for a new link."

4. **Remove Dashboard Route**: In `src/route.tsx`, remove the dashboard route entry

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, write tests that demonstrate the bug on the current code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that simulate authenticated users accessing shared links and assert that the correct state is set. Run these tests on the CURRENT (unfixed) code to observe the incorrect behavior.

**Test Cases**:
1. **Authenticated Recipient Test**: Simulate authenticated user "emilys" clicking `/v/tok_alice_doc1` - will show "login_required" state (bug)
2. **Authenticated Non-Recipient Test**: Simulate authenticated user "michaelw" clicking `/v/tok_carol_doc2` - will show "login_required" state (bug)
3. **Unauthenticated Access Test**: Simulate unauthenticated user clicking `/v/tok_alice_doc1` - will show "login_required" state (correct)
4. **Invalid Token Test**: Simulate authenticated user clicking `/v/invalid_token` - will show "login_required" state (bug)

**Expected Counterexamples**:
- Authenticated users who are recipients are incorrectly seeing "login_required" state
- The useEffect hook checks authentication BEFORE verifying token/recipient status
- Possible causes: incorrect order of checks, missing recipient verification

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode**:
```
FOR ALL input WHERE isBugCondition(input) DO
  result := ViewerGate_fixed(input)
  ASSERT result.state = "verifying" OR result.state = "granted" OR result.state = "denied"
  ASSERT result.state != "login_required"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode**:
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT ViewerGate_original(input) = ViewerGate_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on CURRENT code first for unauthenticated access and invalid tokens, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Unauthenticated Access Preservation**: Verify unauthenticated users still get redirected to login
2. **Invalid Token Preservation**: Verify invalid tokens still show "Access Denied"
3. **Navigation State Preservation**: Verify viewer URL is preserved in navigation state for login redirect
4. **Email/OTP Flow Preservation**: Verify email/OTP flow continues to work

### Unit Tests

- Test that authenticated recipients can access shared links without login prompt
- Test that unauthenticated users are redirected to login
- Test that invalid tokens show access denied
- Test navigation state preservation for login redirect
- Test email/OTP flow integration

### Property-Based Tests

- Generate random authentication states and token combinations to verify fix works
- Generate random user/recipient mappings to verify access control
- Test that all unauthenticated access attempts are properly handled

### Integration Tests

- Test full workflow: authenticated user clicks shared link → document viewer displays
- Test unauthenticated user clicks shared link → login redirect → return to viewer
- Test invalid token → access denied message displays correctly
- Test email/OTP flow integration with viewer access