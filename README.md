Unlocks all of the power of the [Polymer Analyzer] in [Atom]. Uses the [atom-languageclient] to talk to the [Polymer Editor Service], and the [atom-ide-ui] to provide the UI.

Features:

 * typeahead completions for imported elements, with documentation
 * typeahead completions for element attributes, with documentation
 * documentation for elements and attributes when hovering over them with your mouse
 * jump to definition for elements and attributes.
   * Via hyperclick. ctrl-click/cmd-click in the HTML, or the
     `hyperclick:confirm-cursor` keybinding.
 * inline errors (squiggle underlines)
    * quick fixes and more complicated edit actions for errors.
      * default keyboard shortcut: `alt-a`, see
        `diagnostics:show-actions-at-position` in keybindings.

## Installation

    apm install atom-ide-ui polymer-ide
    # Run the "Window: reload" command in atom (or restart it).

**Important Note**: If you're upgrading from a previous version, double check to be sure that you've installed `atom-ide-ui`.

### Try it out on a simple example project

    git clone https://github.com/Polymer/atom-plugin
    cd atom-plugin/example_project
    bower install
    atom ./

### Contributing

    git clone https://github.com/Polymer/atom-plugin
    cd atom-plugin/
    yarn
    # Register this package only for development
    apm link -d
    # Run Atom in development mode
    atom -d .

The functionality of this plugin lives in the [Polymer Editor Service], so most changes you'll want to make will be there, so it's advisable to link in a local copy of it during development:

    cd folder/of/editor/service
    yarn link
    cd folder/of/atom-plugin
    yarn link polymer-editor-service


[Polymer Analyzer]: https://github.com/Polymer/polymer-analyzer
[Atom]: https://atom.io/
[Polymer Editor Service]: https://github.com/Polymer/polymer-editor-service
[atom-languageclient]: https://github.com/atom/atom-languageclient
[atom-ide-ui]: https://github.com/facebook-atom/atom-ide-ui
