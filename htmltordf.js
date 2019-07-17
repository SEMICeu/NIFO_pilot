// Annotate HTML with RDFa

/******************************/
/***LOAD MODULES***************/
/******************************/
var fs = require('fs');
var mammoth = require('mammoth');
var cheerio = require('cheerio');
var extendCheerio = require('./wrapAll.js');
var request = require('sync-request');
var getRdfaGraph = require('graph-rdfa-processor');
var jsdom = require('jsdom');
const _cliProgress = require('cli-progress');
var rdfaParser = require('ldtr/lib/rdfa/parser');
//var xmldom = require('xmldom');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/
console.log("Converting HTML to RDF");
const bar1 = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
var config = require('./config.json');
var args = process.argv.slice(2);
var filePath = 'html';
var outputPath = 'rdfa';
var outputPathRDF = 'rdf';
var input = fs.readdirSync(filePath).filter(function(file) {
    if(file.indexOf(".html")>-1) return file;
})
var html;
var countryCodes = {};
var countries = [];

bar1.start((input.length*100)+100, 0);

function checkArray(str, arr){
   for(var i=0; i < arr.length; i++){
       if(str.indexOf(arr[i]) > -1)
           return true;
   }
   return false;
}

/*===============*/
/*Get country NAL*/
/*===============*/

var options = {
    headers: {
    'Content-Type':     'application/x-www-form-urlencoded',
    'Accept':           '*/*',
    'User-Agent':       'runscope/0.1'
    }
}

// Start the request
var nalbody = request('GET', 'http://publications.europa.eu/mdr/resource/authority/country/html/countries-eng.html', options).getBody();

$nal = cheerio.load(nalbody, {
    normalizeWhitespace: true
});

$nal('#tbl_countries_a tr').each(function(index, element){
    var country_temp = $nal(this).children("td:nth-of-type(3)").text();
    if(country_temp.length > 0){
        countryCodes[country_temp] = $nal(this).children("td:nth-of-type(1)").text();
        countries.push(country_temp);
    }
});

bar1.increment(100);

/******************************/
/***CREATE HTML + RDFa*********/
/******************************/
input.forEach(function (fileName) {
    /*==================*/
    /*LOAD DOM STRUCTURE*/
    /*==================*/
    html = fs.readFileSync(filePath + '/' + fileName);
    $ = cheerio.load('<html><body>'+html+'</body></html>', {
        normalizeWhitespace: true,
        xmlMode:true
    });
    extendCheerio($);
    //Define additional variables
    var content,
        text,
        country,
        language,
        client,
        currency,
        countryLabel,
        link,
        label

    //Determine country
    for(var i = 0; i < countries.length; i++){
        if(fileName.indexOf(countries[i]) >= 0){
            country = config['prefix']['nifo']+countries[i];
            countryLabel = countries[i];
        }
    }    

    //Add root node and namespaces to document
    $('body').contents().wrapAll('<div resource="'+country+'" prefix="'+config['prefixes']+'"></div>');
    $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['ispartof']+'" href="'+config['prefix']['factsheets']+'"><span property="'+config['prop']['seealso']+'" href="http://dbpedia.org/resource/'+countryLabel+'"></span><span property="'+config['prop']['issued']+'" content="'+config['issued']+'"></span><span property="'+config['prop']['licence']+'" content="'+config['licence']+'"></span><span property="'+config['prop']['country']+'" content="'+config['prefix']['country']+countryCodes[countryLabel]+'"></span>');
    //$( "p:contains('ISA')" ).css("color", "red");#00b0f0
    //$( "p:contains('ISA')" ).remove();
    // $( "h3" ).each(function(index, element){
    //     if($(this).hasClass("subtitle")) {
    //         $(this).css("color", "#00b0f0");
    //     } else {
    //         $(this).css("color", "#0070c0");
    //     }
    // });

    $( "p.subtitle" ).each(function(index, element){
        $(this).css("color", "#00b0f0");
        $(this).css("font-size", "18px");
    });

    $( "img" ).each(function(index, element){
        var oldSrc = $(this).attr('src');
        console.log('oldsrc', oldSrc);
        $(this).attr('src', '../html/' + oldSrc);
    });
    
    
    //$( ".subtitle" ).css("color", "#00b0f0");
    /*=================*/
    /*Annotate document*/
    /*=================*/
    $(config['section_header']).each(function (index, elem) {
        content = $(this).text().trim();
        //console.log("content==>", content);
        switch(content){
            case "Country Profile":
                $(this).nextUntil('h1').each(function (index, elem) {
                    if ($(this).text().indexOf("Population") >= 0) {
                        //Population
                        $(this).attr("property", config['prop']['population']);
                        text= $(this).text().replace(/.*: /,'');
                        $(this).attr("content", text);
                    } else if ($(this).text().indexOf("GDP at market prices") >= 0) {
                        //GDP at market prices
                        $(this).attr("property", config['prop']['gdpnominal']);
                        text= $(this).text().replace(/.*: /,'');
                        $(this).attr("content", text);
                    } else if ($(this).text().indexOf("GDP per inhabitant in PPS") >= 0) {
                        //GDP per inhabitant in PPS
                        $(this).attr("property", config['prop']['gdppercapita']);
                        text= $(this).text().replace(/.*: /,'');
                        $(this).attr("content", text);
                    } else if ($(this).text().indexOf("Area") >= 0) {
                        //Area
                        $(this).attr("property", config['prop']['area']);
                        text= $(this).text().replace(/.*: /,'');
                        $(this).attr("content", text);
                    } else if ($(this).text().indexOf("Capital city") >= 0) {
                        //Capital city
                        $(this).attr("property", config['prop']['capital']);
                        text= $(this).text().replace(/.*: /,'');
                        $(this).attr("content", text);
                    } else if ($(this).text().indexOf("Official EU language") >= 0) {
                        //Official EU language
                        //Obtain language label from text
                        $(this).attr("property", config['prop']['language']);
                        text= $(this).text().replace(/.*: /,'');
                        $(this).attr("content", text);
                    } else if ($(this).text().indexOf("Currency") >= 0) {
                        //Currency
                        currency = $(this).text().replace(config['text_identifier']['currency'], "");
                        $(this).attr("property", config['prop']['currency']);
                        $(this).attr("href", config['prefix']['currency']+currency);
                    } else if ($(this).text().indexOf("Source") >= 0) {
                        //Source
                        $(this).attr("property", config['prop']['source']);
                        text= encodeURI($(this).children('a').attr('href'));
                        $(this).attr("href", text);
                    } else {
                        //else
                    }
                });
                break;
            case "Digital Government Highlights":
                    $(this).nextUntil('h1').each(function (index, elem) {
                        //console.log("content==>Highlights", content);
                    });
                break;
            case "Digital Government Political Communications":
                    // $(this).nextUntil('h1').each(function (index, elem) {
                    //     console.log("content==>Communications", content);
                    // });
                break;
            case "Digital Government Legislation":
                    // $(this).nextUntil('h1').each(function (index, elem) {
                    //     console.log("content==>Legislation", content);
                    // });
                break;
            case "Digital Government Governance":
                    // $(this).nextUntil('h1').each(function (index, elem) {
                    //     console.log("content==>Governance", content);
                    // });
                break;
            case "Digital Government Infrastructure":
                    // $(this).nextUntil('h1').each(function (index, elem) {
                    //     console.log("content==>Infrastructure", content);
                    // });
                break;
            case "Digital Government Services for Citizens":
                    // $(this).nextUntil('h1').each(function (index, elem) {
                    //     console.log("content==>Services for Citizens", content);
                    // });                  
                break;
            case "Digital Government Services for Businesses":
                    // $(this).nextUntil('h1').each(function (index, elem) {
                    //     console.log("content==>Services for Businesses", content);
                    // });
                break;
        }
    });


    /*=================*/
    /* GENERATE OUTPUT */
    /*=================*/
    //Save the RDFa file
    $('a').each(function (index, elem) {
        that = $(this);
        link = that.attr('href');
        if(link !== undefined){
            if (link.startsWith("file")) {
                that.remove();
            } else {
                link2 = encodeURI(link.replace(/\\/g,"/"));
                that.attr('href', link2);
            }
        } else {
            //that.remove();
        }
    });
    var output = fileName.split('.');
    fs.writeFile(outputPath + "/" + output[0] + ".html", unescape($.html()), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The "+countryLabel+" RDFa file was saved!");
    });

    //Save the file in Turtle syntax
    const { JSDOM } = jsdom;
    const { document } = new JSDOM($.html()).window;
    let opts = {baseURI: config['prefix']['nifo']};
    let graph = getRdfaGraph(document, opts);
    fs.writeFile(outputPathRDF + "/" + output[0] + ".ttl", graph.toString() , function (err) {
        if (err) {
            return console.log(err);
        }
        //console.log("The "+countryLabel+" Turtle file was saved!");
    });

    //Save the file in JSON-LD syntax
    var baseUri = config['prefix']['nifo'];
    //DOMParser = xmldom.DOMParser;
    //var result = rdfaParser.parse(
    //    new xmldom.DOMParser().parseFromString(unescape($.html()), 'text/xml'),baseUri);
    var result   = rdfaParser.parse((new JSDOM($.html(), {url: baseUri})).window.document);
    fs.writeFile(outputPathRDF + "/" + output[0] + ".jsonld", JSON.stringify(result, null, 2), function (err) {
        if (err) {
            return console.log(err);
        }
        //console.log("The "+countryLabel+" JSON-LD file was saved!");
    });

    bar1.increment(100);
});
bar1.stop();