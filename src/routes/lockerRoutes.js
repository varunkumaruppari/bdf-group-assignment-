const express = require('express');
const router = express.Router();
const lockerController = require('../controllers/lockerController');
const { validateLocker, validateIdParam } = require('../middleware/validator');

// GET /lockers - Search / Filter / List lockers (e.g. GET /lockers?floor=2)
router.get('/', lockerController.getAllLockers);

// GET /lockers/:id - Get one locker by ID
router.get('/:id', validateIdParam('id'), lockerController.getLockerById);

// POST /lockers - Create a new locker
router.post('/', validateLocker, lockerController.createLocker);

// PUT /lockers/:id - Update an existing locker
router.put('/:id', validateIdParam('id'), lockerController.updateLocker);

// DELETE /lockers/:id - Delete a locker
router.delete('/:id', validateIdParam('id'), lockerController.deleteLocker);

module.exports = router;

