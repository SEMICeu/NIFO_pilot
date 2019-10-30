// Convert a set of Word documents containing information about eGovernment into xHTML 

/******************************/
/***LOAD MODULES***************/
/******************************/

var fs = require('fs');
var path = require("path");
var mammoth = require('mammoth');
const _cliProgress = require('cli-progress');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/

console.log("Converting DOCX to HTML");
const bar1 = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
var filePath = 'docx';
var outputPath = 'html';
var input = fs.readdirSync(filePath);
var output;
var imageIndex = 0;
var fileIndex = 0;
bar1.start((input.length*100), 0);

var options = {
    styleMap: [
    	"h1 => h1.title",
        "p[style-name='HEAD 1'] => h1",
        "p[style-name='HEAD 2'] => h2",
        "p[style-name='Caption'] => h2.caption",
        "p[style-name='HEAD 3'] => h3",
        "p[style-name='Subtitle'] => p.subtitle"
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
    bar1.increment(100);
	mammoth.convertToHtml({path: filePath+'/'+fileName}, options)
	    .then(function(result){
            var generatedHTML = result.value; // The generated HTML
            var html = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>'+generatedHTML+'</body></html>'
	        var messages = result.messages; // Any messages, such as warnings during conversion
			output = fileName.split('.docx');
			fs.writeFileSync(outputPath+"/"+output[0]+".html", unescape(html));
	        fs.writeFileSync('log/'+output[0]+'.log', messages);
	    })
	    .done();
});
bar1.stop();