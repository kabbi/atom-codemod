'use babel';

import { joinPath, readFile } from './Files';

export const getActiveProjectPath = () => {
  const activeFilePath = atom.workspace.getActiveTextEditor().getPath();
  const [ projectPath ] = atom.project.relativizePath(activeFilePath);
  return projectPath;
};

export const getCodemodPackages = async projectPath => {
  const meta = JSON.parse(await readFile(projectPath, 'package.json'));
  if (!meta || !meta.atomCodemods || !meta.atomCodemods.packages) {
    return [];
  }
  const { atomCodemods: { packages } } = meta;
  return packages.map(packageName => (
    joinPath('node_modules', packageName)
  ));
};

export const getCodemodPaths = async () => {
  const editor = atom.workspace.getActiveTextEditor();
  // TODO: fetch transforms from all opened projects when no file is opened in atom
  if (!editor || !editor.getPath()) {
    return [];
  }
  const projectPath = getActiveProjectPath();
  return ['transforms'].map(relativePath => joinPath(projectPath, relativePath));
};
