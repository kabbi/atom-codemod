'use babel';

let activation = null;

export const activate = state => {
  if (activation == null) {
    const { Activation } = require('./Activation');
    activation = new Activation(state);
  }
};

export const deactivate = () => {
  if (activation != null) {
    activation.dispose();
    activation = null;
  }
};

export const consumeOutputService = api => {
  activation.consumeOutputService(api);
};
