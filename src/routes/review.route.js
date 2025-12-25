const express = require('express');
const app = express.Router();
const controller = require('../controllers/review.controller');

app.get("/", controller.getUserMostReview);

module.exports = app;
