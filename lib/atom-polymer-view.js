'use babel';
export class AtomPolymerView {
    constructor(_serializedState) {
        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('atom-polymer');
        // Create message element
        const message = document.createElement('div');
        message.textContent = 'The AtomPolymer package is running from ts!';
        message.classList.add('message');
        this.element.appendChild(message);
    }
    // Returns an object that can be retrieved when package is activated
    serialize() {
    }
    // Tear down any state and detach
    destroy() {
        this.element.remove();
    }
    getElement() {
        return this.element;
    }
}
//# sourceMappingURL=atom-polymer-view.js.map