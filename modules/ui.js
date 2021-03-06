define(['exports', './utils'], function (exports, _utils) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	var EventEmitter = require('events');
	var util = require('util');
	var open = require("open");
	var gui = require('nw.gui');
	var win = gui.Window.get();

	/**
  * Creates and binds an instance of the application's user interface and all user interface logic.
  * @constructor
   * @param {object} cb - Callback to run after the user interface has initialized.
  */
	var Ui = function Ui(cb) {

		var self = this;
		var $ = global.$;
		var app = global.app;

		self.trigger = function (eventName, eventData, messageHandler) {
			self.emit(eventName, eventData);
			app.message.send(eventName, eventData, messageHandler);
		};

		self._el = {
			$app: $('#app'),
			$projectCard: $('#projectCard'),
			$projectLabel: $('#projectLabel'),
			$projectTitle: $('#projectTitle'),
			$projectPath: $('#projectPath'),
			$openProject: $('#openProject'),
			$newProject: $('#newProject'),
			$openProjectFolder: $('#openProjectFolder'),
			$publishProject: $('#publishProject'),
			$serverPort: $('#serverPort'),
			$restartServer: $('#restartServer'),
			$projectInfo: $('#projectInfo'),
			$cascadeVersion: $('#cascadeVersion'),
			$cascadePath: $('#cascadePath'),
			$chooseCascade: $('#chooseCascade'),
			$toggleCustomCascade: $('#toggleCustomCascade'),
			$restartCascade: $('#restartCascade'),
			$pluginsPath: $('#pluginsPath'),
			$showPlugins: $('#showPlugins'),
			$openDirectory: $('#openDirectory'),
			$newDirectory: $('#newDirectory'),
			$chooseFile: $('#chooseFile'),
			$previewProject: $('.app-preview'),
			$openIn: $('.app-open-in'),
			$toggleLeftMenu: $('#toggleLeftMenu'),
			$toggleRightMenu: $('#toggleRightMenu'),
			$clickOverlay: $('#clickOverlay'),
			$windowClose: $('#windowClose'),
			$windowMin: $('#windowMinimize'),
			$downloadOverlay: $('#downloadOverlay'),
			$downloadBar: $('#downloadBar'),
			$downloadMessage: $('#downloadMessage'),
			$compileError: $('#errorTag'),
			$compileErrorMessage: $('#errorTagMessage'),
			$compileErrorDetails: $('#errorTagDetails')
		};

		self.get = function (el) {
			return self._el[el];
		};

		self._set = function (key, value) {
			var el = self._el;
			if (key === 'projectTitle') {
				if (value) {
					el.$projectTitle.html(value);
				} else {
					el.$projectTitle.html(app.cascade.get('settings').currentProjectDir.split('/').pop());
				}
			} else if (key === 'projectPath') {
				if (value) {
					el.$projectPath.html(value);
				} else {
					el.$projectPath.html(app.cascade.get('settings').currentProjectDir);
				}
			} else if (key === 'serverPort') {
				el.$serverPort.attr('value', app.cascade.get('serverPort'));
			} else if (key === 'cascadePath') {
				el.$cascadePath.html(app.get('altGulpPath'));
			} else if (key === 'cascadeVersion') {
				el.$cascadeVersion.html(app.cascade.get('version'));
			} else if (key === 'pluginsPath') {
				el.$pluginsPath.html(app.cascade.get('userPluginsFolder'));
			} else if (key === 'customCascade') {
				if (app.get('useAltGulpPath') === true) {
					el.$toggleCustomCascade.attr("data-value", "true");
					el.$toggleCustomCascade.html("Disable");
				} else {
					el.$toggleCustomCascade.attr("data-value", "false");
					el.$toggleCustomCascade.html("Enable");
				}
			} else if (key === 'appReady') {
				el.$app.addClass("ready");
			} else if (key === 'projectLabel') {
				el.$projectLabel.html(value);
			}
		};

		self.toggleMenu = function (menu) {
			var el = self._el;

			$("body").toggleClass('menu');
			if (menu === 'left') {
				el.$app.toggleClass('menu-left');
			} else if (menu === 'right') {
				el.$app.toggleClass('menu-right');
			}
		};

		self._updateProject = function (defaultProject) {
			var el = self._el;
			el.$projectTitle.trigger('destroy');
			var wasDefault = false;
			if (el.$projectCard.hasClass('default-project')) {
				wasDefault = true;
			}

			if (defaultProject) {
				el.$projectCard.addClass('default-project');
				el.$projectCard.removeClass('processing');
				self._set('projectLabel', 'No Project Currently Open');
				self._set('projectTitle', 'Default Project');
				self._set('projectPath', 'Please open or create a new project below.');
				self._toggleProjectOptions(false);
			} else {

				if (wasDefault) {
					el.$projectCard.removeClass('default-project');
					el.$projectCard.removeClass('processing');
					self._set('projectLabel', 'Current Project');
					self._set('projectTitle');
					self._set('projectPath');
					self._toggleProjectOptions();
					el.$projectTitle.dotdotdot({
						height: 30,
						wrap: 'letter'
					});
					var path = el.$projectPath.html().split('/');
					path.pop();
					if (path.length > 1) {
						var name = path.pop();
						var firstPart = path.join('/');
						el.$projectPath.html('<span class="pathname">' + firstPart + '</span><span class="filename">/' + name + '</span>');
					}
				} else {
					el.$projectCard.removeClass('default-project');
					el.$projectCard.addClass('fade-out-details');
					el.$projectCard.removeClass('processing');
					self._toggleProjectOptions();

					setTimeout(function () {
						self._set('projectLabel', 'Current Project');
						self._set('projectTitle');
						self._set('projectPath');
						el.$projectTitle.dotdotdot({
							height: 30,
							wrap: 'letter'
						});
						var path = el.$projectPath.html().split('/');
						path.pop();
						if (path.length > 1) {
							var name = path.pop();
							var firstPart = path.join('/');
							el.$projectPath.html('<span class="pathname">' + firstPart + '</span><span class="filename">/' + name + '</span>');
						}
						el.$projectCard.addClass('enter-details');
						setTimeout(function () {
							el.$projectCard.removeClass('fade-out-details');
							el.$projectCard.removeClass('enter-details');
						}, 1000);
					}, 500);
				}
			}
		};

		self._sccSelect = function (callback) {
			var chooser = self._el.$chooseFile;
			chooser.unbind('change');
			chooser.change(function (evt) {
				if ($(this).val() !== "") {
					if (callback) {
						callback($(this).val());
					}
					app.keepWindowOpen = false;
				}
			});
			app.keepWindowOpen = true;
			chooser.trigger('click');
		};

		self._fileSelect = function (callback) {
			var chooser = self._el.$openDirectory;
			chooser.unbind('change');
			chooser.change(function (evt) {
				if ($(this).val() !== "") {
					if (callback) {
						callback($(this).val());
					}
					app.keepWindowOpen = false;
				}
			});
			app.keepWindowOpen = true;
			chooser.trigger('click');
		};

		self._fileSave = function (callback) {
			var chooser = self._el.$newDirectory;
			chooser.unbind('change');
			chooser.change(function (evt) {
				if ($(this).val() !== "") {
					if (callback) {
						callback($(this).val());
					}
					app.keepWindowOpen = false;
				}
			});
			app.keepWindowOpen = true;
			chooser.trigger('click');
		};

		self._bind_hotkeys = function () {
			var showDevToolsOptions = {
				key: "Ctrl+Shift+D",
				active: function active() {
					app.console.showDevTools();
					win.showDevTools();
				}
			};
			var showDevTools = new gui.Shortcut(showDevToolsOptions);

			var reloadAppOptions = {
				key: "Ctrl+Shift+R",
				active: function active() {
					app.restart();
				}
			};
			var reloadApp = new gui.Shortcut(reloadAppOptions);

			win.on('focus', function () {
				gui.App.registerGlobalHotKey(showDevTools);
				gui.App.registerGlobalHotKey(reloadApp);
			});

			win.on('blur', function () {
				gui.App.unregisterGlobalHotKey(showDevTools);
				gui.App.unregisterGlobalHotKey(reloadApp);
			});

			var showCascadeOptions = {
				key: "Ctrl+Shift+C",
				active: function active() {
					if (app.showing) {
						app.showing = false;
						win.hide();
						win.blur();
					} else {
						app.showing = true;
						win.show();
						win.focus();
					}
				}
			};
			var showCascade = new gui.Shortcut(showCascadeOptions);
			gui.App.registerGlobalHotKey(showCascade);
		};

		self._bind_projectOpen = function (element, callback) {
			element.click(function () {
				self._fileSelect(function (path) {
					app.open(path, function (success) {
						if (callback) {
							callback(success);
						}
					});
				});
			});
		};

		self._bind_leftMenu = function (element, callback) {
			element.click(function () {
				self.toggleMenu('left');
			});
		};

		self._bind_rightMenu = function (element, callback) {
			element.click(function () {
				self.toggleMenu('right');
			});
		};

		self._bind_projectInfo = function (element, callback) {
			var el = self._el;
			element.click(function () {
				app.console.restore();
				app.console.show();
				if (!el.winMenu_showConsole.checked) {
					el.winMenu_showConsole.checked = true;
				}
			});
		};

		self._bind_projectPublish = function (element, callback) {
			element.click(function () {
				app.project.publish(function (success) {
					if (callback) {
						callback(success);
					}
				});
			});
		};

		self._bind_projectNew = function (element, callback) {
			element.click(function () {
				self._fileSave(function (path) {
					path = path.split('/');
					var name = path.pop();
					path = path.join('/');
					app['new'](path, name, function (success) {
						if (callback) {
							callback(success);
						}
					});
				});
			});
		};

		self._bind_projectPreview = function (element) {
			element.click(function () {
				var target = $(this).attr('data-target');
				app.project.preview(target);
				$('body').removeClass('menu');
				self._el.$app.removeClass('menu-right');
			});
		};

		self._bind_projectOpenIn = function (element) {
			element.click(function () {
				var target = $(this).attr('data-target');
				app.project.viewIn(target);
				$('body').removeClass('menu');
				self._el.$app.removeClass('menu-right');
			});
		};

		self._bind_appRestart = function (element) {
			var el = self._el;
			var validateServerPort = function validateServerPort(port) {
				var isnum = /^\d+$/.test(port);
				return isnum;
			};
			element.click(function () {
				var serverPort = el.$serverPort.val();
				var oldServerPort = app.get('serverPort');
				var changed = false;
				if (validateServerPort(serverPort) === true && serverPort.split("").length === 4) {
					app.set('serverPort', serverPort);
					app.restart();
				} else {
					el.$serverPort.val(oldServerPort);
					self.alert("Restart Error", "'" + serverPort + "' is not a valid server port.");
				}
			});
		};

		self._bind_pluginsShowFolder = function (element) {
			element.click(function () {
				open(app.get('userPluginsFolder'), 'finder');
			});
		};

		self._bind_cascadeToggleCustom = function (element) {
			var el = self._el;
			element.click(function () {
				if (element.attr('data-value') === "true") {
					element.attr('data-value', "false");
					app.set("useAltGulpPath", false);
				} else {
					element.attr('data-value', "true");
					app.set("useAltGulpPath", true);
				}
			});
		};

		self._bind_cascadeChooseCustom = function (element) {
			var el = self._el;
			element.click(function () {
				self._fileSelect(function (path) {
					el.$cascadePath.html(path);
					app.set("altGulpPath", path);
				});
			});
		};

		self._bind_clickOutsideCloseMenu = function (element) {
			var el = self._el;
			element.click(function () {
				$('body').removeClass('menu');
				el.$app.removeClass('menu-left');
				el.$app.removeClass('menu-right');
			});
		};

		self._bind_windowClose = function (element) {
			element.click(function () {
				gui.App.quit();
			});
		};

		self._bind_windowMin = function (element) {
			element.click(function () {
				win.minimize();
			});
		};

		self._create_nativeMenus = function () {

			var el = self._el;

			var projectMenu = new gui.Menu();
			el.winMenu_new = new gui.MenuItem({
				label: 'New Project',
				key: 'n',
				modifiers: 'cmd',
				click: function click() {
					el.$newProject.trigger('click');
				}
			});

			el.winMenu_newFromScc = new gui.MenuItem({
				label: 'New Project From .SCC Package',
				key: 'e',
				modifiers: 'cmd',
				click: function click() {
					app.ui._sccSelect(function (file) {
						app.open(file);
					});
				}
			});

			el.winMenu_open = new gui.MenuItem({
				label: 'Open...',
				key: 'o',
				modifiers: 'cmd',
				click: function click() {
					el.$openProject.trigger('click');
				}
			});

			el.winMenu_openRecent = new gui.MenuItem({
				label: 'Open Recent'
			});

			var updateRecentMenu = function updateRecentMenu() {
				var recentMenu = new gui.Menu();
				var recentProjects = app.get('settings').recentProjects;
				for (var i = 0; i < recentProjects.length; i++) {
					var createMenu = function createMenu(i) {
						var projPath = recentProjects[i];
						var projMenuItem = new gui.MenuItem({
							label: projPath,
							click: function click() {
								app.open(projPath);
							}
						});
						if (i !== 0) {
							recentMenu.append(projMenuItem);
						}
					};
					createMenu(i);
				}
				el.winMenu_openRecent.submenu = recentMenu;
			};

			app.on('set', function (event) {
				if (event.data.key === 'recentProjects') {
					updateRecentMenu();
				}
			});

			el.winMenu_separator = new gui.MenuItem({
				type: "separator"
			});
			el.winMenu_rename = new gui.MenuItem({
				label: 'Rename',
				key: 'u',
				modifiers: 'cmd',
				click: function click() {
					var newName = prompt("Please enter a new name:", app.cascade.get('settings').currentProjectDir.split('/').pop());
					if (newName != null) {
						app.project.rename(newName);
					}
				}
			});
			el.winMenu_duplicate = new gui.MenuItem({
				label: 'Save As...',
				key: 's',
				modifiers: 'cmd',
				click: function click() {
					self._fileSave(function (path) {
						app.project.duplicate(path);
					});
				}
			});
			el.winMenu_folder = new gui.MenuItem({
				label: 'Show Folder',
				key: 'f',
				modifiers: 'cmd',
				click: function click() {
					app.project.viewIn();
				}
			});
			el.winMenu_publish = new gui.MenuItem({
				label: 'Publish',
				key: 'p',
				modifiers: 'cmd',
				click: function click() {
					el.$publishProject.trigger('click');
				}
			});
			projectMenu.append(el.winMenu_new);
			projectMenu.append(el.winMenu_newFromScc);
			projectMenu.append(el.winMenu_open);
			projectMenu.append(el.winMenu_openRecent);
			projectMenu.append(el.winMenu_duplicate);
			projectMenu.append(el.winMenu_separator);
			projectMenu.append(el.winMenu_rename);
			projectMenu.append(el.winMenu_folder);
			projectMenu.append(el.winMenu_publish);
			var projectMenuParent = new gui.MenuItem({
				label: 'Project',
				submenu: projectMenu
			});
			win.menu.insert(projectMenuParent, 1);

			var previewMenu = new gui.Menu();
			el.winMenu_preview = new gui.MenuItem({
				label: 'Preview in Default Browser',
				key: '2',
				modifiers: 'cmd',
				click: function click() {
					app.project.preview();
				}
			});
			el.winMenu_separator = new gui.MenuItem({
				type: "separator"
			});
			el.winMenu_previewChrome = new gui.MenuItem({
				label: 'Preview in Chrome',
				key: '3',
				modifiers: 'cmd',
				click: function click() {
					app.project.preview('google chrome');
				}
			});
			el.winMenu_previewSafari = new gui.MenuItem({
				label: 'Preview in Safari',
				key: '4',
				modifiers: 'cmd',
				click: function click() {
					app.project.preview('safari');
				}
			});
			el.winMenu_previewFirefox = new gui.MenuItem({
				label: 'Preview in Firefox',
				key: '5',
				modifiers: 'cmd',
				click: function click() {
					app.project.preview('firefox');
				}
			});
			el.winMenu_previewOpera = new gui.MenuItem({
				label: 'Preview in Opera',
				key: '6',
				modifiers: 'cmd',
				click: function click() {
					app.project.preview('opera');
				}
			});
			previewMenu.append(el.winMenu_preview);
			previewMenu.append(el.winMenu_separator);
			previewMenu.append(el.winMenu_previewChrome);
			previewMenu.append(el.winMenu_previewSafari);
			previewMenu.append(el.winMenu_previewFirefox);
			previewMenu.append(el.winMenu_previewOpera);
			var previewMenuParent = new gui.MenuItem({
				label: 'Preview',
				submenu: previewMenu
			});
			win.menu.append(previewMenuParent);

			var serverMenu = new gui.Menu();
			el.winMenu_proxy = new gui.MenuItem({
				label: 'Use Proxy Server',
				click: function click() {
					var currentProxy = app.get('settings').proxy;
					if (!currentProxy) {
						currentProxy = '';
					}
					var proxy = prompt("Please enter your proxy server and port (i.e. 'localproxy.com:80').\nLeave blank if no proxy server is desired.", currentProxy);
					if (proxy != null) {
						if (proxy === '') {
							proxy = null;
						}
						app.set('proxy', proxy);
						if (proxy !== currentProxy) {
							alert("You have updated your proxy server settings.\nThe application will need to restart.");
							app.restart();
						}
					}
				}
			});
			serverMenu.append(el.winMenu_proxy);
			var serverMenuParent = new gui.MenuItem({
				label: 'Server',
				submenu: serverMenu
			});
			win.menu.append(serverMenuParent);

			var windowMenu = win.menu.items[3].submenu;
			var separator = new gui.MenuItem({
				type: "separator"
			});
			el.winMenu_showConsole = new gui.MenuItem({
				label: 'Show Project Console',
				type: "checkbox",
				checked: false,
				key: '1',
				modifiers: 'cmd',
				click: function click() {
					if (this.checked) {
						app.console.restore();
						app.console.show();
					} else {
						app.console.restore();
						app.console.hide();
					}
				}
			});
			el.winMenu_trayMode = new gui.MenuItem({
				label: 'Enable Menu Bar Mode',
				type: "checkbox",
				checked: app.get('settings').trayMode,
				key: 't',
				modifiers: 'cmd',
				click: function click() {
					if (this.checked) {
						app.set("trayMode", true);
						self._setupTrayMode(true);
					} else {
						app.set("trayMode", false);
						self._setupTrayMode(false);
					}
				}
			});
			windowMenu.append(separator);
			windowMenu.append(el.winMenu_showConsole);
			windowMenu.append(el.winMenu_trayMode);

			var helpMenu = new gui.Menu();
			el.winMenu_docs = new gui.MenuItem({
				label: 'Cascade Documentation',
				key: '7',
				modifiers: 'cmd',
				click: function click() {
					var url = app.get("settings").documentation;
					open(url);
				}
			});
			el.winMenu_knowledgeBase = new gui.MenuItem({
				label: 'Specless Knowledge Base',
				key: '8',
				modifiers: 'cmd',
				click: function click() {
					var url = app.get("settings").knowledgeBase;
					open(url);
				}
			});
			el.winMenu_contact = new gui.MenuItem({
				label: 'Contact Support',
				key: '9',
				modifiers: 'cmd',
				click: function click() {
					var url = app.get("settings").contact;
					open(url);
				}
			});
			el.winMenu_reportBug = new gui.MenuItem({
				label: 'Report a Bug',
				key: '0',
				modifiers: 'cmd',
				click: function click() {
					var url = app.get("settings").reportBug;
					open(url);
				}
			});
			var separator = new gui.MenuItem({
				type: "separator"
			});
			helpMenu.append(el.winMenu_docs);
			helpMenu.append(el.winMenu_knowledgeBase);
			helpMenu.append(separator);
			helpMenu.append(el.winMenu_contact);
			helpMenu.append(el.winMenu_reportBug);
			var helpMenuParent = new gui.MenuItem({
				label: 'Help',
				submenu: helpMenu
			});
			win.menu.append(helpMenuParent);
		};

		self._bindAll = function () {
			var el = self._el;
			self._bind_hotkeys();
			self._bind_projectOpen(el.$openProject);
			self._bind_projectNew(el.$newProject);
			self._bind_projectPreview(el.$previewProject);
			self._bind_projectOpenIn(el.$openIn);
			self._bind_projectPublish(el.$publishProject);
			self._bind_appRestart(el.$restartServer);
			self._bind_pluginsShowFolder(el.$showPlugins);
			self._bind_cascadeToggleCustom(el.$toggleCustomCascade);
			self._bind_cascadeChooseCustom(el.$chooseCascade);
			self._bind_leftMenu(el.$toggleLeftMenu);
			self._bind_rightMenu(el.$toggleRightMenu);
			self._bind_clickOutsideCloseMenu(el.$clickOverlay);
			self._bind_windowClose(el.$windowClose);
			self._bind_windowMin(el.$windowMin);
			self._bind_projectInfo(el.$projectInfo);
			self._bind_projectInfo(el.$compileErrorMessage);
			el.$compileError.click(function () {
				app.open(app.project.get('settings').path);
				self.toggleCompileError(false);
				el.$compileErrorDetails.removeClass('show');
			});
		};

		self._setAll = function () {
			self._set('serverPort');
			self._set('cascadePath');
			self._set('cascadeVersion');
			self._set('pluginsPath');
			self._set('customCascade');
			self._set('appReady');
		};

		self._setupTrayMode = function (enableDisable) {

			var hideWindow = function hideWindow() {
				$('body').animate({
					opacity: 0
				}, 300, function () {
					win.hide();
					$('body').css('opacity', 1);
				});
			};

			var showWindow = function showWindow() {
				$('body').animate({
					opacity: 1
				}, 1, function () {
					win.show();
					$('body').css('opacity', 1);
				});
			};

			// win.on('focus', function() {
			// 	//gui.Window.requestAttention(false);
			// });

			if (enableDisable === true || enableDisable === undefined) {
				app.trayModeOn = true;
				hideWindow();
				app.showing = false;
				$('body').addClass("arrow");
				win.setVisibleOnAllWorkspaces(true);
				win.setAlwaysOnTop(true);
				document.title = 'Cascade';
				document.title = '　';
				app.tray = new gui.Tray({
					icon: app.path + "/assets/cascade_16x16.png",
					iconIsTemplate: true
				});
				app.tray.on('click', function (event) {
					win.moveTo(event.x + 14 - win.width / 2, event.y);
					if (app.showing === false) {
						showWindow();
						win.focus();
						app.showing = true;
					} else {
						hideWindow();
						app.showing = false;
					}
				});
				win.on('blur', function (event) {
					if (app.trayModeOn === true) {
						if (app.keepWindowOpen === false) {
							hideWindow();
							app.showing = false;
						}
					}
				});
				window.addEventListener('blur', function (event) {
					if (app.trayModeOn === true) {
						if (app.keepWindowOpen === false) {
							hideWindow();
							app.showing = false;
						}
					}
				});
				win.on('focus', function (event) {
					if (app.trayModeOn === true) {
						showWindow();
						app.showing = true;
						app.keepWindowOpen = false;
					}
				});
			} else {
				app.trayModeOn = false;
				if (app.tray) {
					app.tray.remove();
					app.tray = null;
				}
				win.show();
				win.focus();
				app.showing = true;
				$('body').removeClass("arrow");
				win.setVisibleOnAllWorkspaces(false);
				win.setAlwaysOnTop(false);
				//win.moveBy(-200, 200);
			}
		};

		self._setupWindows = function () {
			var el = self._el;
			win.show();
			win.focus();
			app.showing = true;

			if (app.get("settings").trayMode === true) {
				self._setupTrayMode(true);
			} else {
				self._setupTrayMode(false);
			}

			gui.App.on('reopen', function () {
				win.show();
				win.focus();
				app.showing = true;
			});

			app.console = gui.Window.open('console.html', {
				width: 940, height: 550,
				toolbar: false,
				frame: false,
				show: false
			});
			app.console.setMinimumSize(910, 440);
			//app.console.setVisibleOnAllWorkspaces(true);
			app.console.on('loaded', function () {
				el.console = app.console.window;
				el.$log = el.console.$('#log');
				el.console.$('#windowClose').click(function () {
					app.console.hide();
					el.winMenu_showConsole.checked = false;
				});
				el.console.$('#windowMinimize').click(function () {
					app.console.minimize();
				});
				self.ready = true;
			});
		};

		self._toggleProjectOptions = function (enableDisable) {
			var el = self._el;
			if (!app.project || enableDisable === false) {
				$('body').addClass('no-project');
				el.winMenu_preview.enabled = false;
				el.winMenu_previewChrome.enabled = false;
				el.winMenu_previewSafari.enabled = false;
				el.winMenu_previewFirefox.enabled = false;
				el.winMenu_previewOpera.enabled = false;
				el.winMenu_duplicate.enabled = false;
				el.winMenu_folder.enabled = false;
				el.winMenu_rename.enabled = false;
				el.winMenu_publish.enabled = false;
			} else {
				$('body').removeClass('no-project');
				el.winMenu_preview.enabled = true;
				el.winMenu_previewChrome.enabled = true;
				el.winMenu_previewSafari.enabled = true;
				el.winMenu_previewFirefox.enabled = true;
				el.winMenu_previewOpera.enabled = true;
				el.winMenu_duplicate.enabled = true;
				el.winMenu_folder.enabled = true;
				el.winMenu_rename.enabled = true;
				el.winMenu_publish.enabled = true;
			}
		};

		self.notify = function (title, message, type, callback, sticky) {
			var config = {
				body: message
			};
			if (type === "success") {
				config.icon = 'file://' + app.path + '/assets/icon-success.png';
			} else if (type === "failure") {
				config.icon = 'file://' + app.path + '/assets/icon-error.png';
			} else if (type === "warning") {
				config.icon = 'file://' + app.path + '/assets/icon-warning.png';
			}
			if (sticky === true) {
				config.requireInteraction = true;
			}

			var notification = new Notification(title, config);
			if (callback) {
				notification.onclick = callback;
			}
			return notification;
		};

		self.alert = function (title, message, callback) {
			var el = self._el;
			el.$app.addClass('alert');
			alert(title + '\n' + '(Full error details can be viewed in the project console.)');
			el.$app.removeClass('alert');
			if (callback) {
				callback(title, message);
			}
		};

		self.toggleCompileError = function (on, type, details) {
			var el = self._el;
			if (on === true) {
				el.$projectCard.addClass('show-error');

				if (type === "css") {
					el.$compileErrorMessage.html('CSS Compile Error');
				} else if (type === "html") {
					el.$compileErrorMessage.html('HTML Compile Error');
				} else if (type === "js") {
					el.$compileErrorMessage.html(' Javascript Compile Error');
				}

				if (details) {
					el.$compileErrorDetails.html(details);
					el.$compileErrorDetails.addClass('show');
				} else {
					el.$compileErrorDetails.html('');
					el.$compileErrorDetails.removeClass('show');
				}
			}

			if (on === false) {
				el.$projectCard.removeClass('show-error');
				el.$compileErrorMessage.html('Compile Error');
				el.$compileErrorDetails.html('');
				el.$compileErrorDetails.removeClass('show');
			}
		};

		self.log = function (message, details, type, category, callback) {
			var el = self._el;
			var $detailEl;
			var $logItem = $('<div class="log-item" data-type="' + type + '" data-category="' + category + '"><span class="toggler"></span><span class="message">' + message + '</span></div>');
			if (details !== null && details !== undefined) {
				$logItem.addClass('has-details');
				$detailEl = $('<div class="details"></div>');
				$detailEl.append(details);
				$logItem.append($detailEl);
				$logItem.click(function () {
					$(this).toggleClass('open');
				});
			}
			if (el.$log) {
				el.$log.append($logItem);
				el.$log.scrollTop(el.$log[0].scrollHeight);
			}

			if (callback) {
				callback($logItem);
			}
			return $logItem;
		};

		self.downloadProgress = function (percent) {
			var el = self._el;
			var percent = percent * 100;
			percent = percent + '%';
			el.$downloadBar.css('width', percent);
		};

		self.unzipProgress = function (percent) {
			var el = self._el;
			var percent = percent * 100;
			percent = percent + '%';
			el.$downloadBar.css('width', percent);
		};

		self._init = function () {
			win.focus();
			self._setupWindows();
			self._bindAll();
			self._setAll();
			self._create_nativeMenus();
			self._toggleProjectOptions();
			var el = self._el;

			app.on('loading:start', function () {
				el.$app.addClass('loading');
			});

			app.on('loading:end', function () {
				el.$app.removeClass('loading');
			});

			app.on('projectChange:start', function () {
				el.$projectCard.addClass('processing');
			});

			app.on('projectChange:end', function () {
				el.$projectCard.removeClass('processing');
			});

			app.on('open', function (event) {
				if (!event.error) {
					var el = self._el;
					app.project.on('set', function () {
						self._setAll();
					});
					self._updateProject();
				} else {
					app.project.on('set', function () {
						self._setAll();
					});
					self._updateProject(true);
				}
			});

			app.message.on('new', function (event) {
				if (event.message === 'Project settings updated.') {
					var settings = app.project.get('settings');
					var JSONFormatter = el.console.JSONFormatter;
					var projectInfo = el.console.document.getElementById('project-info');
					projectInfo.innerHTML = '';
					var formatter = new JSONFormatter(settings, 3, { theme: 'dark' });
					projectInfo.appendChild(formatter.render());
				}
			});

			app.on('new', function (event) {
				if (!event.error) {
					app.project.on('set', function () {
						self._setAll();
						self._updateProject();
					});
					self._updateProject();
				}
			});

			app.on('set', function () {
				self._setAll();
			});

			app.on('init', function (event) {
				if (!event.error) {
					app.cascade.on('set', function () {
						self._setAll();
					});
				}
			});

			app.on('download:start', function () {
				el.$app.addClass('downloading');
			});

			app.on('download:end', function (event) {
				el.$downloadMessage.html('Unpacking Update...');
			});

			app.on('update:end', function (event) {
				if (event.callback) {
					el.$downloadBar.css('width', '100%');
					el.$downloadOverlay.addClass('completed');
					el.$downloadOverlay.css('cursor', 'pointer');
					el.$downloadOverlay.click(function () {
						event.callback();
					});
				} else {
					el.$app.removeClass('downloading');
				}
			});

			self.trigger('init', {
				message: 'User interface initialized successfully.'
			});
		};

		self._init();
	};

	exports.Ui = Ui;
	util.inherits(Ui, EventEmitter);
});
//# sourceMappingURL=ui.js.map
