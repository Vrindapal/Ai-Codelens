const express = require("express");

const router = express.Router();

const {
    explainCode
} = require("../controllers/explainController");

router.post(
    "/",
    explainCode
);

module.exports = router;