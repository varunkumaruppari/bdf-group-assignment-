const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { validateMember, validateIdParam } = require('../middleware/validator');

// GET /members - List all members
router.get('/', memberController.getAllMembers);

// GET /members/:id - Get member by ID
router.get('/:id', validateIdParam('id'), memberController.getMemberById);

// POST /members - Create a new member
router.post('/', validateMember, memberController.createMember);

// PUT /members/:id - Update existing member
router.put('/:id', validateIdParam('id'), memberController.updateMember);

// DELETE /members/:id - Delete member
router.delete('/:id', validateIdParam('id'), memberController.deleteMember);

module.exports = router;

