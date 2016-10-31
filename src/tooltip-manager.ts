'use babel';

/// <reference path="marked/index.d.ts" />

import {CompositeDisposable} from 'atom';
import {RemoteEditorService} from 'polymer-analyzer/lib/editor-service/remote-editor-service';
import * as marked from 'marked';

class TooltipManager {
  textEditor: AtomCore.IEditor;
  tooltipMarker: AtomCore.IDisplayBufferMarker;
  tooltipElement: HTMLElement = null;
  documentationElement: HTMLElement = null;
  editorService: RemoteEditorService;
  editorElements: Array<HTMLElement> = [];
  cursorOutsideTooltip: boolean = true;

  constructor(editorService: RemoteEditorService) {
    this.editorService = editorService;
  };

  subscribe(subscriptions: CompositeDisposable) {
    subscriptions.add(atom.workspace.observePanes((pane: AtomCore.IPane) => {
      this.update();
      subscriptions.add(pane.onDidChangeActiveItem(() => {
        this.update();
      }));
    }));
  };

  update() {
    this.removeTooltip();
    this.textEditor = atom.workspace.getActiveTextEditor();
    this.addMouseEventListener();
  }

  addMouseEventListener() {
    const textEditorElement = atom.views.getView(this.textEditor);
    if (!textEditorElement) {
      return;
    }
    if (this.editorElements.indexOf(textEditorElement) > -1) {
      return;
    }
    this.editorElements.push(textEditorElement);
    let timer: number;
    textEditorElement.addEventListener('mousemove', (event: MouseEvent) => {
      window.clearTimeout(timer);
      if (this.cursorOutsideTooltip) {
        this.removeTooltip();
        timer = window.setTimeout(() => this.calculatePositions(event, textEditorElement), 100);
      }
    });
  };

  calculatePositions(event: MouseEvent, textEditorElement: any) {
    // The text editor could have been closed before the timeout was fired
    if (!textEditorElement || !textEditorElement.component) {
      return;
    }
    const reportedCursorPosition = textEditorElement.component.screenPositionForMouseEvent(event);
    const currentCursorPixelPosition = textEditorElement.component.pixelPositionForMouseEvent(event);
    const expectedPixelPosition = textEditorElement.pixelPositionForScreenPosition(reportedCursorPosition);

    const nearColumn = Math.abs(currentCursorPixelPosition.left - expectedPixelPosition.left) < 20;
    const nearRow = Math.abs(currentCursorPixelPosition.top - expectedPixelPosition.top) < 20;

    if (nearColumn && nearRow) {
      this.updateTooltip(this.textEditor.bufferPositionForScreenPosition(reportedCursorPosition));
    }
  }

  async updateTooltip(point: {row: number, column: number}) {
    this.removeTooltip();

    if (!(this.editorService && this.textEditor)) {
      return;
    }
    const relativePath: string =
      atom.project['relativizePath'](this.textEditor.getPath())[1];
    let documentation: string;
    try {
      documentation = await this.editorService.getDocumentationAtPosition(relativePath, {line: point.row, column: point.column});
      if (!documentation) {
        return;
      }
    } catch (e) {
      // The analyzer was not able to parse the file
      return;
    }

    const marker = this.textEditor.markBufferRange([point, point]);
    const div = this.getOrCreateTooltipElement();
    this.documentationElement.innerHTML = marked.parse(documentation, {sanitize: true});
    this.textEditor.decorateMarker(marker, {
      type: 'overlay',
      item: div
    });
    this.tooltipMarker = marker;
    this.cursorOutsideTooltip = false;
  };

  getOrCreateTooltipElement(): HTMLElement {
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
        this.cursorOutsideTooltip = true;
      });

      this.tooltipElement = div;
      this.documentationElement = content;
    } else {
      this.tooltipElement.style.display = 'block';
    }
    return this.tooltipElement;
  };

  removeTooltip() {
    if (this.tooltipMarker) {
      this.tooltipMarker.destroy();
      this.tooltipMarker = null;
      this.tooltipElement.style.display = 'none';
    }
  };
}

export default TooltipManager;
