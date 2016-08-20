declare module 'atom-lint' {
  interface Provider {
    name: string;
    grammarScopes: string[];
    scope: 'file'|'project';
    /**
     * Lint files while typing, without the need to save them. Defaults to
     * true.
     */
    lintOnFly: boolean;
    lint(textEditor: AtomCore.IEditor): Promise<Message[]>;
  }
  interface Message {
    type: string;
    text?: string;
    html?: string;
    // Only specify this if you want the name to be something other than your
    // linterProvider.name
    name?: string;
    filePath?: string;
    range?: Range;
    trace?: Trace[];
    fix?: Fix;
    severity?: 'error'|'warning'|'info';
    selected?: Function;
  }
  interface Trace {
    type: 'Trace';
    text?: string;
    html?: string;
    // Only specify this if you want the name to be something other than your
    // linterProvider.name
    name?: string;
    filePath: string;
    range?: Range;
    class
    ?: string;
    severity?: 'error'|'warning'|'info';
  }

  /** Note: currently unimplemented in linter. */
  interface Fix {
    range: Range;
    newText: string;
    oldText?: string;
  }
  type Range = [[number, number], [number, number]];
}