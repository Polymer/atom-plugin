'use babel';

/// <reference path="../custom_typings/main.d.ts" />
/// <reference path="atom/index.d.ts" />
/// <reference path="marked/index.d.ts" />

import * as path from 'path';

import {CompositeDisposable, AtomMouseEvent} from 'atom';
import * as lint from 'atom-lint';
import {Severity} from 'polymer-analyzer/lib/warning/warning';
import {RemoteEditorService} from 'polymer-analyzer/lib/editor-service/remote-editor-service';
import {SourceRange} from 'polymer-analyzer/lib/model/model';
import * as autocomplete from 'atom-autocomplete-plus';
import * as marked from 'marked';

interface ViewState {}

class PolymerIde {
  subscriptions: CompositeDisposable = null;
  linter: Linter = null;
  autocompleter: Autocompleter = null;
  editorService: RemoteEditorService;
  tooltipManager: TooltipManager;

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
    this.setProjectPaths(atom.project['getPaths']());
    this.tooltipManager = new TooltipManager(this.editorService);
    this.tooltipManager.subscribe(this.subscriptions);
  };

  deactivate() {
    this.subscriptions.dispose();
    this.subscriptions = null;
    this.editorService = null;
    this.linter = null;
    this.autocompleter = null;
    this.tooltipManager.removeTooltip();
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

class TooltipManager {
  textEditor: AtomCore.IEditor;
  tooltipMarker: AtomCore.IDisplayBufferMarker;
  tooltipElement: HTMLElement = null;
  documentationElement: HTMLElement = null;
  editorService: RemoteEditorService;
  editorElements: Array<HTMLElement> = [];

  constructor(editorService: RemoteEditorService) {
    this.editorService = editorService;
  };

  subscribe(subscriptions: CompositeDisposable) {
    subscriptions.add(atom.workspace.observePanes((pane: AtomCore.IPane) => {
      this.update();
      subscriptions.add(pane.onDidChangeActiveItem(() => {
        this.update();
      }));
    }));
  };

  update() {
    this.removeTooltip();
    this.textEditor = atom.workspace.getActiveTextEditor();
    this.addMouseEventListener();
  }

  addMouseEventListener() {
    const textEditorElement = atom.views.getView(this.textEditor);
    if (!textEditorElement) {
      return;
    }
    if (this.editorElements.indexOf(textEditorElement) > -1) {
      return;
    }
    this.editorElements.push(textEditorElement);
    let timer: number;
    textEditorElement.addEventListener('mousemove', (event: AtomMouseEvent) => {
      window.clearTimeout(timer);
      this.removeTooltip();
      timer = window.setTimeout(() => this.calculatePositions(event, textEditorElement), 100);
    });
  };

  calculatePositions(event: AtomMouseEvent, textEditorElement: any) {
    // The text editor could have been closed before the timeout was fired
    if (!textEditorElement || !textEditorElement.component) {
      return;
    }
    const reportedCursorPosition = textEditorElement.component.screenPositionForMouseEvent(event);
    const currentCursorPixelPosition = textEditorElement.component.pixelPositionForMouseEvent(event);
    const expectedPixelPosition = textEditorElement.pixelPositionForScreenPosition(reportedCursorPosition);

    const nearColumn = Math.abs(currentCursorPixelPosition.left - expectedPixelPosition.left) < 20;
    const nearRow = Math.abs(currentCursorPixelPosition.top - expectedPixelPosition.top) < 20;

    if (nearColumn && nearRow) {
      this.updateTooltip(this.textEditor.bufferPositionForScreenPosition(reportedCursorPosition), event);
    }
  }

  async updateTooltip(point: {row: number, column: number}, event: AtomMouseEvent) {
    this.removeTooltip();

    if (!(this.editorService && this.textEditor)) {
      return;
    }
    const relativePath: string =
      atom.project['relativizePath'](this.textEditor.getPath())[1];
    let documentation: string;
    try {
      documentation = await this.editorService.getDocumentationAtPosition(relativePath, {line: point.row, column: point.column});
      if (!documentation) {
        return;
      }
    } catch (e) {
      // The analyzer was not able to parse the file
      return;
    }

    const marker = this.textEditor.markBufferRange([point, point]);
    const div = this.getOrCreateTooltipElement();
    div.style.left = event.left;
    div.style.top = event.top;
    this.documentationElement.innerHTML = marked.parse(documentation);
    this.textEditor.decorateMarker(marker, {
      type: 'overlay',
      item: div
    });
    this.tooltipMarker = marker;
  };

  getOrCreateTooltipElement(): HTMLElement {
    if (!this.tooltipElement) {
      const div = document.createElement('div');
      div.classList.add('tooltip');
      div.classList.add('in');
      div.classList.add('bottom');
      const content = document.createElement('div');

      content.classList.add('tooltip-inner');
      content.classList.add('polymer-tooltip-documentation');
      div.appendChild(content);

      this.tooltipElement = div;
      this.documentationElement = content;
    } else {
      this.tooltipElement.style.display = 'block';
    }
    return this.tooltipElement;
  };

  removeTooltip() {
    if (this.tooltipMarker) {
      this.tooltipMarker.destroy();
      this.tooltipMarker = null;
      this.tooltipElement.style.display = 'none';
    }
  };
}

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
        atom.project['relativizePath'](textEditor.getPath());
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
        atom.project['relativizePath'](options.editor.getPath())[1];
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
