# Part 1: Server and Routes – Evidence & Screenshot Checklist
**Team Member**: Ragiman Sai Jashwanth Reddy  
**Registration Number**: 252U1R7084  
**Assigned Responsibility**: Express Server Initialization, Middleware Configuration, and Route Mounting  

---

## 1. Associated Code Files
- [`src/server.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/server.js) – Server entrypoint, port listener, database bootup, graceful shutdown.
- [`src/app.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/app.js) – Express application configuration, CORS, body parsers, router mountings.
- [`src/routes/memberRoutes.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/routes/memberRoutes.js) – Router definitions for `/members`.
- [`src/routes/lockerRoutes.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/routes/lockerRoutes.js) – Router definitions for `/lockers`.
- [`src/routes/allotmentRoutes.js`](file:///C:/Users/uvaru/OneDrive/Desktop/GROUP%20ASS/src/routes/allotmentRoutes.js) – Router definitions for `/allotments` (including `/details`).

---

## 2. Verified Screenshots Present in this Folder

| # | Filename | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | [`01_server_startup.png`](./01_server_startup.png) | Terminal: `npm start` output showing FitNest Gym Server running on http://localhost:3000 with all route URLs. | **Verified & Present** |
| **2** | [`02_health_check_endpoint.png`](./02_health_check_endpoint.png) | Postman: `GET http://localhost:3000/` returning HTTP 200 OK with project name, status: online, and documentation map. | **Verified & Present** |
| **3** | [`03_route_mounting_code.png`](./03_route_mounting_code.png) | VS Code: `src/app.js` showing route mounting for `/members`, `/lockers`, and `/allotments` (lines 32–35). | **Verified & Present** |
| **4** | [`04_graceful_shutdown.png`](./04_graceful_shutdown.png) | Terminal: "Gracefully shutting down FitNest Gym Server..." with database connection closed on `Ctrl+C`. | **Verified & Present** |

---

## 3. Verification Notes
- Server gracefully captures both `SIGINT` and `SIGTERM`.
- All routes mount under their standard prefixes: `/members`, `/lockers`, `/allotments`.

