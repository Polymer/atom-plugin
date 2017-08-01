<!-- ## Unreleased -->

<!-- New PRs should document their user-visible changes here, in the Unreleased section. -->

## 0.4.0 - 2017-08-01 - New Annotations, Improved Inheritance

* Added autcompletion for attribute values based on property information.
* Updated to the latest version of the analyzer, includes many bug fixes and improvements, including:
  * Added support for recognizing instance properties in constructors.
    * The properties must be annotated with a jsdoc tag to be recognized.
    * Specific handling of the following tags is supported:
      * `@public`, `@private`, `@protected`, `@type`, and `@const`
      * The description can be combined with a visibility or type annotation. e.g.
        * `/** @type {number} How many bacon wrapped waffles to eat. */`
  * Added support for new JSDoc tags: @customElement, @polymer, @mixinFunction, @appliesMixin
  * Fixed a bug where we were too aggressive in associating HTML comments with
    nodes, such that any comment that came before a `<script>` tag e.g. could
    become part of the description of the element defined therein.
  * Simplify rules for infering privacy. Now all features: classes, elements, properties, methods, etc have one set of rules for inferring privacy. Explicit js doc annotations are respected, otherwise `__foo` and `foo_` are private, `_foo` is protected, and `foo` is public.
  * Mix mixins into mixins.
  * Improved modeling of inheritance:
    * overriding inherited members now works correctly
    * overriding a private member produces a Warning

## 0.3.0 - 2017-03-20 - Linter and Polymer 2.0

* Get many new kinds of warnings from [the new linter](https://github.com/Polymer/polymer-linter) when you have a polymer.json file that configures lint rules.
* Many fixes and updates for Polymer 2.0

## 0.2.2 - 2016-11-21 - Slots in autocompletions

### Changed

* Element autocompletions will now have a smart tabbing order snippet depending on shadow dom slots.

## 0.2.1 - 2016-11-14 - Cursor positioning in autocompletions

### Changed

* Autocompletions will now have a smart tabbing order snippet depending on properties. #1

## 0.2.0 - 2016-11-11 - Tooltips and Markdown

### Added
* Added support for documentation tooltips when you hover your mouse over a custom element or attribute!
* Display markdown in descriptions for autocompletion results. #10

### Fixed
* Fix an issue with the lifecycles of certain internal objects. #16

## 0.1.3 - 2016-10-17 - Improved documentation
* Improved documentation

## 0.1.2 - 2016-10-17 - First working version!
* Features linting through `linter` and autocompletions through Atom's built-in autocompletions plugin.

## 0.1.1 - 2016-10-17 - Also, differently totally broken
* `apm` is not like `npm`

## 0.1.0 - 2016-10-17 - Totally broken
* `apm` is not like `npm`
