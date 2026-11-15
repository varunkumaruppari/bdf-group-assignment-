const { run, get, all } = require('../database/connection');

/**
 * Controller for Allotment operations and SQL JOIN queries.
 */

// GET /allotments - View all allotments (supports ?status=active)
async function getAllAllotments(req, res, next) {
  try {
    const { status, includeDetails } = req.query;

    if (includeDetails === 'true') {
      return getAllotmentDetails(req, res, next);
    }

    let sql = 'SELECT * FROM allotments WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status.trim());
    }

    sql += ' ORDER BY id DESC';
    const allotments = await all(sql, params);
    return res.status(200).json(allotments);
  } catch (error) {
    next(error);
  }
}

// GET /allotments/details - JOIN Endpoint returning Allotment, Member & Locker info
async function getAllotmentDetails(req, res, next) {
  try {
    const { status, member_id, locker_id } = req.query;

    let sql = `
      SELECT 
        a.id AS allotment_id,
        m.id AS member_id,
        m.name AS member_name,
        m.email AS member_email,
        m.phone AS member_phone,
        m.membership_type,
        l.id AS locker_id,
        l.name AS locker_name,
        l.floor AS locker_floor,
        l.status AS locker_status,
        a.start_date,
        a.end_date,
        a.status AS allotment_status,
        a.created_at,
        a.updated_at
      FROM allotments a
      INNER JOIN members m ON a.member_id = m.id
      INNER JOIN lockers l ON a.locker_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND LOWER(a.status) = LOWER(?)';
      params.push(status.trim());
    }

    if (member_id) {
      sql += ' AND a.member_id = ?';
      params.push(Number(member_id));
    }

    if (locker_id) {
      sql += ' AND a.locker_id = ?';
      params.push(Number(locker_id));
    }

    sql += ' ORDER BY a.id DESC';

    const results = await all(sql, params);
    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
}

// GET /allotments/details/:id - JOIN Endpoint for a single allotment
async function getAllotmentDetailsById(req, res, next) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        a.id AS allotment_id,
        m.id AS member_id,
        m.name AS member_name,
        m.email AS member_email,
        m.phone AS member_phone,
        m.membership_type,
        l.id AS locker_id,
        l.name AS locker_name,
        l.floor AS locker_floor,
        l.status AS locker_status,
        a.start_date,
        a.end_date,
        a.status AS allotment_status,
        a.created_at,
        a.updated_at
      FROM allotments a
      INNER JOIN members m ON a.member_id = m.id
      INNER JOIN lockers l ON a.locker_id = l.id
      WHERE a.id = ?
    `;

    const result = await get(sql, [id]);

    if (!result) {
      return res.status(404).json({
        error: `Allotment with ID ${id} not found`
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// GET /allotments/:id - View an individual allotment
async function getAllotmentById(req, res, next) {
  try {
    const { id } = req.params;
    const allotment = await get('SELECT * FROM allotments WHERE id = ?', [id]);

    if (!allotment) {
      return res.status(404).json({
        error: `Allotment with ID ${id} not found`
      });
    }

    return res.status(200).json(allotment);
  } catch (error) {
    next(error);
  }
}

// POST /allotments - Create an allotment
// Enforces:
// 1. Valid member & locker existence
// 2. Prevent assigning an already-occupied locker (HTTP 409)
// 3. Prevent member having multiple active allotments (HTTP 409)
async function createAllotment(req, res, next) {
  try {
    const { member_id, locker_id, start_date, end_date } = req.body;

    // Check member existence
    const member = await get('SELECT * FROM members WHERE id = ?', [member_id]);
    if (!member) {
      return res.status(404).json({
        error: `Member with ID ${member_id} not found`
      });
    }

    // Check locker existence
    const locker = await get('SELECT * FROM lockers WHERE id = ?', [locker_id]);
    if (!locker) {
      return res.status(404).json({
        error: `Locker with ID ${locker_id} not found`
      });
    }

    // Check if locker is already occupied by an active allotment
    const activeLockerAllotment = await get(
      "SELECT id FROM allotments WHERE locker_id = ? AND status = 'active'",
      [locker_id]
    );

    if (activeLockerAllotment || locker.status === 'occupied') {
      return res.status(409).json({
        error: `Locker '${locker.name}' is already occupied and cannot be allotted`
      });
    }

    // Check if member already has an active allotment
    const activeMemberAllotment = await get(
      "SELECT a.id, l.name AS locker_name FROM allotments a JOIN lockers l ON a.locker_id = l.id WHERE a.member_id = ? AND a.status = 'active'",
      [member_id]
    );

    if (activeMemberAllotment) {
      return res.status(409).json({
        error: `Member '${member.name}' already has an active locker allotment (${activeMemberAllotment.locker_name})`
      });
    }

    const startDate = start_date || new Date().toISOString();
    const endDate = end_date || null;

    // Insert new allotment
    const result = await run(
      'INSERT INTO allotments (member_id, locker_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
      [member_id, locker_id, startDate, endDate, 'active']
    );

    // Update locker status to 'occupied'
    await run("UPDATE lockers SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [locker_id]);

    const created = await get('SELECT * FROM allotments WHERE id = ?', [result.lastID]);
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

// PUT /allotments/:id - Update an allotment (e.g. change status, change dates, transfer locker)
async function updateAllotment(req, res, next) {
  try {
    const { id } = req.params;
    const { status, end_date, locker_id } = req.body;

    const currentAllotment = await get('SELECT * FROM allotments WHERE id = ?', [id]);
    if (!currentAllotment) {
      return res.status(404).json({
        error: `Allotment with ID ${id} not found`
      });
    }

    let targetLockerId = currentAllotment.locker_id;
    let targetStatus = status !== undefined ? status.toLowerCase().trim() : currentAllotment.status;
    let targetEndDate = end_date !== undefined ? end_date : currentAllotment.end_date;

    // If changing locker, verify new locker exists and is not occupied
    if (locker_id !== undefined && Number(locker_id) !== currentAllotment.locker_id) {
      const newLocker = await get('SELECT * FROM lockers WHERE id = ?', [locker_id]);
      if (!newLocker) {
        return res.status(404).json({
          error: `New locker with ID ${locker_id} not found`
        });
      }

      const activeOnNewLocker = await get(
        "SELECT id FROM allotments WHERE locker_id = ? AND status = 'active' AND id != ?",
        [locker_id, id]
      );

      if (activeOnNewLocker || newLocker.status === 'occupied') {
        return res.status(409).json({
          error: `Target locker '${newLocker.name}' is already occupied`
        });
      }

      // Free old locker if old allotment was active
      if (currentAllotment.status === 'active') {
        await run("UPDATE lockers SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [currentAllotment.locker_id]);
      }

      // Mark new locker as occupied
      await run("UPDATE lockers SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [locker_id]);
      targetLockerId = Number(locker_id);
    }

    // If status changed from active to returned/completed/cancelled, free up the locker
    if (currentAllotment.status === 'active' && targetStatus !== 'active') {
      await run("UPDATE lockers SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [targetLockerId]);
      if (!targetEndDate) {
        targetEndDate = new Date().toISOString();
      }
    } else if (currentAllotment.status !== 'active' && targetStatus === 'active') {
      // Re-activating allotment, ensure locker is free
      const activeCheck = await get(
        "SELECT id FROM allotments WHERE locker_id = ? AND status = 'active' AND id != ?",
        [targetLockerId, id]
      );
      if (activeCheck) {
        return res.status(409).json({
          error: 'Cannot reactivate allotment: locker is currently occupied by another allotment'
        });
      }
      await run("UPDATE lockers SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [targetLockerId]);
    }

    await run(
      'UPDATE allotments SET locker_id = ?, status = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [targetLockerId, targetStatus, targetEndDate, id]
    );

    const updated = await get('SELECT * FROM allotments WHERE id = ?', [id]);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

// DELETE /allotments/:id - Delete an allotment
async function deleteAllotment(req, res, next) {
  try {
    const { id } = req.params;

    const allotment = await get('SELECT * FROM allotments WHERE id = ?', [id]);
    if (!allotment) {
      return res.status(404).json({
        error: `Allotment with ID ${id} not found`
      });
    }

    await run('DELETE FROM allotments WHERE id = ?', [id]);

    // Check if any other active allotment exists for this locker; if not, mark available
    const remainingActive = await get(
      "SELECT id FROM allotments WHERE locker_id = ? AND status = 'active'",
      [allotment.locker_id]
    );

    if (!remainingActive) {
      await run("UPDATE lockers SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [allotment.locker_id]);
    }

    return res.status(200).json({
      message: `Allotment ID ${id} deleted successfully`,
      deletedAllotment: allotment
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllAllotments,
  getAllotmentById,
  getAllotmentDetails,
  getAllotmentDetailsById,
  createAllotment,
  updateAllotment,
  deleteAllotment
};

