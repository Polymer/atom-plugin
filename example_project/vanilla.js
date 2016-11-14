/**
 * Hello from VanillaElement's documentation! **This is a bold statement** asdfasdfasdfasdfasdf
 *
 * ```html
 * <vanilla-elem></vanilla-elem>
 * ```
 *
 * __asdfasdfasdfasdf__
 */
class VanillaElement extends HTMLElement {
  static get observedAttributes() {
    return [
      /** @type {boolean} When given the element is totally inactive */
      'disabled',
      /** @type {boolean} When given the element is expanded */
      'open'
    ];
  }
}

class VanillElementWithoutProperties extends HTMLElement {}

customElements.define('vanilla-elem', VanillaElement);
customElements.define('vanilla-elem-without-properties', VanillElementWithoutProperties);
