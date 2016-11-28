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


/// <reference path="../custom_typings/main.d.ts" />

import {CompositeDisposable} from 'atom';
import * as lint from 'atom-lint';
import {RemoteEditorService} from 'polymer-editor-service/lib/remote-editor-service';
import * as autocomplete from 'atom-autocomplete-plus';
import Autocompleter from './auto-completer';
import Linter from './linter';
import TooltipManager from './tooltip-manager';

interface ViewState {}

type WorkSpace = {
  linter: Linter;
  autocompleter: Autocompleter;
  editorService: RemoteEditorService;
  tooltipManager: TooltipManager;
};

class PolymerIde {
  subscriptions: CompositeDisposable = null;
  workspaces: Map<string, [number, WorkSpace]> = new Map();

  activate(_: ViewState) {
    // Events subscribed to in atom's system can be easily cleaned up with a
    // CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
        this.updateWorkspaceMap(editor);
      })
    );
  };

  private getProjectPathFromEditor(editor: AtomCore.IEditor) {
    return atom.project.relativizePath(editor.getPath())[0];
  };

  private updateWorkspaceMap(editor: AtomCore.IEditor) {
    const project = this.getProjectPathFromEditor(editor);
    editor.onDidDestroy(() => {
      const workspace = this.workspaces.get(project);
      workspace[0] = workspace[0] - 1;
    });
    if (this.workspaces.has(project)) {
      this.workspaces.get(project)[0] = this.workspaces.get(project)[0] + 1;
    } else {
      // TODO(timvdlippe): Expose as user setting?
      if (this.workspaces.size == 10) {
        for (const oldProject of this.workspaces.keys()) {
          const workspace = this.workspaces.get(oldProject);
          if (workspace[0] <= 1) {
            this.workspaces.delete(oldProject);
            break;
          }
        }
      }
      const editorService = new RemoteEditorService(project);
      const workspace = {
        linter: new Linter(editorService),
        autocompleter: new Autocompleter(editorService),
        editorService: editorService,
        tooltipManager: new TooltipManager(editorService)
      };
      this.workspaces.set(project, [1, workspace]);
    }
  };

  provideLinter(): lint.Provider {
    return {
      name: 'polymer-ide',
      grammarScopes: ['source.js', 'text.html', 'text.html.basic'],
      scope: 'file',
      lintOnFly: true,
      lint: (editor) => {
        const project = this.getProjectPathFromEditor(editor);
        return this.workspaces.get(project)[1].linter.lint(editor);
      }
    }
  };

  provideAutocompleter(): autocomplete.Provider {
    return {
      selector: '.text.html, .source.js',
      getSuggestions: (options) => {
        const project = this.getProjectPathFromEditor(options.editor);
        return this.workspaces.get(project)[1].autocompleter.getSuggestions(options);
      }
    };
  };

  deactivate() {
    this.subscriptions.dispose();
    this.subscriptions = null;
    this.workspaces = new Map();
  };

  serialize(): ViewState {
    return {};
  };

};

export default new PolymerIde();
