const express = require('express');
const router = express.Router();
const allotmentController = require('../controllers/allotmentController');
const { validateAllotment, validateIdParam } = require('../middleware/validator');

// GET /allotments/details - JOIN Endpoint returning Allotment, Member & Locker info
router.get('/details', allotmentController.getAllotmentDetails);

// GET /allotments/details/:id - JOIN Endpoint for a single allotment
router.get('/details/:id', validateIdParam('id'), allotmentController.getAllotmentDetailsById);

// GET /allotments - View all allotments
router.get('/', allotmentController.getAllAllotments);

// GET /allotments/:id - View an individual allotment
router.get('/:id', validateIdParam('id'), allotmentController.getAllotmentById);

// POST /allotments - Create an allotment
router.post('/', validateAllotment, allotmentController.createAllotment);

// PUT /allotments/:id - Update an allotment
router.put('/:id', validateIdParam('id'), allotmentController.updateAllotment);

// DELETE /allotments/:id - Delete an allotment
router.delete('/:id', validateIdParam('id'), allotmentController.deleteAllotment);

module.exports = router;

