define(['exports', './utils'], function (exports, _utils) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	var jetpack = require('fs-jetpack');
	var spawn = require('child_process').spawn;
	var Q = require('q');
	var EventEmitter = require('events');
	var util = require('util');
	var gui = require('nw.gui');
	var win = gui.Window.get();

	var io = require('socket.io-client');
	var http = require('http');
	var chokidar = require('chokidar');

	/**
  * Creates an instance of the Cascade Gulp compiler wrapper.
  * @constructor
  * @param {string} path - The path to the Cascade Gulp compiler.
  * @param {function} cb - Callback to run after compiler wrapper has been setup.
  */
	var Cascade = function Cascade(path, cb) {

		var self = this;
		var app = global.app;
		self.path = path;

		var gulpProcess;

		self.trigger = function (eventName, eventData, messageHandler) {
			self.emit(eventName, eventData);
			app.message.send(eventName, eventData, messageHandler);
		};

		self.get = function (type, callback) {
			var settings = jetpack.read(self.path + '/package.json', 'json')['specless-cascade'];
			var event = {
				message: "The 'get' function was called.",
				data: { key: type }
			};
			self.trigger('get');
			if (type === 'settings') {
				if (callback) {
					callback(settings);
				}
				return settings;
			} else if (type === undefined) {
				if (callback) {
					callback(self);
				}
				event.data.key = 'self';
				return self;
			} else {
				if (callback) {
					callback(settings[type]);
				}
				return settings[type];
			}
			self.trigger('get', event);
		};

		self.set = function (key, value, callback) {
			var packageJson = jetpack.read(self.path + '/package.json', 'json');
			var settings = packageJson['specless-cascade'];
			settings[key] = value;
			jetpack.write(self.path + '/package.json', packageJson);
			var event = {
				message: "The 'set' function was called.",
				data: { key: key, value: value }
			};
			if (callback) {
				callback(settings[key]);
			}
			self.trigger('set', event);
			return settings[key];
		};

		self._run = function (task, callback, args) {
			var event = {
				message: "Starting run command for task '" + task + "'."
			};
			self.trigger('run:start', event);
			var command = ['./node_modules/gulp/bin/gulp.js', task];
			if (args) {
				command = command.concat(args);
			}
			var deferred = Q.defer();
			var process = spawn(app.get('settings').node, command, { cwd: self.path });
			app.message.logStream(process);

			process.on('close', function (exitCode) {
				var success;
				if (exitCode === 0) {
					success = true;
					if (callback) {
						callback(success);
					}
					event.message = "The run command '" + task + "' completed without errors.";
					self.trigger('run:end', event);
					deferred.resolve();
				} else {
					success = false;
					if (callback) {
						callback(success);
					}
					event.message = "The run command '" + task + "' failed to complete.";
					event.error = "The process ended with an exit code of '" + exitCode + "'.";
					event.data = { exitCode: exitCode };
					self.trigger('run:end', event);
					deferred.reject();
				}
			});
			return deferred.promise;
		};

		self.start = function (projPath, callback) {
			self.messageListener = new MessageListener();
			var settings = self.get('settings');
			self._run('set-project', function (success) {
				if (success === true) {
					self.socket = io('http://localhost:' + settings.serverPort);
					//utils.handleMessage("Project validated.", 0);
					self.trigger('validated', {
						message: 'Project validated.'
					}, 0);
					self.trigger('directory', {
						message: 'New Project Directory Set.'
					});

					if (gulpProcess && gulpProcess.killed === false) {
						self.stop();
					}
					http.get({
						hostname: 'localhost',
						port: settings.serverPort,
						path: '/killme',
						agent: false
					}).on('error', function (error) {
						self.trigger('noserver', {
							message: "No server currently running on port " + settings.serverPort + ". Proceed with starting server.",
							error: error
						}, 2);
						//utils.handleMessage("No server currently running on port " + settings.serverPort + ". Proceed with starting server.", 0);
					}).end();
					gulpProcess = spawn(app.get('settings').node, ['./node_modules/gulp/bin/gulp.js', 'start'], { cwd: self.path, detached: true });
					self.socket.on('file change', function (data) {
						app.project.trigger('file:change', {
							message: 'File Changed',
							data: data
						});
					});
					self.socket.on('connect', function (data) {
						self.trigger('socket:connection', {
							message: "Connected via websockets to Cascade compiler.",
							data: data
						}, 2);
						//utils.handleMessage("Connected via websockets to Cascade compiler.", 0);
					});
					self.socket.on('error', function (data) {
						self.trigger('socket:error', {
							message: "Error connecting to sockets server.",
							data: data
						}, 2);
						//utils.handleMessage("Websockets server not ready yet.", 0);
					});
					var once = false;
					gulpProcess.stdout.on('data', function (data) {
						if (once === false) {
							self.trigger('compiler:data', {
								message: "Cascade compiler starting.",
								data: data
							}, 2);
							//utils.handleMessage("Cascade compiler starting.", 2);
							if (callback) {
								callback('started');
								self.trigger('start');
							}
						}
						once = true;
					});
					gulpProcess.on('exit', function (exitCode) {
						if (callback) {
							callback('exited', exitCode);
							if (exitCode > 0) {
								var event = {
									message: "Cascade compiler exited unexpectedly.",
									error: "Gulp Process exited.",
									data: { exitCode: exitCode }
								};
								self.trigger('exit', event, 3);
								//utils.handleMessage(event.message, 3);
							} else {
									var event = {
										message: "Cascade compiler exited."
									};
									self.trigger('exit', event, 2);
									//utils.handleMessage(event.message, 2);
								}
						}
					});
					app.message.logStream(gulpProcess);
					self.process = gulpProcess;
					return gulpProcess;
				} else {
					var event = {
						message: "The project at '" + projPath + "' is not a valid Cascade project."
					};
					self.trigger('invalidProject', event, 2);
					//utils.handleMessage(event.message, 2);
					if (callback) {
						callback('failed');
					}
					return false;
				}
			}, ['--path=' + projPath]);
		};

		self.stop = function (callback) {
			var settings = jetpack.read(self.path + '/package.json', 'json')['specless-cascade'];

			if (self.messageListener) {
				self.messageListener.kill();
			}
			if (self.socket) {
				self.socket.close();
				self.socket.destroy();
			}
			http.get({
				hostname: 'localhost',
				port: settings.serverPort,
				path: '/killme',
				agent: false
			}).on('error', function (error) {
				self.trigger('noserver', {
					message: "No server currently running on port " + settings.serverPort + ".",
					error: error
				}, 2);
				//utils.handleMessage("No server currently running on port " + settings.serverPort + ".", 0);
			}).end();

			if (gulpProcess && gulpProcess.killed === false) {
				try {
					process.kill(-gulpProcess.pid);
				} catch (error) {
					self.trigger('noserver', {
						message: "Cannot stop project. May already be stopped."
					}, 2);
					//utils.handleMessage("Cannot stop project. May already be stopped.", 0);
				}
				var event = {
					message: "Compiler stopped."
				};
				self.trigger('stop', event, 2);
				//utils.handleMessage(event.message, 0);
				if (callback) {
					callback(true);
				}
			} else {
				var event = {
					message: "Cannot stop compiler. May already be stopped.",
					error: "Error stopping compiler."
				};
				self.trigger('stop', event, 2);
				//utils.handleMessage(event.message, 0);
				if (callback) {
					callback(false);
				}
			}
			return gulpProcess;
		};

		self.create = function (path, name, callback) {
			self._run('new', callback, ['--path=' + path, '--name=' + name]);
		};

		self.publish = function (callback) {
			self._run('publish', function (success) {
				var event = {};
				if (success === true) {
					if (callback) {
						callback(success);
					}
					event.message = "Publish command successful.";
					self.trigger('publish', event);
				} else if (success === false) {
					if (callback) {
						callback(success);
					}
					event.message = "Publish command failed.";
					event.error = "Unknown error.";
					self.trigger('publish', event);
				}
			});
		};

		var MessageListener = function MessageListener() {
			var me = this;
			var messageLog = self.path + '/message-log.json';
			jetpack.write(messageLog, '[]');
			me.log = [];

			me.watching = chokidar.watch(messageLog, { persistent: true, usePolling: true, interval: 250 });
			me.watching.on('change', function (logPath) {
				var prevCount = me.log.length;
				me.log = jetpack.read(messageLog, 'json');
				var newCount = me.log.length;
				for (var i = 0; i < me.log.length; i++) {
					if (i >= prevCount) {
						var message = me.log[i];
						self.trigger('message', {
							message: message.message,
							error: message.details
						}, message.code);
						//utils.handleMessage(message.message, message.code, message.details);
					}
				}
			});

			me.kill = function () {
				me.watching.close();
			};
		};

		self._init = function (callback) {
			var appSettings = jetpack.read('./package.json', 'json')['specless-cascade'];
			try {
				var cascadeSettings = jetpack.read(self.path + '/package.json', 'json')['specless-cascade'];
				var version = cascadeSettings.version;
			} catch (error) {
				self.trigger('init:error', {
					message: "Not a valid Cascade compiler located at '" + self.path + "'. Using built-in Cascade compiler instead.",
					error: error
				}, 0);
				//utils.handleMessage("Not a valid Cascade compiler", 0);
				//console.warn("Not a valid Cascade compiler located at '" + self.path + "'. Using built-in Cascade compiler instead.")
				self.path = appSettings.appPath + appSettings.gulpPath;
				app.set('useAltGulpPath', false);
				var version = jetpack.read(self.path + '/package.json', 'json').version;
			}
			win.on('closed', function () {
				self.stop();
			});
			self.set('path', self.path);
			self.set('version', version);
			self.set('serverPort', appSettings.serverPort);
			self.set('autoReload', appSettings.autoReload);
			self.set('userPluginsFolder', appSettings.userPluginsFolder);
			self.trigger('init', {
				message: "Compiler initialized successfully."
			}, 0);
			if (callback) {
				callback();
			}
		};

		self._init(cb);
	};

	exports.Cascade = Cascade;
	util.inherits(Cascade, EventEmitter);
});
//# sourceMappingURL=cascade.js.map
