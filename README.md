# atom-polymer

Unlocks all of the power of the [Polymer Analyzer](https://github.com/Polymer/polymer-analyzer) in your editor.

Features:

 * typeahead completions for imported elements, with documentation
 * typeahead completions for element attributes, with documentation
 * inline errors (squiggle underlines)
 * (coming soon!) jump to definition support for custom elements and attributes

## Installation

    git clone git@github.com:Polymer/atom-plugin.git
    cd atom-plugin
    npm install
    apm link ./
    # Run the "Window: reload" command in atom (or restart it).

### Updating

    cd atom-plugin
    git pull origin master
    rm -rf node_modules # lol
    npm install
    # Run the "Window: reload" command in atom (or restart it).
