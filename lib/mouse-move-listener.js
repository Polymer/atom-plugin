'use babel';
/// <reference path="../custom_typings/atom.d.ts" />
import { CompositeDisposable, Disposable } from 'atom';
class MouseMoveListener extends Disposable {
    constructor(editorService) {
        super(null);
        this.editorElements = [];
        this.subscriptions = new CompositeDisposable();
        this.editorService = editorService;
        this.subscriptions.add(atom.workspace.observePanes((pane) => {
            this.update();
            this.subscriptions.add(pane.onDidChangeActiveItem(() => {
                this.update();
            }));
        }));
    }
    ;
    update() {
        this.beforeUpdate();
        if (this.removeMouseMoveListener) {
            this.removeMouseMoveListener();
        }
        this.textEditor = atom.workspace.getActiveTextEditor();
        this.addMouseEventListener();
    }
    ;
    addMouseEventListener() {
        const textEditorElement = atom.views.getView(this.textEditor);
        if (!textEditorElement) {
            return;
        }
        if (this.editorElements.indexOf(textEditorElement) > -1) {
            return;
        }
        this.editorElements.push(textEditorElement);
        if (this.removeMouseMoveListener) {
            this.removeMouseMoveListener();
        }
        const mouseMoveListener = this.obtainMouseMoveListener(textEditorElement);
        textEditorElement.addEventListener('mousemove', mouseMoveListener);
        this.removeMouseMoveListener = () => textEditorElement.removeEventListener('mousemove', mouseMoveListener);
    }
    ;
}
export default MouseMoveListener;
//# sourceMappingURL=mouse-move-listener.js.map