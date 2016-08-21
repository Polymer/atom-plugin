'use babel';

/// <reference path="../custom_typings/main.d.ts" />

import * as path from 'path';

import {AtomPolymerView, AtomPolymerViewState} from './atom-polymer-view';
import {CompositeDisposable} from 'atom';
import * as lint from 'atom-lint';
import {Severity} from 'polymer-analyzer/lib/editor-service';
import {RemoteEditorService} from 'polymer-analyzer/lib/remote-editor-service';
import {SourceRange} from 'polymer-analyzer/lib/ast/ast';

console.log('atom-polymer was imported');

interface ViewState {
  atomPolymerViewState: AtomPolymerViewState;
}

class AtomPolymer {
  atomPolymerView: AtomPolymerView = null;
  modalPanel: AtomCore.Panel = null;
  subscriptions: CompositeDisposable = null;
  linter: Linter = null;

  activate(state: ViewState) {
    console.log('atom-polymer was activated');
    this.atomPolymerView = new AtomPolymerView(state.atomPolymerViewState);
    this.modalPanel = atom.workspace.addModalPanel(
        {item: this.atomPolymerView.getElement(), visible: false});

    // Events subscribed to in atom's system can be easily cleaned up with a
    // CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add(
        'atom-workspace', {'atom-polymer:toggle': () => this.toggle()}));
    this.linter = new Linter();

    this.subscriptions.add(
        atom.project.onDidChangePaths((projectPaths: string[]) => {
          this.setProjectPaths(projectPaths);
        }));
    this.setProjectPaths(atom.project['getPaths']());
  };

  deactivate() {
    this.modalPanel['destroy']();
    this.subscriptions.dispose();
    this.atomPolymerView.destroy();
    this.linter = null;
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

  serialize() {
    return {atomPolymerViewState: this.atomPolymerView.serialize()};
  };

  toggle() {
    console.log('AtomPolymer was toggled!');
    return (
        this.modalPanel.isVisible() ? this.modalPanel.hide() :
                                      this.modalPanel.show());
  };

  provideLinter(): lint.Provider|lint.Provider[] {
    return this.linter;
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
