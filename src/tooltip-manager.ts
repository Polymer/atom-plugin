'use babel';

/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/// <reference path="../custom_typings/atom.d.ts" />

import {CompositeDisposable, Disposable} from 'atom';
import {RemoteEditorService} from 'polymer-editor-service/lib/remote-editor-service';
import * as marked from 'marked';

class TooltipManager extends Disposable {
  textEditor: AtomCore.IEditor;
  tooltipMarker: AtomCore.IDisplayBufferMarker;
  tooltipElement: HTMLElement = null;
  documentationElement: HTMLElement = null;
  editorService: RemoteEditorService;
  editorElements: Array<HTMLElement> = [];
  oldCursorsPosition: {x: number, y: number};
  removeMouseMoveListener: Function;
  subscriptions: CompositeDisposable;

  constructor(editorService: RemoteEditorService) {
    super(null);
    this.editorService = editorService;
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
        atom.workspace.observePanes((pane: AtomCore.IPane) => {
          this.update();
          this.subscriptions.add(pane.onDidChangeActiveItem(() => {
            this.update();
          }));
        }));
  };

  private update() {
    this.removeTooltip();
    if (this.removeMouseMoveListener) {
      this.removeMouseMoveListener();
    }
    this.textEditor = atom.workspace.getActiveTextEditor();
    this.addMouseEventListener();
  }

  private addMouseEventListener() {
    const textEditorElement = atom.views.getView(this.textEditor);
    if (!textEditorElement) {
      return;
    }
    if (this.editorElements.indexOf(textEditorElement) > -1) {
      return;
    }
    this.editorElements.push(textEditorElement);
    let timer: number;

    if (this.removeMouseMoveListener) {
      this.removeMouseMoveListener();
    }
    const mouseMoveListener = (event: MouseEvent) => {
      window.clearTimeout(timer);
      if (this.tooltipMarker
          // You are going too far up
          && (this.oldCursorsPosition.y - event.y > 25
              // You are going too far left
              || this.oldCursorsPosition.x - event.x > 25
              // You are going too far right
              || (this.oldCursorsPosition.x - event.x < -40
                  // but you are not going down inside the tooltip.
                  && this.oldCursorsPosition.y - event.y > -40))) {
        this.removeTooltip();
      }
      if (!this.tooltipMarker) {
        timer = window.setTimeout(
            () => this.calculatePositions(event, textEditorElement), 100);
      }
    };
    textEditorElement.addEventListener('mousemove', mouseMoveListener);
    this.removeMouseMoveListener = () =>
        textEditorElement.removeEventListener('mousemove', mouseMoveListener);
  };

  private calculatePositions(event: MouseEvent, textEditorElement: any) {
    // The text editor could have been closed before the timeout was fired
    if (!textEditorElement || !textEditorElement.component) {
      return;
    }
    const reportedCursorPosition =
        textEditorElement.component.screenPositionForMouseEvent(event);
    const currentCursorPixelPosition =
        textEditorElement.component.pixelPositionForMouseEvent(event);
    const expectedPixelPosition =
        textEditorElement.pixelPositionForScreenPosition(
            reportedCursorPosition);

    const nearColumn =
        Math.abs(currentCursorPixelPosition.left - expectedPixelPosition.left) <
        20;
    const nearRow =
        Math.abs(currentCursorPixelPosition.top - expectedPixelPosition.top) <
        20;

    if (nearColumn && nearRow) {
      this.updateTooltip(this.textEditor.bufferPositionForScreenPosition(
          reportedCursorPosition));
      this.oldCursorsPosition = {x: event.x, y: event.y};
    }
  }

  private async updateTooltip(point: {row: number, column: number}) {
    this.removeTooltip();

    if (!(this.editorService && this.textEditor)) {
      return;
    }
    const relativePath: string =
        atom.project.relativizePath(this.textEditor.getPath())[1];
    let documentation: string;
    try {
      documentation = await this.editorService.getDocumentationAtPosition(
          relativePath, {line: point.row, column: point.column});
      if (!documentation) {
        return;
      }
    } catch (e) {
      // The analyzer was not able to parse the file
      return;
    }

    const marker = this.textEditor.markBufferRange([point, point]);
    const div = this.getOrCreateTooltipElement();
    this.documentationElement.innerHTML =
        marked.parse(documentation, {sanitize: true});
    this.textEditor.decorateMarker(marker, {type: 'overlay', item: div});
    this.tooltipMarker = marker;
  };

  private getOrCreateTooltipElement(): HTMLElement {
    if (!this.tooltipElement) {
      const div = document.createElement('div');
      div.classList.add('tooltip');
      div.classList.add('in');
      div.classList.add('bottom');
      div.id = 'polymer-tooltip-container';
      const content = document.createElement('div');

      content.id = 'polymer-tooltip-documentation';
      content.classList.add('tooltip-inner');
      div.appendChild(content);

      div.addEventListener('mouseleave', () => {
        this.removeTooltip();
      });

      this.tooltipElement = div;
      this.documentationElement = content;
    } else {
      this.tooltipElement.style.display = 'block';
    }
    return this.tooltipElement;
  };

  private removeTooltip() {
    if (this.tooltipMarker) {
      this.tooltipMarker.destroy();
      this.tooltipMarker = null;
      this.tooltipElement.style.display = 'none';
    }
  };

  dispose() {
    this.removeTooltip();
    this.subscriptions.dispose();
  }
}

export default TooltipManager;
