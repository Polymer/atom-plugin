'use babel';

/// <reference path="../custom_typings/main.d.ts" />

import * as path from 'path';

import {CompositeDisposable} from 'atom';
import * as lint from 'atom-lint';
import {Severity} from 'polymer-analyzer/lib/warning/warning';
import {RemoteEditorService} from 'polymer-editor-service/lib/remote-editor-service';
import {SourceRange} from 'polymer-analyzer/lib/model/model';
import * as autocomplete from 'atom-autocomplete-plus';
import TooltipManager from './tooltip-manager';

interface ViewState {}

class PolymerIde {
  subscriptions: CompositeDisposable = null;
  linter: Linter = null;
  autocompleter: Autocompleter = null;
  editorService: RemoteEditorService;

  activate(_: ViewState) {
    // Initialize.
    this.linter = new Linter();
    this.autocompleter = new Autocompleter();

    // Events subscribed to in atom's system can be easily cleaned up with a
    // CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
        atom.project.onDidChangePaths((projectPaths: string[]) => {
          this.setProjectPaths(projectPaths);
        }));
    this.setProjectPaths(atom.project.getPaths());
    this.subscriptions.add(new TooltipManager(this.editorService));
  };

  deactivate() {
    this.subscriptions.dispose();
    this.subscriptions = null;
    this.editorService = null;
    this.linter = null;
    this.autocompleter = null;
  };

  setProjectPaths(projectPaths: string[]) {
    if (projectPaths.length === 0) {
      this.linter.configurationError = 'polymer-ide only works with projects.';
    } else if (projectPaths.length > 1) {
      this.linter.configurationError =
          `polymer-ide only works with projects with exactly one root ` +
          `directory, this project has: ${JSON.stringify(projectPaths)}`;
    } else {
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
  };

  serialize(): ViewState {
    return {};
  };

  provideLinter(): lint.Provider|lint.Provider[] {
    return this.linter;
  };

  provideAutocompleter(): autocomplete.Provider|autocomplete.Provider[] {
    return this.autocompleter;
  };
};

class Linter implements lint.Provider {
  name = 'polymer-ide';
  grammarScopes = ['source.js', 'text.html', 'text.html.basic'];
  scope: 'file' = 'file';
  lintOnFly = true;
  configurationError: string|null = null;
  editorService: RemoteEditorService;

  async lint(textEditor: AtomCore.IEditor): Promise<lint.Message[]> {
    try {
      return await this._lint(textEditor);
    } catch (e) {
      // Atom pops up huge loud error popups if we return a rejecting promise
      // here, so better to just log and swallow.
      console.error(e.stack || e.message || e);
      return [];
    }
  };

  private async _lint(textEditor: AtomCore.IEditor): Promise<lint.Message[]> {
    if (this.configurationError) {
      return [{
        type: 'Error',
        text: this.configurationError,
        range: [[0, 0], [0, 1]],
        filePath: textEditor.getPath(),
        severity: 'error'
      }];
    }
    const [projectPath, relativePath]: string[] =
        atom.project.relativizePath(textEditor.getPath());
    try {
      await this.editorService.fileChanged(
          relativePath, textEditor.getBuffer().cachedText);
    } catch (e) {
      /* swallow the erorr, let getWarningsFor() handle things */
    }
    const warnings = await this.editorService.getWarningsForFile(relativePath);
    return warnings.map(w => {
      const {path: relPath, range} = convertSourceRange(w.sourceRange);
      return <lint.Message>{
        type: severityToMessageType(w.severity),
        filePath: path.join(projectPath, relPath),
        range: range,
        text: w.message
      };
    });
  }
}

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
    console.log(completions);
    if (!completions) {
      return [];
    }
    if (completions.kind === 'element-tags') {
      // Could do something more clever here, and look for partial matches
      // ordering by length of match.
      const matchingElements = completions.elements.filter(
          e => e.tagname.startsWith(options.prefix));
      return matchingElements.map((element) => {
        const suggestion: autocomplete.TextSuggestion = {
          text: element.expandTo,
          displayText: `<${element.tagname}>`,
          description: element.description,
          descriptionMarkdown: element.description,
          type: 'class',
          replacementPrefix: `<${options.prefix}`
        };
        return suggestion;
      });
    } else if (completions.kind === 'attributes') {
      return completions.attributes.map((attr) => {
        let suggestion: autocomplete.Suggestion;
        if (attr.type === 'boolean') {
          suggestion = {text: attr.name};
        } else {
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
  }
}

function severityToMessageType(severity: Severity): string {
  switch (severity) {
    case Severity.ERROR:
      return 'Error';
    case Severity.WARNING:
      return 'Warning';
    case Severity.INFO:
      return 'Info';
    default:
      const never: never = severity;
      throw new Error(`Unknown severity received: ${never}`);
  }
}

function convertSourceRange(sourceRange: SourceRange):
    {range: lint.Range, path: string} {
  return {
    path: sourceRange.file,
    range: [
      [sourceRange.start.line, sourceRange.start.column],
      [sourceRange.end.line, sourceRange.end.column]
    ]
  };
}

export default new PolymerIde();
