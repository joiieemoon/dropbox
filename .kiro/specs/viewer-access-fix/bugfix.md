# Bugfix Requirements Document

## Introduction

This bugfix addresses issues in the PDF viewer sharing/access flow where authenticated users are incorrectly prompted for authentication when accessing shared links. The current implementation in `ViewerGate.tsx` has a flawed state machine that always redirects authenticated users to the login page, ignoring that they may already be authenticated via localStorage. The dashboard page also needs to be removed as it's not needed.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks a shared link (e.g., `/v/:token`) AND the user is authenticated via localStorage THEN the system redirects to login page instead of granting access directly

1.2 WHEN a user clicks a shared link AND the user is authenticated THEN the system displays "Authentication Required" screen even though the user is already logged in

1.3 WHEN the dashboard route (`/dashboard`) is accessed THEN the system displays the dashboard page which should be removed

1.4 WHEN access is denied (invalid/expired link) THEN the system shows an error message with red styling that makes the situation feel like a technical error

### Expected Behavior (Correct)

2.1 WHEN a user clicks a shared link AND the user is authenticated via localStorage THEN the system SHALL verify token and grant access without requiring additional authentication

2.2 WHEN a user clicks a shared link AND the user is NOT authenticated THEN the system SHALL redirect to the sign-in page (preserving the viewer URL in state)

2.3 WHEN the dashboard route is accessed THEN the system SHALL NOT display the dashboard page (route should be removed)

2.4 WHEN access is denied (invalid/expired link) THEN the system SHALL show a helpful "Access Denied" message without error styling

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user is not authenticated AND clicks a shared link THEN the system SHALL CONTINUE TO redirect to the login page with the original viewer URL preserved in navigation state

3.2 WHEN email is submitted for OTP verification THEN the system SHALL CONTINUE TO work as before for cases where email/OTP flow is required

3.3 WHEN a user accesses the dashboard via direct navigation (e.g., from sidebar) THEN the system SHALL CONTINUE TO show an appropriate page (or redirect) - current dashboard functionality should be preserved or redirected

3.4 WHEN document access is valid AND user is authenticated THEN the system SHALL CONTINUE TO display the document viewer without interruption

3.5 WHEN sharing links to recipients (rec_1, rec_2, etc.) THEN the system SHALL CONTINUE TO work with the existing recipient mapping in `userIdentity.ts`