# Part 2: Database Architecture – Evidence & Screenshot Checklist
**Team Member**: Palusa Sai Mokshith Goud  
**Registration Number**: 252U1R7074  
**Assigned Responsibility**: SQLite Relational Database, Schema Constraints, Foreign Keys & Seeder  

---

## 1. Associated Code Files
- [`src/database/connection.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/database/connection.js) – Promisified SQLite3 wrapper (`run`, `get`, `all`), foreign key pragma, dynamic database path resolver.
- [`src/database/init.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/database/init.js) – DDL statements for `members`, `lockers`, `allotments`, `COLLATE NOCASE`, `ON DELETE CASCADE`, indexes.
- [`src/database/seed.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/database/seed.js) – Seeder script creating initial gym members, multi-floor lockers, and allotments.

---

## 2. Verified Screenshots Present in this Folder

| # | Filename | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | [`01_sqlite_schema_init.png`](./01_sqlite_schema_init.png) | VS Code: `src/database/init.js` showing all 3 `CREATE TABLE` blocks — `members`, `lockers` (`UNIQUE COLLATE NOCASE`), `allotments` (`FOREIGN KEY … ON DELETE CASCADE`) — plus 4 `CREATE INDEX` statements. | **Verified & Present** |
| **2** | [`02_foreign_keys_pragma.png`](./02_foreign_keys_pragma.png) | VS Code: `src/database/connection.js` showing `sqlite3` require, `dbInstance` singleton, `DB_PATH` resolver (line 27), and `PRAGMA foreign_keys = ON;` (line 44). | **Verified & Present** |
| **3** | [`03_database_seed_execution.png`](./03_database_seed_execution.png) | Terminal: `node scripts/reset-test-db.js` → resetting `fitnest_test.db`, seeding 6 lockers, confirming "Original database (fitnest.db) is UNCHANGED." | **Verified & Present** |
| **4** | [`04_sqlite_tables_verification.png`](./04_sqlite_tables_verification.png) | Postman: `GET http://localhost:3000/lockers` → 200 OK · 1.27 KB, returning persisted locker records (Locker 01, 02, 03…) across floors 1, 2, 3. | **Verified & Present** |

---

## 3. Verification Notes
- SQLite database strictly enforces relational integrity with `ON DELETE CASCADE`.
- Four dedicated indexes improve performance on foreign keys and search filters (`floor`, `member_id`, `locker_id`, `status`).

