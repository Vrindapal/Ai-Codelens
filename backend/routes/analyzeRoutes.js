const express = require("express");

const {
    analyzeCode
} = require("../controllers/analyzeController");

const router = express.Router();

router.post("/", analyzeCode);

module.exports = router;