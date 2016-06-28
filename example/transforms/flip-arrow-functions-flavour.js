export default (file, { jscodeshift: j }) => (
  j(file.source)
    .find(j.ArrowFunctionExpression)
    .forEach(path => {
      if (path.node.expression) {
        path.node.expression = false;
        path.get('body').replace(j.blockStatement([
          j.returnStatement(path.get('body').node),
        ]));
      } else {
        path.node.expression = true;
        path.get('body').replace(
          path.get('body', 'body', 0, 'argument').node
        );
      }
    })
    .toSource()
);
