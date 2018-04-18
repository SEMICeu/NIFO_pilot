// Convert a set of Word documents containing information about eGovernment into xHTML 

/******************************/
/***LOAD MODULES***************/
/******************************/

var fs = require('fs');
var path = require("path");
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
var output;
var imageIndex = 0;
var fileIndex = 0;

var options = {
    styleMap: [
    	"h1 => h1.title",
        "p[style-name='HEAD 1'] => h1",
        "p[style-name='HEAD 2'] => h2"
    ],
    convertImage: mammoth.images.imgElement(function(element) {
        imageIndex++;
        var extension = element.contentType.split("/")[1];
        var filename = fileIndex+"-"+imageIndex + "." + extension;
        
        return element.read().then(function(imageBuffer) {
            var imagePath = path.join(outputPath, "img", filename);
 			fs.writeFile(imagePath, imageBuffer, function(err) {
                if(err) {
                    console.log(err);
                }
            }); 

        return {src: "img/"+filename, alt: filename};
       
        })
    })
};

input.forEach(function(fileName){
	fileIndex++
	mammoth.convertToHtml({path: filePath+'/'+fileName}, options)
	    .then(function(result){
	        var html = result.value; // The generated HTML
	        var messages = result.messages; // Any messages, such as warnings during conversion
			output = fileName.split('.');
			fs.writeFileSync(outputPath+"/"+output[0]+".html", unescape(html));
	        fs.writeFileSync('log/'+output[0]+'.log', messages);
	        console.log("Converted "+fileName);
	    })
	    .done();
});