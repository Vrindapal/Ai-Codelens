const express = require("express");

const router = express.Router();

const {
    generateTests
} = require("../controllers/testController");

router.post(
    "/",
    generateTests
);

module.exports = router;