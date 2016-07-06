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

	/**
  * Creates an instance of the application.
  * @constructor
  * @param {Object} settings - The configuration settings to configure the application.
  * @param {string} settings.appPath - The path of the nw.js application.
  * @param {string} settings.folderIcon - The path to an image file to use for project folders.
  * @param {string} settings.fileIcon - The path to an image file to use for output '.scc' files.
  * @param {boolean} settings.appWasUpdated - Marks if this is the first time launching the app after the app was updated.
  * @param {boolean} settings.firstLaunch - Marks if this is the first time opening the applcation.
  * @param {string} settings.gulpPath - The path of the internal Gulp compiler.
  * @param {string} settings.altGulpPath - The path of an alternative Gulp compiler to use.
  * @param {string} settings.useAltGulpPath - Marks if the alternative Gulp compiler should be used instead of the internal compiler.
  * @param {string} settings.userPluginsFolder - The path to a folder that contains additional user-supplied plugins for the Gulp compiler to use.
  */
	var App = function App(settings) {

		/**
      * @alias App#
      */
		var self = this;

		/**
   * The primary instance of the application. Refer to documentation for {@link App}.
   * @namespace
   */
		global.app = self;

		self.emit('start', {
			message: "The application is starting."
		});

		/**
      * The path of the nw.js application contents.
      */
		self.path = settings.appPath;

		/**
      * The primary application window.
      */
		self.window = win;

		/**
      * A bunch of helpful utility methods. Refer to documentation for {@link utils}
      */
		self.utils = _modulesUtils.utils;

		/**
      * The current application environment.
      */
		self.environment = global.environment;

		var gulpPath;
		var cascade;

		/**
      * Triggers an event and if applicable, sends message data to the message manager.
      * @param {string} eventName - The name of the event being triggered.
      * @param {object} eventData - Data to be sent along with the event.
      * @param {number} messageCode - The code number of the message type to handle the event message.
      */
		self.trigger = function (eventName, eventData, messageCode) {
			self.emit(eventName, eventData);
			self.message.send(eventName, eventData, messageCode);
		};

		/**
      * Opens a project.
      * @param {string} path - The path of the project to be opened.
      * @param {function} callback - Callback to run after function has executed.
      */
		self.open = function (path, callback) {
			self.trigger('loading:start');
			var defaultProjectDir = gulpPath + cascade.defaultProjectDir;

			/**
       * Primary instance of the current project. Refer to documentation for {@link Project}.
       */
			self.project = new _modulesProject.Project(path, function (success) {
				if (callback) {
					callback(success);
				}
				if (success === true) {
					self.utils.addToRecentProjects(path);
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

		/**
      * Closed the currently open project.
      * @param {function} callback - Callback to run after function has executed.
      */
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

		/**
      * Creates a new project.
      * @param {string} path - The path of the folder that will contain the project folder.
      * @param {string} name - The name of the project (will also be used as the folder name of the project).
      * @param {function} callback - Callback to run after function has executed.
      */
		self['new'] = function (path, name, callback) {
			self.project = new _modulesProject.Project(path, function (success) {
				console.log("new", success);
				if (callback) {
					callback(success);
				}
				if (success === true) {
					self.utils.addToRecentProjects(path + "/" + name);
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

		/**
      * Returns the specified property of the application instance.
      * @param {string} type - The property for which to return the value of.
      * @param {function} callback - Callback to run after function has executed.
      */
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

		/**
      * Sets the specified property of the application instance.
      * @param {string} key - The property key to set.
      * @param {string} value - The property value to set.
      * @param {function} callback - Callback to run after function has executed.
      */
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

		/**
      * Restarts the application
      */
		self.restart = function () {
			var exec = require('child_process').exec;

			var runNwApp = function runNwApp() {
				var nwPath = _modulesUtils.utils.nwPath();
				exec('sleep 1s\n' + nwPath + ' ' + self.path, { detached: true });
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
		/**
      * Checks if there is an update to the application available. If available, downloads and unpacks the contents to the current application directory, overwriting the existing application.
      * @param {function} callback - Callback to run after function has completed executing.
      */
		self.update = function (callback) {
			var yauzl = require("yauzl");
			var githubUser = 'specless';
			var githubRepo = 'cascade-app-source';
			var fstream = require('fstream');
			var pathUtil = require("path");
			var mkdirp = require("mkdirp");

			self.trigger('update:start', {
				message: "Checking for updated version."
			});
			_modulesUtils.utils.checkGithub(githubUser, githubRepo, function (fileUrl, err) {
				if (!err) {
					if (fileUrl !== false) {
						_modulesUtils.utils.downloadFile(fileUrl, function (path, file, err) {
							if (!err) {
								var output = path + '/' + file;
								var totalFiles = 30000;
								var filesProcessed = 0;
								var percent = 0;
								var appSettings = self.get('settings');
								var cascadeSettings = self.cascade.get('settings');

								yauzl.open(output, { lazyEntries: true }, function (err, zipfile) {
									if (err) {
										self.trigger('update:end', {
											message: "There was an error reading the downloaded update. File may have been corrupted.",
											error: err
										}, 6);
									} else {
										totalFiles = zipfile.entryCount;
										zipfile.readEntry();
										zipfile.on("entry", function (entry) {
											var newFilePath = entry.fileName.split('/');
											newFilePath.shift();
											newFilePath = self.path + '/' + newFilePath.join('/');
											if (/\/$/.test(entry.fileName)) {
												filesProcessed = filesProcessed + 1;
												percent = filesProcessed / totalFiles;
												self.ui.unzipProgress(percent);
												zipfile.readEntry();
											} else {
												zipfile.openReadStream(entry, function (err, readStream) {
													if (err) {
														self.trigger('update:end', {
															message: "There was an error unpacking the updated version.",
															error: err
														}, 6);
													} else {
														mkdirp(pathUtil.dirname(newFilePath), function (err) {
															if (err) {
																self.trigger('update:end', {
																	message: "There was an error unpacking the updated version.",
																	error: err
																}, 6);
															} else {
																readStream.pipe(fs.createWriteStream(newFilePath));
																readStream.on("end", function () {
																	filesProcessed = filesProcessed + 1;
																	percent = filesProcessed / totalFiles;
																	self.ui.unzipProgress(percent);
																	zipfile.readEntry();
																});
															}
														});
													}
												});
											}
										});
										zipfile.on("close", function (err) {
											if (!err) {
												self.set('altGulpPath', appSettings.altGulpPath);
												self.set('autoReload', appSettings.autoReload);
												self.set('firstLaunch', appSettings.firstLaunch);
												self.set('proxy', appSettings.proxy);
												self.set('serverPort', appSettings.serverPort);
												self.set('trayMode', appSettings.trayMode);
												self.set('useAltGulpPath', appSettings.useAltGulpPath);
												self.set('appWasUpdated', true);
												self.cascade.set('currentProjectDir', cascadeSettings.currentProjectDir);
												// clearInterval(self.update.interval);
												self.trigger('update:end', {
													message: "Application has been updated.",
													error: "Click to restart. Application will not function properly until restarted.",
													featureToggle: true,
													callback: function callback() {
														self.restart();
													}
												}, 8);
											} else {
												self.trigger('update:end', {
													message: "There was an error copying the updated version.",
													error: err
												}, 6);
											}
											self.ui.unzipProgress(1);
										});
									}
								});

								//var writeStream = fstream.Writer(path);

								// self.on('end', function() {
								// 	self.emit('unzip');
								// 	console.log("UNZIPPED!");
								// 		var version = file.replace('.zip', '').replace('v','');
								// 		var directory = path + '/' + githubRepo + '-' + version;
								// 		var defaultSettings = require(directory + '/package.json');
								// 		var currentSettings = self.get('settings');
								// 		defaultSettings["specless-cascade"].altGulpPath = currentSettings.altGulpPath;
								// 		defaultSettings["specless-cascade"].autoReload = currentSettings.autoReload;
								// 		defaultSettings["specless-cascade"].firstLaunch = currentSettings.firstLaunch;
								// 		defaultSettings["specless-cascade"].proxy = currentSettings.proxy;
								// 		defaultSettings["specless-cascade"].serverPort = currentSettings.serverPort;
								// 		defaultSettings["specless-cascade"].trayMode = currentSettings.trayMode;
								// 		defaultSettings["specless-cascade"].useAltGulpPath = currentSettings.useAltGulpPath;
								// 		jetpack.write(directory + '/package.json', defaultSettings);

								// 		// var newCascadeSettings = require(directory + settings.gulpPath + '/package.json');
								// 		// newCascadeSettings["specless-cascade"].currentProjectDir = self.cascade.get('currentSettings');
								// 		// jetpack.write(directory + settings.gulpPath + '/package.json', newCascadeSettings);

								// 		utils.copyNewAppFiles(directory, self.path, function(err) {
								// 			if (!err) {
								// 				self.trigger('update:end', {
								// 		message: "Copied files, ok to restart."
								// 	}, 7);
								// 			} else {
								// 				self.trigger('update:end', {
								// 		message: "There was an error copying the updated version.",
								// 		error: err
								// 	}, 6);
								// 			}
								// 		});
								// 	});

								//  	var once = false

								//  	self.on('errordsad', function(err) {
								//  		if (once === false) {
								//   		self.trigger('update:end', {
								// 		message: "There was an error unpacking the updated version.",
								// 		error: err
								// 	}, 6);
								// 	once = true;
								// }
								//  	});
							} else {
									self.trigger('update:end', {
										message: "There was an error downloading the latest version.",
										error: err
									}, 6);
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

		/**
      * Sets up and initializes the application instance.
      * @private
      */
		self._init = function () {

			/**
       * Primary instance of the message manager. Refer to documentation for {@link Messages}.
       */
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
			/**
       * Primary instance of the Cascade Gulp wrapper. Refer to documentation for {@link Cascade}.
       */
			self.cascade = new _modulesCascade.Cascade(gulpPath);

			/**
       * Primary instance of the user interface. Refer to documentation for {@link Ui}.
       */
			self.ui = new _modulesUi.Ui();

			cascade = self.cascade.get('settings');
			self.cascade.set('userPluginsFolder', settings.userPluginsFolder);
			fs.access(settings.userPluginsFolder, fs.F_OK, function (err) {
				if (err) {
					fs.mkdirSync(settings.userPluginsFolder);
					self.trigger('plugins:ready', {
						message: "Plugins folder didn't exist. Created '" + settings.userPluginsFolder + "'. Plugins ready.",
						data: { createdFolder: true }
					}, 7);
				} else {
					self.trigger('plugins:ready', {
						message: "Plugins folder exists. Plugins ready.",
						data: { createdFolder: false }
					}, 7);
				}
			});
			var requestConfig = {};
			if (settings.proxy) {
				requestConfig.proxy = settings.proxy;
			}
			self.request = request.defaults(requestConfig);
			if (settings.appWasUpdated === true) {
				self.trigger('update:live', {
					message: "Running updated version of application.",
					error: "New version is: " + gui.App.manifest.version
				}, 8);
				self.set('appWasUpdated', false);
			}
			self.update();
			// self.update.interval = setInterval(self.update(), 3600000);
			self.trigger('init', {
				message: "The application initialized successfully."
			}, 7);
			if (!settings.firstLaunch) {
				if (cascade.currentProjectDir) {
					self.open(cascade.currentProjectDir);
				}
			} else {
				// Once we have a first use experience, run that here.
				self.cascade.set('currentProjectDir', null);
				self.set('firstLaunch', false);
				self.trigger('firstLaunch', {
					message: "Welcome to Cascade! Looks like this is your first time running the app."
				}, 7);
			}
		};

		self._init();
	};

	util.inherits(App, EventEmitter);

	var packageJson = jetpack.read('./package.json', 'json');

	global.environment = packageJson.environment;

	var settings = packageJson['specless-cascade'];
	settings.appPath = process.cwd();
	settings.node = settings.appPath + '/node-v4.4.6-darwin-x64/bin/node';
	settings.node = '/usr/local/bin/node';
	settings.userPluginsFolder = gui.App.dataPath + '/Plugins';

	var app = new App(settings);

	//global.myProject = new Project('/Users/scorby/Dev/defaultCascadeProjectTest', "My Name");
});
//# sourceMappingURL=app.js.map
