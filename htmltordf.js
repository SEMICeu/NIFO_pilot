// Annotate HTML with RDFa

/******************************/
/***LOAD MODULES***************/
/******************************/
var fs = require('fs');
//var mammoth = require('mammoth');
var cheerio = require('cheerio');
var extendCheerio = require('./wrapAll.js');
//var request = require('sync-request');
var getRdfaGraph = require('graph-rdfa-processor');
var jsdom = require('jsdom');
const _cliProgress = require('cli-progress');
var rdfaParser = require('ldtr/lib/rdfa/parser');
var xml2js = require('xml2js');
var parser = new xml2js.Parser({attrkey: 'code', charkey: 'label'});

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
// var countryCodes = {};
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
fs.readFile('assets/countries_EN.xml', function(err, data) {
    parser.parseString(data, function (err, result) {
        result.TABLE.LIBELLE.forEach(function(element){
            countries.push(element);
        });
        createHtmlToRDFa();
    });
});

var createHtmlToRDFa = function() {
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
            label,
            imgSrcCountry
    
        //Determine country
        for(var i = 0; i < countries.length; i++){
            if(fileName.indexOf(countries[i].label) >= 0){
                country = config['prefix']['nifo']+countries[i].label;
                countryLabel = countries[i].label;
                countryCode = countries[i].code.CODE;
            }
        }    
    
        //Add root node and namespaces to document
        $('body').contents().wrapAll('<div resource="'+country+'" prefix="'+config['prefixes']+'"></div>');
        $('body').children('div').first().children('p').first().before('<p class="image-container" style="position:relative"></p>');
        $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['ispartof']+'" href="'+config['prefix']['factsheets']+'"><span property="'+config['prop']['seealso']+'" href="http://dbpedia.org/resource/'+countryLabel+'"></span><span property="'+config['prop']['issued']+'" content="'+config['issued']+'"></span><span property="'+config['prop']['licence']+'" content="'+config['licence']+'"></span><span property="'+config['prop']['country']+'" content="'+config['prefix']['country']+countryCode+'"></span>');
        //$( "p:contains('ISA')" ).css("color", "red");#00b0f0
        $( "p:contains('ISA')" ).remove();
        $( "h3" ).each(function(index, element){
            $(this).css("color", "#0070c0");
        });
    
        $( "p.subtitle" ).each(function(index, element){
            $(this).css("color", "#00b0f0");
            $(this).css("font-size", "18px");
        });
    
        $( "img" ).each(function(index, element){
            var _this = $(this);
            var oldSrc = _this.attr('src');
            if (index == 0) {
                imgSrcCountry = (countryLabel == 'Austria') ? '../assets/country.jpeg' : oldSrc;
            }
        });
    
        /*=================*/
        /*Annotate document*/
        /*=================*/
        $(config['section_header']).each(function (index, elem) {
            content = $(this).text().trim();
            switch(content){
                case "Country Profile":
                    $(this).nextUntil(config['section_header']).each(function (index, elem) {
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
                        } else if ($(this).text().indexOf("Digital Government Indicators") >= 0) {
                            //Digital Government Indicators
                            label = $(this).text()+" "+countryLabel;
                            var sources = [];
                            var source = [];
                            $(this).attr("property", config['prop']['title']);
                            $(this).nextAll('table').first().find('p').each(function(index, element){
                                if ($(this).text().indexOf("Percentage of individuals using the internet for") >= 0) {
                                    var dimensionLabel = $(this).text();
                                    var parentNode =  $(this).parent();
                                    $(this).attr('property', config['prop']['label']);
                                    $(this).attr('resource', config['prefix']['measure']+dimensionLabel.replace(/ /g,''));
                                    $(this).attr('typeOf', config['class']['measure']);
                                    parentNode.attr('property', 'qb:component');
                                    parentNode.attr('href', config['prefix']['measure']+dimensionLabel.replace(/ /g,''));

                                } else if ($(this).text().indexOf("Source:") >= 0) {
                                    sources.push(encodeURI($(this).children('a').first().attr("href")));
                                }
                            });
                            $(this).nextUntil(config['subsection_header']).wrapAll('<div resource="'+config['prefix']['datastructure']+label.replace(/ /g,'')+'" typeOf="'+config['class']['datastructure']+'"></div>');
                            for(var i = 0; i < sources.length; i++){
                                if(source.toString().indexOf(sources[i]) === -1 ){ source.push(sources[i]); }
                            }
                            $(this).after('<span style="display:none;" property="'+config['prop']['source']+'" content="'+source.toString()+'"></span>')
                            $(this).after('<span style="display:none;" property="'+config['prop']['structure']+'" href="'+config['prefix']['datastructure']+label.replace(/ /g,'')+'"></span>');
                            $(this).nextUntil(config['subsection_header']).add($(this)).wrapAll('<div resource="'+config['prefix']['dataset']+label.replace(/ /g,'')+'" typeOf="'+config['class']['dataset']+'"></div>');
                            $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['relation']+'" href="'+config['prefix']['dataset']+label.replace(/ /g,'')+'"></span>');
                        } else {
                            //else
                        }
                        $(this).find("img").addClass('keepElement');
                    });
                    break;
                case "Digital Government Highlights":
                        $(this).nextUntil(config['section_header']).each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                        });
                    break;
                case "Digital Government Political Communications":
                        $(this).nextUntil(config['section_header']).each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                        });
                    break;
                case "Digital Government Legislation":
                        $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['relation']+'" href="'+config['prefix']['legalframework']+countryLabel+'"></span>');
                        $(this).nextUntil(config['section_header']).each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                            $(this).find('a').each(function(index, element){
                                var linkText = $(this).text().toLowerCase();
                                if( checkArray(linkText, Object.keys(config['type_framework']).map(function(k) { return config['type_framework'][k] })) ){
                                    $(this).attr('typeOf', config['class']['legalresource']);
                                    $(this).attr('property', config['prop']['relation']);
                                    var linkURI = encodeURI($(this).attr('href'));
                                    $(this).attr('href', linkURI);
                                    $(this).after('<span resource="'+linkURI+'" property="'+config['prop']['ELItitle']+'" content="'+$(this).text()+'"></span>')
                                }
                            });
                        });
                        $(this).nextUntil(config['section_header']).add($(this).closest(config['section_header'])).wrapAll('<div resource="'+config['prefix']['legalframework']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                    break;
                case "Digital Government Governance":
                        var personURI;
                        $(this).nextUntil(config['section_header'], 'table').each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                            $(this).attr('typeOf', config['class']['person']);
                            $(this).attr('property', config['prop']['relation']);
                            $(this).attr('href', country);
                            $(this).find('p').each(function (index, elem) {
                                //Annotate contact points
                                switch(index){                            
                                    case 1:
                                        //Full name
                                        personURI = config['prefix']['person']+$(this).text().replace(/ /g,'');
                                        $(this).attr("property", config['prop']['name']);
                                        $(this).parents("table").attr("resource", personURI)
                                        break;
                                    case 2:
                                        //Role
                                        var role = $(this).text();
                                        var childNode = $(this).children('strong').first();
                                        $(this).attr("about", personURI);
                                        $(this).attr("property", config['prop']['holds']);
                                        $(this).attr("href", config['prefix']['post']+role.replace(/ /g,''));
                                        childNode.attr("about", config['prefix']['role']+role.replace(/ /g,''));
                                        childNode.attr("typeOf", config['class']['role']);
                                        childNode.attr("property", config['prop']['label']);
                                        childNode.wrap('<span about="'+config['prefix']['post']+role.replace(/ /g,'')+'" typeOf="'+config['class']['post']+'"><span property="'+config['prop']['role']+'" href="'+config['prefix']['role']+role.replace(/ /g,'')+'"></span></span>');
                                        break;                      
                                }
                                if($(this).text().indexOf("Tel.") >= 0) {
                                    $(this).attr("property", config['prop']['telephone']);
                                    $(this).attr("content", $(this).text().replace(/.*: /,''));
                                } else if($(this).text().indexOf("Fax:") >= 0) {
                                    $(this).attr("property", config['prop']['fax']);
                                    $(this).attr("content", $(this).text().replace(/.*: /,''));
                                } else if( ($(this).text().indexOf("E-mail:") >= 0) || ($(this).text().indexOf("Contact:") >= 0) ) {
                                     $(this).attr("property", config['prop']['email']);
                                    $(this).attr("content", $(this).text().replace(/.*: /,''));
                                } else if($(this).text().indexOf("Source:") >= 0) {
                                    $(this).attr("property", config['prop']['url']);
                                    $(this).attr("content", $(this).children('a').first().attr('href'));
                                }
                            });
                            $(this).find('p').each(function (index, elem) {
                                switch(index){    
                                    case 3:
                                    //Contact details wrapper
                                    var blankNode = config['prefix']['contact']+Math.floor((Math.random() * 10000) + 1);
                                    $(this).nextAll().wrapAll('<div about="'+personURI+'" property="'+config['prop']['contact']+'" href="'+blankNode+'"><div resource="'+blankNode+'" typeOf="'+config['class']['contact']+'"></div></div>');
                                    break; 
                                }
                            });
                        });
                    break;
                case "Digital Government Infrastructure":
                        $(this).nextUntil(config['section_header']).each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                        });
                    break;
                case "Digital Government Services for Citizens":
                        $(this).nextUntil(config['section_header']).each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                            $(this).nextAll('table').first().find('p > strong').each(function(index, element){
                                var publicService = $(this).text();
                                var publicServiceURI = config['prefix']['service']+countryLabel+"/"+publicService.replace(/[^\w]/g,'');
                                $(this).attr("about", publicServiceURI);
                                $(this).attr("typeOf", config['class']['publicservice']);
                                $(this).attr("property", config['prop']['title']);
                                $(this).after('<span about="'+publicServiceURI+'" property="'+config['prop']['relation']+'" href="'+country+'"></span>')
                                $(this).parentsUntil('table').nextAll('tr').each(function(index, element){
                                    switch(index){
                                        case 0:
                                            $(this).find('p').last().attr("about", publicServiceURI);
                                            $(this).find('p').last().attr("property", config['prop']['competent']);
                                            break;
                                        case 1:
                                            $(this).find('p').last().attr("about", publicServiceURI);
                                            $(this).find('p').last().attr("property", config['prop']['url']);
                                            $(this).find('p').last().attr("href", $(this).children('a').first().attr('href'));
                                            break;
                                        case 2:
                                            $(this).find('p').last().parent().attr("about", publicServiceURI);
                                            $(this).find('p').last().parent().attr("property", config['prop']['description']);
                                            break;
                                    }
                                });
                            });
                        });           
                    break;
                case "Digital Government Services for Businesses":
                        $(this).nextUntil(config['section_header']).each(function (index, elem) {
                            $(this).find("img").addClass('keepElement');
                            $(this).nextAll('table').first().find('p > strong').each(function(index, element){
                                var publicService = $(this).text();
                                var publicServiceURI = config['prefix']['service']+countryLabel+"/"+publicService.replace(/[^\w]/g,'');
                                $(this).attr("about", publicServiceURI);
                                $(this).attr("typeOf", config['class']['publicservice']);
                                $(this).attr("property", config['prop']['title']);
                                $(this).after('<span about="'+publicServiceURI+'" property="'+config['prop']['relation']+'" href="'+country+'"></span>')
                                $(this).parentsUntil('table').nextAll('tr').each(function(index, element){
                                    switch(index){
                                        case 0:
                                            $(this).find('p').last().attr("about", publicServiceURI);
                                            $(this).find('p').last().attr("property", config['prop']['competent']);
                                            break;
                                        case 1:
                                            $(this).find('p').last().attr("about", publicServiceURI);
                                            $(this).find('p').last().attr("property", config['prop']['url']);
                                            $(this).find('p').last().attr("href", $(this).children('a').first().attr('href'));
                                            break;
                                        case 2:
                                            $(this).find('p').last().parent().attr("about", publicServiceURI);
                                            $(this).find('p').last().parent().attr("property", config['prop']['description']);
                                            break;
                                    }
                                });
                            });
                            if ($(this).text().indexOf("The Digital Government Factsheets") >= 0) {
                                $(this).nextAll().remove();
                                $(this).remove();
                                return false;
                            }
                        });
                    break;
            }
        });
    
        $( "img" ).each(function(index, element){
            var _this = $(this);
            var oldSrc = _this.attr('src');
            if(_this.hasClass("keepElement") && !(oldSrc.indexOf(".x-") >= 0)) {
                _this.attr('src', '../html/' + oldSrc);
            } else {
                _this.remove();
            }
        });
        $('p.image-container').append('<img style="position:relative; width: 20%;left: 42%;z-index: 1;" src="../assets/european-commission.png" /><img style="position:relative;width: 100%;top: -65px;" src="'+'../html/' + imgSrcCountry+'" />')
    
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
}

