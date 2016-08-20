'use babel';

/// <reference path="../custom_typings/main.d.ts" />

import {AtomPolymerView, AtomPolymerViewState} from './atom-polymer-view';
import {CompositeDisposable} from 'atom';
import * as lint from 'atom-lint';

console.log('atom-polymer was imported');

interface ViewState {
  atomPolymerViewState: AtomPolymerViewState;
}

class AtomPolymer {
  atomPolymerView: AtomPolymerView = null;
  modalPanel: AtomCore.Panel = null;
  subscriptions: CompositeDisposable = null;

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
  };

  deactivate() {
    this.modalPanel['destroy']();
    this.subscriptions.dispose();
    this.atomPolymerView.destroy();
  };

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
    console.log('atom-polymer was asked for a lint provider');
    const provider: lint.Provider = {
      name: 'Polymer Analyzer',
      grammarScopes: [
        'source.js', 'text.html', 'text.html.basic'
      ],              // ['*'] will get it triggered regardless of grammar
      scope: 'file',  // or 'project'
      lintOnFly: true,
      lint: async function(textEditor): Promise<lint.Message[]> {
        console.log(`atom-polymer was asked to lint ${textEditor.getPath()}`);
        return [{
          type: 'Error',
          text: 'Something went wrong',
          range: [[0, 0], [0, 1]],
          filePath: textEditor.getPath()
        }];
      }
    };
    return provider;
  }
};

export default new AtomPolymer();
