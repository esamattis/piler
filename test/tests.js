'use strict';

var
  cp = require('child_process'),
  path = require('path'),
  env = process.env,
  cwd = path.join('.', 'test', 'testapp'),
  app = [
    path.join('..', '..', 'node_modules', 'coffee-script', 'bin', 'coffee'),
    'app.coffee'
  ];

env.NODE_ENV = 'development';

var development = cp.spawn('node', app, {
  cwd  : cwd,
  env  : env,
  stdio: 'inherit'
});

env.NODE_ENV = 'production';

var production = cp.spawn('node', app, {
  cwd  : cwd,
  env  : env,
  stdio: 'inherit'
});

if (production && development) {
  // launch tests on loaded apps
  if (process.argv.indexOf('--start') === -1) {
    var mocha = cp.spawn('node', [path.join('.', 'node_modules', 'mocha', 'bin', '_mocha')], {
      cwd  : process.cwd(),
      env  : process.env,
      stdio: 'inherit'
    });

    mocha.on('close', function (code){
      production.kill();
      development.kill();
      process.exit(code);
    });
  } else {
    setTimeout(function (){
      production.kill();
      development.kill();
      process.exit(0);
    }, 15000);
  }
} else {
  process.exit(1);
}
