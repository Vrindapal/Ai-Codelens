const express = require("express");

const {
    fixCode
} = require("../controllers/fixController");

const router = express.Router();

router.post("/", fixCode);

module.exports = router;