define(['exports'], function (exports) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	var EventEmitter = require('events');
	var util = require('util');

	var Messages = function Messages() {

		var self = this;
		var app = global.app;

		self.codes = {
			0: {
				title: "Gulp Console",
				handle: function handle(message, details) {
					var category = "gulp";
					var type = "message";
					if (app.ui) {
						app.ui.log(message, details, type, category);
					}
				}
			},
			1: {
				title: "Cascade Compiler Commands",
				handle: function handle(message, details) {
					var category = "cascade";
					var type = "command";
					if (app.ui) {
						app.ui.log(message, details, type, category);
					}
				}
			},
			2: {
				title: "Cascade Compiler General Messages",
				handle: function handle(message, details) {
					var category = "cascade";
					var type = "message";
					if (app.ui) {
						app.ui.log(message, details, type, category);
					}
				}
			},
			3: {
				title: "Cascade Compiler General Errors",
				handle: function handle(message, details) {
					var category = "cascade";
					var type = "error";
					if (app.ui) {
						app.ui.log(message, details, type, category);
					}
				}
			},
			4: {
				title: "Cascade Compile Success",
				handle: function handle(message, details) {
					var category = "cascade";
					var type = "success";
					if (app.ui) {
						app.ui.notify("Compile Success", message, 'success');
						app.ui.log(message, details, type, category);
					}
				}
			},
			5: {
				title: "Cascade Compile Failure",
				handle: function handle(message, details) {
					var category = "cascade";
					var type = "error";
					if (app.ui) {
						app.ui.notify("Compile Failed", message, 'failure');
						app.ui.log(message, details, type, category);
					}
				}
			},
			6: {
				title: "Application Error",
				handle: function handle(message, details) {
					var category = "app";
					var type = "error";
					if (app.ui) {
						app.ui.log(message, details, type, category);
						app.ui.alert(message, details);
					}
				}
			},
			7: {
				title: "Application Message",
				handle: function handle(message, details) {
					var category = "app";
					var type = "message";
					if (app.ui) {
						app.ui.log(message, details, type, category);
					}
				}
			},
			8: {
				title: "Application Warning",
				handle: function handle(message, details) {
					var category = "app";
					var type = "message";
					if (app.ui) {
						app.ui.log(message, details, type, category);
					}
				}
			}
		};

		self.send = function (name, data, code) {
			var message = name;
			var details = null;
			if (self.codes[code]) {
				if (data.error) {
					details = data.error;
				}
				if (data.message) {
					message = data.message;
				}
				self.codes[code].handle(message, details);
				self.emit('new', {
					message: message,
					code: code,
					details: details
				});
			}

			if (code === 7) {
				console.log(data.message);
			}
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
