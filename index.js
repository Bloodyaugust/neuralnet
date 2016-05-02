var compression = require('compression');
var express = require('express');
var fetch = require('node-fetch');
var app = express();

var distMode = (process.argv[2] === 'dist');
var port = process.env.PORT || 8085;

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
}

app.use(allowCrossDomain);
app.use(compression());
if (distMode) {
  app.use(express.static('public'));
} else {
  app.use(express.static('app'));
}
app.use('/bower_components', express.static('bower_components'));

app.listen(port, function () {
  console.log('Listening on port ' + port + ' in ' + (distMode ? 'dist' : 'dev') + ' mode');
});
