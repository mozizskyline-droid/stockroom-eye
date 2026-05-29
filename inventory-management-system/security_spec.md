# 🛡️ Firebase Security Specification (TDD SPEC)

## 1. Core Data Invariants

*   **Product Quantities**: Must never drop below zero.
*   **Immutable Logs**: Write operations on `transactions` and `sales` can only insert (`create`) new entries. Updates and deletions are strictly blocked to preserve audit integrity.
*   **Role-Based Access Control (RBAC)**:
    *   **Admin**: Unrestricted read/write access.
    *   **Manager**: Can manage products, perform stock operations, check reports and transactions, but cannot change roles or delete other users.
    *   **Staff**: Only permitted to record sales and decrement stock quantities that arise from sales. No product updates or direct stock re-entries allowed.
*   **Role Immutability**: No user can self-manage or upgrade their own role.

---

## 2. The "Dirty Dozen" Threat Vectors

1.  **Privilege Escalation**: Non-admin user tries to write a `User` profile with `role = "Admin"`.
2.  **Product Overwrite**: A Staff member attempts to modify the `sellingPrice` of a high-value item directly.
3.  **Negative Stock Poisoning**: Staff registers a sale of 100 items when only 5 exist, forcing the database into negative numbers.
4.  **Audit Deletion**: Staff attempts to delete a transaction logging entry to cover up stock theft.
5.  **Phantom Sale Update**: Customer/Staff attempts to modify a completed sale's `total` value after creation.
6.  **Unauthenticated Write**: An anonymous socket attempts to create high-volume junk products.
7.  **Resource Exhaustion (ID Poisoning)**: Creating documents with IDs larger than 128 characters or containing illegal ASCII code spaces.
8.  **Orphaned Sale**: Writing a sale document with a reference to a nonexistent `productId`.
9.  **Time Spoofing / Backdating**: Submitting items with `createdAt` or `date` pointing to 2 years in the future rather than using `request.time`.
10. **Admin Bypass Attack**: Accessing system configuration or audit logs with a mock claims token spoof.
11. **PII Harvesting**: Accessing and reading all registered user emails globally without proper permissions.
12. **Self-Demotion / Lockout**: A manager or admin accidentally clearing their own authentication credentials database records.

---

## 3. Test Cases Draft Verification

Our security rules are structured to block each of these twelve vulnerabilities instantly:
*   `hasOnly()` validation ensures no phantom properties can be appended to standard writes.
*   `affectedKeys()` gating restricts non-admin product modifications.
*   Transaction integrity and existence checks are mapped synchronously where possible.
