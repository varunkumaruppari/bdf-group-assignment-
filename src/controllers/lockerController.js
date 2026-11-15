const { run, get, all } = require('../database/connection');

/**
 * Controller for Locker CRUD and search operations.
 */

// GET /lockers - Get all lockers with optional search/filter query params
async function getAllLockers(req, res, next) {
  try {
    const { floor, status, search, name } = req.query;
    let query = 'SELECT * FROM lockers WHERE 1=1';
    const params = [];

    if (floor !== undefined && floor !== '') {
      query += ' AND floor = ?';
      params.push(Number(floor));
    }

    if (status) {
      query += ' AND LOWER(status) = LOWER(?)';
      params.push(status.trim());
    }

    if (name) {
      query += ' AND LOWER(TRIM(name)) = LOWER(TRIM(?))';
      params.push(name.trim());
    } else if (search) {
      query += ' AND LOWER(name) LIKE ?';
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    query += ' ORDER BY floor ASC, id ASC';

    const lockers = await all(query, params);
    return res.status(200).json(lockers);
  } catch (error) {
    next(error);
  }
}

// GET /lockers/:id - Get one locker by ID
async function getLockerById(req, res, next) {
  try {
    const { id } = req.params;
    const locker = await get('SELECT * FROM lockers WHERE id = ?', [id]);

    if (!locker) {
      return res.status(404).json({
        error: `Locker with ID ${id} not found`
      });
    }

    return res.status(200).json(locker);
  } catch (error) {
    next(error);
  }
}

// POST /lockers - Create a new locker
// Enforces duplicate name prevention regardless of case
async function createLocker(req, res, next) {
  try {
    const { name, floor, status } = req.body;
    const trimmedName = name.trim();

    // Case-insensitive duplicate check
    const existing = await get(
      'SELECT * FROM lockers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
      [trimmedName]
    );

    if (existing) {
      return res.status(409).json({
        error: `${existing.name} already exists`
      });
    }

    const lockerStatus = status ? status.toLowerCase().trim() : 'available';

    const result = await run(
      'INSERT INTO lockers (name, floor, status) VALUES (?, ?, ?)',
      [trimmedName, Number(floor), lockerStatus]
    );

    const newLocker = await get('SELECT * FROM lockers WHERE id = ?', [result.lastID]);

    return res.status(201).json(newLocker);
  } catch (error) {
    // Catch SQLite UNIQUE constraint as fallback
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: `${req.body.name} already exists`
      });
    }
    next(error);
  }
}

// PUT /lockers/:id - Update an existing locker
// Enforces duplicate name check excluding the current locker
async function updateLocker(req, res, next) {
  try {
    const { id } = req.params;
    const { name, floor, status } = req.body;

    // Check if locker exists
    const currentLocker = await get('SELECT * FROM lockers WHERE id = ?', [id]);
    if (!currentLocker) {
      return res.status(404).json({
        error: `Locker with ID ${id} not found`
      });
    }

    const updatedName = name !== undefined ? name.trim() : currentLocker.name;
    const updatedFloor = floor !== undefined ? Number(floor) : currentLocker.floor;
    const updatedStatus = status !== undefined ? status.toLowerCase().trim() : currentLocker.status;

    // Check if name is taken by ANY OTHER locker (case-insensitive)
    if (name !== undefined) {
      const duplicate = await get(
        'SELECT * FROM lockers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?',
        [updatedName, id]
      );

      if (duplicate) {
        return res.status(409).json({
          error: `${duplicate.name} already exists`
        });
      }
    }

    await run(
      'UPDATE lockers SET name = ?, floor = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedName, updatedFloor, updatedStatus, id]
    );

    const updated = await get('SELECT * FROM lockers WHERE id = ?', [id]);
    return res.status(200).json(updated);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: `${req.body.name} already exists`
      });
    }
    next(error);
  }
}

// DELETE /lockers/:id - Delete a locker
async function deleteLocker(req, res, next) {
  try {
    const { id } = req.params;

    const locker = await get('SELECT * FROM lockers WHERE id = ?', [id]);
    if (!locker) {
      return res.status(404).json({
        error: `Locker with ID ${id} not found`
      });
    }

    // Check if locker currently has an active allotment
    const activeAllotment = await get(
      "SELECT id FROM allotments WHERE locker_id = ? AND status = 'active'",
      [id]
    );

    if (activeAllotment) {
      return res.status(409).json({
        error: `Cannot delete locker ${locker.name}: it is currently allotted (Allotment ID: ${activeAllotment.id})`
      });
    }

    await run('DELETE FROM lockers WHERE id = ?', [id]);

    return res.status(200).json({
      message: `Locker ${locker.name} (ID: ${id}) deleted successfully`,
      deletedLocker: locker
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllLockers,
  getLockerById,
  createLocker,
  updateLocker,
  deleteLocker
};

