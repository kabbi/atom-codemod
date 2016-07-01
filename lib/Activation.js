'use babel';

// eslint-disable-next-line import/no-unresolved
import { CompositeDisposable } from 'atom';

import Rx from 'rxjs';

import CodemodListView from './views/CodemodListView';
import { fetchTransformList } from './utils/Discovery';
import { splitFilePath } from './utils/Files';
import { startServer, killServer } from './utils/Server';
import { runExternalTransform } from './utils/Transforms';

export class Activation {
  server = null;
  subscriptions = null;
  output$ = null;

  constructor() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codemod:restart-server': () => this.restartServer(),
    }));
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'codemod:apply-to-file': () => this.showCodemodList(::this.applyToFile),
      'codemod:apply-to-selection': () => this.showCodemodList(::this.applyToSelection),
    }));
    this.server = startServer();
  }

  dispose() {
    this.subscriptions.dispose();
    killServer(this.server);
  }

  consumeOutputService(api) {
    return api.registerOutputProvider({
      id: 'jscodeshift',
      messages: Rx.Observable.create(observer => {
        this.output$ = observer;
      }),
    });
  }

  restartServer() {
    killServer(this.server);
    this.server = startServer();
  }

  async showCodemodList(onItemSelected) {
    try {
      const transformFiles = await fetchTransformList();
      const transforms = transformFiles.map(filePath => {
        const [ path, file ] = splitFilePath(filePath);
        return {
          displayName: file,
          filePath,
          file,
          path,
        };
      });
      const availableCodemodsView = new CodemodListView(transforms, item => {
        onItemSelected(item);
        availableCodemodsView.cancel();
      });
    } catch (error) {
      atom.notifications.addError('Sorry, something has failed', {
        dismissable: true,
        detail: error.message,
      });
    }
  }

  applyToFile(transform) {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      atom.notifications.addWarning('No file opened', {
        dismissable: true,
        detail: 'You dont\'t have any file focused',
      });
      return;
    }
    runExternalTransform(transform.filePath, editor.getPath(), this.output$);
  }

  applyToSelection(transform) {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      atom.notifications.addWarning('No file opened', {
        dismissable: true,
        detail: 'You dont\'t have any file focused',
      });
      return;
    }
    if (!editor.getSelectedText()) {
      atom.notifications.addWarning('No text selected', {
        dismissable: true,
        detail: 'You don\'t have any text selected',
      });
      return;
    }
    editor.mutateSelectedText(async selection => {
      try {
        const code = await this.server.runTransform({
          targetPath: editor.getPath(),
          transformPath: transform.filePath,
          code: selection.getText(),
        });
        if (!code) {
          return;
        }
        selection.insertText(code);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Transform failed', error);
        atom.notifications.addError('Something failed', {
          detail: `We had an error running your transform: ${error.message}`,
          dismissable: true,
        });
      }
    });
  }
}

export default Activation;
