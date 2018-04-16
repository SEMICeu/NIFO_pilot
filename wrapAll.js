/******************************/
/***CHEERIO wrapAll EXTENSION**/
/******************************/

var cheerio = require('cheerio');
var _ = require('lodash');

module.exports = (function() {
    var extendCheerio = function extendCheerio($) {
        _.extend($.prototype, {
            wrapAll: function(wrapper) {
                if (this.length < 1) {
                    return this;
                }

                if (this.length < 2 && this.wrap) { // wrap not defined in npm version,
                    return this.wrap(wrapper);      // and git version fails testing.
                }

                var elems = this;
                var section = $(wrapper);
                var marker = $('<div>');
                marker = marker.insertBefore(elems.first()); // in jQuery marker would remain current
                elems.each(function(k, v) {                  // in Cheerio, we update with the output.
                    section.append($(v));
                });
                section.insertBefore(marker); 
                marker.remove();
                return section;                 // This is what jQuery would return, IIRC.
            },
        });
    };

    if ("test") {
        $ = cheerio.load("<html><body><div><p><span>This <em>is <i>test</p><span>More <em>test");
        extendCheerio($);
        $('span').wrapAll('<section>');
        var passed = ($.html() === '<html><body><div><p><section><span>This <em>is <i>test</i></em>'+
                          '</span><span>More <em>test</em></span></section></p></div></body></html>');
        //console.log("passed: " + (passed ? "yes" : "no"));
        // console.log($.html() + "\n\n");
    }
    return extendCheerio;
})();