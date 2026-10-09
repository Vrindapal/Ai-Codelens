const Groq = require("groq-sdk");


const groq = new Groq({

    apiKey:
        process.env.GROQ_API_KEY

});


const generateTestsWithAI = async ({
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

You are CodeLens AI,
an expert software testing assistant.

Generate useful unit tests
for the provided source code.

Rules:

1. Understand the function first.
2. Generate meaningful test cases.
3. Include normal cases.
4. Include edge cases.
5. Include invalid or boundary cases when relevant.
6. Use Jest for JavaScript and JavaScript React.
7. Do not modify the original function.
8. Return only valid JSON.

`
                },


                {

                    role: "user",

                    content: `

Language:

${language}


SOURCE CODE:

${code}


Generate Jest unit tests
for this code.

`
                }

            ],


            response_format: {

                type:
                    "json_schema",


                json_schema: {

                    name:
                        "code_tests",


                    strict:
                        true,


                    schema: {

                        type:
                            "object",


                        properties: {

                            framework: {

                                type:
                                    "string"

                            },


                            explanation: {

                                type:
                                    "string"

                            },


                            testCases: {

                                type:
                                    "array",

                                items: {

                                    type:
                                        "string"

                                }

                            },


                            testCode: {

                                type:
                                    "string"

                            }

                        },


                        required: [

                            "framework",

                            "explanation",

                            "testCases",

                            "testCode"

                        ],


                        additionalProperties:
                            false

                    }

                }

            }

        });


    const content =
        response
            .choices[0]
            ?.message
            ?.content;


    if (!content) {

        throw new Error(
            "AI returned empty test response"
        );

    }


    return JSON.parse(content);

};


module.exports = {

    generateTestsWithAI

};