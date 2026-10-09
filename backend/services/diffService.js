const Diff = require("diff");

const generateCodeDiff = (originalCode, fixedCode) => {

    const changes = Diff.diffLines(
        originalCode,
        fixedCode
    );

    return changes.map(change => {

        let type = "unchanged";

        if (change.added) {
            type = "added";
        }

        if (change.removed) {
            type = "removed";
        }

        return {
            type,
            content: change.value
        };

    });

};

module.exports = {
    generateCodeDiff
};