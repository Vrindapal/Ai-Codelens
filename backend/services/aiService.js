const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const analyzeWithAI = async ({
    language,
    code,
    staticAnalysis
}) => {

    const response = await groq.chat.completions.create({

        model: "openai/gpt-oss-20b",

        messages: [

            {
                role: "system",

                content: `
You are CodeLens AI, an expert software engineering agent.

Analyze the provided source code and static analysis.

For every bug, return the approximate 1-based line number where the problem occurs.

The line number must refer to the code provided by the user.

If the issue spans multiple lines, return the first relevant line.

Do not invent line numbers outside the provided code.

Your responsibilities:

1. Detect logical bugs.
2. Detect potential runtime errors.
3. Detect bad programming practices.
4. Explain complexity.
5. Suggest a better algorithm or approach.
6. Generate improved code.
7. Explain exactly what was changed.
8. Mention possible edge cases.
9. Give an interview-style explanation.

IMPORTANT:

- Do not claim a bug unless there is reasonable evidence.
- Do not change the intended functionality.
- Prefer efficient and readable solutions.
- If the code is already good, say so.
- Return ONLY valid JSON.
`
            },

            {
                role: "user",

                content: `
Language:
${language}

SOURCE CODE:
${code}

STATIC ANALYSIS:
${JSON.stringify(staticAnalysis, null, 2)}

Analyze this code completely.
`
            }

        ],

        response_format: {
            type: "json_schema",

            json_schema: {

                name: "code_intelligence",

                strict: true,

                schema: {

                    type: "object",

                    properties: {

                        summary: {
                            type: "string"
                        },

                        complexityExplanation: {
                            type: "string"
                        },

                        bugs: {
                            type: "array",

                            items: {
                                type: "object",

                                properties: {

                                    title: {
                                        type: "string"
                                    },

                                    severity: {
                                        type: "string"
                                    },

                                    line: {
                                        type: "integer"
                                    },

                                    explanation: {
                                        type: "string"
                                    },

                                    suggestion: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "title",
                                    "severity",
                                    "line",
                                    "explanation",
                                    "suggestion"
                                ],

                                additionalProperties: false
                            }
                        },

                        codeSmells: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },

                        betterApproach: {
                            type: "string"
                        },

                        whyBetter: {
                            type: "string"
                        },

                        improvedCode: {
                            type: "string"
                        },

                        changesMade: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },

                        edgeCases: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },

                        interviewTip: {
                            type: "string"
                        }

                    },

                    required: [
                        "summary",
                        "complexityExplanation",
                        "bugs",
                        "codeSmells",
                        "betterApproach",
                        "whyBetter",
                        "improvedCode",
                        "changesMade",
                        "edgeCases",
                        "interviewTip"
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
    analyzeWithAI
};