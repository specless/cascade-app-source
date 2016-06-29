var postcss = require('postcss');
var _ = require('underscore');
var utils = require('../js/utils.js');

module.exports = postcss.plugin('context-queries', function (opts) {
    opts = opts || {
    	contexts : ['custom'],
    	operators : [':', '>', '<', '=='],
    	attrPrefix : '[data-',
    	attrJoiner : "~='",
    	attrExplicitJoiner : "='",
    	attrEnding : "']",
    	logResults : false,
    	logTo : 'file',
    }
    var contextList = {};
    var layoutList = [];

    var logContext = function (object, feature, value) {
    	if (_.has(object, feature) === false) {
    		object[feature] = [];
    	}
    	object[feature].push(value);
    	object[feature] = _.uniq(object[feature]);
    	return object;
    }

    var addToContextList = function (objectA, objectB) {
    	_.each(objectB, function (value, key) {  
		    if (_.has(objectA, key) === false) {
		    	objectA[key] = value;
		    } else {
		    	objectA[key] = objectA[key].concat(objectB[key]);
		    	objectA[key] = _.uniq(objectA[key]);
		    }
		});
    }

    var parseLayouts = function (string) {
	  var string = string.split('/');
	  for (p = 0; p < string.length; p++) { 
	      var split = string[p].split('x');
	      string[p] = {
	      	w: split[0],
	        h: split[1]
	      }
	      string[p].w = string[p].w.replace('[', '').replace(']', '').split('-');
	      string[p].h = string[p].h.replace('[', '').replace(']', '').split('-');      
	      if (string[p].w.length == 1) {
	      	string[p].w = string[p].w[0];
	      }  
	      if (string[p].h.length == 1) {
	      	string[p].h = string[p].h[0];
	      }
	  }
	  layoutList = layoutList.concat(string);
	  layoutList = _.uniq(layoutList);
	  return string;
	}

	var layoutSelector = function (layouts) {
		layouts = parseLayouts(layouts);
		var selector = '';
	    var tempSelector;
	    var contextName = '';
	    var contextLog = {};
	    var attrStart = opts.attrPrefix;
	    var attrWidth = "ad-width" + opts.attrJoiner;
	    var attrHeight = "ad-height" + opts.attrJoiner;
	    var attrEnd = opts.attrEnding;
		for (q = 0; q < layouts.length; q++) {
		    if (layouts[q].w.constructor === Array) {
		    	tempSelector = attrStart + 'min-' + attrWidth + layouts[q].w[0] + attrEnd;
		        tempSelector = tempSelector + attrStart + 'max-' + attrWidth + layouts[q].w[1] + attrEnd;
		        selector = selector + tempSelector;
		        contextName = 'min-' + attrWidth.replace(opts.attrJoiner, '');
		        logContext(contextLog, contextName, layouts[q].w[0]);
		        contextName = 'max-' + attrWidth.replace(opts.attrJoiner, '');
		        logContext(contextLog, contextName, layouts[q].w[1]);

		    } else {
		    	tempSelector = attrStart + attrWidth + layouts[q].w + attrEnd;
		        selector = selector + tempSelector;
		        contextName = attrWidth.replace(opts.attrJoiner, '');
		        logContext(contextLog, contextName, layouts[q].w);
		    }
		    if (layouts[q].h.constructor === Array) {
		    	tempSelector = attrStart + 'min-' + attrHeight + layouts[q].h[0] + attrEnd;
		        tempSelector = tempSelector + attrStart + 'max-' + attrHeight + layouts[q].h[1] + attrEnd;
		        selector = selector + tempSelector
		        contextName = 'min-' + attrHeight.replace(opts.attrJoiner, '');
		        logContext(contextLog, contextName, layouts[q].h[0]);
		        contextName = 'max-' + attrHeight.replace(opts.attrJoiner, '');
		        logContext(contextLog, contextName, layouts[q].h[1]);
		    } else {
		    	tempSelector = attrStart + attrHeight + layouts[q].h + attrEnd;
		        selector = selector + tempSelector;
		        contextName = attrHeight.replace(opts.attrJoiner, '');
		        logContext(contextLog, contextName, layouts[q].h);
		    }
		    selector = selector + ", ";
	  	}
	  	result = {
	  		string : selector.replace(/,\s*$/, ''),
	  		log : contextLog
	  	}
	  	return result;
	}

	var createSelector = function (name, params, atRoot) {
    	var selectorList = [];
    	var contextLog = {};
    	var result;

		params = params.replace(/\s+/g, '');
		rules = params.split(',');
		if (params !== '') {
				_.each(rules, function(rule) {
					var selector = [];
					var selectorString = '';
					var args = rule.split(')and(');
					_.each(args, function(arg) {
						arg = arg.replace(/([\(\)])/g, '');
						if (name === 'layout') {
							layouts = layoutSelector(arg);
							selectorString = layouts.string;
							addToContextList(contextLog, layouts.log);
						} else {
							var success = false;
							_.each(opts.operators, function(operator) {
								var splitArg = arg.split(operator);
								if (splitArg.length > 1) {
									var feature = name + '-' + splitArg[0];
									var value = splitArg[1].replace(/([\'\"])/g, '');
									// Do we need to lower-case and replace spaces in the value also?
									var joiner = opts.attrJoiner;
									if (operator === '>') {
										feature = 'min-' + feature;
									} else if (operator === '<') {
										feature = 'max-' + feature;
									} else if (operator === '==') {
										joiner = opts.attrExplicitJoiner;
									}
									var attrSelector = opts.attrPrefix + feature + joiner + value + opts.attrEnding;
									selector.push(attrSelector);
									logContext(contextLog, feature, value);
								}
							});
						}
					});
					selector = selector.join('');
					if (name === 'layout') {
						selector = selectorString;
					}
					if (atRoot === false) {
						selector = '&' + selector;
					}
					selectorList.push(selector);
				});
			result = {
				string : selectorList.join(', '),
				log : contextLog
			}
		} else {
			result = {
				string : null,
				log : null
			}
		}
		return result;
    }

    return function (css, result) {
    	var pathArray = css.source.input.file.split('/');
    	var file = {
    		path : pathArray.join('/'),
    		name : pathArray.pop(),
    		folder : pathArray.join('/'),
    		component : pathArray.pop()
    	}
    	css.walk(function (node) {
    		_.each(opts.contexts, function(context) {
	    		if (node.type === "atrule" && node.name === context) {
	    			var atRoot = false;
	    			if (node.parent.type === "root") {
	    				atRoot = true;
	    			}
	    			var selector = createSelector(node.name, node.params, atRoot);
	    			node.type = "rule";
	    			// Need to figure out below what to set the selector string to if there are no params
	    			if (selector.string === null) {
	    				node.selector = ".test";
	    			} else {
	    				node.selector = selector.string;
	    				addToContextList(contextList, selector.log);
	    			}
	    		}
	    	});
    	});
    	
    	if (opts.logResults === true) {
			if (opts.logTo === 'project') {
				utils.logComponentDetails(file.component, 'css', 'contexts', contextList);
				utils.logComponentDetails(file.component, 'css', 'layouts', layoutList);
			}
		}

		contextList = {};
    	layoutList = [];

     //    _.each(contextList, function(value, key) {
     //    	result.messages.push({
	    //         type:    'contexts',
	    //         plugin:  'context-queries',
	    //         text: 'Context Query Added: "' + key + '"'
	    //     });
    	// });
    	// _.each(layoutList, function(layout) {
    	// 	var width = layout.w;
    	// 	var height = layout.h;
    	// 	if (typeof width === 'object') {
    	// 		width = '[' + width.join('-') + ']'
    	// 	}
    	// 	if (typeof height === 'object') {
    	// 		height = '[' + height.join('-') + ']'
    	// 	}
     //    	result.messages.push({
	    //         type:    'layouts',
	    //         plugin:  'context-queries',
	    //         text: 'Layout Added: "' + width + 'x' + height + '"'
	    //     });
    	// });
   	}
});