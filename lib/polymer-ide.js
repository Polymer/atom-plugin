/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const {AutoLanguageClient, Convert} = require('atom-languageclient');

class PolymerLanguageClient extends AutoLanguageClient {
  /**
   * =========================================================
   * Static metadata about this plugin.
   * =========================================================
   */
  getGrammarScopes() {
    return [
      'source.html',
      'source.js',
      'source.css',
      'text.html.basic',
      'source.json'
    ];
  }
  getLanguageName() {
    return 'Web';
  }
  getServerName() {
    return 'polymer-ide';
  }
  startServerProcess() {
    return this.spawnChildNode([require.resolve(
        'polymer-editor-service/lib/polymer-language-server.js')]);
  }

  get config() {
    return {
      analyzeWholePackage: {
        title: 'Analyze Whole Package',
        description: `
            When true, warnings will be reported for all files, not just those
            that are open. Warnings will be more accurate but the initial
            analysis will be slower.
        `,
        type: 'boolean',
        default: false
      },
      /*
      Disabled, as this will do nothing until willSaveWaitUntil is supported.
      See: https://github.com/Polymer/atom-plugin/issues/68
      Note that the client capability in initializeParams may also need to be
      updated with the willSaveWaitUntil capability too.

      fixOnSave: {
        title: 'Fix on save',
        description: `
            When true, fixes all (fixable) warnings in the document when you
            save.
        `,
        type: 'boolean',
        default: false
      }
      */
    }
  }


  /**
   * =========================================================
   * Defining synchronizing configuration with the server.
   * =========================================================
   */
  postInitialization(server) {
    super.postInitialization(server);
    const connection = server.connection;
    const sendLatestConfig = () => {
      connection.didChangeConfiguration({settings: this.getLatestConfig()});
    };
    for (const key of Object.keys(this.config)) {
      atom.config.observe(`polymer-ide.${key}`, sendLatestConfig);
    }
    sendLatestConfig();
  }
  getLatestConfig() {
    const config = {};
    for (const key of Object.keys(this.config)) {
      config[key] = atom.config.get(`polymer-ide.${key}`);
    }
    return {'polymer-ide': config};
  }

  /**
   * =========================================================
   * Communicating the atom-langaugeclient capabilities to the server.
   *
   * Can remove this override once
   * https://github.com/atom/atom-languageclient/issues/150 is resolved.
   * =========================================================
   */
  getInitializeParams(projectPath, process) {
    const initParams = super.getInitializeParams(projectPath, process);
    initParams.capabilities.experimental = {
      'polymer-ide': {
        // atom-languageclient does not filter completions, so the
        // server needs to do it.
        // See: https://github.com/atom/atom-languageclient/issues/150
        doesNotFilterCompletions: true
      }
    };
    return initParams;
  }
}

module.exports = new PolymerLanguageClient();
