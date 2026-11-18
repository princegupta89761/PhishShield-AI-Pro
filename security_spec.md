# Security Specification — PhishShield AI Pro

## 1. Data Invariants
1. **Identity Integrity**: Every document in `/users/{userId}`, `/users/{userId}/private/{docId}`, `/scans/{scanId}`, and `/reports/{reportId}` must bind `uid` or `userId` strictly to `request.auth.uid` on creation and preserve it immutably on update.
2. **Prevent Self-Assigned Roles**: A user creating `/users/{userId}` can only set `role == 'user'`, never `role == 'admin'`. Only an existing admin (`isAdmin()`) may promote or modify `role`.
3. **Verified Email Gate**: All standard Firestore writes require `request.auth != null && request.auth.token.email_verified == true`.
4. **PII Isolation**: User email addresses reside exclusively in `/users/{userId}/private/info`, accessible only to `isOwner(userId)` or `isAdmin()`.
5. **Path Variable & Payload Limits**: All document IDs match `^[a-zA-Z0-9_\-]+$` with `size() <= 128`. All strings enforce explicit `.size()` upper bounds, and all arrays enforce `.size() <= 20`.
6. **Temporal Integrity**: `createdAt` and `updatedAt` timestamps on Firestore writes are strictly validated against `request.time`.
7. **Terminal State Locking**: Once a scan reaches `status == 'archived'`, only an admin can unarchive or alter it.
8. **Secure List Queries**: `scans` and `reports` `list` rules enforce `resource.data.userId == request.auth.uid || isAdmin()`. `users` `list` is restricted to `isAdmin()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Update (`users`)**: User updates `/users/{uid}` with `{ displayName: "Alice", isVerifiedAdmin: true }` -> `PERMISSION_DENIED` (blocked by `affectedKeys().hasOnly(...)`).
2. **Role Escalation on Create (`users`)**: New user creates `/users/{uid}` with `{ role: "admin", ... }` -> `PERMISSION_DENIED` (blocked by `incoming().role == 'user'`).
3. **Role Escalation on Update (`users`)**: Standard user updates `/users/{uid}` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
4. **Email Spoofing (`admins` / `isAdmin`)**: Token has `email: "prince89761@gmail.com"` with `email_verified: false` -> `PERMISSION_DENIED`.
5. **Cross-User Scan Forgery (`scans`)**: Authenticated User A creates `/scans/scan1` with `{ userId: "userB", ... }` -> `PERMISSION_DENIED`.
6. **Orphaned Report Creation (`reports`)**: Authenticated User A creates `/reports/rep1` referencing a non-existent `scanId` -> `PERMISSION_DENIED` (`exists()` check fails).
7. **Unbounded Array Poisoning (`scans`)**: User creates `/scans/scan2` with `triggeredFeatures` containing 50 items or non-string element `[123]` -> `PERMISSION_DENIED`.
8. **ID Poisoning (`scans`)**: User attempts `create` on `/scans/` with a 2KB or `$bad*id` document ID -> `PERMISSION_DENIED` (`isValidId` regex/size check).
9. **Client Timestamp Tampering (`scans`)**: User creates `/scans/scan3` with backdated `createdAt` not equal to `request.time` -> `PERMISSION_DENIED`.
10. **PII Cross-Read (`users/private`)**: Authenticated User A reads `/users/userB/private/info` -> `PERMISSION_DENIED`.
11. **Blanket Query Scraping (`scans`)**: Authenticated User A runs `collection('scans')` list query without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
12. **Terminal State Bypass (`scans`)**: User updates an `archived` scan back to `completed` or alters `riskScore` -> `PERMISSION_DENIED`.
