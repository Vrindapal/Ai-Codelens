const Groq = require("groq-sdk");


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


const explainWithAI = async ({
    language,
    code
}) => {


    const response =
        await groq.chat.completions.create({

            model:
                "openai/gpt-oss-20b",


            messages: [

                {
                    role: "system",

                    content: `
You are CodeLens AI.

You are an expert programming teacher.

Explain the provided code in a simple,
clear and beginner-friendly way.

Your explanation must include:

1. What the code does.
2. Step-by-step explanation.
3. Important variables.
4. Algorithm or approach.
5. Time complexity.
6. Space complexity.
7. Possible edge cases.
8. Important interview points.

Do not change the code.

Return ONLY valid JSON.
`
                },


                {
                    role: "user",

                    content: `
Language:

${language}


SOURCE CODE:

${code}


Explain this code completely.
`
                }

            ],


            response_format: {

                type: "json_schema",

                json_schema: {

                    name:
                        "code_explanation",

                    strict: true,

                    schema: {

                        type: "object",

                        properties: {

                            summary: {
                                type: "string"
                            },

                            stepByStep: {

                                type: "array",

                                items: {
                                    type: "string"
                                }
                            },

                            variables: {

                                type: "array",

                                items: {
                                    type: "string"
                                }
                            },

                            approach: {
                                type: "string"
                            },

                            timeComplexity: {
                                type: "string"
                            },

                            spaceComplexity: {
                                type: "string"
                            },

                            edgeCases: {

                                type: "array",

                                items: {
                                    type: "string"
                                }
                            },

                            interviewPoints: {

                                type: "array",

                                items: {
                                    type: "string"
                                }
                            }

                        },


                        required: [

                            "summary",

                            "stepByStep",

                            "variables",

                            "approach",

                            "timeComplexity",

                            "spaceComplexity",

                            "edgeCases",

                            "interviewPoints"

                        ],


                        additionalProperties: false
                    }
                }
            }
        });


    const content =
        response.choices[0]?.message?.content;


    if (!content) {

        throw new Error(
            "AI returned empty response"
        );
    }


    return JSON.parse(content);
};


module.exports = {
    explainWithAI
};