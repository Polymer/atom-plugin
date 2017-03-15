'use babel';

import PolymerIde from '../lib/polymer-ide';
import temp from 'temp';
import { Severity } from 'polymer-analyzer/lib/warning/warning';

temp.track();

describe('Linter', () => {
  let provider;
  let editor;
  let filePath;
  let projectPath = temp.mkdirSync('dir1');

  beforeEach(() => {
    filePath = temp.openSync({
      suffix: '.html',
      dir: projectPath
    }).path;

    atom.project.setPaths([projectPath]);

    waitsForPromise(() =>
      atom.workspace.open(filePath)
        .then(_editor => {
          editor = _editor;
          return atom.packages.activatePackage('polymer-ide');
        })
        .then(() => {
          provider = PolymerIde.provideLinter();
        }));
  });

  describe('lint', () => {
    it('should return a configuration error if any set', () => {
      provider.configurationError = 'i am an error';

      return provider.lint(editor).then(warnings => {
        expect(warnings.length).toBe(1);

        expect(warnings[0]).toEqual({
          type: 'Error',
          text: 'i am an error',
          range: [[0, 0], [0, 1]],
          filePath: filePath,
          severity: 'error'
        });
      });
    });

    it('should log an exception if any uncaught', () => {
      spyOn(provider.editorService, 'getWarningsForFile')
        .andThrow({
          message: 'foo'
        });

      return provider.lint(editor).then(warnings => {
        expect(warnings.length).toBe(0);
        expect(console.error).toHaveBeenCalledWith('foo');
      });
    });

    it('should return warnings if any', () => {
      spyOn(provider.editorService, 'getWarningsForFile')
        .andReturn(Promise.resolve([{
          message: 'foo error',
          severity: Severity.ERROR,
          code: '',
          sourceRange: {
            file: filePath,
            start: {
              line: 0,
              column: 0
            },
            end: {
              line: 1,
              column: 1
            }
          }
        }]));

      return provider.lint(editor).then(warnings => {
        expect(warnings.length).toBe(1);
        expect(warnings[0]).toEqual({
          type: 'Error',
          filePath: filePath,
          range: [[0, 0], [1, 1]],
          text: 'foo error'
        });
      });
    });
  });
});
