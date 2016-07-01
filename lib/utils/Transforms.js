'use babel';

// eslint-disable-next-line import/no-unresolved
import { BufferedNodeProcess } from 'atom';

import { joinPath } from './Files';

export const runExternalTransform = (transformPath, targetPath, output$) => {
  const jscodeshift = joinPath(
    __dirname,
    '..',
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
      transformPath,
      targetPath,
    ],
    stdout: output => {
      output$.next({
        text: output,
        level: 'log',
      });
    },
    stderr: output => {
      output$.next({
        text: output,
        level: 'error',
      });
    },
    exit: returnCode => {
      output$.next({
        text: `Process exited with code ${returnCode}`,
        level: 'info',
      });
    },
  });

  atom.commands.dispatch(
    atom.views.getView(atom.workspace),
    'nuclide-console:show'
  );
};
