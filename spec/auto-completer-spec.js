'use babel';

import * as path from 'path';
import PolymerIde from '../lib/polymer-ide';

describe('Autocompleter', () => {
  let provider;
  let editor;
  let projectPath = path.resolve(__dirname, 'fixtures');
  let filePath = path.resolve(projectPath, 'simple.html');
  let opts;

  const getCompletions = () => {
    const cursor = editor.getLastCursor();
    const start = cursor.getBeginningOfCurrentWordBufferPosition();
    const end = cursor.getBufferPosition();
    return provider.getSuggestions({
      editor: editor,
      bufferPosition: end,
      scopeDescriptor: cursor.getScopeDescriptor(),
      prefix: editor.getTextInRange([start, end])
    });
  };

  beforeEach(() => {
    atom.project.setPaths([projectPath]);

    waitsForPromise(() =>
      atom.workspace.open(filePath)
        .then(_editor => {
          editor = _editor;
          return atom.packages.activatePackage('polymer-ide');
        })
        .then(() => {
          provider = PolymerIde.provideAutocompleter();
        }));
  });

  describe('getSuggestions', () => {
    it('should log an exception if any uncaught', () => {
      spyOn(console, 'error');
      spyOn(provider.editorService, 'getTypeaheadCompletionsAtPosition')
        .andThrow({
          message: 'foo'
        });

      waitsForPromise(() =>
        getCompletions().then(result => {
          expect(result.length).toBe(0);
          expect(console.error).toHaveBeenCalledWith('foo');
        }));
    });

    it('should return nothing if no editor service', () => {
      provider.editorService = null;

      waitsForPromise(() =>
        getCompletions().then(result => {
          expect(result.length).toBe(0);
        }));
    });

    it('should return nothing if editor service call fails', () => {
      spyOn(provider.editorService, 'getTypeaheadCompletionsAtPosition')
        .andReturn(false);

      waitsForPromise(() =>
        getCompletions().then(result => {
          expect(result.length).toBe(0);
        }));
    });

    it('should suggest matching elements', () => {
      editor.setCursorBufferPosition([20, 0]);
      editor.insertText('<te');

      waitsForPromise(() =>
        getCompletions().then(result => {
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({
            snippet: '<test-element $1></test-element>$0',
            displayText: '<test-element>',
            description: '',
            descriptionMarkdown: '',
            type: 'class',
            replacementPrefix: '<te'
          });
        }));
    });

    describe('attributes', () => {
      it('should suggest matching attributes');

      it('should produce text suggestions for bools');

      it('should display attribute inheritance');

      it('should display attribute type');
    });
  });
});
