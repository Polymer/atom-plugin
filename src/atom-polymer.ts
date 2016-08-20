'use babel';

/// <reference path="../custom_typings/main.d.ts" />

import {AtomPolymerView, AtomPolymerViewState} from './atom-polymer-view';
import {CompositeDisposable} from 'atom';

interface ViewState {
  atomPolymerViewState: AtomPolymerViewState
}

class AtomPolymer {
  atomPolymerView: AtomPolymerView = null;
  modalPanel: AtomCore.Panel = null;
  subscriptions: CompositeDisposable = null;

  activate(state: ViewState) {
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
};

export default new AtomPolymer();
