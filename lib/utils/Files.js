'use babel';

import promisify from 'es6-promisify';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

export const joinPath = ::path.join;

export const readFile = (...pathSegments) => (
  promisify(fs.readFile, fs)(path.join(...pathSegments))
);

export const findFiles = (directoryPath, pattern) => (
  promisify(glob)(pattern, {
    cwd: directoryPath,
  }).then(files => (
    files.map(filePath => joinPath(directoryPath, filePath))
  ))
);

export const splitFilePath = filePath => (
  [path.dirname(filePath), path.basename(filePath)]
);
