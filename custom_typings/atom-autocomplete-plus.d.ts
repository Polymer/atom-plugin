declare module 'atom-autocomplete-plus' {
  export interface Provider {
    /**
     * Defines the scope selector(s) (can be comma-separated) for which your
     * provider should receive suggestion requests
     */
    selector: string;

    /**
     * Called when a suggestion request has been dispatched by `autocomplete+`
     * to your provider. Return an array of suggestions (if any) in the order
     * you would like them displayed to the user. Returning a Promise of an
     * array of suggestions is also supported.
     */
    getSuggestions(params: SuggestionRequestOptions): Promise<Suggestion[]>;

    /**
     * Defines the scope selector(s) (can be comma-separated) for which your
     * provider should not be used
     */
    disableForSelector?: string;

    /**
     * A number to indicate its priority to be included in a suggestions
     * request. The default provider has an inclusion priority of 0. Higher
     * priority providers can suppress lower priority providers with
     * `excludeLowerPriority`.
     */
    inclusionPriority?: number;
    /**
     * Will not use lower priority providers when this provider is used.
     */
    excludeLowerPriority?: boolean;

    /**
     * Will be called if your provider is being destroyed by `autocomplete+`
     */
    dispose?(): void;

    /**
     * Function that is called when a suggestion from your provider was inserted
     * into the buffer
     */
    onDidInsertSuggestion?(options: DidInsertionSuggestionOptions): void;
  }
  interface SuggestionRequestOptions {
    /** The current TextEditor. */
    editor: AtomCore.IEditor;
    /** The position of the cursor */
    bufferPosition: [number, number];
    /** The scope descriptor for the current cursor position */
    scopeDescriptor: AtomCore.ScopeDescriptor;
    /**
     * The prefix for the word immediately preceding the current cursor position
     */
    prefix: string;
    /**
     * Whether the autocomplete request was initiated by the user (e.g. with
     * ctrl+space)
     */
    activatedManually: boolean;
  }
  interface DidInsertionSuggestionOptions {
    editor: AtomCore.IEditor;
    triggerPosition: [number, number];
    suggestion: Suggestion;
  }
  type Suggestion = TextSuggestion | SnippetSuggestion;
  interface BaseSuggestion {
    /**
     * A string that will show in the UI for this suggestion. When not set,
     * snippet || text is displayed. This is useful when snippet or text
     * displays too much, and you want to simplify. e.g. {type: 'attribute',
     * snippet: 'class="$0"$1', displayText: 'class'}
     */
    displayText?: string;

    /**
     * The text immediately preceding the cursor, which will be replaced by the
     * text. If not provided, the prefix passed into getSuggestions will be
     * used.
     */
    replacementPrefix?: string;

    /**
     * The suggestion type. It will be converted into an icon shown against the
     * suggestion. screenshot. Predefined styles exist for variable, constant,
     * property, value, method, function, class, type, keyword, tag, snippet,
     * import, require. This list represents nearly everything being colorized.
     */
    type?: 'variable'|'constant'|'property'|'value'|'method'|'function'|'class'|
        'type'|'keyword'|'tag'|'snippet'|'import'|'require';

    /**
     * This is shown before the suggestion. Useful for return values.
     *
     * [screenshot](https://github.com/atom/autocomplete-plus/pull/334)
     */
    leftLabel?: string;

    /**
     * Use this instead of leftLabel if you want to use html for the left label.
     */
    leftLabelHTML?: string;

    /**
     * An indicator (e.g. function, variable) denoting the "kind" of suggestion
     * this represents
     */
    rightLabel: string;

    /**
     * Use this instead of rightLabel if you want to use html for the right
     * label.
     */
    rightLabelHTML?: string;

    /**
     * Class name for the suggestion in the suggestion list. Allows you to style
     * your suggestion via CSS, if desired
     */
    className?: string;

    /**
     * If you want complete control over the icon shown against the suggestion.
     * e.g. `iconHTML: '<i class="icon-move-right"></i>'`
     * [screenshot](https://github.com/atom/autocomplete-plus/pull/334). The
     * background color of the icon will still be determined (by default) from
     * the type.
     */
    iconHTML?: string;

    /**
     * A doc-string summary or short description of the suggestion. When
     * specified, it will be displayed at the bottom of the suggestions list.
     */
    description?: string;

    /**
     * A url to the documentation or more information about this suggestion.
     * When specified, a More.. link will be displayed in the description area.
     */
    descriptionMoreLink?: string;
  }
  interface TextSuggestion {
    /**
     * The text which will be inserted into the editor, in place of the prefix
     */
    text: string;
  }
  interface SnippetSuggestion {
    /**
     * A snippet string. This will allow users to tab through function arguments
     * or other options. e.g. 'myFunction(${1:arg1}, ${2:arg2})'. See the
     * snippets package for more information.
     *
     * https://github.com/atom/snippets
     */
    snippet: string;
  }
}
