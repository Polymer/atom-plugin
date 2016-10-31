'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
import * as path from 'path';
import { CompositeDisposable } from 'atom';
import { Severity } from 'polymer-analyzer/lib/warning/warning';
import { RemoteEditorService } from 'polymer-analyzer/lib/editor-service/remote-editor-service';
import TooltipManager from './tooltip-manager';
class PolymerIde {
    constructor() {
        this.subscriptions = null;
        this.linter = null;
        this.autocompleter = null;
    }
    activate(_) {
        // Initialize.
        this.linter = new Linter();
        this.autocompleter = new Autocompleter();
        // Events subscribed to in atom's system can be easily cleaned up with a
        // CompositeDisposable
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(atom.project.onDidChangePaths((projectPaths) => {
            this.setProjectPaths(projectPaths);
        }));
        this.setProjectPaths(atom.project['getPaths']());
        this.tooltipManager = new TooltipManager(this.editorService);
        this.tooltipManager.subscribe(this.subscriptions);
    }
    ;
    deactivate() {
        this.subscriptions.dispose();
        this.subscriptions = null;
        this.editorService = null;
        this.linter = null;
        this.autocompleter = null;
        this.tooltipManager.removeTooltip();
    }
    ;
    setProjectPaths(projectPaths) {
        if (projectPaths.length === 0) {
            this.linter.configurationError = 'polymer-ide only works with projects.';
        }
        else if (projectPaths.length > 1) {
            this.linter.configurationError =
                `polymer-ide only works with projects with exactly one root ` +
                    `directory, this project has: ${JSON.stringify(projectPaths)}`;
        }
        else {
            const rootDir = projectPaths[0];
            if (this.editorService) {
                this.editorService.dispose();
            }
            this.editorService = new RemoteEditorService(rootDir);
            this.subscriptions.add(this.editorService);
            this.linter.configurationError = null;
            this.linter.editorService = this.editorService;
            this.autocompleter.editorService = this.editorService;
        }
    }
    ;
    serialize() {
        return {};
    }
    ;
    provideLinter() {
        return this.linter;
    }
    ;
    provideAutocompleter() {
        return this.autocompleter;
    }
    ;
}
;
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
            const [projectPath, relativePath] = atom.project['relativizePath'](textEditor.getPath());
            try {
                yield this.editorService.fileChanged(relativePath, textEditor.getBuffer().cachedText);
            }
            catch (e) {
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
class Autocompleter {
    constructor() {
        this.selector = '.text.html, .source.js';
        this.priority = 1;
    }
    getSuggestions(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this._getSuggestions(options);
            }
            catch (e) {
                // Atom pops up huge loud error popups so better to just log and swallow.
                console.error(e.stack || e.message || e);
                return [];
            }
        });
    }
    _getSuggestions(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.editorService) {
                return [];
            }
            const position = {
                line: options.bufferPosition.row,
                column: options.bufferPosition.column
            };
            const relativePath = atom.project['relativizePath'](options.editor.getPath())[1];
            const completions = yield this.editorService.getTypeaheadCompletionsAtPosition(relativePath, position);
            console.log(completions);
            if (!completions) {
                return [];
            }
            if (completions.kind === 'element-tags') {
                // Could do something more clever here, and look for partial matches
                // ordering by length of match.
                const matchingElements = completions.elements.filter(e => e.tagname.startsWith(options.prefix));
                return matchingElements.map((element) => {
                    const suggestion = {
                        text: element.expandTo,
                        displayText: `<${element.tagname}>`,
                        description: element.description,
                        type: 'class',
                        replacementPrefix: `<${options.prefix}`
                    };
                    return suggestion;
                });
            }
            else if (completions.kind === 'attributes') {
                return completions.attributes.map((attr) => {
                    let suggestion;
                    if (attr.type === 'boolean') {
                        suggestion = { text: attr.name };
                    }
                    else {
                        suggestion = {
                            displayText: attr.name,
                            snippet: `${attr.name}="\${1:${attr.type}}"`
                        };
                    }
                    suggestion.type = 'property';
                    suggestion.description = attr.description;
                    if (attr.inheritedFrom) {
                        suggestion.rightLabel = `⊃ ${attr.inheritedFrom}`;
                    }
                    if (attr.type) {
                        suggestion.leftLabel = attr.type;
                    }
                    return suggestion;
                });
            } /* else if (completions.kind === 'resource-paths') {
              return completions.paths.map((path) => {
                const suggestion: autocomplete.TextSuggestion = {
                  text: path,
                  replacementPrefix: completions.prefix,
                  type: 'import'
                };
                return suggestion;
              });
            } */
        });
    }
}
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
export default new PolymerIde();
//# sourceMappingURL=polymer-ide.js.map