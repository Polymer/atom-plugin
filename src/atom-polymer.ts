'use babel';

/// <reference path="../custom_typings/main.d.ts" />

import * as path from 'path';

import {CompositeDisposable} from 'atom';
import * as lint from 'atom-lint';
import {Severity} from 'polymer-analyzer/lib/editor-service';
import {RemoteEditorService} from 'polymer-analyzer/lib/remote-editor-service';
import {SourceRange} from 'polymer-analyzer/lib/ast/ast';
import * as autocomplete from 'atom-autocomplete-plus';

interface ViewState {}

class AtomPolymer {
  subscriptions: CompositeDisposable = null;
  linter: Linter = new Linter();
  autocompleter: Autocompleter = new Autocompleter();

  activate(_: ViewState) {
    // Events subscribed to in atom's system can be easily cleaned up with a
    // CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
        atom.project.onDidChangePaths((projectPaths: string[]) => {
          this.setProjectPaths(projectPaths);
        }));
    this.setProjectPaths(atom.project['getPaths']());
  };

  deactivate() {
    this.subscriptions.dispose();
    this.linter = null;
    this.autocompleter = null;
  };

  setProjectPaths(projectPaths: string[]) {
    if (projectPaths.length === 0) {
      this.linter.configurationError =
          'Polymer linter only works with projects.';
    } else if (projectPaths.length > 1) {
      this.linter.configurationError =
          `Polymer linter only projects with exactly one root directory, this project has: ${JSON.stringify(projectPaths)}`;
    } else {
      const rootDir = projectPaths[0];
      const editorService = new RemoteEditorService(rootDir);
      this.subscriptions.add(editorService);
      this.linter.configurationError = null;
      this.linter.editorService = editorService;
      this.linter.rootDir = rootDir;
    }
  }

  serialize(): ViewState {
    return {};
  };

  provideLinter(): lint.Provider|lint.Provider[] {
    return this.linter;
  }

  provideAutocompleter(): autocomplete.Provider|autocomplete.Provider[] {
    return this.autocompleter;
  }
};

class Linter implements lint.Provider {
  name = 'Polymer Analyzer';
  grammarScopes = ['source.js', 'text.html', 'text.html.basic'];
  scope: 'file' = 'file';
  lintOnFly = true;
  configurationError: string|null = null;
  editorService: RemoteEditorService;
  rootDir: string = null;

  async lint(textEditor: AtomCore.IEditor): Promise<lint.Message[]> {
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
        atom.project['relativizePath'](textEditor.getPath());
    await this.editorService.fileChanged(
        relativePath, textEditor.getBuffer().cachedText);
    const warnings = await this.editorService.getWarningsFor(relativePath);
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

  async getSuggestions(_options: autocomplete.SuggestionRequestOptions):
      Promise<autocomplete.Suggestion[]> {
    const suggestions: autocomplete.Suggestion[] = [];
    suggestions.push({text: 'foobarbaz'});

    return suggestions;
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
      throw new Error(`Unknown severity received: ${severity}`);
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

export default new AtomPolymer();
