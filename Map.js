
var Map = (function() {
	var Map = function(bushes, blocks, sinkholes, yarnballs) {
		this.bushes = bushes;
		this.blocks = blocks;
		this.sinkholes = sinkholes;
		this.yarnballs = yarnballs
	};
	
	return Map;
})();

var MapLibrary = {};

MapLibrary.Map1 = (function () {

    return new Map(
	    (function () {
	        var bushes = [];
	        for (var i = 4; i <= 18; i++) {
	            for (var j = 4; j <= 18; j++) {
	                if (!(i == 11 && j == 11))
	                    bushes.push({ x: i, y: j });
	            }
	        }
	        return bushes;
	    })(),
	    [],
	    [],
	    []);

});