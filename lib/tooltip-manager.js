'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
import { CompositeDisposable, Disposable } from 'atom';
import * as marked from 'marked';
class TooltipManager extends Disposable {
    constructor(editorService) {
        super(null);
        this.tooltipElement = null;
        this.documentationElement = null;
        this.editorElements = [];
        this.editorService = editorService;
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(atom.workspace.observePanes((pane) => {
            this.update();
            this.subscriptions.add(pane.onDidChangeActiveItem(() => {
                this.update();
            }));
        }));
    }
    ;
    update() {
        this.removeTooltip();
        if (this.removeMouseMoveListener) {
            this.removeMouseMoveListener();
        }
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
        let timer;
        if (this.removeMouseMoveListener) {
            this.removeMouseMoveListener();
        }
        const mouseMoveListener = (event) => {
            window.clearTimeout(timer);
            if (this.tooltipMarker
                && (this.oldCursorsPosition.y - event.y > 25
                    || this.oldCursorsPosition.x - event.x > 25
                    || (this.oldCursorsPosition.x - event.x < -40
                        && this.oldCursorsPosition.y - event.y > -40))) {
                this.removeTooltip();
            }
            if (!this.tooltipMarker) {
                timer = window.setTimeout(() => this.calculatePositions(event, textEditorElement), 100);
            }
        };
        textEditorElement.addEventListener('mousemove', mouseMoveListener);
        this.removeMouseMoveListener = () => textEditorElement.removeEventListener('mousemove', mouseMoveListener);
    }
    ;
    calculatePositions(event, textEditorElement) {
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
            this.oldCursorsPosition = { x: event.x, y: event.y };
        }
    }
    updateTooltip(point) {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeTooltip();
            if (!(this.editorService && this.textEditor)) {
                return;
            }
            const relativePath = atom.project.relativizePath(this.textEditor.getPath())[1];
            let documentation;
            try {
                documentation = yield this.editorService.getDocumentationAtPosition(relativePath, { line: point.row, column: point.column });
                if (!documentation) {
                    return;
                }
            }
            catch (e) {
                // The analyzer was not able to parse the file
                return;
            }
            const marker = this.textEditor.markBufferRange([point, point]);
            const div = this.getOrCreateTooltipElement();
            this.documentationElement.innerHTML = marked.parse(documentation, { sanitize: true });
            this.textEditor.decorateMarker(marker, {
                type: 'overlay',
                item: div
            });
            this.tooltipMarker = marker;
        });
    }
    ;
    getOrCreateTooltipElement() {
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
        }
        else {
            this.tooltipElement.style.display = 'block';
        }
        return this.tooltipElement;
    }
    ;
    removeTooltip() {
        if (this.tooltipMarker) {
            this.tooltipMarker.destroy();
            this.tooltipMarker = null;
            this.tooltipElement.style.display = 'none';
        }
    }
    ;
    dispose() {
        this.removeTooltip();
        this.subscriptions.dispose();
    }
}
export default TooltipManager;
//# sourceMappingURL=tooltip-manager.js.map