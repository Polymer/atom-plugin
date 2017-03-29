'use babel';

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import PolymerIde from '../lib/polymer-ide';

describe('Autocompleter', () => {
  let provider;
  let editor;
  let opts;
  const fixtures = path.resolve(__dirname, 'fixtures');

  const getCompletions = () => {
    editor.save();
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
    waitsForPromise(async () => {
      const tempDir = path.join(os.tmpdir(), `atom-polymer-ide-auto-completer-${Math.random()}`);
      await fs.copy(fixtures, tempDir);
      atom.project.setPaths([tempDir]);

      editor = await atom.workspace.open(path.resolve(tempDir, 'simple.html'));
      await atom.packages.activatePackage('polymer-ide');
      provider = PolymerIde.provideAutocompleter();
    });
  });

  describe('getSuggestions', () => {
    it('should log an exception if any uncaught', () => {
      spyOn(console, 'error');
      spyOn(provider.editorService, 'getTypeaheadCompletionsAtPosition')
        .andThrow({
          message: 'foo'
        });

      waitsForPromise(async () => {
        var result = await getCompletions();
        expect(result.length).toBe(0);
        expect(console.error).toHaveBeenCalledWith('foo');
      });
    });

    it('should return nothing if no editor service', () => {
      provider.editorService = null;

      waitsForPromise(async () => {
        var result = await getCompletions();
        expect(result.length).toBe(0);
      });
    });

    it('should return nothing if editor service call fails', () => {
      spyOn(provider.editorService, 'getTypeaheadCompletionsAtPosition')
        .andReturn(false);

      waitsForPromise(async () => {
        var result = await getCompletions();
        expect(result.length).toBe(0);
      });
    });

    it('should suggest matching elements', () => {
      editor.setCursorBufferPosition([29, 0]);
      editor.insertText('<te');

      waitsForPromise(async () => {
        var result = await getCompletions();
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({
          snippet: '<test-element $1></test-element>$0',
          displayText: '<test-element>',
          description: 'test description',
          descriptionMarkdown: 'test description',
          type: 'class',
          replacementPrefix: '<te'
        });
      });
    });

    describe('attributes', () => {
      it('should suggest matching attributes', () => {
        editor.setCursorBufferPosition([29, 0]);
        editor.insertText('<test-element fo');

        waitsForPromise(async () => {
          var result = await getCompletions();
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({
            text: 'foo',
            type: 'property',
            description: 'foo description',
            leftLabel: 'String'
          });
        });
      });

      it('should produce text suggestions for bools', () => {
        editor.setCursorBufferPosition([29, 0]);
        editor.insertText('<test-element ba');

        waitsForPromise(async () => {
          var result = await getCompletions();
          expect(result.length).toBe(1);
          expect(result[0]).toEqual({
            displayText: 'bar',
            snippet: 'bar=${1:Boolean}',
            type: 'property',
            description: 'bar description',
            leftLabel: 'Boolean'
          });
        });
      });

      it('should display attribute inheritance');
    });
  });
});
