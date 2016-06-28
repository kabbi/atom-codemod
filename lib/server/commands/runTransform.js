const jscodeshift = require('jscodeshift');

module.exports = ({ options }) => new Promise((resolve, reject) => {
  const { targetPath, transformPath, trasnformOptions = {}, code } = options;
  try {
    // TODO: default or no default?
    const transform = require(transformPath).default;
    const result = (transform.default || transform)({
      path: targetPath,
      source: code,
    }, {
      jscodeshift,
    }, trasnformOptions);
    resolve(result);
  } catch (error) {
    reject(error);
  }
});
