'use babel';

export type AtomPolymerViewState = void;

export class AtomPolymerView {
  element: HTMLDivElement;

  constructor(_serializedState: void) {
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
  serialize(): AtomPolymerViewState {
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }
}
