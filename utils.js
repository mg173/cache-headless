function getds() {
  return (new Date()).toISOString();
}

function makeLog(eventName, ...varsToPrint) {
  const logline = `[${getds()}] ${eventName}` + (varsToPrint?.length ? ` [${varsToPrint.join('|')}]` : '');
  return logline;
}

function log(eventName, ...varsToPrint) {
  const logline = makeLog(eventName, ...varsToPrint);
  console.log(logline);
}

function elog(eventName, ...varsToPrint) {
  const logline = makeLog(eventName, ...varsToPrint);
  console.error(logline);
}

exports.log = log;
exports.elog = elog;
