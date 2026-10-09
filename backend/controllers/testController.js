const {
    generateTestsWithAI
} = require("../services/testService");


const generateTests = async (req, res) => {

    try {

        const {
            language,
            code
        } = req.body;


        if (!language) {

            return res.status(400).json({

                success: false,

                message:
                    "Language is required"

            });
        }


        if (!code) {

            return res.status(400).json({

                success: false,

                message:
                    "Code is required"

            });
        }


        console.log(
            "Test generation language:",
            language
        );


        const result =
            await generateTestsWithAI({

                language,
                code

            });


        return res.status(200).json({

            success: true,

            result

        });


    } catch (error) {

        console.error(
            "Test Generation Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to generate tests",

            error:
                error.message

        });

    }
};


module.exports = {

    generateTests

};