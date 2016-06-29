export default (file, { jscodeshift: j }) => (
  j(file.source)
    .find(j.Node)
    .replaceWith(({ node }) => {
      if (!node.comments) {
        return node;
      }
      node.comments = node.comments.filter(comment => (
        !comment.value.trim().startsWith('eslint')
      ));
      return node;
    })
    .toSource()
);
