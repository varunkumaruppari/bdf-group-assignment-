# Part 4: Validation and Search – Evidence & Screenshot Checklist
**Team Member**: Maduru Sampath Kumar Reddy  
**Registration Number**: 252U1R7060  
**Assigned Responsibility**: Input Validation, Floor Query Search, Error Handling Middleware  

---

## 1. Associated Code Files
- [`src/middleware/validator.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/middleware/validator.js) – Middleware validating IDs, strings, regex emails, numeric floors, and status enums.
- [`src/middleware/errorHandler.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/middleware/errorHandler.js) – Centralized error handler and SQLite constraint mapper.
- [`src/middleware/notFound.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/middleware/notFound.js) – 404 Route Not Found middleware.
- [`src/controllers/lockerController.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/controllers/lockerController.js#L10-L32) (Lines 10–32) – Dynamic query filter implementation for floor, status, keyword search.

---

## 2. Verified Screenshots Present in this Folder

| # | Filename | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | [`01_search_lockers_by_floor.png`](./01_search_lockers_by_floor.png) | Postman: `GET http://localhost:3001/lockers?floor=2` → 200 OK · 529 B, returning lockers array exclusively for floor 2 (`Locker 10`, `Locker 11`). | **Verified & Present** |
| **2** | [`02_validation_error_400.png`](./02_validation_error_400.png) | Postman: `POST http://localhost:3001/lockers` with missing name → **400 Bad Request** · `{"error": "Locker name is required and must be a non-empty string"}`. | **Verified & Present** |
| **3** | [`03_not_found_404.png`](./03_not_found_404.png) | Postman: `GET http://localhost:3001/lockers/9999` → **404 Not Found** · `{"error": "Locker with ID 9999 not found"}`. | **Verified & Present** |
| **4** | [`04_centralized_error_handler.png`](./04_centralized_error_handler.png) | VS Code: `src/middleware/errorHandler.js` showing centralized error handler middleware mapping custom HTTP status codes and SQLite constraint violations. | **Verified & Present** |

---

## 3. Verification Notes
- Locker search supports combining multiple query filters: `floor`, `status`, and `search`.
- Validation errors return clear, human-readable error messages with HTTP 400.

