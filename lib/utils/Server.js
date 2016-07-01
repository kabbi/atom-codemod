'use babel';

import cp from 'child_process';
import promisify from 'es6-promisify';

import { joinPath } from './Files';
import { randomId } from './Random';

export const startServer = () => {
  console.log('starting server');
  const serverProcess = cp.fork(joinPath(__dirname, '..', 'server', 'index.js'), {
    execPath: 'node',
    silent: true,
  });
  // TODO: forward logs to nuclide console
  serverProcess.stdout.on('data', () => {
    // Do something with data
  });
  serverProcess.stderr.on('data', () => {
    // Do something with data
  });
  const pendingRequests = {};
  serverProcess.on('message', message => {
    console.log('got messag', message);
    const { requestId, result, error } = message;
    if (!requestId || !pendingRequests[requestId]) {
      return;
    }
    const { resolve, reject } = pendingRequests[requestId];
    delete pendingRequests[requestId];
    if (result) {
      resolve(result);
    } else {
      reject(error);
    }
  });
  const send = promisify(serverProcess.send, serverProcess);

  return {
    process: serverProcess,

    async runTransform(options) {
      const requestId = randomId();
      await send({
        command: 'runTransform',
        requestId,
        options,
      });
      // TODO: implement request timeout
      return new Promise((resolve, reject) => {
        pendingRequests[requestId] = {
          resolve,
          reject,
        };
      });
    },
  };
};

// TODO: refactor to be a method on a server object
export const killServer = server => {
  server.process.kill();
};
