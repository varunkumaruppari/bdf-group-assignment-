# Part 6: Postman Automation & Project Documentation – Evidence & Screenshot Checklist
**Team Member**: Yelluri Navadeep Kumar  
**Registration Number**: 252U1R7100  
**Assigned Responsibility**: Postman Collection Test Scripts (`pm.test`), Collection Repeatability, Isolated Test Environment, and Project Documentation  

---

## 1. Associated Code Files
- [`FitNest_Gym_Locker_System.postman_collection.json`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/FitNest_Gym_Locker_System.postman_collection.json) – 34-request Postman v2.1.0 collection with test scripts (`pm.test`) and dynamic variable chaining.
- [`scripts/start-test-server.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/scripts/start-test-server.js) – Isolated test server on port 3001 using `fitnest_test.db`.
- [`scripts/reset-test-db.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/scripts/reset-test-db.js) – Reset script keeping test environment repeatable without touching production `fitnest.db`.
- [`scripts/verify-postman-collection.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/scripts/verify-postman-collection.js) – Automated verification runner executing the Postman collection.
- [`README.md`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/README.md) – Comprehensive assignment documentation.

---

## 2. Verified Screenshots Present in this Folder

| # | Filename | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | [`01_postman_collection_runner.png`](./01_postman_collection_runner.png) | Automated Postman collection execution showing 100% green passing results: 34 requests executed, 68 test assertions passed, 0 failures. | **Verified & Present** |
| **2** | [`02_isolated_test_server_port_3001.png`](./02_isolated_test_server_port_3001.png) | Terminal executing `npm run start:test`: isolated test server running on port 3001 using `fitnest_test.db` with production DB safe & untouched. | **Verified & Present** |
| **3** | [`03_database_isolation_proof.png`](./03_database_isolation_proof.png) | Terminal executing `node scripts/reset-test-db.js`: resetting and seeding test database while verifying `fitnest.db` remains UNCHANGED. | **Verified & Present** |

---

## 3. Verification Notes
- Every Postman request contains embedded `pm.test` assertions for status codes and payloads.
- Dynamic collection variables (`createdMemberId`, `locker12Id`, `locker99Id`, `createdAllotmentId`) chain created entities directly into subsequent update, get, and delete operations.
- Built-in cleanup requests ensure the entire collection can be re-run indefinitely with zero manual database resets.

