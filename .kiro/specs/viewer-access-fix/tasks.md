# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Authenticated User Access to Shared Links
  - **IMPORTANT**: Write this property-based test BEFORE implementing the fix
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: authenticated user accessing their valid shared link
  - Test that ViewerGate sets state to "login_required" for authenticated users who are recipients (from Bug Condition in design)
  - Run test on UNFIXED code - expect FAILURE (this confirms the bug exists)
  - Document counterexamples found (e.g., "Authenticated user 'emilys' accessing /v/tok_alice_doc1 shows 'login_required' state instead of proceeding to verifying state")
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Unauthenticated and Invalid Access Handling
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Unauthenticated user accessing shared link gets redirected to login on current code
  - Observe: Invalid token access shows "Access Denied" on current code
  - Observe: Navigation state preserves viewer URL for login redirect on current code
  - Write property-based tests: for all unauthenticated or invalid access cases, behavior matches current implementation (from Preservation Requirements in design)
  - Verify tests PASS on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix for PDF viewer access flow

  - [ ] 3.1 Implement the fix
    - Reorder useEffect logic in ViewerGate to verify token BEFORE setting login_required state for authenticated users
    - Add recipient verification before authentication check
    - Update access denied message to be more helpful
    - _Bug_Condition: isBugCondition(input) where isAuthenticated=true AND user is intended recipient_
    - _Expected_Behavior: expectedBehavior(result) from design - authenticated users should proceed to verifying state_
    - _Preservation: Preservation Requirements from design - unauthenticated and invalid access must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Authenticated User Access to Shared Links
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Unauthenticated and Invalid Access Handling
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.