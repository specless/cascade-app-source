var fs = require('fs');
module.exports = function (element, utils, _) {
    
    var videojsOptions = {
    	controls : false,
    	preload : 'metadata',
        customControlsOnMobile: true,
        nativeControlForTouch: false,
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
        iosInline : false,
    	simpleControls : false,
    	muted : false,
    	wallpaper: false,
    	aspect : 'auto',
    	audioHover : false, 
    	viewToggleOff : false,
        autoplay: false,
        exit: false,
        panorama: false
    };

    var copyTo = utils.get('projectSettings');
    var copyFrom = utils.get('cascadeSettings');

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
        if (key === 'data-exit') {
            elementOptions.exit = utils.normalizeAttrValue(attr);
        }
    });

    if (elementOptions.simpleControls) {
        videojsOptions.controls = true
    }

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
    if (elementOptions.iosInline === true) {
        element.jsDependencies.push('ad-video-inline');
        videojsOptions.plugins.speclessInlinePlayer = {
            playerType : elementOptions.playerType,
            muted : elementOptions.muted,
            autoplay : elementOptions.autoplay
        }
    }

    if (elementOptions.panorama === true) {
        attrs['data-pano-src'] = '/assets/360-video-wrapper.html';
        element.jsDependencies.push('ad-video-panorama');
        var copyTo = utils.get('projectSettings').path + '/assets/360-video-wrapper.html';
        var copyFrom = utils.get('cascadeSettings').path + '/plugins/ad-video/360-video-wrapper.html';
        fs.createReadStream(copyFrom).pipe(fs.createWriteStream(copyTo));
        videojsOptions.plugins.speclessPanoPlayer = {}
    }

    videojsOptions.plugins.speclessCascade = elementOptions;
    attrs['data-setup'] = JSON.stringify(videojsOptions);
    element.node.attrs = attrs;
    return element
}