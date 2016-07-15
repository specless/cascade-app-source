module.exports = function (element, utils, _) {
    
    var videojsOptions = {
    	controls : false,
    	preload : 'metadata',
        customControlsOnMobile: true,
        nativeControlsForTouch: false,
    	loop : false,
    	poster : false,
        plugins : {
            speclessCascade: {},
            speclessTracking:{}
        }
    };

    var elementOptions = {
    	playerType : 'html5',
    	name : null,
    	sizing : 'contain',
        iphoneInline : false,
    	simpleControls : false,
    	muted : false,
    	wallpaper: false,
    	aspect : '16x9',
    	audioHover : false, 
    	viewToggleOff : false,
        autoplay: false,
    };

    var attrs = element.node.attrs;

    _.each(attrs, function (attr, key) {
    	camelKey = utils.snakeToCamel(key);
    	if (_.has(elementOptions, camelKey) === true) {
    		elementOptions[camelKey] = utils.normalizeAttrValue(attr);
    		delete attrs[key]
    	}
    	if (_.has(videojsOptions, camelKey) === true) {
    		videojsOptions[camelKey] = utils.normalizeAttrValue(attr);
    		delete attrs[key]
    	}
        if (key === 'src') {
            var urlTest = attr.split('youtube.com/watch');
            if (urlTest.length > 1) {
                elementOptions.playerType = 'youtube';
            }
        }
    });
    if (attrs['class']) {
        attrs['class'] = attrs['class'] + ' video-js';
    } else {
        attrs['class'] = 'video-js';
    }
    attrs['class']
    if (elementOptions.playerType === 'youtube') {
        element.jsDependencies.push('ad-video-youtube');
        videojsOptions.techOrder = ['youtube'];
        videojsOptions.sources = [{
            'type': 'video/youtube',
            'src': attrs.src
        }];
    }
    if (elementOptions.iphoneInline === true) {
        element.jsDependencies.push('ad-video-inline');
        videojsOptions.plugins.speclessInlinePlayer = {
            playerType : elementOptions.playerType
        }
    }
    videojsOptions.plugins.speclessCascade = elementOptions;
    attrs['data-setup'] = JSON.stringify(videojsOptions);
    element.node.attrs = attrs;
    return element
}