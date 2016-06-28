require('babel-register');
const commands = require('./commands');

process.on('uncaughtException', error => {
  process.send({
    type: 'status',
    status: 'stopped',
    reason: 'uncaughtException',
    error,
  });
});

process.on('message', message => {
  const { requestId, command } = message;
  const executor = commands[command];
  if (!executor) {
    process.send({
      type: 'status',
      status: 'unknownCommand',
      message,
    });
    return;
  }
  executor(message).then(result => {
    process.send({
      type: 'rpc',
      requestId,
      result,
    });
  }, error => {
    process.send({
      type: 'rpc',
      requestId,
      error: {
        name: error.name,
        mesage: error.message,
        stack: error.stack,
        fields: error,
      },
    });
  });
});

process.send({
  type: 'status',
  status: 'started',
});
