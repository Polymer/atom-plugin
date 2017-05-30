'use babel';

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


import * as autocomplete from 'atom-autocomplete-plus';
import {RemoteEditorService} from 'polymer-editor-service/lib/remote-editor-service';

class Autocompleter implements autocomplete.Provider {
  selector = '.text.html, .source.js';
  priority = 1;
  editorService: RemoteEditorService;

  async getSuggestions(options: autocomplete.SuggestionRequestOptions):
      Promise<autocomplete.Suggestion[]> {
    try {
      return await this._getSuggestions(options);
    } catch (e) {
      // Atom pops up huge loud error popups so better to just log and swallow.
      console.error(e.stack || e.message || e);
      return [];
    }
  }

  private async _getSuggestions(options: autocomplete.SuggestionRequestOptions):
      Promise<autocomplete.Suggestion[]> {
    if (!this.editorService) {
      return [];
    }

    const position = {
      line: options.bufferPosition.row,
      column: options.bufferPosition.column
    };
    const relativePath: string =
        atom.project.relativizePath(options.editor.getPath())[1];
    const completions =
        await this.editorService.getTypeaheadCompletionsAtPosition(
            relativePath, position);
    if (!completions) {
      return [];
    }
    if (completions.kind === 'element-tags') {
      // Could do something more clever here, and look for partial matches
      // ordering by length of match.
      const matchingElements = completions.elements.filter(
          e => e.tagname.startsWith(options.prefix));
      return matchingElements.map((element) => {
        const suggestion: autocomplete.SnippetSuggestion = {
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

    if (completions.kind === 'attribute-values') {
      return completions.attributes.map(attr => {
        let suggestion: autocomplete.Suggestion;
        suggestion = {text: attr.autocompletion};
        suggestion.type = 'value';
        suggestion.description = attr.description;
        if (attr.inheritedFrom) {
          suggestion.rightLabel = `⊃ ${attr.inheritedFrom}`;
        }
        if (attr.type) {
          suggestion.leftLabel = attr.type;
        }
        return suggestion;
      });
    }

    if (completions.kind === 'attributes') {
      return completions.attributes
          .filter(e => e.name.startsWith(options.prefix))
          .map((attr) => {
            let suggestion: autocomplete.Suggestion;
            if (attr.type === 'boolean') {
              suggestion = {text: attr.name};
            } else {
              suggestion = {
                displayText: attr.name,
                snippet: `${attr.name}="\${1:${attr.type}}"`,
                replacementPrefix: options.prefix,
                type: 'class'
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
  }
}

export default Autocompleter;
