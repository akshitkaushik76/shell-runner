const express = require('express');
const controller = require('./../Controllers/controller');
const router = express.Router();
router.route('/create').post(controller.Commands);
module.exports = router;

