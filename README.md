# atom-polymer

Unlocks all of the power of the [Polymer Analyzer](https://github.com/Polymer/polymer-analyzer) in your editor. See the [Polymer Editor Service](https://github.com/Polymer/polymer-editor-service) for more info, including links to other editor plugins.

Features:

 * typeahead completions for imported elements, with documentation
 * typeahead completions for element attributes, with documentation
 * inline errors (squiggle underlines)
 * (coming soon!) jump to definition support for custom elements and attributes

## Installation

When atom-polymer is released it will be a one step install from the atom package manager. While it's in private dogfooding you'll need to clone it and install it manually.

    git clone git@github.com:Polymer/atom-plugin.git
    cd atom-plugin
    npm install
    apm install linter # optional, for red squiggles under errors
    apm link ./
    # Run the "Window: reload" command in atom (or restart it).

### Updating

    cd atom-plugin
    git pull origin master
    rm -rf node_modules # lol
    npm install
    # Run the "Window: reload" command in atom (or restart it).

### Try it out on a simple example project

    cd atom-plugin/example_project
    bower install
    atom ./