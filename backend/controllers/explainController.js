const {
    explainWithAI
} = require("../services/explainService");


const explainCode = async (req, res) => {

    try {

        const {
            language,
            code
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


        console.log(
            "Explain language:",
            language
        );


        const result =
            await explainWithAI({
                language,
                code
            });


        return res.status(200).json({

            success: true,

            result

        });


    } catch (error) {

        console.error(
            "Explain Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to explain code",

            error:
                error.message

        });
    }
};


module.exports = {
    explainCode
};