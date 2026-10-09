const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const analyzeRoutes = require("./routes/analyzeRoutes");
const fixRoutes = require("./routes/fixRoutes");
const explainRoutes = require("./routes/explainRoutes");
const testRoutes =
    require("./routes/testRoutes");

const app = express();

app.use(cors());

app.use(express.json());


/* =====================================================
   ROUTES
===================================================== */

app.use(
    "/api/analyze",
    analyzeRoutes
);

app.use(
    "/api/fix",
    fixRoutes
);

app.use(
    "/api/explain",
    explainRoutes
);

app.use(
    "/api/tests",
    testRoutes
);

/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.json({
        message:
            "CodeLens AI Backend is running 🚀"
    });

});


/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(500).json({
            success: false,
            message:
                "Something went wrong"
        });

    }
);


/* =====================================================
   SERVER
===================================================== */

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);