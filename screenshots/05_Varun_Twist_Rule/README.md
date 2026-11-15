# Part 5: Twist Rule & Automated Testing – Evidence & Screenshot Checklist
**Team Member**: Uppari Varun Kumar  
**Registration Number**: 252U1R7094  
**Assigned Responsibility**: Case-Insensitive Duplicate Locker Name Prevention (Twist Rule), Conflict Responses (409), and Jest Automated Test Suites  

---

## 1. Associated Code Files
- [`src/controllers/lockerController.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/controllers/lockerController.js#L67-L76) (Lines 67–76, 120–129) – Application-level case-insensitive duplicate check and self-exclusion logic.
- [`src/database/init.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/database/init.js#L27) (Line 27) – Database schema `name TEXT NOT NULL UNIQUE COLLATE NOCASE`.
- [`tests/twist.test.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/tests/twist.test.js) – Jest test suite specifically validating Twist Tests 1, 2, 3, variants, and concurrent race-condition handling.

---

## 2. Verified Screenshots Present in this Folder

| # | Filename | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | [`01_twist_test_1_create_201.png`](./01_twist_test_1_create_201.png) | Postman adding `"Locker 12"` returning HTTP 201 Created. | **Verified & Present** |
| **2** | [`02_twist_test_2_duplicate_409.png`](./02_twist_test_2_duplicate_409.png) | Postman adding `"locker 12"` returning HTTP 409 Conflict with exact error `{"error": "Locker 12 already exists"}`. | **Verified & Present** |
| **3** | [`03_twist_test_3_rename_409.png`](./03_twist_test_3_rename_409.png) | Postman renaming another locker (`Locker 20`, ID: 6) to `"Locker 12"` returning HTTP 409 Conflict. | **Verified & Present** |
| **4** | [`04_twist_self_update_200.png`](./04_twist_self_update_200.png) | Postman showing `"Locker 20"` updating its floor to 2 while retaining name returning HTTP 200 OK. | **Verified & Present** |
| **5** | [`05_jest_automated_twist_tests.png`](./05_jest_automated_twist_tests.png) | Terminal running Jest twist test suite with 8/8 passing tests (including concurrency test). | **Verified & Present** |
| **6** | [`06_full_test_suite_49_passing.png`](./06_full_test_suite_49_passing.png) | Terminal running full Jest test suite showing all 4 test suites and 49 tests passing. | **Verified & Present** |

---

## 3. Verification Notes
- The twist rule is enforced at both the application query layer (`LOWER(TRIM(name))`) and the database layer (`COLLATE NOCASE`).
- The concurrency test in `tests/twist.test.js` proves that simultaneous requests in parallel cannot slip past the unique name validation.

