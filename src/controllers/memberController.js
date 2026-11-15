const { run, get, all } = require('../database/connection');

/**
 * Controller for Member CRUD operations.
 */

// GET /members - Get all members
async function getAllMembers(req, res, next) {
  try {
    const members = await all('SELECT * FROM members ORDER BY id ASC');
    return res.status(200).json(members);
  } catch (error) {
    next(error);
  }
}

// GET /members/:id - Get one member by ID
async function getMemberById(req, res, next) {
  try {
    const { id } = req.params;
    const member = await get('SELECT * FROM members WHERE id = ?', [id]);

    if (!member) {
      return res.status(404).json({
        error: `Member with ID ${id} not found`
      });
    }

    return res.status(200).json(member);
  } catch (error) {
    next(error);
  }
}

// POST /members - Create a new member
async function createMember(req, res, next) {
  try {
    const { name, email, phone, membership_type } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await get(
      'SELECT id, email FROM members WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))',
      [trimmedEmail]
    );

    if (existing) {
      return res.status(409).json({
        error: `A member with email '${email}' already exists`
      });
    }

    const type = membership_type ? membership_type.trim() : 'Standard';
    const memberPhone = phone ? phone.trim() : null;

    const result = await run(
      'INSERT INTO members (name, email, phone, membership_type) VALUES (?, ?, ?, ?)',
      [name.trim(), trimmedEmail, memberPhone, type]
    );

    const newMember = await get('SELECT * FROM members WHERE id = ?', [result.lastID]);
    return res.status(201).json(newMember);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: `Member with email '${req.body.email}' already exists`
      });
    }
    next(error);
  }
}

// PUT /members/:id - Update an existing member
async function updateMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, membership_type } = req.body;

    const currentMember = await get('SELECT * FROM members WHERE id = ?', [id]);
    if (!currentMember) {
      return res.status(404).json({
        error: `Member with ID ${id} not found`
      });
    }

    const updatedName = name !== undefined ? name.trim() : currentMember.name;
    const updatedEmail = email !== undefined ? email.trim().toLowerCase() : currentMember.email;
    const updatedPhone = phone !== undefined ? phone.trim() : currentMember.phone;
    const updatedType = membership_type !== undefined ? membership_type.trim() : currentMember.membership_type;

    if (email !== undefined) {
      const duplicate = await get(
        'SELECT id FROM members WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND id != ?',
        [updatedEmail, id]
      );

      if (duplicate) {
        return res.status(409).json({
          error: `Email '${email}' is already in use by another member`
        });
      }
    }

    await run(
      'UPDATE members SET name = ?, email = ?, phone = ?, membership_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedName, updatedEmail, updatedPhone, updatedType, id]
    );

    const updated = await get('SELECT * FROM members WHERE id = ?', [id]);
    return res.status(200).json(updated);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: `Email '${req.body.email}' is already in use`
      });
    }
    next(error);
  }
}

// DELETE /members/:id - Delete a member
async function deleteMember(req, res, next) {
  try {
    const { id } = req.params;

    const member = await get('SELECT * FROM members WHERE id = ?', [id]);
    if (!member) {
      return res.status(404).json({
        error: `Member with ID ${id} not found`
      });
    }

    // Check if member has active allotments
    const activeAllotment = await get(
      "SELECT id FROM allotments WHERE member_id = ? AND status = 'active'",
      [id]
    );

    if (activeAllotment) {
      return res.status(409).json({
        error: `Cannot delete member ${member.name}: active locker allotment exists (Allotment ID: ${activeAllotment.id})`
      });
    }

    await run('DELETE FROM members WHERE id = ?', [id]);

    return res.status(200).json({
      message: `Member ${member.name} (ID: ${id}) deleted successfully`,
      deletedMember: member
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};

