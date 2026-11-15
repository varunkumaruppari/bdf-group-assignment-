/**
 * Input validation helpers and middleware
 */

function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const id = Number(req.params[paramName]);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be a positive integer`
      });
    }
    next();
  };
}

function validateMember(req, res, next) {
  const { name, email, phone, membership_type } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Member name is required and must be a non-empty string'
    });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      error: 'A valid email address is required'
    });
  }

  if (phone !== undefined && typeof phone !== 'string') {
    return res.status(400).json({
      error: 'Phone must be a string if provided'
    });
  }

  if (membership_type !== undefined && (typeof membership_type !== 'string' || membership_type.trim() === '')) {
    return res.status(400).json({
      error: 'Membership type must be a non-empty string if provided'
    });
  }

  next();
}

function validateLocker(req, res, next) {
  const { name, floor, status } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Locker name is required and must be a non-empty string'
    });
  }

  if (floor === undefined || floor === null || isNaN(Number(floor))) {
    return res.status(400).json({
      error: 'Locker floor is required and must be a valid number'
    });
  }

  if (status !== undefined) {
    const validStatuses = ['available', 'occupied', 'maintenance'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
  }

  next();
}

function validateAllotment(req, res, next) {
  const { member_id, locker_id } = req.body;

  if (member_id === undefined || member_id === null || !Number.isInteger(Number(member_id)) || Number(member_id) <= 0) {
    return res.status(400).json({
      error: 'member_id is required and must be a positive integer'
    });
  }

  if (locker_id === undefined || locker_id === null || !Number.isInteger(Number(locker_id)) || Number(locker_id) <= 0) {
    return res.status(400).json({
      error: 'locker_id is required and must be a positive integer'
    });
  }

  next();
}

module.exports = {
  validateIdParam,
  validateMember,
  validateLocker,
  validateAllotment
};

