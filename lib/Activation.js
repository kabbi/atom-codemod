'use babel';

// eslint-disable-next-line import/no-unresolved
import { BufferedNodeProcess, CompositeDisposable } from 'atom';

import Rx from 'rxjs';

import CodemodListView from './views/CodemodListView';
import { fetchTransformList } from './utils/Discovery';
import { joinPath, splitFilePath } from './utils/Files';
import { startServer, killServer } from './utils/Server';

export class Activation {
  server = null;
  subscriptions = null;
  output$ = null;

  constructor() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codemod:apply-to-file': () => this.showCodemodList(::this.applyToFile),
      'codemod:apply-to-selection': () => this.showCodemodList(::this.applyToSelection),
      'codemod:restart-server': () => this.restartServer(),
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
    if (!atom.workspace.getActiveTextEditor()) {
      atom.notifications.addWarning('No file opened', {
        dismissable: true,
        detail: 'You dont\'t have any file focused',
      });
      return;
    }
    this.runTransform(transform);
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
    editor.mutateSelectedText(selection => {
      this.server.runTransform({
        targetPath: editor.getPath(),
        transformPath: transform.filePath,
        code: selection.getText(),
      }).then(code => {
        if (!code) {
          return;
        }
        selection.insertText(code);
      });
    });
  }

  runTransform(transform) {
    const jscodeshift = joinPath(
      __dirname,
      '..',
      'node_modules',
      '.bin',
      'jscodeshift'
    );

    // eslint-disable-next-line no-new
    new BufferedNodeProcess({
      command: jscodeshift,
      args: [
        '-t',
        transform.filePath,
        atom.workspace.getActiveTextEditor().getPath(),
      ],
      stdout: output => {
        this.output$.next({
          text: output,
          level: 'log',
        });
      },
      stderr: output => {
        this.output$.next({
          text: output,
          level: 'error',
        });
      },
      exit: returnCode => {
        this.output$.next({
          text: `Process exited with code ${returnCode}`,
          level: 'info',
        });
      },
    });

    atom.commands.dispatch(
      atom.views.getView(atom.workspace),
      'nuclide-console:show'
    );
  }
}

export default Activation;
