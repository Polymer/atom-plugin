Unlocks all of the power of the [Polymer Analyzer] in [Atom]. See the [Polymer Editor Service] for more info, including links to other editor plugins.

Features:

 * typeahead completions for imported elements, with documentation
 * typeahead completions for element attributes, with documentation
 * inline errors (squiggle underlines)

## Installation

    apm install polymer-ide
    apm install linter # optional, for red squiggles under errors
    # Run the "Window: reload" command in atom (or restart it).

### Try it out on a simple example project

    git clone https://github.com/Polymer/atom-plugin
    cd atom-plugin/example_project
    bower install
    atom ./

[Polymer Analyzer]: https://github.com/Polymer/polymer-analyzer
[Atom]: https://atom.io/
[polymer editor service]: https://github.com/Polymer/polymer-editor-service
