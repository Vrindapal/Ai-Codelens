const vscode = require("vscode");
const axios = require("axios");

let fixEditor;
let fixSelection;
let diagnosticCollection;


/* =========================================================
   ACTIVATE EXTENSION
========================================================= */

function activate(context) {

    console.log("CodeLens AI extension activated!");


    /* =====================================================
       DIAGNOSTICS
    ===================================================== */

    diagnosticCollection =
        vscode.languages.createDiagnosticCollection(
            "codelens-ai"
        );

    context.subscriptions.push(
        diagnosticCollection
    );


    /* =====================================================
       QUICK FIX PROVIDER
    ===================================================== */

    const codeActionProvider =
        vscode.languages.registerCodeActionsProvider(
            { scheme: "file" },
            new CodeLensAIActionProvider(),
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.QuickFix
                ]
            }
        );

    context.subscriptions.push(
        codeActionProvider
    );


    /* =====================================================
       CODELENS PROVIDER
    ===================================================== */

    const codeLensProvider =
        vscode.languages.registerCodeLensProvider(
            { scheme: "file" },
            new CodeLensAIProvider()
        );

    context.subscriptions.push(
        codeLensProvider
    );


    /* =====================================================
       ANALYZE COMMAND
    ===================================================== */

    const analyzeCommand =
        vscode.commands.registerCommand(
            "codelens-ai.analyze",

            async (codeLensRange) => {

                const editor =
                    vscode.window.activeTextEditor;


                if (!editor) {

                    vscode.window.showErrorMessage(
                        "No active editor found."
                    );

                    return;
                }


                /* Clear previous diagnostics */

                diagnosticCollection.delete(
                    editor.document.uri
                );


                /* =================================================
                   GET CODE
                ================================================= */

                let selectedCode;


                if (codeLensRange) {

                    /*
                        CodeLens Analyze
                    */

                    selectedCode =
                        editor.document.getText(
                            codeLensRange
                        );


                    /*
                        Save editor and selection
                        for possible Fix operation
                    */

                    fixEditor = editor;

                    fixSelection =
                        new vscode.Selection(
                            codeLensRange.start,
                            codeLensRange.end
                        );

                } else {

                    /*
                        Manual selection
                    */

                    selectedCode =
                        editor.document.getText(
                            editor.selection
                        );
                }


                if (!selectedCode.trim()) {

                    vscode.window.showWarningMessage(
                        "Please select some code first."
                    );

                    return;
                }


                const language =
                    editor.document.languageId;


                console.log(
                    "Language:",
                    language
                );

                console.log(
                    "Selected code:",
                    selectedCode
                );


                /* =================================================
                   SEND CODE TO BACKEND
                ================================================= */

                try {

                    await vscode.window.withProgress(
                        {
                            location:
                                vscode.ProgressLocation.Notification,

                            title:
                                "CodeLens AI is analyzing your code...",

                            cancellable: false
                        },

                        async () => {

                            const response =
                                await axios.post(
                                    "http://localhost:5000/api/analyze",

                                    {
                                        language,
                                        code: selectedCode
                                    }
                                );


                            console.log(
                                "Backend response:",
                                response.data
                            );


                            /*
                                Show analysis window
                            */

                            showAnalysis(
                                response.data
                            );


                            /*
                                Add problems
                            */

                            addDiagnostics(
                                editor,
                                response.data
                            );
                        }
                    );

                } catch (error) {

                    console.error(
                        "CodeLens AI Error:",
                        error
                    );


                    if (error.response) {

                        vscode.window.showErrorMessage(
                            `Backend Error: ${error.response.data.message ||
                            "Analysis failed"
                            }`
                        );

                    } else {

                        vscode.window.showErrorMessage(
                            "Could not connect to CodeLens AI backend."
                        );
                    }
                }
            }
        );


    context.subscriptions.push(
        analyzeCommand
    );


    /* =====================================================
       EXPLAIN COMMAND
    ===================================================== */

    const explainCommand =
        vscode.commands.registerCommand(
            "codelens-ai.explain",

            async (codeLensRange) => {

                const editor =
                    vscode.window.activeTextEditor;


                if (!editor) {

                    vscode.window.showErrorMessage(
                        "No active editor found."
                    );

                    return;
                }


                /* =================================================
                   GET CODE
                ================================================= */

                let selectedCode;


                if (codeLensRange) {

                    /*
                        CodeLens Explain
                    */

                    selectedCode =
                        editor.document.getText(
                            codeLensRange
                        );

                } else {

                    /*
                        Manual selection
                    */

                    selectedCode =
                        editor.document.getText(
                            editor.selection
                        );
                }


                if (!selectedCode.trim()) {

                    vscode.window.showWarningMessage(
                        "Please select some code first."
                    );

                    return;
                }


                const language =
                    editor.document.languageId;


                console.log(
                    "Explain language:",
                    language
                );

                console.log(
                    "Explain code:",
                    selectedCode
                );


                /* =================================================
                   SEND CODE TO EXPLAIN API
                ================================================= */

                try {

                    await vscode.window.withProgress(
                        {
                            location:
                                vscode.ProgressLocation.Notification,

                            title:
                                "CodeLens AI is explaining your code...",

                            cancellable: false
                        },

                        async () => {

                            const response =
                                await axios.post(
                                    "http://localhost:5000/api/explain",

                                    {
                                        language,
                                        code: selectedCode
                                    }
                                );


                            console.log(
                                "Explain response:",
                                response.data
                            );


                            /*
                                Show explanation window
                            */

                            showExplanation(
                                response.data
                            );
                        }
                    );

                } catch (error) {

                    console.error(
                        "Explain Error:",
                        error
                    );


                    if (error.response) {

                        vscode.window.showErrorMessage(
                            `Backend Error: ${error.response.data.message ||
                            "Explanation failed"
                            }`
                        );

                    } else {

                        vscode.window.showErrorMessage(
                            "Could not connect to CodeLens AI backend."
                        );
                    }
                }
            }
        );


    context.subscriptions.push(
        explainCommand
    );


    /* =====================================================
   TEST GENERATION COMMAND
===================================================== */

    const testCommand =
        vscode.commands.registerCommand(
            "codelens-ai.tests",

            async (codeLensRange) => {

                const editor =
                    vscode.window.activeTextEditor;


                if (!editor) {

                    vscode.window.showErrorMessage(
                        "No active editor found."
                    );

                    return;
                }


                /* =================================================
                   GET CODE
                ================================================= */

                let selectedCode;


                if (codeLensRange) {

                    /*
                        CodeLens Test Generation
                    */

                    selectedCode =
                        editor.document.getText(
                            codeLensRange
                        );

                } else {

                    /*
                        Manual selection
                    */

                    selectedCode =
                        editor.document.getText(
                            editor.selection
                        );
                }


                if (!selectedCode.trim()) {

                    vscode.window.showWarningMessage(
                        "Please select some code first."
                    );

                    return;
                }


                const language =
                    editor.document.languageId;


                console.log(
                    "Test generation language:",
                    language
                );


                console.log(
                    "Test generation code:",
                    selectedCode
                );


                /* =================================================
                   SEND CODE TO BACKEND
                ================================================= */

                try {

                    await vscode.window.withProgress(

                        {
                            location:
                                vscode.ProgressLocation.Notification,

                            title:
                                "CodeLens AI is generating tests...",

                            cancellable: false
                        },


                        async () => {

                            const response =
                                await axios.post(

                                    "http://localhost:5000/api/tests",

                                    {
                                        language,
                                        code: selectedCode
                                    }

                                );


                            console.log(
                                "Test generation response:",
                                response.data
                            );


                            /*
                                Show generated tests
                            */

                            showTestResult(
                                response.data
                            );

                        }

                    );


                } catch (error) {

                    console.error(
                        "Test Generation Error:",
                        error
                    );


                    if (error.response) {

                        vscode.window.showErrorMessage(

                            `Backend Error: ${error.response.data.message ||
                            "Test generation failed"
                            }`

                        );

                    } else {

                        vscode.window.showErrorMessage(

                            "Could not connect to CodeLens AI backend."

                        );

                    }

                }

            }
        );


    context.subscriptions.push(
        testCommand
    );




    /* =====================================================
       CODE QUALITY SCORE COMMAND
    ===================================================== */

    const qualityCommand = vscode.commands.registerCommand(
        "codelens-ai.quality",
        async (codeLensRange) => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage(
                    "Please open a code file first."
                );
                return;
            }

            const selectedCode = codeLensRange
                ? editor.document.getText(codeLensRange)
                : editor.document.getText(editor.selection);

            if (!selectedCode.trim()) {
                vscode.window.showWarningMessage(
                    "Select code or use the CodeLens Quality button."
                );
                return;
            }

            try {
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: "CodeLens AI is checking code quality...",
                        cancellable: false
                    },
                    async () => {
                        const response = await axios.post(
                            "http://localhost:5000/api/analyze",
                            {
                                language: editor.document.languageId,
                                code: selectedCode
                            }
                        );

                        showQualityResult(response.data);
                    }
                );
            } catch (error) {
                console.error("Quality Score Error:", error);

                vscode.window.showErrorMessage(
                    error.response?.data?.message ||
                    "Could not calculate quality score. Check the backend."
                );
            }
        }
    );

    context.subscriptions.push(
        qualityCommand
    );


    /* =====================================================
       FIX COMMAND
    ===================================================== */

    const fixCommand =
        vscode.commands.registerCommand(
            "codelens-ai.fix",

            async (
                codeLensRange,
                diagnosticMessage
            ) => {

                const editor =
                    vscode.window.activeTextEditor;


                if (!editor) {

                    vscode.window.showErrorMessage(
                        "No active editor found."
                    );

                    return;
                }


                /* =================================================
                   SAVE EDITOR
                ================================================= */

                fixEditor =
                    editor;


                /* =================================================
                   GET CODE
                ================================================= */

                let selectedCode;


                if (codeLensRange) {

                    /*
                        CodeLens Fix
                    */

                    selectedCode =
                        editor.document.getText(
                            codeLensRange
                        );


                    fixSelection =
                        new vscode.Selection(
                            codeLensRange.start,
                            codeLensRange.end
                        );

                } else {

                    /*
                        Quick Fix / manual selection
                    */

                    fixSelection =
                        new vscode.Selection(
                            editor.selection.start,
                            editor.selection.end
                        );


                    selectedCode =
                        editor.document.getText(
                            editor.selection
                        );
                }


                if (!selectedCode.trim()) {

                    vscode.window.showWarningMessage(
                        "Please select some code first."
                    );

                    return;
                }


                const language =
                    editor.document.languageId;


                /* =================================================
                   PROBLEM
                ================================================= */

                const problem =
                    diagnosticMessage ||
                    "Fix the reported CodeLens AI issue.";


                console.log(
                    "Fix language:",
                    language
                );

                console.log(
                    "Fix problem:",
                    problem
                );

                console.log(
                    "Fix code:",
                    selectedCode
                );


                /* =================================================
                   SEND CODE TO FIX API
                ================================================= */

                try {

                    await vscode.window.withProgress(
                        {
                            location:
                                vscode.ProgressLocation.Notification,

                            title:
                                "CodeLens AI is generating a fix...",

                            cancellable: false
                        },

                        async () => {

                            const response =
                                await axios.post(
                                    "http://localhost:5000/api/fix",

                                    {
                                        language,
                                        code: selectedCode,
                                        problem: problem
                                    }
                                );


                            console.log(
                                "Fix response:",
                                response.data
                            );


                            /*
                                Show fix result
                            */

                            showFixResult(
                                response.data
                            );
                        }
                    );

                } catch (error) {

                    console.error(
                        "Fix Error:",
                        error
                    );


                    if (error.response) {

                        vscode.window.showErrorMessage(
                            `Backend Error: ${error.response.data.message ||
                            "Fix generation failed"
                            }`
                        );

                    } else {

                        vscode.window.showErrorMessage(
                            "Could not connect to CodeLens AI backend."
                        );
                    }
                }
            }
        );


    context.subscriptions.push(
        fixCommand
    );
}

/* =========================================================
   QUICK FIX PROVIDER
========================================================= */

class CodeLensAIActionProvider {

    provideCodeActions(
        document,
        range,
        context
    ) {

        const actions = [];


        // Only CodeLens AI diagnostics
        const diagnostics =
            context.diagnostics.filter(
                diagnostic =>
                    diagnostic.source === "CodeLens AI"
            );


        if (diagnostics.length === 0) {
            return actions;
        }


        const diagnostic =
            diagnostics[0];


        /* =================================================
           CREATE QUICK FIX ACTION
        ================================================= */

        const fixAction =
            new vscode.CodeAction(
                "🔧 CodeLens AI: Generate Fix",
                vscode.CodeActionKind.QuickFix
            );


        fixAction.diagnostics = [
            diagnostic
        ];


        fixAction.isPreferred = true;


        /* =================================================
           FIND FUNCTION RANGE
        ================================================= */

        const provider =
            new CodeLensAIProvider();


        const functionRange =
            provider.getFunctionRange(
                document,
                diagnostic.range.start.line
            );


        /*
            If a complete function is found,
            send the complete function to Fix.

            Otherwise fall back to diagnostic range.
        */

        let fixRange =
            functionRange;


        if (!fixRange) {

            fixRange =
                new vscode.Range(
                    diagnostic.range.start.line,
                    0,
                    diagnostic.range.end.line,
                    document.lineAt(
                        diagnostic.range.end.line
                    ).text.length
                );
        }


        /* =================================================
           COMMAND
        ================================================= */

        fixAction.command = {

            command:
                "codelens-ai.fix",

            title:
                "CodeLens AI: Generate Fix",

            arguments: [

                fixRange,

                diagnostic.message
            ]
        };


        actions.push(
            fixAction
        );


        return actions;
    }
}


/* =========================================================
   CODELENS PROVIDER
========================================================= */

class CodeLensAIProvider {

    provideCodeLenses(document) {

        if (
            document.languageId !== "javascript" &&
            document.languageId !== "javascriptreact" &&
            document.languageId !== "typescript" &&
            document.languageId !== "typescriptreact"
        ) {
            return [];
        }


        const codeLenses = [];


        for (
            let i = 0;
            i < document.lineCount;
            i++
        ) {

            const line =
                document.lineAt(i).text;

            const trimmedLine =
                line.trim();


            const isFunction =
                trimmedLine.startsWith("function ") ||
                trimmedLine.startsWith("async function ");


            const isArrowFunction =
                trimmedLine.includes("=>");


            if (
                !isFunction &&
                !isArrowFunction
            ) {
                continue;
            }


            const functionRange =
                this.getFunctionRange(
                    document,
                    i
                );


            if (!functionRange) {
                continue;
            }


            /* =================================================
               ANALYZE
            ================================================= */

            const analyzeLens =
                new vscode.CodeLens(
                    functionRange
                );


            analyzeLens.command = {

                title:
                    "✨ CodeLens AI: Analyze",

                command:
                    "codelens-ai.analyze",

                arguments: [
                    functionRange
                ]

            };


            /* =================================================
               EXPLAIN
            ================================================= */

            const explainLens =
                new vscode.CodeLens(
                    functionRange
                );


            explainLens.command = {

                title:
                    "💡 CodeLens AI: Explain",

                command:
                    "codelens-ai.explain",

                arguments: [
                    functionRange
                ]

            };


            /* =================================================
               TESTS
            ================================================= */

            const testLens =
                new vscode.CodeLens(
                    functionRange
                );


            testLens.command = {

                title:
                    "🧪 CodeLens AI: Tests",

                command:
                    "codelens-ai.tests",

                arguments: [
                    functionRange
                ]

            };

            /* qualityLens */

            const qualityLens = new vscode.CodeLens(functionRange);

            qualityLens.command = {
                title: "📊 CodeLens AI: Quality Score",
                command: "codelens-ai.quality",
                arguments: [functionRange]
            };


            /* =================================================
               FIX
            ================================================= */

            const fixLens =
                new vscode.CodeLens(
                    functionRange
                );


            fixLens.command = {

                title:
                    "🔧 CodeLens AI: Fix",

                command:
                    "codelens-ai.fix",

                arguments: [
                    functionRange
                ]

            };


            /* =================================================
               ADD ALL CODELENSES
            ================================================= */

            codeLenses.push(

                analyzeLens,

                explainLens,

                testLens,

                fixLens,

                qualityLens

            );

        }


        return codeLenses;
    }


    /* =====================================================
       FIND COMPLETE FUNCTION RANGE
    ===================================================== */

    getFunctionRange(
        document,
        startLine
    ) {

        let braceCount = 0;

        let started = false;


        for (
            let i = startLine;
            i < document.lineCount;
            i++
        ) {

            const line =
                document.lineAt(i).text;


            for (
                let j = 0;
                j < line.length;
                j++
            ) {

                const char =
                    line[j];


                if (char === "{") {

                    braceCount++;

                    started = true;

                }

                else if (char === "}") {

                    braceCount--;

                }


                if (
                    started &&
                    braceCount === 0
                ) {

                    return new vscode.Range(

                        startLine,
                        0,

                        i,

                        document
                            .lineAt(i)
                            .text
                            .length

                    );

                }

            }

        }


        return null;
    }
}

/* =========================================================
   SHOW ANALYSIS
========================================================= */

function showAnalysis(data) {

    const result = data.result;

    if (!result) {
        vscode.window.showErrorMessage(
            "No analysis result received."
        );
        return;
    }

    const panel =
        vscode.window.createWebviewPanel(
            "codelensAnalysis",
            "CodeLens AI Analysis",
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

    const complexity =
        result.complexity || {};

    const statistics =
        result.statistics || {};

    const bugs =
        result.aiAnalysis?.bugs || [];

    const codeSmells =
        result.aiAnalysis?.codeSmells || [];

    const summary =
        result.aiAnalysis?.summary ||
        "No summary available.";

    const complexityExplanation =
        result.aiAnalysis?.complexityExplanation ||
        "No complexity explanation available.";

    const betterApproach =
        result.aiAnalysis?.betterApproach ||
        "No better approach suggested.";

    const whyBetter =
        result.aiAnalysis?.whyBetter ||
        "No explanation available.";

    const improvedCode =
        result.aiAnalysis?.improvedCode ||
        "No improved code generated.";

    const changesMade =
        result.aiAnalysis?.changesMade || [];

    const edgeCases =
        result.aiAnalysis?.edgeCases || [];

    const interviewTip =
        result.aiAnalysis?.interviewTip ||
        "No interview tip available.";


    panel.webview.html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
/>

<style>

body {

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    padding: 25px;

    color: var(--vscode-foreground);

    background:
        var(--vscode-editor-background);

    line-height: 1.6;
}


h1 {

    font-size: 28px;

    margin-bottom: 25px;
}


h2 {

    font-size: 19px;

    margin-top: 30px;

    margin-bottom: 12px;
}


h3 {

    font-size: 15px;

    margin-bottom: 8px;
}


.section {

    background:
        var(--vscode-textCodeBlock-background);

    border:
        1px solid var(--vscode-panel-border);

    border-radius: 10px;

    padding: 18px;

    margin-bottom: 20px;
}


/* Complexity */

.complexity-container {

    display: grid;

    grid-template-columns:
        repeat(2, 1fr);

    gap: 15px;
}


.complexity-card {

    padding: 18px;

    border-radius: 10px;

    background:
        var(--vscode-editor-background);

    border:
        1px solid var(--vscode-panel-border);
}


.complexity-card h3 {

    margin-top: 0;

    opacity: 0.8;
}


.complexity-value {

    font-size: 25px;

    font-weight: bold;
}


/* Statistics */

.stats {

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 10px;
}


.stat {

    padding: 15px;

    text-align: center;

    border-radius: 8px;

    background:
        var(--vscode-editor-background);

    border:
        1px solid var(--vscode-panel-border);
}


.stat strong {

    display: block;

    font-size: 22px;
}


.stat span {

    font-size: 12px;

    opacity: 0.7;
}


/* Bugs */

.bug {

    padding: 14px;

    margin-bottom: 12px;

    border-radius: 8px;

    background:
        var(--vscode-editor-background);

    border-left:
        4px solid
        var(--vscode-errorForeground);
}


.bug-title {

    font-weight: bold;

    margin-bottom: 5px;
}


.bug-severity {

    font-size: 12px;

    opacity: 0.8;
}


.bug-line {

    font-size: 12px;

    margin-top: 5px;

    opacity: 0.8;
}


/* Code Smells */

.smell {

    padding: 12px;

    margin-bottom: 8px;

    border-radius: 8px;

    background:
        var(--vscode-editor-background);

    border-left:
        4px solid
        var(--vscode-editorWarning-foreground);
}


/* Lists */

ul {

    padding-left: 22px;
}


li {

    margin-bottom: 7px;
}


/* Code */

pre {

    background:
        var(--vscode-editor-background);

    padding: 15px;

    border-radius: 8px;

    overflow-x: auto;

    border:
        1px solid var(--vscode-panel-border);

}


code {

    font-family:
        "Consolas",
        "Courier New",
        monospace;

    font-size: 13px;
}


/* Empty */

.empty {

    opacity: 0.7;

    font-style: italic;
}


/* Success */

.success {

    padding: 12px;

    border-radius: 8px;

    background:
        var(--vscode-editor-background);
}

</style>

</head>


<body>


<h1>
    🤖 CodeLens AI Analysis
</h1>


<!-- SUMMARY -->

<h2>
    📝 Summary
</h2>

<div class="section">

    ${escapeHtml(summary)}

</div>


<!-- COMPLEXITY -->

<h2>
    ⚡ Complexity
</h2>

<div class="complexity-container">


    <div class="complexity-card">

        <h3>
            Time Complexity
        </h3>

        <div class="complexity-value">

            ${escapeHtml(
        complexity.time ||
        "Unknown"
    )}

        </div>

    </div>


    <div class="complexity-card">

        <h3>
            Space Complexity
        </h3>

        <div class="complexity-value">

            ${escapeHtml(
        complexity.space ||
        "Unknown"
    )}

        </div>

    </div>


</div>


<!-- COMPLEXITY EXPLANATION -->

<h2>
    🧠 Complexity Explanation
</h2>

<div class="section">

    ${escapeHtml(
        complexityExplanation
    )}

</div>


<!-- STATISTICS -->

<h2>
    📊 Code Statistics
</h2>

<div class="stats">


    <div class="stat">

        <strong>
            ${statistics.loops || 0}
        </strong>

        <span>
            Loops
        </span>

    </div>


    <div class="stat">

        <strong>
            ${statistics.maximumLoopDepth || 0}
        </strong>

        <span>
            Max Loop Depth
        </span>

    </div>


    <div class="stat">

        <strong>
            ${statistics.functions || 0}
        </strong>

        <span>
            Functions
        </span>

    </div>


    <div class="stat">

        <strong>
            ${statistics.maximumFunctionLength || 0}
        </strong>

        <span>
            Max Function Lines
        </span>

    </div>


</div>


<!-- BUGS -->

<h2>
    🐛 Bugs
</h2>

<div class="section">

${bugs.length > 0

            ? bugs.map(bug => `

            <div class="bug">

                <div class="bug-title">

                    🔴
                    ${escapeHtml(
                bug.title ||
                "Potential bug"
            )}

                </div>


                <div class="bug-severity">

                    Severity:
                    ${escapeHtml(
                bug.severity ||
                "Unknown"
            )}

                </div>


                <div class="bug-line">

                    📍 Line:
                    ${bug.line || "Unknown"}

                </div>


                <p>

                    ${escapeHtml(
                bug.explanation ||
                "No explanation available."
            )}

                </p>


                <p>

                    <strong>
                        💡 Suggestion:
                    </strong>

                    ${escapeHtml(
                bug.suggestion ||
                "No suggestion available."
            )}

                </p>

            </div>

        `).join("")

            : `

            <div class="success">

                ✅ No major bugs detected.

            </div>

        `
        }

</div>


<!-- CODE SMELLS -->

<h2>
    🧹 Code Smells
</h2>

<div class="section">

${codeSmells.length > 0

            ? codeSmells.map(smell => `

            <div class="smell">

                ⚠️
                ${escapeHtml(smell)}

            </div>

        `).join("")

            : `

            <div class="success">

                ✅ No major code smells detected.

            </div>

        `
        }

</div>


<!-- BETTER APPROACH -->

<h2>
    🚀 Better Approach
</h2>

<div class="section">

    ${escapeHtml(
            betterApproach
        )}

</div>


<!-- WHY BETTER -->

<h2>
    💡 Why This Is Better
</h2>

<div class="section">

    ${escapeHtml(
            whyBetter
        )}

</div>


<!-- IMPROVED CODE -->

<h2>
    💻 Improved Code
</h2>

<div class="section">

    <pre><code>${escapeHtml(
            improvedCode
        )}</code></pre>

</div>


<!-- CHANGES -->

<h2>
    🔄 Changes Made
</h2>

<div class="section">

${changesMade.length > 0

            ? `

            <ul>

                ${changesMade.map(change => `

                    <li>
                        ${escapeHtml(change)}
                    </li>

                `).join("")}

            </ul>

        `

            : `

            <div class="empty">

                No changes information available.

            </div>

        `
        }

</div>


<!-- EDGE CASES -->

<h2>
    ⚠️ Edge Cases
</h2>

<div class="section">

${edgeCases.length > 0

            ? `

            <ul>

                ${edgeCases.map(edgeCase => `

                    <li>
                        ${escapeHtml(edgeCase)}
                    </li>

                `).join("")}

            </ul>

        `

            : `

            <div class="empty">

                No edge cases identified.

            </div>

        `
        }

</div>


<!-- INTERVIEW TIP -->

<h2>
    🎯 Interview Tip
</h2>

<div class="section">

    ${escapeHtml(
            interviewTip
        )}

</div>


</body>

</html>

`;
}


function showExplanation(data) {

    const result =
        data.result;

    if (!result) {

        vscode.window.showErrorMessage(
            "No explanation received."
        );

        return;
    }


    const panel =
        vscode.window.createWebviewPanel(

            "codelensExplanation",

            "CodeLens AI Explanation",

            vscode.ViewColumn.Beside,

            {
                enableScripts: true
            }
        );


    panel.webview.html = `

<!DOCTYPE html>

<html>

<head>

<style>

body {

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    padding: 25px;

    color:
        var(--vscode-foreground);

    background:
        var(--vscode-editor-background);

    line-height: 1.6;
}


h1 {

    font-size: 27px;
}


h2 {

    margin-top: 28px;

    font-size: 19px;
}


.section {

    padding: 18px;

    margin-bottom: 18px;

    border-radius: 10px;

    background:
        var(--vscode-textCodeBlock-background);

    border:
        1px solid
        var(--vscode-panel-border);
}


.complexity {

    display: flex;

    gap: 15px;
}


.card {

    flex: 1;

    padding: 15px;

    border-radius: 10px;

    background:
        var(--vscode-editor-background);

    border:
        1px solid
        var(--vscode-panel-border);
}


.card strong {

    display: block;

    font-size: 20px;
}


li {

    margin-bottom: 8px;
}


</style>

</head>


<body>


<h1>
    💡 CodeLens AI Explanation
</h1>


<h2>
    📝 What Does This Code Do?
</h2>

<div class="section">

    ${escapeHtml(
        result.summary
    )}

</div>


<h2>
    🔍 Step-by-Step Explanation
</h2>

<div class="section">

    <ol>

        ${(result.stepByStep || [])
            .map(step => `
                    <li>
                        ${escapeHtml(step)}
                    </li>
                `)
            .join("")
        }

    </ol>

</div>


<h2>
    📦 Important Variables
</h2>

<div class="section">

    <ul>

        ${(result.variables || [])
            .map(variable => `
                    <li>
                        ${escapeHtml(variable)}
                    </li>
                `)
            .join("")
        }

    </ul>

</div>


<h2>
    🚀 Approach
</h2>

<div class="section">

    ${escapeHtml(
            result.approach
        )}

</div>


<h2>
    ⚡ Complexity
</h2>

<div class="complexity">


    <div class="card">

        <strong>
            ${escapeHtml(
            result.timeComplexity
        )}
        </strong>

        Time Complexity

    </div>


    <div class="card">

        <strong>
            ${escapeHtml(
            result.spaceComplexity
        )}
        </strong>

        Space Complexity

    </div>


</div>


<h2>
    ⚠️ Edge Cases
</h2>

<div class="section">

    <ul>

        ${(result.edgeCases || [])
            .map(edgeCase => `
                    <li>
                        ${escapeHtml(edgeCase)}
                    </li>
                `)
            .join("")
        }

    </ul>

</div>


<h2>
    🎯 Interview Points
</h2>

<div class="section">

    <ul>

        ${(result.interviewPoints || [])
            .map(point => `
                    <li>
                        ${escapeHtml(point)}
                    </li>
                `)
            .join("")
        }

    </ul>

</div>


</body>

</html>

`;
}



function showQualityResult(data) {
    const result = data?.result || data;

    if (data?.success === false || !result) {
        vscode.window.showErrorMessage(
            data?.message || "Code analysis failed."
        );
        return;
    }

    const issues = Array.isArray(result.issues)
        ? result.issues
        : [];

    const aiAnalysis = result.aiAnalysis || {};

    const bugs = Array.isArray(aiAnalysis.bugs)
        ? aiAnalysis.bugs
        : [];

    const codeSmells = Array.isArray(aiAnalysis.codeSmells)
        ? aiAnalysis.codeSmells
        : [];

    // Static analysis penalties: maximum 25 points
    const staticPenalty = Math.min(25, issues.length * 5);

    // Bug penalties depend on severity
    const bugPenalty = Math.min(
        45,
        bugs.reduce((total, bug) => {
            const severity = String(
                bug.severity || "low"
            ).toLowerCase();

            if (severity === "critical" || severity === "high") {
                return total + 12;
            }

            if (severity === "medium" || severity === "warning") {
                return total + 7;
            }

            return total + 3;
        }, 0)
    );

    // Code smell penalties: maximum 15 points
    const smellPenalty = Math.min(15, codeSmells.length * 3);

    const score = Math.max(
        0,
        Math.min(
            100,
            100 - staticPenalty - bugPenalty - smellPenalty
        )
    );

    let grade = "Needs Improvement";
    let color = "#f87171";

    if (score >= 90) {
        grade = "Excellent";
        color = "#4ade80";
    } else if (score >= 75) {
        grade = "Good";
        color = "#a3e635";
    } else if (score >= 60) {
        grade = "Fair";
        color = "#facc15";
    }

    const panel = vscode.window.createWebviewPanel(
        "codelensAIQuality",
        "CodeLens AI - Quality Score",
        vscode.ViewColumn.Beside,
        {}
    );

    const escape = (value) =>
        String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );

    const bugItems = bugs.length
        ? bugs.map(bug => `
            <li>
                <strong>${escape(bug.severity || "Issue")}</strong>:
                ${escape(bug.message || bug.description || "Detected bug")}
            </li>
        `).join("")
        : "<li>No AI-detected bugs were returned.</li>";

    const smellItems = codeSmells.length
        ? codeSmells.map(smell => `
            <li>${escape(
            typeof smell === "string"
                ? smell
                : smell.message || smell.description || JSON.stringify(smell)
        )}</li>
        `).join("")
        : "<li>No code smells were returned.</li>";

    const staticItems = issues.length
        ? issues.map(issue => `
            <li>${escape(
            typeof issue === "string"
                ? issue
                : issue.message || issue.description || JSON.stringify(issue)
        )}</li>
        `).join("")
        : "<li>No static analysis issues were returned.</li>";

    panel.webview.html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 24px;
            line-height: 1.6;
        }

        .score-card, .card {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 18px;
        }

        .score {
            font-size: 58px;
            font-weight: 700;
            color: ${color};
        }

        .track {
            height: 12px;
            background: var(--vscode-panel-border);
            border-radius: 10px;
            overflow: hidden;
        }

        .bar {
            height: 100%;
            width: ${score}%;
            background: ${color};
        }

        h2 { font-size: 18px; }
        li { margin-bottom: 8px; }
        .muted {
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h1>🛡️ CodeLens AI Quality Report</h1>

    <div class="score-card">
        <div class="muted">Heuristic Quality Score</div>
        <div class="score">${score}<span style="font-size:22px">/100</span></div>
        <h2>${grade}</h2>
        <div class="track"><div class="bar"></div></div>
        <p class="muted">
            Estimated from returned static issues, AI-detected bugs
            and code smells. This is not a definitive quality metric.
        </p>
    </div>

    <div class="card">
        <h2>📊 Score Breakdown</h2>
        <p>Starting score: 100</p>
        <p>Static analysis penalty: −${staticPenalty}</p>
        <p>Bug penalty: −${bugPenalty}</p>
        <p>Code smell penalty: −${smellPenalty}</p>
        <p><strong>Final score: ${score}/100</strong></p>
    </div>

    <div class="card">
        <h2>🐛 Detected Bugs (${bugs.length})</h2>
        <ul>${bugItems}</ul>
    </div>

    <div class="card">
        <h2>🔍 Code Smells (${codeSmells.length})</h2>
        <ul>${smellItems}</ul>
    </div>

    <div class="card">
        <h2>⚙️ Static Analysis Issues (${issues.length})</h2>
        <ul>${staticItems}</ul>
    </div>
</body>
</html>`;
}

/* =========================================================
   DIAGNOSTICS
========================================================= */

function addDiagnostics(editor, data) {

    if (!diagnosticCollection) {
        return;
    }

    const diagnostics = [];
    const result = data.result;

    if (!result) {
        return;
    }

    // Static analyzer issues
    const issues = result.issues || [];

    issues.forEach(issue => {

        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(
                0,
                0,
                0,
                editor.document.lineAt(0).text.length
            ),
            `CodeLens AI: ${issue}`,
            vscode.DiagnosticSeverity.Warning
        );

        diagnostic.source = "CodeLens AI";
        diagnostic.code = "AI-STATIC";

        diagnostics.push(diagnostic);
    });


    // AI detected bugs
    const bugs =
        result.aiAnalysis?.bugs || [];

    bugs.forEach(bug => {

        let lineNumber = Number(bug.line);

        // Safety check
        if (!Number.isInteger(lineNumber)) {
            lineNumber = 1;
        }

        // AI gives 1-based line number
        const lineIndex = Math.max(
            0,
            Math.min(
                lineNumber - 1,
                editor.document.lineCount - 1
            )
        );

        const lineText =
            editor.document.lineAt(lineIndex).text;

        const diagnostic =
            new vscode.Diagnostic(
                new vscode.Range(
                    lineIndex,
                    0,
                    lineIndex,
                    lineText.length
                ),
                `CodeLens AI: ${bug.title}`,
                getSeverity(bug.severity)
            );

        diagnostic.source = "CodeLens AI";
        diagnostic.code = "AI-BUG";

        diagnostics.push(diagnostic);
    });


    diagnosticCollection.set(
        editor.document.uri,
        diagnostics
    );
}

/* =========================================================
   DIAGNOSTIC SEVERITY
========================================================= */

function getSeverity(
    severity
) {

    if (!severity) {

        return vscode.DiagnosticSeverity.Warning;
    }


    const value =
        severity.toLowerCase();


    if (
        value.includes("critical") ||
        value.includes("high")
    ) {

        return vscode.DiagnosticSeverity.Error;
    }


    if (
        value.includes("medium") ||
        value.includes("warning")
    ) {

        return vscode.DiagnosticSeverity.Warning;
    }


    return vscode.DiagnosticSeverity.Information;
}


/* =========================================================
   SHOW FIX RESULT
========================================================= */

function showFixResult(data) {

    if (!data.success) {

        vscode.window.showErrorMessage(
            data.message ||
            "Fix generation failed."
        );

        return;
    }


    const result =
        data.result;


    if (!result) {

        vscode.window.showErrorMessage(
            "No fix result received."
        );

        return;
    }


    /* =====================================================
       CREATE WEBVIEW
    ===================================================== */

    const panel =
        vscode.window.createWebviewPanel(

            "codelensAIFix",

            "CodeLens AI - Code Fix",

            vscode.ViewColumn.Beside,

            {
                enableScripts: true
            }
        );


    /* =====================================================
       CHANGES
    ===================================================== */

    const changes =
        result.changes || [];


    const changesHTML =
        changes.length

            ? changes.map(
                change => `

                    <li>
                        ${escapeHtml(change)}
                    </li>

                `
            ).join("")

            : `
                <li>
                    No changes description available.
                </li>
            `;


    /* =====================================================
       DIFF
    ===================================================== */

    const diff =
        result.diff || [];


    const diffHTML =
        diff.length

            ? diff.map(
                item => {

                    let symbol = "  ";

                    let className =
                        "unchanged";


                    if (
                        item.type ===
                        "added"
                    ) {

                        symbol = "+ ";

                        className =
                            "added";

                    }

                    else if (
                        item.type ===
                        "removed"
                    ) {

                        symbol = "- ";

                        className =
                            "removed";
                    }


                    return `

                        <div class="diff-line ${className}">

                            <span class="symbol">
                                ${escapeHtml(symbol)}
                            </span>

                            <span>
                                ${escapeHtml(
                        item.content
                    )}
                            </span>

                        </div>

                    `;
                }
            ).join("")

            : `
                <div class="empty-diff">
                    No diff available.
                </div>
            `;


    /* =====================================================
       WEBVIEW HTML
    ===================================================== */

    panel.webview.html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">


<style>

    * {
        box-sizing: border-box;
    }


    body {

        font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

        padding: 28px;

        color:
            var(--vscode-foreground);

        background:
            var(--vscode-editor-background);

        line-height: 1.6;
    }


    h1 {

        font-size: 28px;

        margin-bottom: 8px;
    }


    .subtitle {

        color:
            var(--vscode-descriptionForeground);

        margin-bottom: 25px;
    }


    h2 {

        font-size: 19px;

        margin-top: 0;

        margin-bottom: 14px;
    }


    .card {

        background:
            var(--vscode-textCodeBlock-background);

        border:
            1px solid
            var(--vscode-panel-border);

        padding: 20px;

        margin-bottom: 18px;

        border-radius: 12px;
    }


    /* =================================================
       COMPLEXITY
    ================================================= */

    .complexity-container {

        display: flex;

        gap: 15px;

        flex-wrap: wrap;
    }


    .complexity-card {

        flex: 1;

        min-width: 180px;

        padding: 16px;

        border-radius: 10px;

        background:
            var(--vscode-editor-background);

        border:
            1px solid
            var(--vscode-panel-border);
    }


    .complexity-title {

        font-size: 13px;

        color:
            var(--vscode-descriptionForeground);

        margin-bottom: 6px;
    }


    .complexity-value {

        font-size: 20px;

        font-weight: bold;
    }


    /* =================================================
       DIFF
    ================================================= */

    .diff-container {

        background:
            var(--vscode-editor-background);

        border:
            1px solid
            var(--vscode-panel-border);

        border-radius: 10px;

        overflow: hidden;

        font-family:
            "Cascadia Code",
            "Consolas",
            monospace;

        font-size: 13px;
    }


    .diff-header {

        padding: 12px 16px;

        border-bottom:
            1px solid
            var(--vscode-panel-border);

        font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

        font-weight: 600;
    }


    .diff-line {

        display: flex;

        padding: 4px 12px;

        white-space: pre-wrap;

        word-break: break-word;
    }


    .diff-line.added {

        background:
            rgba(46, 160, 67, 0.18);

        color:
            #86efac;
    }


    .diff-line.removed {

        background:
            rgba(248, 81, 73, 0.18);

        color:
            #fca5a5;
    }


    .diff-line.unchanged {

        color:
            var(--vscode-foreground);
    }


    .symbol {

        width: 25px;

        flex-shrink: 0;

        font-weight: bold;
    }


    .empty-diff {

        padding: 20px;

        color:
            var(--vscode-descriptionForeground);
    }


    /* =================================================
       CODE
    ================================================= */

    .code-container {

        background:
            var(--vscode-editor-background);

        border:
            1px solid
            var(--vscode-panel-border);

        border-radius: 10px;

        overflow: auto;
    }


    pre {

        margin: 0;

        padding: 18px;

        font-family:
            "Cascadia Code",
            "Consolas",
            monospace;

        font-size: 13px;

        white-space: pre;

        overflow-x: auto;
    }


    /* =================================================
       BUTTON
    ================================================= */

    .button-container {

        display: flex;

        gap: 12px;

        margin-top: 18px;

        flex-wrap: wrap;
    }


    button {

        border: none;

        padding:
            11px 20px;

        border-radius: 8px;

        cursor: pointer;

        font-size: 14px;

        font-weight: 600;
    }


    #applyFix {

        background:
            var(--vscode-button-background);

        color:
            var(--vscode-button-foreground);
    }


    #applyFix:hover {

        background:
            var(--vscode-button-hoverBackground);
    }


    #cancelFix {

        background:
            var(--vscode-button-secondaryBackground);

        color:
            var(--vscode-button-secondaryForeground);
    }


    #cancelFix:hover {

        background:
            var(--vscode-button-secondaryHoverBackground);
    }


    .warning {

        padding: 12px 15px;

        margin-bottom: 18px;

        border-radius: 8px;

        background:
            var(--vscode-textBlockQuote-background);

        border-left:
            4px solid
            var(--vscode-textLink-foreground);
    }


    li {

        margin-bottom: 8px;
    }

</style>

</head>


<body>


    <h1>
        🔧 CodeLens AI Fix
    </h1>


    <div class="subtitle">

        AI-generated fix for your selected code.

    </div>


    <!-- =================================================
         WARNING
    ================================================= -->

    <div class="warning">

        ⚠️ Review the changes before applying the fix
        to your source code.

    </div>


    <!-- =================================================
         EXPLANATION
    ================================================= -->

    <div class="card">

        <h2>
            💡 Explanation
        </h2>

        <p>

            ${escapeHtml(
        result.explanation ||
        "No explanation available."
    )}

        </p>

    </div>


    <!-- =================================================
         CHANGES
    ================================================= -->

    <div class="card">

        <h2>
            📝 Changes Made
        </h2>

        <ul>

            ${changesHTML}

        </ul>

    </div>


    <!-- =================================================
         COMPLEXITY
    ================================================= -->

    <div class="card">

        <h2>
            ⚡ Complexity
        </h2>


        <div class="complexity-container">


            <div class="complexity-card">

                <div class="complexity-title">
                    Before
                </div>

                <div class="complexity-value">

                    ${escapeHtml(
        result.complexityBefore ||
        "Unknown"
    )}

                </div>

            </div>


            <div class="complexity-card">

                <div class="complexity-title">
                    After
                </div>

                <div class="complexity-value">

                    ${escapeHtml(
        result.complexityAfter ||
        "Unknown"
    )}

                </div>

            </div>


        </div>

    </div>


    <!-- =================================================
         DIFF
    ================================================= -->

    <div class="card">

        <h2>
            🔄 Code Changes
        </h2>


        <div class="diff-container">

            <div class="diff-header">

                AI-generated changes

            </div>


            ${diffHTML}

        </div>

    </div>


    <!-- =================================================
         FIXED CODE
    ================================================= -->

    <div class="card">

        <h2>
            ✨ Fixed Code
        </h2>


        <div class="code-container">

            <pre>${escapeHtml(
        result.fixedCode ||
        "No fixed code returned."
    )}</pre>

        </div>


        <!-- BUTTONS -->

        <div class="button-container">

            <button
                id="applyFix"
            >

                🚀 Apply Fix

            </button>


            <button
                id="cancelFix"
            >

                Cancel

            </button>

        </div>

    </div>


    <!-- =================================================
         SCRIPT
    ================================================= -->

    <script>

        const vscode =
            acquireVsCodeApi();


        /* ================================================
           APPLY FIX
        ================================================ */

        document
            .getElementById("applyFix")
            .addEventListener(
                "click",
                () => {

                    vscode.postMessage({

                        command:
                            "applyFix",

                        code:
                            ${JSON.stringify(
        result.fixedCode || ""
    )}
                    });

                }
            );


        /* ================================================
           CANCEL
        ================================================ */

        document
            .getElementById("cancelFix")
            .addEventListener(
                "click",
                () => {

                    vscode.postMessage({

                        command:
                            "cancelFix"

                    });

                }
            );

    </script>


</body>

</html>

`;


    /* =====================================================
       WEBVIEW MESSAGE HANDLER
    ===================================================== */

    panel.webview.onDidReceiveMessage(

        async message => {


            /* =============================================
               APPLY FIX
            ============================================= */

            if (
                message.command ===
                "applyFix"
            ) {


                if (
                    !fixEditor ||
                    !fixSelection
                ) {

                    vscode.window.showErrorMessage(

                        "No active editor or selection found."

                    );

                    return;
                }


                const edit =
                    new vscode.WorkspaceEdit();


                edit.replace(

                    fixEditor.document.uri,

                    fixSelection,

                    result.fixedCode

                );


                const success =
                    await vscode.workspace.applyEdit(
                        edit
                    );


                if (success) {


                    vscode.window.showInformationMessage(

                        "CodeLens AI: Fix applied successfully! 🚀"

                    );


                    panel.dispose();


                    fixEditor =
                        undefined;


                    fixSelection =
                        undefined;


                } else {


                    vscode.window.showErrorMessage(

                        "Failed to apply CodeLens AI fix."

                    );

                }

            }


            /* =============================================
               CANCEL FIX
            ============================================= */

            if (
                message.command ===
                "cancelFix"
            ) {

                panel.dispose();

            }

        }

    );

}


function showTestResult(data) {

    if (!data.success || !data.result) {
        vscode.window.showErrorMessage(
            data.message || "Test generation failed."
        );
        return;
    }

    const result = data.result;
    const testCode = result.testCode || "";

    if (!testCode.trim()) {
        vscode.window.showErrorMessage(
            "AI did not return any test code."
        );
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        "codelensAITests",
        "CodeLens AI - Test Generator",
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    const testCasesHTML = (result.testCases || [])
        .map(testCase => `
            <li>${escapeHtml(testCase)}</li>
        `)
        .join("");

    panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 24px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            line-height: 1.6;
        }

        h1 {
            font-size: 26px;
        }

        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 24px;
        }

        .card {
            border: 1px solid var(--vscode-panel-border);
            background: var(--vscode-textCodeBlock-background);
            border-radius: 10px;
            padding: 18px;
            margin-bottom: 18px;
        }

        h2 {
            font-size: 18px;
            margin-top: 0;
        }

        pre {
            white-space: pre;
            overflow: auto;
            padding: 16px;
            border-radius: 8px;
            background: var(--vscode-editor-background);
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            line-height: 1.6;
        }

        li {
            margin-bottom: 8px;
        }

        button {
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin: 6px 8px 0 0;
            font-size: 13px;
        }

        #copyTests {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        #insertTests {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        button:hover {
            opacity: 0.85;
        }
    </style>
</head>

<body>
    <h1>🧪 CodeLens AI Test Generator</h1>

    <div class="subtitle">
        AI-generated unit tests for your selected code.
    </div>

    <div class="card">
        <h2>⚙️ Framework</h2>
        <p>${escapeHtml(result.framework || "Jest")}</p>
    </div>

    <div class="card">
        <h2>💡 Explanation</h2>
        <p>${escapeHtml(
        result.explanation || "No explanation available."
    )}</p>
    </div>

    <div class="card">
        <h2>✅ Generated Test Cases</h2>
        <ul>
            ${testCasesHTML || "<li>No test case descriptions returned.</li>"}
        </ul>
    </div>

    <div class="card">
        <h2>📝 Generated Test Code</h2>

        <pre>${escapeHtml(testCode)}</pre>

        <button id="copyTests">📋 Copy Tests</button>
        <button id="insertTests">➕ Insert into Editor</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        const testCode = ${JSON.stringify(testCode)};

        document.getElementById("copyTests")
            .addEventListener("click", () => {
                vscode.postMessage({
                    command: "copyTests",
                    code: testCode
                });
            });

        document.getElementById("insertTests")
            .addEventListener("click", () => {
                vscode.postMessage({
                    command: "insertTests",
                    code: testCode
                });
            });
    </script>
</body>
</html>
`;

    panel.webview.onDidReceiveMessage(async message => {

        if (message.command === "copyTests") {
            await vscode.env.clipboard.writeText(
                message.code || ""
            );

            vscode.window.showInformationMessage(
                "Generated tests copied to clipboard!"
            );
        }

        if (message.command === "insertTests") {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage(
                    "Open a test file or source file before inserting tests."
                );
                return;
            }

            const code = message.code || "";

            const success = await editor.edit(editBuilder => {
                editBuilder.insert(
                    editor.selection.active,
                    "\n\n" + code + "\n"
                );
            });

            if (success) {
                vscode.window.showInformationMessage(
                    "Generated tests inserted into the editor."
                );
            } else {
                vscode.window.showErrorMessage(
                    "Could not insert generated tests."
                );
            }
        }
    });
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   DEACTIVATE
========================================================= */

function deactivate() { }


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    activate,

    deactivate

};