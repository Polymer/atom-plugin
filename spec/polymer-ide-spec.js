'use babel';

import PolymerIde from '../lib/polymer-ide';
import temp from 'temp';

temp.track();

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g.
// `fit` or `fdescribe`). Remove the `f` to unfocus the block.

describe('PolymerIde', () => {
  beforeEach(() => {
    waitsForPromise(() =>
      atom.packages.activatePackage('polymer-ide'));
  });

  describe('activate', () => {
    it('should initialise services', () => {
      expect(PolymerIde.linter).toBeDefined();
      expect(PolymerIde.autocompleter).toBeDefined();
      expect(PolymerIde.subscriptions).toBeDefined();
    });
  });

  describe('deactivate', () => {
    beforeEach(() => {
      atom.packages.deactivatePackage('polymer-ide');
    });

    it('should dispose of all services', () => {
      expect(PolymerIde.subscriptions).toBeNull();
      expect(PolymerIde.editorService).toBeNull();
      expect(PolymerIde.linter).toBeNull();
      expect(PolymerIde.autocompleter).toBeNull();
    });
  });

  describe('onDidChangePaths', () => {
    it('should set linter error if no paths', () => {
      atom.project.setPaths([]);
      expect(PolymerIde.linter.configurationError)
        .toBe('polymer-ide only works with projects.');
    });

    it('should set linter error if multiple roots', () => {
      const paths = [
        temp.mkdirSync('dir1'),
        temp.mkdirSync('dir2')
      ];

      atom.project.setPaths(paths);

      expect(PolymerIde.linter.configurationError)
        .toBe('polymer-ide only works with projects' +
              ' with exactly one root directory, ' +
              `this project has: ${JSON.stringify(paths)}`);
    });

    it('should initialise editor service', () => {
      const paths = [
        temp.mkdirSync('dir1')
      ];

      atom.project.setPaths(paths);

      expect(PolymerIde.editorService).toBeDefined();
      expect(PolymerIde.linter.configurationError).toBeNull();
      expect(PolymerIde.linter.editorService)
        .toBe(PolymerIde.editorService);
      expect(PolymerIde.autocompleter.editorService)
        .toBe(PolymerIde.editorService);
    });

    it('should dispose of a previous editor service', () => {
      atom.project.setPaths([
        temp.mkdirSync('dir1')
      ]);

      const service = PolymerIde.editorService;

      spyOn(service, 'dispose').andCallThrough();

      atom.project.setPaths([
        temp.mkdirSync('dir2')
      ]);

      expect(service.dispose).toHaveBeenCalled();
    });
  });
});
