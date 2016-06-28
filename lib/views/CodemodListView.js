'use babel';

import { SelectListView } from 'atom-space-pen-views';

export class CodemodListView extends SelectListView {
  constructor(items, onSelect) {
    super();

    this.addClass('overlay from-top');
    this.setItems(items);
    this.panel = atom.workspace.addModalPanel({ item: this });
    this.panel.show();
    this.focusFilterEditor();
    this.onSelect = onSelect;
  }

  viewForItem(item) {
    return `<li>${item.displayName}</li>`;
  }

  getFilterKey() {
    return 'displayName';
  }

  getEmptyMessage() {
    return 'No transforms found. Try puting some files in `/transforms` folder ' +
      'in your project or configure this plugin in your `package.json` file.';
  }

  confirmed(item) {
    this.onSelect(item);
  }

  cancelled() {
    this.editor = null;

    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }
  }
}

export default CodemodListView;
