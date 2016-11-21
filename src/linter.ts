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


import * as path from 'path';
import * as lint from 'atom-lint';
import {RemoteEditorService} from 'polymer-editor-service/lib/remote-editor-service';
import {Severity} from 'polymer-analyzer/lib/warning/warning';
import {SourceRange} from 'polymer-analyzer/lib/model/model';

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

export default Linter;
