'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import MouseMoveListener from './mouse-move-listener';
class DefinitionFinder extends MouseMoveListener {
    beforeUpdate() {
        if (this.removeMouseMoveListener) {
            this.removeMouseMoveListener();
        }
    }
    ;
    obtainMouseMoveListener(textEditorElement) {
        this.attachMouseDownListener(textEditorElement);
        return (event) => __awaiter(this, void 0, void 0, function* () {
            const screenPosition = textEditorElement.component.screenPositionForMouseEvent(event);
            const point = this.textEditor.bufferPositionForScreenPosition(screenPosition);
            const relativePath = atom.project.relativizePath(this.textEditor.getPath())[1];
            try {
                this.sourcePosition = yield this.editorService.getDefinitionForFeatureAtPosition(relativePath, { line: point.row, column: point.column });
            }
            catch (e) {
                return;
            }
        });
    }
    ;
    attachMouseDownListener(textEditorElement) {
        console.log(textEditorElement);
        const mouseDownListener = this.mouseDownListener.bind(this);
        textEditorElement.addEventListener('mousedown', mouseDownListener);
        this.removeMouseMoveListener = () => textEditorElement.removeEventListener('mousedown', mouseDownListener);
    }
    ;
    mouseDownListener(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.sourcePosition && event.ctrlKey) {
                atom.workspace.open(this.sourcePosition.file, {
                    initialLine: this.sourcePosition.start.line,
                    initialColumn: this.sourcePosition.start.column
                });
            }
        });
    }
}
export default DefinitionFinder;
//# sourceMappingURL=definition-finder.js.map