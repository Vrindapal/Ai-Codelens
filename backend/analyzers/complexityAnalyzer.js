const parser = require("@babel/parser");

const analyzeComplexity = (code) => {
    try {
        const ast = parser.parse(code, {
            sourceType: "unambiguous",
            plugins: [
                "jsx",
                "typescript"
            ]
        });

        let loopCount = 0;
        let maxLoopDepth = 0;
        let functionCount = 0;
        let maxFunctionLength = 0;
        let maxConditionDepth = 0;

        const issues = [];
        const suggestions = [];

        const walk = (
            node,
            currentLoopDepth = 0,
            currentConditionDepth = 0
        ) => {

            if (!node || typeof node !== "object") {
                return;
            }

            let newLoopDepth = currentLoopDepth;
            let newConditionDepth = currentConditionDepth;

            // =========================
            // LOOP DETECTION
            // =========================

            const isLoop =
                node.type === "ForStatement" ||
                node.type === "WhileStatement" ||
                node.type === "DoWhileStatement" ||
                node.type === "ForOfStatement" ||
                node.type === "ForInStatement";

            if (isLoop) {

                loopCount++;

                newLoopDepth =
                    currentLoopDepth + 1;

                maxLoopDepth = Math.max(
                    maxLoopDepth,
                    newLoopDepth
                );
            }

            // =========================
            // CONDITION DETECTION
            // =========================

            const isCondition =
                node.type === "IfStatement" ||
                node.type === "ConditionalExpression";

            if (isCondition) {

                newConditionDepth =
                    currentConditionDepth + 1;

                maxConditionDepth = Math.max(
                    maxConditionDepth,
                    newConditionDepth
                );
            }

            // =========================
            // FUNCTION DETECTION
            // =========================

            const isFunction =
                node.type === "FunctionDeclaration" ||
                node.type === "FunctionExpression" ||
                node.type === "ArrowFunctionExpression";

            if (isFunction) {

                functionCount++;

                if (node.loc) {

                    const startLine =
                        node.loc.start.line;

                    const endLine =
                        node.loc.end.line;

                    const functionLength =
                        endLine - startLine + 1;

                    maxFunctionLength =
                        Math.max(
                            maxFunctionLength,
                            functionLength
                        );

                    // Long function warning
                    if (functionLength > 50) {

                        issues.push({
                            type: "code-smell",
                            severity: "medium",
                            message:
                                `Function is too long (${functionLength} lines).`
                        });

                        suggestions.push(
                            "Consider breaking this function into smaller functions."
                        );
                    }
                }
            }

            // =========================
            // NESTED LOOP WARNING
            // =========================

            if (newLoopDepth >= 2) {

                const alreadyExists =
                    issues.some(
                        issue =>
                            issue.type === "complexity" &&
                            issue.message.includes("nested loop")
                    );

                if (!alreadyExists) {

                    issues.push({
                        type: "complexity",
                        severity: "medium",
                        message:
                            "Nested loop detected. This may result in O(n²) or higher complexity."
                    });

                    suggestions.push(
                        "Check whether a HashMap, HashSet or another data structure can reduce the nested loop."
                    );
                }
            }

            // =========================
            // DEEP CONDITIONS
            // =========================

            if (newConditionDepth >= 3) {

                const alreadyExists =
                    issues.some(
                        issue =>
                            issue.type === "code-smell" &&
                            issue.message.includes("conditions")
                    );

                if (!alreadyExists) {

                    issues.push({
                        type: "code-smell",
                        severity: "medium",
                        message:
                            "Deeply nested conditions detected."
                    });

                    suggestions.push(
                        "Consider using early returns or extracting conditions into separate functions."
                    );
                }
            }

            // =========================
            // RECURSION DETECTION
            // =========================

            if (
                isFunction &&
                node.id &&
                node.id.name
            ) {

                const functionName =
                    node.id.name;

                let recursive = false;

                const checkRecursion = child => {

                    if (!child || typeof child !== "object") {
                        return;
                    }

                    if (
                        child.type === "CallExpression" &&
                        child.callee &&
                        child.callee.type === "Identifier" &&
                        child.callee.name === functionName
                    ) {
                        recursive = true;
                    }

                    for (const key in child) {

                        if (
                            key === "loc" ||
                            key === "start" ||
                            key === "end"
                        ) {
                            continue;
                        }

                        const value = child[key];

                        if (Array.isArray(value)) {

                            value.forEach(checkRecursion);

                        } else if (
                            value &&
                            typeof value === "object"
                        ) {

                            checkRecursion(value);
                        }
                    }
                };

                checkRecursion(node.body);

                if (recursive) {

                    issues.push({
                        type: "complexity",
                        severity: "info",
                        message:
                            `Recursive function detected: ${functionName}()`
                    });

                    suggestions.push(
                        "Check recursion depth and consider whether an iterative approach would be more efficient."
                    );
                }
            }

            // =========================
            // WALK CHILD NODES
            // =========================

            for (const key in node) {

                if (
                    key === "loc" ||
                    key === "start" ||
                    key === "end"
                ) {
                    continue;
                }

                const child = node[key];

                if (Array.isArray(child)) {

                    child.forEach(item => {

                        walk(
                            item,
                            newLoopDepth,
                            newConditionDepth
                        );

                    });

                } else if (
                    child &&
                    typeof child === "object"
                ) {

                    walk(
                        child,
                        newLoopDepth,
                        newConditionDepth
                    );
                }
            }
        };

        walk(ast);

        // =========================
        // COMPLEXITY CALCULATION
        // =========================

        let timeComplexity = "O(1)";

        if (maxLoopDepth === 1) {

            timeComplexity = "O(n)";

        } else if (maxLoopDepth === 2) {

            timeComplexity = "O(n²)";

        } else if (maxLoopDepth === 3) {

            timeComplexity = "O(n³)";

        } else if (maxLoopDepth > 3) {

            timeComplexity =
                `O(n^${maxLoopDepth})`;
        }

        return {

            success: true,

            complexity: {
                time: timeComplexity,
                space: "O(1)"
            },

            statistics: {
                loops: loopCount,
                maximumLoopDepth: maxLoopDepth,
                functions: functionCount,
                maximumFunctionLength:
                    maxFunctionLength,
                maximumConditionDepth:
                    maxConditionDepth
            },

            issues,

            suggestions
        };

    } catch (error) {

        return {
            success: false,
            error: "Unable to parse the code",
            details: error.message
        };
    }
};

module.exports = {
    analyzeComplexity
};