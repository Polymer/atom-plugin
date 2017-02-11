Unlocks all of the power of the [Polymer Analyzer] in [Atom]. See the [Polymer Editor Service] for more info, including links to other editor plugins.

Features:

 * typeahead completions for imported elements, with documentation
 * typeahead completions for element attributes, with documentation
 * inline errors (squiggle underlines)
 * documentation for elements and attributes when hovering over them with your mouse

## Installation

    apm install polymer-ide
    apm install linter # optional, for red squiggles under errors
    # Run the "Window: reload" command in atom (or restart it).

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

It is advisable to link the [Polymer Analyzer] and [Polymer Editor Service] during development:

    cd folder/of/analyzer
    yarn link
    cd folder/of/editor/service
    yarn link
    cd folder/of/atom-plugin
    yarn link polymer-analyzer
    yarn link polymer-editor-service

[Polymer Analyzer]: https://github.com/Polymer/polymer-analyzer
[Atom]: https://atom.io/
[polymer editor service]: https://github.com/Polymer/polymer-editor-service
