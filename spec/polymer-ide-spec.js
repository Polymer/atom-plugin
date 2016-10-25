'use babel';

import PolymerIde from '../lib/polymer-ide';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g.
// `fit` or `fdescribe`). Remove the `f` to unfocus the block.

describe('PolymerIde', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    activationPromise = atom.packages.activatePackage('polymer-ide');
  });

});
