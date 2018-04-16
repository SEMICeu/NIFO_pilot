// Convert a set of Word documents containing information about eGovernment into xHTML 

/******************************/
/***LOAD MODULES***************/
/******************************/

var fs = require('fs');
var mammoth = require('mammoth');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/

//var args = process.argv.slice(2);
//var filePath = args[0];
//var outputPath = args[1];
var filePath = 'input';
var outputPath = 'output';
var input = fs.readdirSync(filePath);
var output = '';

var options = {
    styleMap: [
    	"h1 => h1.title",
        "p[style-name='HEAD 1'] => h1",
        "p[style-name='HEAD 2'] => h2"
    ]
};

input.forEach(function(fileName){
	mammoth.convertToHtml({path: filePath+'/'+fileName}, options)
	    .then(function(result){
	        var html = result.value; // The generated HTML
	        html = '<html><head></head><body>'+html+'</body></html>';
	        var messages = result.messages; // Any messages, such as warnings during conversion
			output = fileName.split('.');
			fs.writeFileSync(outputPath+"/"+output[0]+".html", unescape(html));
	        fs.writeFileSync('log/'+output[0]+'.log', messages);
	        console.log("Converted "+fileName);
	    })
	    .done();
});