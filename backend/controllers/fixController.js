const {
    generateFix
} = require("../services/aiFixService");

const {
    generateCodeDiff
} = require("../services/diffService");


const fixCode = async (req, res) => {

    try {

        const {
            language,
            code,
            problem
        } = req.body;


        if (!language) {
            return res.status(400).json({
                success: false,
                message: "Language is required"
            });
        }


        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Code is required"
            });
        }


        if (!problem) {
            return res.status(400).json({
                success: false,
                message: "Problem description is required"
            });
        }


        // AI generates fixed code
        const result = await generateFix({
            language,
            code,
            problem
        });


        // Generate difference
        const diff = generateCodeDiff(
            code,
            result.fixedCode
        );


        return res.status(200).json({

            success: true,

            result: {
                ...result,
                diff
            }

        });


    } catch (error) {

        console.error(
            "Fix Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to generate code fix",

            error: error.message

        });

    }

};


module.exports = {
    fixCode
};