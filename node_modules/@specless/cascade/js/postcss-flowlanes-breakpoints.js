var postcss = require('postcss');
var _ = require('underscore');
var utils = require('../js/utils.js');

module.exports = postcss.plugin('flowlanes-breakpoints', function (opts) {
    opts = opts || {
    	flowlaneSyntax : 'flowlane',
    	breakpointSyntax : 'breakpoint',
    	defineFlowlaneSyntax : 'define-flowlane',
    	breakpointDefault : 'max',
    	attrPrefix : '[data-',
    	attrJoiner : "~='",
    	attrEnding : "']",
    	flowlaneProps : ['min-width', 'max-width', 'min-scale', 'max-scale'],
    	flowlaneDefaults: {
			breakpoints : [],
			'min-width' : 0,
			'max-width' : 10000,
			'min-scale' : 0,
			'max-scale' : 1000
		},
		logResults : false,
    	logTo : 'file'
    }
    var flowlaneList = {};

    var logFlowlane = function (object, flowlane) {
    	if (_.has(object, flowlane) === false) {
    		object[flowlane] = opts.flowlaneDefaults;
    	}
    	return object;
    }

    var logBreakpoint = function (object, flowlane, bpType, bpValue) {
    	var breakpoint = {
    		type : bpType,
    		value : bpValue
    	}
    	if (_.has(object, flowlane) === false) {
    		object[flowlane].breakpoints = [];
    	}
    	object[flowlane].breakpoints.push(breakpoint);
    	return object;
    }

    var addToFlowlaneList = function (objectA, objectB) {
    	_.each(objectB, function (value, key) {  
		    if (_.has(objectA, key) === false) {
		    	objectA[key] = value;
		    } else {
		    	objectA[key] = objectA[key].concat(objectB[key]);
		    	objectA[key] = _.uniq(objectA[key]);
		    }
		});
    }

    return function (css, result) {
    	var pathArray = css.source.input.file.split('/');
    	var file = {
    		path : pathArray.join('/'),
    		name : pathArray.pop(),
    		folder : pathArray.join('/'),
    		component : pathArray.pop()
    	}

    	css.walkAtRules(function (node) {
			if (node.name === opts.flowlaneSyntax) {
				var height = node.params.replace(/([\(\)])/g, '');
				var selector = opts.attrPrefix + opts.flowlaneSyntax + opts.attrJoiner + height + opts.attrEnding;
				if (node.parent.type !== "root") {
					selector = '&' + selector;
				}
				node.type = 'rule';
				node.selector = selector;
				logFlowlane(flowlaneList, height);

				node.walkAtRules(function(node) {
					if (node.name === opts.breakpointSyntax) {
						values = node.params.replace(/\s+/g, '').replace(/([\(\)])/g, '').split(':');
						if (values.length === 2) {
							var type = values[0];
							var value = values[1];
							
						} else {
							var type = opts.breakpointDefault;
							var value = values[0];
						}
						var mediaParams = "screen and (" + type + "-aspect-ratio: " + value + " / " + height + ")";
						node.name = "media";
						node.params = mediaParams;
						logBreakpoint(flowlaneList, height, type, value);
					}
				});

			} else if (node.name === opts.breakpointSyntax) {
				values = node.params.replace(/\s+/g, '').replace(/([\(\)])/g, '').split(':');
				if (values.length === 2) {
					var type = values[0];
					var value = values[1];
					
				} else {
					var type = 'max';
					var value = values[0];
				}
				var mediaParams = "screen and (" + type + "-width: " + value + ")";
				node.name = "media";
				node.params = mediaParams;
			}
    	});
		css.walkAtRules(function (node) {
			if (node.name === opts.defineFlowlaneSyntax) {
				var flowlane = node.params.replace(/([\(\)])/g, '');
				node.walkDecls(function (node) {
					if (_.has(flowlaneList, flowlane) === true) {
						var flowlaneObj = flowlaneList[flowlane];
						_.each(opts.flowlaneProps, function(prop) {
							if (node.prop === prop) {
								flowlaneObj[prop] = node.value;
							}
						});
					}
				});
				node.remove();
			}
		});

		if (opts.logResults === true) {
			if (opts.logTo === 'project') {
				utils.logComponentDetails(file.component, 'css', 'flowlanes', flowlaneList);
			}
		}

		flowlaneList = {};

		// _.each(settings.components, function(component) {
		// 	if (component.name === file.component) {

		// 	}
		// });

		// var path = './build/' + file.component + '/' + file.name + 'flowlanes.json';
		// jetpack.write(path, flowlaneList);

   	}
});