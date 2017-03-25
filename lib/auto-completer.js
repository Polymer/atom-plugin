'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
            const relativePath = atom.project.relativizePath(options.editor.getPath())[1];
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
                        snippet: element.expandToSnippet,
                        displayText: `<${element.tagname}>`,
                        description: element.description,
                        descriptionMarkdown: element.description,
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
export default Autocompleter;
//# sourceMappingURL=auto-completer.js.map