const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use isolated test database
const TEST_DB_PATH = path.resolve(__dirname, '../src/database/fitnest_test.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const { getDatabase, close } = require('../src/database/connection');
const { initDatabase } = require('../src/database/init');
const { seedDatabase } = require('../src/database/seed');

async function runPostmanCollection() {
  console.log('====================================================');
  console.log('EXECUTING POSTMAN COLLECTION TEST RUNNER');
  console.log('Target: FitNest Gym Isolated Test Environment');
  console.log('====================================================\n');

  const db = getDatabase(TEST_DB_PATH);
  await initDatabase(db);
  // Clear tables to start completely fresh
  const { run } = require('../src/database/connection');
  await run('DELETE FROM allotments', [], db);
  await run('DELETE FROM lockers', [], db);
  await run('DELETE FROM members', [], db);
  try { await run('DELETE FROM sqlite_sequence', [], db); } catch (e) {}
  await seedDatabase(db);

  const collectionPath = path.resolve(__dirname, '../FitNest_Gym_Locker_System.postman_collection.json');
  const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

  const variables = {};
  collection.variable.forEach(v => {
    variables[v.key] = v.value;
  });

  function resolveUrl(rawUrl) {
    let resolved = rawUrl;
    for (const [key, val] of Object.entries(variables)) {
      resolved = resolved.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }
    // Remove baseUrl for supertest
    resolved = resolved.replace('http://localhost:3000', '');
    return resolved;
  }

  let totalRequests = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  const executionLog = [];

  for (const folder of collection.item) {
    console.log(`\n📁 FOLDER: ${folder.name}`);
    if (!folder.item) continue;

    for (const reqItem of folder.item) {
      totalRequests++;
      const req = reqItem.request;
      const method = req.method.toLowerCase();
      const pathUrl = resolveUrl(req.url.raw);

      let reqBuilder = request(app)[method](pathUrl);
      if (req.header) {
        req.header.forEach(h => reqBuilder.set(h.key, h.value));
      }

      let payload = null;
      if (req.body && req.body.raw) {
        try {
          payload = JSON.parse(req.body.raw);
          reqBuilder = reqBuilder.send(payload);
        } catch (e) {
          reqBuilder = reqBuilder.send(req.body.raw);
        }
      }

      const response = await reqBuilder;

      // Extract test assertions from collection item
      const testEvents = reqItem.event ? reqItem.event.filter(e => e.listen === 'test') : [];
      let itemPassed = true;
      const itemAssertions = [];

      if (testEvents.length > 0 && testEvents[0].script && testEvents[0].script.exec) {
        const scriptLines = testEvents[0].script.exec;
        
        // Mock Postman Environment
        const pm = {
          test: (testName, fn) => {
            try {
              fn();
              itemAssertions.push({ name: testName, pass: true });
            } catch (err) {
              itemPassed = false;
              itemAssertions.push({ name: testName, pass: false, error: err.message });
            }
          },
          response: {
            to: {
              have: {
                status: (expectedStatus) => {
                  if (response.status !== expectedStatus) {
                    throw new Error(`Expected status ${expectedStatus} but got ${response.status}`);
                  }
                }
              }
            },
            json: () => response.body
          },
          collectionVariables: {
            set: (key, val) => {
              variables[key] = String(val);
            },
            get: (key) => variables[key]
          },
          expect: (actual) => ({
            to: {
              eql: (expected) => {
                if (actual !== expected) {
                  throw new Error(`Expected ${JSON.stringify(actual)} to eql ${JSON.stringify(expected)}`);
                }
              },
              include: (substring) => {
                if (typeof actual !== 'string' || !actual.includes(substring)) {
                  throw new Error(`Expected "${actual}" to include "${substring}"`);
                }
              },
              be: {
                an: (expectedType) => {
                  const actualType = Array.isArray(actual) ? 'array' : typeof actual;
                  if (actualType !== expectedType) {
                    throw new Error(`Expected type ${expectedType} but got ${actualType}`);
                  }
                },
                a: (expectedType) => {
                  const actualType = Array.isArray(actual) ? 'array' : typeof actual;
                  if (actualType !== expectedType) {
                    throw new Error(`Expected type ${expectedType} but got ${actualType}`);
                  }
                },
                at: {
                  least: (min) => {
                    if (typeof actual !== 'number' || actual < min) {
                      throw new Error(`Expected at least ${min} but got ${actual}`);
                    }
                  }
                }
              },
              have: {
                property: (prop) => {
                  if (!actual || actual[prop] === undefined) {
                    throw new Error(`Expected object to have property "${prop}"`);
                  }
                }
              }
            }
          })
        };

        // Execute assertion script
        try {
          const scriptCode = scriptLines.join('\n');
          const fn = new Function('pm', scriptCode);
          fn(pm);
        } catch (err) {
          itemPassed = false;
          itemAssertions.push({ name: `Script execution error: ${err.message}`, pass: false });
        }
      }

      const passCount = itemAssertions.filter(a => a.pass).length;
      const failCount = itemAssertions.filter(a => !a.pass).length;
      passedAssertions += passCount;
      failedAssertions += failCount;

      const symbol = itemPassed ? '✔' : '✖';
      console.log(`  ${symbol} [${req.method}] ${pathUrl} -> HTTP ${response.status} (${passCount} assertions passed)`);
      if (failCount > 0) {
        console.log(`     FAILED:`, itemAssertions.filter(a => !a.pass));
      }

      executionLog.push({
        name: reqItem.name,
        method: req.method,
        url: pathUrl,
        status: response.status,
        passed: itemPassed,
        assertions: itemAssertions
      });
    }
  }

  await close(db);

  console.log('\n====================================================');
  console.log('POSTMAN COLLECTION EXECUTION SUMMARY');
  console.log('====================================================');
  console.log(`• Total Requests Executed:    ${totalRequests}`);
  console.log(`• Total Assertions Verified:   ${passedAssertions + failedAssertions}`);
  console.log(`• Passed Assertions:          ${passedAssertions}`);
  console.log(`• Failed Assertions:          ${failedAssertions}`);
  console.log(`• Overall Status:             ${failedAssertions === 0 ? 'ALL PASSED (100%)' : 'FAILURES DETECTED'}`);
  console.log('====================================================');

  process.exit(failedAssertions === 0 ? 0 : 1);
}

runPostmanCollection().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
