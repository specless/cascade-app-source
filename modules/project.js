define(['exports', './utils'], function (exports, _utils) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	var spawn = require('child_process').spawn;
	var Q = require('q');
	var jetpack = require('fs-jetpack');
	var fs = require('fs');
	var open = require("open");
	var fsExtra = require('node-fs-extra');
	var EventEmitter = require('events');
	var util = require('util');

	var Project = function Project(path, cb, name) {

		var self = this;
		var app = global.app;

		self.path = path;

		self.trigger = function (eventName, eventData, messageHandler) {
			self.emit(eventName, eventData);
			app.message.send(eventName, eventData, messageHandler);
		};

		self.get = function (type, callback) {
			var settingsFile = self.path + '/' + app.cascade.get('settingsFileName');
			var settings = jetpack.read(settingsFile, 'json');
			var event = {
				message: "The 'get' function was called.",
				data: { key: type }
			};
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
			var settingsFile = self.path + '/' + app.cascade.get('settingsFileName');
			var settings = jetpack.read(settingsFile, 'json');
			var event = {
				message: "The 'set' function was called",
				data: { key: key, value: value }
			};
			settings[key] = value;
			jetpack.write(settingsFile, settings);
			if (callback) {
				callback(settings[key]);
			}
			self.trigger('set', event);
			return settings[key];
		};

		self.preview = function (target) {
			var event = {
				message: "Opening preview.",
				data: {
					url: "http://localhost:" + app.get('serverPort') + "/",
					target: target
				}
			};
			if (target === undefined) {
				open("http://localhost:" + app.get('serverPort') + "/");
				event.data.target = "default";
			} else {
				open("http://localhost:" + app.get('serverPort') + "/", target);
			}
			self.trigger('preview', event);
		};

		self.viewIn = function (target) {
			var event = {
				message: "Viewing project in external application.",
				data: {
					target: target
				}
			};
			if (target === undefined) {
				open(app.project.get('path'), 'finder');
				event.data.target = 'finder';
			} else {
				open(app.project.get('path'), target);
			}
			self.trigger('viewIn', event);
		};

		self.rename = function (name) {
			var oldPath = app.cascade.get('settings').currentProjectDir;
			var oldName = app.cascade.get('settings').currentProjectDir.split('/').pop();
			var newPath = app.cascade.get('settings').currentProjectDir.split('/');
			newPath.pop();
			newPath.push(name);
			var updatedPath = newPath.join('/');
			var event = {};

			fs.access(updatedPath, fs.F_OK, function (err) {
				if (!err) {
					event.message = "Rename Failed";
					event.error = "A project or folder at that location with the same name already exists.";
					self.trigger('rename', event, 6);
				} else {
					fs.rename(oldPath, updatedPath, function (err) {
						if (err) {
							event.message = "Rename Failed";
							event.error = err;
							self.trigger('rename', event, 6);
						} else {
							app.open(updatedPath);
							_utils.utils.setProjectIcon(updatedPath);
							event.message = "Successfully renamed project to '" + name + "'.";
							self.trigger('rename', event, 7);
						}
					});
				}
			});
		};

		self.duplicate = function (newPath) {
			var event = {};
			fs.access(newPath, fs.F_OK, function (err) {
				if (!err) {
					event.message = "Project Duplication Failed";
					event.error = "A project or folder at that location already exists.";
					self.trigger('rename', event, 6);
				} else {
					fsExtra.copy(self.path, newPath, function (err) {
						if (err) {
							event.message = "Project Duplication Failed";
							event.error = err;
							self.trigger('rename', event, 6);
						} else {
							event.message = "Project successfully duplicated to: '" + newPath + "'.";
							self.trigger('rename', event, 7);
							app.open(newPath);
							_utils.utils.setProjectIcon(newPath);
						}
					});
				}
			});
		};

		self.publish = function (callback) {
			app.cascade._run('publish', function (success) {
				if (success === true) {
					if (callback) {
						callback(success);
					}
					var name = app.project.get('path').split('/').pop();
					var file = app.project.get('path') + '/' + name + '.scc';
					self.trigger('publish', {
						message: "Project published successfully",
						data: { file: file }
					}, 7);
					_utils.utils.setProjectIcon(file, true);
					open(app.project.get('path'), 'finder');
				} else if (success === false) {
					if (callback) {
						callback(success);
					}
					self.trigger('publish', {
						message: "Failed to publish project",
						error: "Unknown error.",
						data: { file: file }
					}, 6);
				}
			});
		};

		self._init = function (callback) {
			if (name) {
				app.cascade.create(path, name, function (success) {
					if (success === false) {
						var event = {
							message: "Failed to create project at '" + path + "/" + name + "'.",
							error: "Unknown error",
							data: { path: path + '/' + name }
						};
						//utils.handleMessage(event.message, 0);
						if (callback) {
							callback(false);
						}
						self.trigger('init', event, 2);
						return false;
					} else {
						self.path = path + '/' + name;
						var event = {
							message: "The project at '" + self.path + "' was created.",
							data: { path: self.path }
						};
						self.trigger('created', event, 2);
						//utils.handleMessage(event.message, 0);
						_utils.utils.setProjectIcon(self.path);
						app.cascade.start(self.path, function (status) {
							if (status === 'started') {
								if (callback) {
									callback(true);
								}
								self.trigger('init', {
									message: "The project at '" + self.path + "' initialized successfully.",
									data: { path: self.path }
								}, 2);
								return true;
							}
						});
					}
				});
			} else {
				//utils.handleMessage("Initializing existing project at '" + self.path + "'.", 0);
				app.cascade.start(self.path, function (status) {
					if (status === 'started') {
						if (callback) {
							callback(true);
						}
						_utils.utils.setProjectIcon(self.path);
						self.trigger('init', {
							message: "The project at '" + self.path + "' initialized successfully.",
							data: { path: self.path }
						}, 2);
						return true;
					} else if (status === 'failed') {
						if (callback) {
							callback(false);
						}
						self.trigger('init', {
							message: "The project at '" + self.path + "' failed to initialize.",
							error: "Unknown error.",
							data: { path: self.path }
						}, 2);
						return false;
					}
				});
			}
		};
		self._init(cb);
	};

	exports.Project = Project;
	util.inherits(Project, EventEmitter);
});
//# sourceMappingURL=project.js.map
