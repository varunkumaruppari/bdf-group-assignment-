# Part 3: REST Endpoints – Evidence & Screenshot Checklist
**Team Member**: P Manish  
**Registration Number**: 252U1R7070  
**Assigned Responsibility**: Member CRUD, Locker CRUD, Allotment Relationship, and SQL JOIN Endpoint  

---

## 1. Associated Code Files
- [`src/controllers/memberController.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/controllers/memberController.js) – Full CRUD for Gym Members.
- [`src/controllers/lockerController.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/controllers/lockerController.js) – Full CRUD for Gym Lockers.
- [`src/controllers/allotmentController.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/controllers/allotmentController.js) – Allotment lifecycle, occupied checks, and multi-table SQL `INNER JOIN` query.

---

## 2. Verified Screenshots Present in this Folder

| # | Filename | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | [`01_member_crud_postman.png`](./01_member_crud_postman.png) | Postman: `GET http://localhost:3000/members` → 200 OK · returning members array (Alex Johnson, Samantha Miller) with all fields: `id`, `name`, `email`, `phone`, `membership_type`, `created_at`, `updated_at`. | **Verified & Present** |
| **2** | [`02_allotment_create_success.png`](./02_allotment_create_success.png) | Postman: `POST http://localhost:3001/allotments` with `{"member_id": 3, "locker_id": 3}` → **201 Created** · returning new allotment `id: 3`, `status: "active"`. | **Verified & Present** |
| **3** | [`03_allotment_occupied_conflict.png`](./03_allotment_occupied_conflict.png) | Postman: `POST http://localhost:3001/allotments` with `{"member_id": 4, "locker_id": 3}` → **409 Conflict** · `{"error": "Locker 'Locker 03' is already occupied and cannot be allotted"}`. | **Verified & Present** |
| **4** | [`04_join_endpoint_response.png`](./04_join_endpoint_response.png) | Postman: `GET http://localhost:3000/allotments/details` → 200 OK · 1.03 KB · returning SQL JOIN data with `allotment_id`, `member_name: "Samantha Miller"`, `locker_name: "Locker 10"`, `locker_floor`, `allotment_status`. | **Verified & Present** |

---

## 3. Verification Notes
- The JOIN endpoint combines data from all three tables using SQL `INNER JOIN`:
  `allotments a INNER JOIN members m ON a.member_id = m.id INNER JOIN lockers l ON a.locker_id = l.id`.

