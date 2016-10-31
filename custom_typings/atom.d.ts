declare module 'atom' {
  export class CompositeDisposable {
    add(d: AtomCore.Disposable): void;
    dispose(): void;
  }
}

declare namespace AtomCore {
  export interface IWorkspace {
    // https://atom.io/docs/api/v1.6.0/Workspace#instance-observePanes
    observePanes(callback: (pane: IPane)=>void): Disposable;
  }

  export interface IPane {
    // https://atom.io/docs/api/v1.6.0/Pane#instance-onDidChangeActiveItem
    onDidChangeActiveItem(callback: (paneItem: any)=>void): Disposable;
  }

  interface DecorationParams {
    type:
      /**
       * Adds the given class to the lines overlapping the rows
       * spanned by the TextEditorMarker.
       */
      'line' |
      /**
       * Adds the given class to the line numbers overlapping the rows spanned
       * by the TextEditorMarker.
       */
      'line-number' |
      /**
       * Creates a .highlight div with the nested class with up to 3 nested
       * regions that fill the area spanned by the TextEditorMarker.
       */
      'highlight' |
      /**
       * Positions the view associated with the given item at the head or tail
       * of the given TextEditorMarker, depending on the position property.
       */
      'overlay' |
      /**
       * Tracks a TextEditorMarker in a Gutter. Created by calling
       * Gutter::decorateMarker on the desired Gutter instance.
       */
      'gutter' |
      /**
       * Positions the view associated with the given item before or after the
       * row of the given TextEditorMarker, depending on the position property.
       */
      'block';
    /**
     * This CSS class will be applied to the decorated line number, line,
     * highlight, or overlay.
     */
    'class'?: string;

    /**
     * An HTMLElement or a model Object with a corresponding view registered.
     * Only applicable to the gutter, overlay and block types.
     */
    item: HTMLElement | Object;

    /**
     * If true, the decoration will only be applied to the head of the
     * TextEditorMarker. Only applicable to the line and line-number types.
     */
    onlyHead?: boolean;

    /**
     * If true, the decoration will only be applied if the associated
     * TextEditorMarker is empty. Only applicable to the gutter, line, and
     * line-number types.
     */
    onlyEmpty?: boolean;

    /**
     * If true, the decoration will only be applied if the associated
     * TextEditorMarker is non-empty. Only applicable to the gutter, line, and
     * line-number types.
     */
    onlyNonEmpty?: boolean;

    /**
     * Only applicable to decorations of type overlay and block, controls where
     * the view is positioned relative to the TextEditorMarker. Values can be
     * 'head' (the default) or 'tail' for overlay decorations, and 'before'
     * (the default) or 'after' for block decorations.
     */
    position?: 'head' | 'tail' | 'before' | 'after';
  }
  export interface IEditor {

    /**
     * Add a decoration that tracks a TextEditorMarker. When the marker moves,
     * is invalidated, or is destroyed, the decoration will be updated to
     * reflect the marker's state.
     *
     * https://atom.io/docs/api/v1.6.0/TextEditor#instance-decorateMarker
     */
    decorateMarker(marker:IDisplayBufferMarker, decorationParams: DecorationParams): IDecoration
  }
}
