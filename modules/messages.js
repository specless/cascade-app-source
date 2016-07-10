define(['exports'], function (exports) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	var EventEmitter = require('events');
	var util = require('util');

	/**
  * Creates an instance of the central messaging manager that handles all messaging, alerts, notifications, logging, and errors, within the application. 
  * @constructor
   * @param {object} cb - Callback to run after the message manager has been initialized.
  */
	var Messages = function Messages(cb) {

		var self = this;
		var app = global.app;

		self.codes = {
			0: {
				title: "Gulp Console",
				handle: function handle(message, details, callback) {
					var category = "gulp";
					var type = "message";
					app.ui.log(message, details, type, category);
				}
			},
			1: {
				title: "Cascade Compiler Commands",
				handle: function handle(message, details, callback) {
					var category = "cascade";
					var type = "command";
					app.ui.log(message, details, type, category);
				}
			},
			2: {
				title: "Cascade Compiler General Messages",
				handle: function handle(message, details, callback) {
					var category = "cascade";
					var type = "message";
					app.ui.log(message, details, type, category);
				}
			},
			3: {
				title: "Cascade Compiler General Errors",
				handle: function handle(message, details, callback) {
					var category = "cascade";
					var type = "error";
					app.ui.log(message, details, type, category);
				}
			},
			4: {
				title: "Cascade Compile Success",
				handle: function handle(message, details, callback) {
					var category = "cascade";
					var type = "success";
					app.ui.notify("Compile Success", message, type, callback);
					app.ui.log(message, details, type, category);
				}
			},
			5: {
				title: "Cascade Compile Failure",
				handle: function handle(message, details, callback) {
					var category = "cascade";
					var type = "error";
					app.ui.notify("Compile Failed", message, 'failure', callback);
					app.ui.log(message, details, type, category);
				}
			},
			6: {
				title: "Application Error",
				handle: function handle(message, details, callback) {
					var category = "app";
					var type = "error";
					app.ui.log(message, details, type, category);
					app.ui.alert(message, details, callback);
				}
			},
			7: {
				title: "Application Message",
				handle: function handle(message, details, callback) {
					var category = "app";
					var type = "message";
					app.ui.log(message, details, type, category);
				}
			},
			8: {
				title: "Application Warning",
				handle: function handle(message, details, callback, featureToggle) {
					var category = "app";
					var type = "warning";
					app.ui.notify(message, details, type, callback, featureToggle);
					app.ui.log(message, details, type, category);
				}
			},
			9: {
				title: "Application Success",
				handle: function handle(message, details, callback, featureToggle) {
					var category = "app";
					var type = "success";
					app.ui.notify(message, details, type, callback, featureToggle);
					app.ui.log(message, details, type, category);
				}
			}
		};

		self.send = function (name, data, code) {
			var message = name;
			var details;
			var callback;
			var featureToggle;
			if (self.codes[code]) {
				if (data.error) {
					details = data.error;
				}
				if (data.message) {
					message = data.message;
				}

				if (data.callback) {
					callback = data.callback;
				}

				if (data.featureToggle) {
					featureToggle = data.featureToggle;
				}

				if (!app.ui || app.ui && !app.ui.ready) {
					// Project console user interface isn't ready yet.. so log to dev console instead.
					if (details) {
						console.groupCollapsed(message);
						console.info(details);
						console.groupEnd();
					} else {
						console.groupCollapsed(message);
						console.info("No additional information.");
						console.groupEnd();
					}
				} else {
					// Project console user interface is ready, so handle the message via the UI instead.
					self.codes[code].handle(message, details, callback, featureToggle);
				}
			}

			// Emit the event
			self.emit('new', {
				message: message,
				code: code,
				details: details
			});
		};

		self.logStream = function (stream) {
			stream.stdout.setEncoding('utf8');
			stream.stdout.on('data', function (data) {
				var str = data.toString(),
				    lines = str.split(/(\r?\n)/g);
				for (var i = 0; i < lines.length; i++) {
					self.codes[0].handle(str);
				}
			});
			stream.stderr.on('data', function (data) {
				var str = data.toString(),
				    lines = str.split(/(\r?\n)/g);
				for (var i = 0; i < lines.length; i++) {
					self.codes[0].handle(str);
				}
			});
		};
	};

	exports.Messages = Messages;
	util.inherits(Messages, EventEmitter);
});
//# sourceMappingURL=messages.js.map
