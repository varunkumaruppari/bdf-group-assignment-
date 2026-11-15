const fs = require('fs');
const path = require('path');

const collectionPath = path.resolve(__dirname, '../FitNest_Gym_Locker_System.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Helper to create test script event block
function makeTestEvent(scriptLines) {
  return [
    {
      listen: "test",
      script: {
        type: "text/javascript",
        exec: scriptLines
      }
    }
  ];
}

// Ensure collectionVariables exist in collection variable definition
const requiredVariables = [
  { key: "baseUrl", value: "http://localhost:3000", type: "string" },
  { key: "createdMemberId", value: "1", type: "string" },
  { key: "locker12Id", value: "7", type: "string" },
  { key: "locker99Id", value: "8", type: "string" },
  { key: "createdAllotmentId", value: "1", type: "string" }
];

collection.variable = requiredVariables;

// Map each request name to its exact assertions and variable updates
const testScriptsMap = {
  // 00 - Health Check
  "API Root / Health Check": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Health check reports online status", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.status).to.eql("online");',
    '    pm.expect(json.project).to.include("FitNest Gym");',
    '    pm.expect(json.documentation).to.be.an("object");',
    '});'
  ],

  // 01 - Members
  "Get All Members": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns members array", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '    pm.expect(json.length).to.be.at.least(1);',
    '});'
  ],

  "Get Member by ID": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns member details", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.id).to.eql(1);',
    '    pm.expect(json).to.have.property("name");',
    '    pm.expect(json).to.have.property("email");',
    '});'
  ],

  "Get Member - Not Found (404)": [
    'pm.test("Status is 404 Not Found", function () {',
    '    pm.response.to.have.status(404);',
    '});',
    'pm.test("Error message mentions not found", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("not found");',
    '});'
  ],

  "Create Member (201)": [
    'pm.test("Status is 201 Created", function () {',
    '    pm.response.to.have.status(201);',
    '});',
    'pm.test("Created member returns ID and details", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.name).to.eql("Michael Scott");',
    '    pm.expect(json.email).to.eql("michael.scott@fitnest.com");',
    '    pm.collectionVariables.set("createdMemberId", json.id);',
    '});'
  ],

  "Create Member - Invalid Input (400)": [
    'pm.test("Status is 400 Bad Request", function () {',
    '    pm.response.to.have.status(400);',
    '});',
    'pm.test("Error indicates validation problem", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.be.a("string");',
    '});'
  ],

  "Create Member - Duplicate Email (409)": [
    'pm.test("Status is 409 Conflict", function () {',
    '    pm.response.to.have.status(409);',
    '});',
    'pm.test("Error indicates email conflict", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("already exists");',
    '});'
  ],

  "Update Member (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Member updated successfully", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.phone).to.eql("555-0999");',
    '    pm.expect(json.membership_type).to.eql("VIP");',
    '});'
  ],

  "Delete Member (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Member deleted successfully", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.message).to.include("deleted successfully");',
    '});'
  ],

  // 02 - Lockers (CRUD & Twist Tests)
  "Get All Lockers": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Lockers returned as array", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '    pm.expect(json.length).to.be.at.least(1);',
    '});'
  ],

  "Get Locker by ID": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns requested locker", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.id).to.eql(1);',
    '    pm.expect(json).to.have.property("name");',
    '});'
  ],

  "Get Locker - Not Found (404)": [
    'pm.test("Status is 404 Not Found", function () {',
    '    pm.response.to.have.status(404);',
    '});',
    'pm.test("Error mentions locker not found", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("not found");',
    '});'
  ],

  "Search Lockers by Floor (e.g. floor=2)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("All returned lockers are on floor 2", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '    json.forEach(function (locker) {',
    '        pm.expect(locker.floor).to.eql(2);',
    '    });',
    '});'
  ],

  "Search Lockers by Status (available)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("All returned lockers have available status", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '    json.forEach(function (locker) {',
    '        pm.expect(locker.status).to.eql("available");',
    '    });',
    '});'
  ],

  "Create Locker - Invalid Input (400)": [
    'pm.test("Status is 400 Bad Request", function () {',
    '    pm.response.to.have.status(400);',
    '});',
    'pm.test("Error indicates required locker fields missing", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.be.a("string");',
    '});'
  ],

  "Twist Test 1: Add Locker 12 (201)": [
    'pm.test("Twist Test 1: Status is 201 Created", function () {',
    '    pm.response.to.have.status(201);',
    '});',
    'pm.test("Locker 12 is created with floor 2", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.name).to.eql("Locker 12");',
    '    pm.expect(json.floor).to.eql(2);',
    '    pm.collectionVariables.set("locker12Id", json.id);',
    '});'
  ],

  "Twist Test 2: Add 'locker 12' Duplicate (409)": [
    'pm.test("Twist Test 2: Status is 409 Conflict", function () {',
    '    pm.response.to.have.status(409);',
    '});',
    'pm.test("Duplicate name collision error returned", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.eql("Locker 12 already exists");',
    '});'
  ],

  "Setup for Test 3: Add Locker 99 (201)": [
    'pm.test("Setup Test 3: Status is 201 Created", function () {',
    '    pm.response.to.have.status(201);',
    '});',
    'pm.test("Locker 99 is created", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.name).to.eql("Locker 99");',
    '    pm.collectionVariables.set("locker99Id", json.id);',
    '});'
  ],

  "Twist Test 3: Rename Locker 99 to 'Locker 12' (409)": [
    'pm.test("Twist Test 3: Status is 409 Conflict", function () {',
    '    pm.response.to.have.status(409);',
    '});',
    'pm.test("Rename collision error message returned", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.eql("Locker 12 already exists");',
    '});'
  ],

  "Update Locker - Self Update (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Self update succeeds without name collision", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.name).to.eql("Locker 12");',
    '    pm.expect(json.floor).to.eql(3);',
    '});'
  ],

  "Delete Locker (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Locker deleted confirmation", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.message).to.include("deleted successfully");',
    '});'
  ],

  "Cleanup: Delete Locker 12 (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Locker 12 cleaned up for repeatability", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.message).to.include("deleted successfully");',
    '});'
  ],

  // 03 - Allotments
  "View All Allotments": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns allotments list", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '});'
  ],

  "View Allotment by ID": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns allotment details", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.id).to.eql(1);',
    '    pm.expect(json).to.have.property("member_id");',
    '    pm.expect(json).to.have.property("locker_id");',
    '});'
  ],

  "View Allotment - Not Found (404)": [
    'pm.test("Status is 404 Not Found", function () {',
    '    pm.response.to.have.status(404);',
    '});',
    'pm.test("Error indicates allotment not found", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("not found");',
    '});'
  ],

  "Create Allotment (201)": [
    'pm.test("Status is 201 Created", function () {',
    '    pm.response.to.have.status(201);',
    '});',
    'pm.test("Allotment created with active status", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.member_id).to.eql(4);',
    '    pm.expect(json.locker_id).to.eql(2);',
    '    pm.expect(json.status).to.eql("active");',
    '    pm.collectionVariables.set("createdAllotmentId", json.id);',
    '});'
  ],

  "Create Allotment - Missing Fields (400)": [
    'pm.test("Status is 400 Bad Request", function () {',
    '    pm.response.to.have.status(400);',
    '});',
    'pm.test("Error indicates missing fields", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("required");',
    '});'
  ],

  "Create Allotment - Missing Member (404)": [
    'pm.test("Status is 404 Not Found", function () {',
    '    pm.response.to.have.status(404);',
    '});',
    'pm.test("Error indicates member not found", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("Member with ID");',
    '});'
  ],

  "Create Allotment - Occupied Locker Conflict (409)": [
    'pm.test("Status is 409 Conflict", function () {',
    '    pm.response.to.have.status(409);',
    '});',
    'pm.test("Error indicates locker already occupied", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.error).to.include("already occupied");',
    '});'
  ],

  "Update Allotment - Return / Mark Completed (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Allotment status marked returned", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.status).to.eql("returned");',
    '});'
  ],

  "Delete Allotment (200)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Allotment deleted confirmation", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.message).to.include("deleted successfully");',
    '});'
  ],

  // 04 - JOIN Endpoint
  "Get All Allotment Details (SQL JOIN)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns joined allotment, member and locker data", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '    pm.expect(json.length).to.be.at.least(1);',
    '    var first = json[0];',
    '    pm.expect(first).to.have.property("allotment_id");',
    '    pm.expect(first).to.have.property("member_name");',
    '    pm.expect(first).to.have.property("locker_name");',
    '    pm.expect(first).to.have.property("locker_floor");',
    '    pm.expect(first).to.have.property("member_email");',
    '});'
  ],

  "Get Single Allotment Details by ID (SQL JOIN)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("Returns joined record for allotment 2", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json.allotment_id).to.eql(2);',
    '    pm.expect(json.member_name).to.be.a("string");',
    '    pm.expect(json.locker_name).to.be.a("string");',
    '});'
  ],

  "Filter Joined Allotments by Status (active)": [
    'pm.test("Status is 200 OK", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    'pm.test("All returned items have active allotment status", function () {',
    '    var json = pm.response.json();',
    '    pm.expect(json).to.be.an("array");',
    '    json.forEach(function (item) {',
    '        pm.expect(item.allotment_status).to.eql("active");',
    '    });',
    '});'
  ]
};

// Traverse and update items in collection
let matched = 0;

for (const folder of collection.item) {
  if (!folder.item) continue;

  // Check if we need to update URL paths with dynamic variables
  for (const reqItem of folder.item) {
    const name = reqItem.name;
    if (testScriptsMap[name]) {
      reqItem.event = makeTestEvent(testScriptsMap[name]);
      matched++;
    }

    // Dynamic variable bindings for URL paths
    if (name === "Update Member (200)") {
      reqItem.request.url.raw = "{{baseUrl}}/members/{{createdMemberId}}";
      reqItem.request.url.path = ["members", "{{createdMemberId}}"];
    } else if (name === "Delete Member (200)") {
      reqItem.request.url.raw = "{{baseUrl}}/members/{{createdMemberId}}";
      reqItem.request.url.path = ["members", "{{createdMemberId}}"];
    } else if (name === "Twist Test 3: Rename Locker 99 to 'Locker 12' (409)") {
      reqItem.request.url.raw = "{{baseUrl}}/lockers/{{locker99Id}}";
      reqItem.request.url.path = ["lockers", "{{locker99Id}}"];
    } else if (name === "Update Locker - Self Update (200)") {
      reqItem.request.url.raw = "{{baseUrl}}/lockers/{{locker12Id}}";
      reqItem.request.url.path = ["lockers", "{{locker12Id}}"];
    } else if (name === "Delete Locker (200)") {
      reqItem.request.url.raw = "{{baseUrl}}/lockers/{{locker99Id}}";
      reqItem.request.url.path = ["lockers", "{{locker99Id}}"];
    } else if (name === "Update Allotment - Return / Mark Completed (200)") {
      reqItem.request.url.raw = "{{baseUrl}}/allotments/{{createdAllotmentId}}";
      reqItem.request.url.path = ["allotments", "{{createdAllotmentId}}"];
    } else if (name === "Delete Allotment (200)") {
      reqItem.request.url.raw = "{{baseUrl}}/allotments/{{createdAllotmentId}}";
      reqItem.request.url.path = ["allotments", "{{createdAllotmentId}}"];
    } else if (name === "Get Single Allotment Details by ID (SQL JOIN)") {
      reqItem.request.url.raw = "{{baseUrl}}/allotments/details/2";
      reqItem.request.url.path = ["allotments", "details", "2"];
    }
  }

  // Check if we need to add the cleanup request for Locker 12 at the end of Locker folder
  if (folder.name.includes("Lockers")) {
    const hasCleanup = folder.item.some(i => i.name === "Cleanup: Delete Locker 12 (200)");
    if (!hasCleanup) {
      folder.item.push({
        name: "Cleanup: Delete Locker 12 (200)",
        request: {
          method: "DELETE",
          header: [],
          url: {
            raw: "{{baseUrl}}/lockers/{{locker12Id}}",
            host: ["{{baseUrl}}"],
            path: ["lockers", "{{locker12Id}}"]
          },
          description: "Deletes Locker 12 so that the Postman collection run is completely repeatable from start to finish without leaving residual records."
        },
        event: makeTestEvent(testScriptsMap["Cleanup: Delete Locker 12 (200)"]),
        response: []
      });
      matched++;
    }
  }
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Successfully updated Postman collection with test assertions for ${matched} requests!`);
