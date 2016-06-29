define(['exports', './modules/cascade', './modules/messages', './modules/project', './modules/ui', './modules/utils'], function (exports, _modulesCascade, _modulesMessages, _modulesProject, _modulesUi, _modulesUtils) {
	'use strict';

	var jetpack = require('fs-jetpack');
	var gui = require('nw.gui');
	var fs = require('fs');
	var request = require('request');
	var EventEmitter = require('events');
	var util = require('util');
	global.$ = $;

	var win = gui.Window.get();
	global.win = win;

	var App = function App(settings) {

		var self = this;
		global.app = self;

		self.emit('start', {
			message: "The application is starting."
		});

		self.path = settings.appPath;
		self.window = win;
		self.utils = _modulesUtils.utils;
		self.environment = global.environment;

		var gulpPath;
		var cascade;

		self.trigger = function (eventName, eventData, messageHandler) {
			self.emit(eventName, eventData);
			self.message.send(eventName, eventData, messageHandler);
		};

		self.open = function (path, callback, first) {
			self.trigger('loading:start');
			var defaultProjectDir = gulpPath + cascade.defaultProjectDir;
			self.project = new _modulesProject.Project(path, function (success) {
				if (callback) {
					callback(success);
				}
				if (success === true) {
					self.trigger('open', {
						message: "Project at '" + path + "' opened successfully."
					}, 7);
					self.trigger('loading:end');
				} else {
					self.trigger('open', {
						message: "Project at '" + path + "' failed to open.",
						error: "There was an error initializing the project. Please make sure the folder contains a valid Casade project."
					}, 6);
					self.trigger('loading:end');
				}
			});
		};

		self.close = function (callback) {
			var cascade = self.cascade.get('settings');
			self.cascade.stop(function () {
				self.project = self.open(gulpPath + cascade.defaultProjectDir, function (success) {
					if (callback) {
						callback(success);
					}
					if (success === true) {
						self.trigger('close', {
							message: "Project closed successfully."
						}, 7);
					} else if (success === false) {
						self.trigger('close', {
							message: "Project failed to close.",
							error: "Unknown error."
						}, 8);
					}
				});
			});
		};

		self['new'] = function (path, name, callback) {
			self.project = new _modulesProject.Project(path, function (success) {
				console.log("new:", success);
				if (callback) {
					callback(success);
				}
				if (success === true) {
					self.trigger('new', {
						message: "Project at '" + path + "/" + name + "' created successfully."
					}, 7);
				} else if (success === false) {
					self.trigger('new', {
						message: "Failed to create project at '" + path + "/" + name + "'.",
						error: "Unknown error."
					}, 6);
				}
			}, name);
		};

		self.get = function (type, callback) {
			var event = {
				message: "The 'get' function was called.",
				data: {}
			};
			event.data.key = type;
			if (type === 'project') {
				event.data.value = self.project;
				if (callback) {
					callback(self.project);
				}
				return self.project;
			} else if (type === 'settings') {
				event.data.value = settings;
				if (callback) {
					callback(settings);
				}
				return settings;
			} else if (type === 'cascade') {
				event.data.value = self.cascade;
				if (callback) {
					callback(self.cascade);
				}
				return self.cascade;
			} else if (type === undefined) {
				event.data.value = self;
				event.data.key = 'self';
				if (callback) {
					callback(self);
				}
				return self;
			} else {
				event.data.value = settings[type];
				if (callback) {
					callback(settings[type]);
				}
				return settings[type];
			}
			self.trigger('get', event);
		};

		self.set = function (key, value, callback) {
			var event = {
				message: "The 'set' function was called.",
				data: {}
			};
			settings[key] = value;
			var packageJson = jetpack.read('./package.json', 'json');
			packageJson['specless-cascade'] = settings;
			jetpack.write('./package.json', packageJson);
			if (callback) {
				callback(settings[key]);
			}
			event.data.key = key;
			event.data.value = settings[key];
			self.trigger('set', event);
			return settings[key];
		};

		self.restart = function (hard) {
			var child_process = require("child_process");
			var exec = require('child_process').exec;

			var runNwApp = function runNwApp() {
				var nwPath = _modulesUtils.utils.nwPath();
				exec('sleep 1s\n' + nwPath + ' ' + app.path, { detached: true });
			};
			self.trigger('restart', {
				message: "Application restarting."
			});
			if (global.environment === 'production') {
				var appPath = self.path.split('/');
				appPath.pop();
				appPath.pop();
				appPath.pop();
				var reg = new RegExp(' ', 'g');
				appPath = appPath.join('/').replace(reg, '\\ ');
				exec('sleep 1s\nopen ' + appPath, { detached: true });
				gui.App.quit();
			} else {
				runNwApp();
				gui.App.quit();
			}
		};

		self.update = function (callback) {
			var unzip = require('unzip');
			var githubUser = 'specless';
			var githubRepo = 'cascade-app-source';

			self.trigger('update:start', {
				message: "Checking for updated version."
			});
			_modulesUtils.utils.checkGithub(githubUser, githubRepo, function (fileUrl, err) {
				if (!err) {
					if (fileUrl !== false) {
						_modulesUtils.utils.downloadFile(fileUrl, function (path, file, err) {
							if (!err) {
								var output = path + '/' + file;
								var stream = fs.createReadStream(output).pipe(unzip.Extract({ path: path }));
								stream.on('finish', function () {
									var version = file.replace('.zip', '').replace('v', '');
									var directory = path + '/' + githubRepo + '-' + version;
									_modulesUtils.utils.copyNewAppFiles(directory, self.path, function (err) {
										if (!err) {
											self.trigger('update:end', {
												message: "Copied files, ok to restart."
											}, 7);
										} else {
											self.trigger('update:end', {
												message: "There was an error copying the updated version.",
												error: err
											}, 7);
										}
									});
								});
								stream.on('error', function (err) {
									self.trigger('update:end', {
										message: "There was an error unpacking the updated version.",
										error: err
									}, 7);
								});
							} else {
								self.trigger('update:end', {
									message: "There was an error downloading the latest version.",
									error: err
								}, 7);
							}
						});
					} else {
						self.trigger('update:end', {
							message: "The current version is the latest. No update required."
						}, 7);
					}
				} else {
					self.trigger('update:end', {
						message: "There was an error checking github.",
						error: err
					}, 7);
				}
			});
		};

		self._init = function () {
			self.message = new _modulesMessages.Messages();
			self.set('appPath', settings.appPath);
			self.set('userPluginsFolder', settings.userPluginsFolder);
			if (settings.useAltGulpPath === true && settings.altGulpPath !== null) {
				gulpPath = settings.altGulpPath;
				self.trigger('compiler:ready', {
					message: "Using alternative Cascade compiler located at '" + gulpPath + "'.",
					data: { usingAlt: true }
				}, 7);
			} else {
				gulpPath = settings.appPath + settings.gulpPath;
				self.trigger('compiler:ready', {
					message: "Using built-in Cascade compiler located at '" + gulpPath + "'.",
					data: { usingAlt: false }
				}, 7);
			}
			self.cascade = new _modulesCascade.Cascade(gulpPath);
			self.ui = new _modulesUi.Ui();
			cascade = self.cascade.get('settings');
			fs.access(settings.userPluginsFolder, fs.F_OK, function (err) {
				if (err) {
					fs.mkdirSync(settings.userPluginsFolder);
					self.trigger('plugins:ready', {
						message: "Plugins folder didn't exist. Created '" + settings.userPluginsFolder + "'. Plugins ready.",
						data: { createdFolder: true }
					}, 7);
				} else {
					self.trigger('plugins:ready', {
						message: "Plugins folder exits. Plugins ready.",
						data: { createdFolder: false }
					}, 7);
				}
			});
			var requestConfig = {};
			if (settings.proxy) {
				requestConfig.proxy = settings.proxy;
			}
			self.request = request.defaults(requestConfig);
			self.update();
			self.open(cascade.currentProjectDir, function (success) {
				if (success) {
					self.trigger('init', {
						message: "The application initialized successfully."
					}, 7);
				} else {
					self.trigger('init', {
						message: "The application failed to initialize.",
						error: "Unknown error."
					}, 7);
				}
			});
		};

		self._init();
	};

	util.inherits(App, EventEmitter);

	var packageJson = jetpack.read('./package.json', 'json');

	global.environment = packageJson.environment;

	var settings = packageJson['specless-cascade'];
	settings.appPath = process.cwd();
	settings.node = settings.appPath + '/node-v4.4.6-darwin-x64/bin/node';
	settings.userPluginsFolder = gui.App.dataPath + '/Plugins';

	var app = new App(settings);

	//global.myProject = new Project('/Users/scorby/Dev/defaultCascadeProjectTest', "My Name");
});
//# sourceMappingURL=app.js.map
