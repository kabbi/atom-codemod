'use babel';

import { findFiles } from './Files';
import { getCodemodPaths } from './Project';

export const fetchTransformList = async () => {
  const paths = await getCodemodPaths();
  const transformFiles = await Promise.all(paths.map(path => (
    findFiles(path, '**/*.js')
  )));
  return [].concat(...transformFiles);
};
