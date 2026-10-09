const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const generateFix = async ({
    language,
    code,
    problem
}) => {

    const response = await groq.chat.completions.create({

        model: "openai/gpt-oss-20b",

        messages: [

            {
                role: "system",

                content: `
You are CodeLens AI, an expert code fixing agent.

Your task is to fix the provided source code.

Rules:

1. Preserve the original functionality.
2. Fix only actual problems.
3. Improve code only when necessary.
4. Do not add unnecessary libraries.
5. Return complete corrected code.
6. Explain every important change.
7. Mention whether the complexity changed.
8. Return ONLY valid JSON.
`
            },

            {
                role: "user",

                content: `
Language:
${language}

Original Code:
${code}

Problem:
${problem}

Fix the code and explain the changes.
`
            }

        ],

        response_format: {
            type: "json_schema",

            json_schema: {

                name: "code_fix",

                strict: true,

                schema: {

                    type: "object",

                    properties: {

                        fixedCode: {
                            type: "string"
                        },

                        explanation: {
                            type: "string"
                        },

                        changes: {
                            type: "array",

                            items: {
                                type: "string"
                            }
                        },

                        complexityBefore: {
                            type: "string"
                        },

                        complexityAfter: {
                            type: "string"
                        }

                    },

                    required: [
                        "fixedCode",
                        "explanation",
                        "changes",
                        "complexityBefore",
                        "complexityAfter"
                    ],

                    additionalProperties: false
                }
            }
        }
    });

    const content =
        response.choices[0]?.message?.content;

    if (!content) {
        throw new Error("AI returned empty response");
    }

    return JSON.parse(content);
};

module.exports = {
    generateFix
};