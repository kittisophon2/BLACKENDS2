const express = require('express');
const app = express.Router();
const controller = require('../controllers/register.controller');

app.get("/", controller.get);
app.get("/:id",controller.getById);
app.post("/", controller.create);
app.put("/:id", controller.update);
app.delete("/:id", controller.delete);
app.post("/login", controller.login);
module.exports = app;