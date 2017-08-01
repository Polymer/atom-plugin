'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import * as path from 'path';
import { Severity } from 'polymer-analyzer';
function severityToMessageType(severity) {
    switch (severity) {
        case Severity.ERROR:
            return 'Error';
        case Severity.WARNING:
            return 'Warning';
        case Severity.INFO:
            return 'Info';
        default:
            const never = severity;
            throw new Error(`Unknown severity received: ${never}`);
    }
}
function convertSourceRange(sourceRange) {
    return {
        path: sourceRange.file,
        range: [
            [sourceRange.start.line, sourceRange.start.column],
            [sourceRange.end.line, sourceRange.end.column]
        ]
    };
}
class Linter {
    constructor() {
        this.name = 'polymer-ide';
        this.grammarScopes = ['source.js', 'text.html', 'text.html.basic'];
        this.scope = 'file';
        this.lintOnFly = true;
        this.configurationError = null;
    }
    lint(textEditor) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this._lint(textEditor);
            }
            catch (e) {
                // Atom pops up huge loud error popups if we return a rejecting promise
                // here, so better to just log and swallow.
                console.error(e.stack || e.message || e);
                return [];
            }
        });
    }
    ;
    _lint(textEditor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configurationError) {
                return [{
                        type: 'Error',
                        text: this.configurationError,
                        range: [[0, 0], [0, 1]],
                        filePath: textEditor.getPath(),
                        severity: 'error'
                    }];
            }
            const [projectPath, relativePath] = atom.project.relativizePath(textEditor.getPath());
            try {
                yield this.editorService.fileChanged(relativePath, textEditor.getBuffer().cachedText);
            }
            catch (e) {
                /* swallow the erorr, let getWarningsFor() handle things */
            }
            const warnings = yield this.editorService.getWarningsForFile(relativePath);
            return warnings.map(w => {
                const { path: relPath, range } = convertSourceRange(w.sourceRange);
                return {
                    type: severityToMessageType(w.severity),
                    filePath: path.join(projectPath, relPath),
                    range: range,
                    text: w.message
                };
            });
        });
    }
}
export default Linter;
//# sourceMappingURL=linter.js.map