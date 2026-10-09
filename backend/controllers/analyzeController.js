const {
    analyzeComplexity
} = require("../analyzers/complexityAnalyzer");

const {
    analyzeWithAI
} = require("../services/aiService");


const analyzeCode = async (req, res) => {

    try {

        const { language, code } = req.body;
        console.log("Received language:", language);


        // -----------------------------
        // Validation
        // -----------------------------

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


        // -----------------------------
        // JavaScript Analysis
        // -----------------------------

        const normalizedLanguage = language.toLowerCase();

        if (
            normalizedLanguage === "javascript" ||
            normalizedLanguage === "javascriptreact"
        ) {

            const complexityResult =
                analyzeComplexity(code);


            if (!complexityResult.success) {

                return res.status(400).json({
                    success: false,
                    message: complexityResult.error,
                    details: complexityResult.details
                });

            }


            // -----------------------------
            // AI Analysis
            // -----------------------------

            const aiAnalysis = await analyzeWithAI({

                language,

                code,

                staticAnalysis: {

                    complexity:
                        complexityResult.complexity,

                    statistics:
                        complexityResult.statistics,

                    issues:
                        complexityResult.issues,

                    suggestions:
                        complexityResult.suggestions

                }

            });


            // -----------------------------
            // Final Response
            // -----------------------------

            return res.status(200).json({

                success: true,

                result: {

                    language,

                    complexity:
                        complexityResult.complexity,

                    statistics:
                        complexityResult.statistics,

                    issues:
                        complexityResult.issues,

                    suggestions:
                        complexityResult.suggestions,

                    aiAnalysis

                }

            });

        }


        // -----------------------------
        // Unsupported Language
        // -----------------------------

        return res.status(200).json({

            success: true,

            result: {

                language,

                complexity: {

                    time: "Not supported yet",

                    space: "Not supported yet"

                },

                issues: [
                    `${language} analyzer is not supported yet. Currently supported languages: JavaScript and JavaScript React.`
                ],

                suggestions: []

            }

        });


    } catch (error) {

        console.error(
            "Analyze Error:",
            error
        );


        res.status(500).json({

            success: false,

            message: "Failed to analyze code",

            error: error.message

        });

    }

};


module.exports = {
    analyzeCode
};