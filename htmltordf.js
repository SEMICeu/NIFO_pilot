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
        $ = cheerio.load(html, {
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
            } else if (fileName.indexOf('UK') >= 0 || fileName.indexOf('United Kingdom') >= 0 ||fileName.indexOf('United_Kingdom') >= 0) {
                // The United Kingdom
                country = config['prefix']['nifo']+'United%20Kingdom';
                countryLabel = 'UK';
                countryCode = 'GBR';
            } else if (fileName.indexOf('North_Macedonia') >= 0 || fileName.indexOf('North Macedonia') >= 0 ) {
                // Republic of North Macedonia
                country = config['prefix']['nifo']+'North%20Macedonia';
                countryLabel = 'North_Macedonia';
                countryCode = 'MKD';
            } else if (fileName.indexOf('Czech_Republic') >= 0 || fileName.indexOf('Czech Republic') >= 0 || fileName.indexOf('CzechRep') >= 0) {
                // Czech Republic
                country = config['prefix']['nifo']+'Czech%20Republic';
                countryLabel = 'Czech_Republic';
                countryCode = 'CZE';
            } else if (fileName.indexOf('EU_editor') >= 0 || fileName.indexOf('EU') >= 0 || fileName.indexOf('EU_v3.00') >= 0) {
                // European Union
                country = config['prefix']['nifo']+'European%20Union';
                countryLabel = 'European_Union';
                countryCode = 'EU';
            } else if (fileName.indexOf('Türkiye') >= 0) {
                // Turkey
                country = config['prefix']['nifo']+'Turkey';
                countryLabel = 'Turkey';
                countryCode = 'TUR';
            }
        }    
    
        //Add root node and namespaces to document
        $('body').contents().wrapAll('<div resource="'+country+'" prefix="'+config['prefixes']+'"></div>');
        $('body').children('div').first().children('p').first().before('<p class="image-container" style="text-align: center;"></p>');
        $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['ispartof']+'" href="'+config['prefix']['factsheets']+'"><span property="'+config['prop']['seealso']+'" href="http://dbpedia.org/resource/'+countryLabel+'"></span><span property="'+config['prop']['issued']+'" content="'+config['issued']+'"></span><span property="'+config['prop']['licence']+'" content="'+config['licence']+'"></span><span property="'+config['prop']['country']+'" content="'+config['prefix']['country']+countryCode+'"></span>');
        // $( "p:contains('ISA')" ).remove();
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
                imgSrcCountry = oldSrc;
            }
        });
    
        /*=================*/
        /*Annotate document*/
        /*=================*/
        $(config['section_header']).each(function (index, elem) {
            content = $(this).text().trim();
            switch(content){
                case "Country Profile":
                case "Profile":
                case "Interoperability State-of-Play":
                    $(this).nextUntil(config['section_header']).each(function (index, elem) {
                        $(this).find("img").addClass('keepElement');
                        $(this).find('a').each(function(index, element){
                            var linkText = $(this).text().toLowerCase();
                            if( checkArray(linkText, Object.keys(config['type_framework']).map(function(k) { return config['type_framework'][k] })) ){
                                $(this).attr('typeOf', config['class']['country']);
                                $(this).attr('property', config['prop']['relation']);
                                var linkURI = encodeURI($(this).attr('href'));
                                $(this).attr('href', linkURI);
                                $(this).after('<span resource="'+linkURI+'" property="'+config['prop']['ELItitle']+'" content="'+$(this).text()+'"></span>')
                            }
                        });
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
                        } else if ($(this).text().indexOf("Official EU language") >= 0 || $(this).text().indexOf("Official language") >= 0) {
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
                            // If <a>...</a> children doesn't exist
                            // Example: <p property="dct:source">Source: European Interoperability Framework Monitoring Mechanism 2019</p>
                            // text is undefined
                            if(text !== 'undefined') {
                                $(this).attr("href", text);
                            }
                        } else if ($(this).text().indexOf("Digital Public Administration Indicators") >= 0) {
                            //Digital Public Administration Indicators
                            label = $(this).text()+" "+countryLabel;
                            var sources = [];
                            var source = [];
                            $(this).attr("property", config['prop']['title']);
                            $(this).nextAll('table').first().find('img').each(function(index, element){
                                $(this).addClass('keepElement');
                            });
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
                                if(source.toString().indexOf(sources[i]) === -1 ){
                                    // source[i] can be undefined
                                    if(sources[i] !== 'undefined') {
                                        source.push(sources[i]); // push only if source[i] exist
                                    }
                                }
                            }
                            $(this).after('<span style="display:none;" property="'+config['prop']['source']+'" content="'+source.toString()+'"></span>')
                            $(this).after('<span style="display:none;" property="'+config['prop']['structure']+'" href="'+config['prefix']['datastructure']+label.replace(/ /g,'')+'"></span>');
                            $(this).nextUntil(config['subsection_header']).add($(this)).wrapAll('<div resource="'+config['prefix']['dataset']+label.replace(/ /g,'')+'" typeOf="'+config['class']['dataset']+'"></div>');
                            $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['relation']+'" href="'+config['prefix']['dataset']+label.replace(/ /g,'')+'"></span>');
                        } else if ($(this).text().indexOf("Interoperability State of Play") >= 0) {
                            //Interoperability State of Play
                            $(this).attr("property", config['prop']['title']);
                            $(this).nextUntil(config['section_header'], 'p:contains("Source:")').children('a').attr('property', config['prop']['relation']);
                        } else if ($(this).text().indexOf("eGovernment State of Play") >= 0) {
                            //eGovernment State of Play
                            $(this).attr("property", config['prop']['title']);
                            $(this).nextUntil(config['section_header'], 'p:contains("Source:")').children('a').attr('property', config['prop']['relation']);
                            let isFirstImg = false;
                            $(this).nextUntil(config['section_header']).each(function(index, element){
                                if ($(this).attr('src') && !isFirstImg) {
                                    $(this).addClass('keepElement');
                                    isFirstImg = true;
                                }
                            });
                            // $(this).first().find("img").addClass('keepElement');
                        } else {
                            //else
                        }
                        //$(this).find("img").addClass('keepElement');
                    });
                    $(this).nextUntil(config['section_header']).add($(this).closest(config['section_header'])).wrapAll('<div resource="'+config['prefix']['country']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                    break;
                case "Digital Public Administration Highlights":
                    $(this).nextUntil(config['section_header']).each(function (index, elem) {
                        switch(index){
                            case 0:
                                // Digital Public Administration Political Communications
                                $(this).attr("property", config['prop']['title']);
                                text= $(this).text().replace(/.*: /,'');
                                $(this).attr("content", text);
                                break;
                            case 1:
                                // Digital Public Administration Legislation
                                $(this).attr("property", config['prop']['title']);
                                text= $(this).text().replace(/.*: /,'');
                                $(this).attr("content", text);
                                break;
                            case 2:
                                // Digital Public Administration Governance
                                $(this).attr("property", config['prop']['title']);
                                text= $(this).text().replace(/.*: /,'');
                                $(this).attr("content", text);
                                break;
                            case 3:
                                // Digital Public Administration Infrastructure
                                $(this).attr("property", config['prop']['title']);
                                text= $(this).text().replace(/.*: /,'');
                                $(this).attr("content", text);
                                break;
                        }
                        $(this).find("img").addClass('keepElement');
                    });
                    break;
                case "Digital Public Administration ICT Tools":
                case "Funding programmes for Digital Public Administration in the European Union":
                case "Executive Summary":
                    $(this).nextUntil(config['section_header']).each(function (index, elem) {
                        $(this).find("img").addClass('keepElement');
                    });
                    break;
                case "Digital Public Administration Political Communications":
                case "Political Initiatives for Digital Public Administration in the European Union":
                    $(this).nextUntil(config['section_header']).each(function (index, elem) {
                        content = $(this).text();
                        $(this).find("img").addClass('keepElement');
                        $(this).find('a').each(function(index, element){
                            var linkText = $(this).text().toLowerCase();
                            if( checkArray(linkText, Object.keys(config['type_framework']).map(function(k) { return config['type_framework'][k] })) ){
                                $(this).attr('typeOf', config['class']['contact']);
                                $(this).attr('property', config['prop']['relation']);
                                var linkURI = encodeURI($(this).attr('href'));
                                $(this).attr('href', linkURI);
                                $(this).after('<span resource="'+linkURI+'" property="'+config['prop']['title']+'" content="'+$(this).text()+'"></span>')
                            }
                        });
                        $(this).find("img").addClass('keepElement');
                    });
                    $(this).nextUntil(config['section_header']).add($(this).closest(config['section_header'])).wrapAll('<div resource="'+config['prefix']['contact']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                    break;
                case "Digital Public Administration Legislation":
                case "Legislative Instruments for Digital Public Administration in the European Union":
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
                case "Digital Public Administration Governance":
                case "Governance":
                    var personURI;
                    $(this).nextUntil(config['section_header'], 'table').each(function (index, elem) {
                        $(this).find("img").addClass('keepElement').css('max-height', '300px');
                        $(this).attr('typeOf', config['class']['person']);
                        $(this).attr('property', config['prop']['relation']);
                        $(this).attr('href', country);
                        $(this).find('p').each(function (index, elem) {
                            if ($(this).text() == " ") {
                                $(this).remove();
                            }
                            if ($(this).text().indexOf("Contact details:") >= 0) {
                                var thisLenght = $(this).prevAll().length;
                                $(this).prevAll().each(function (index, elem) {
                                    var value = $(this).text();
                                    $(this).html('<strong>'+value+'</strong>');
                                    //Annotate contact points
                                    if (index === thisLenght - 1) {
                                        //Full name
                                        personURI = config['prefix']['person']+$(this).text().replace(/ /g,'');
                                        $(this).attr("property", config['prop']['name']);
                                        $(this).parents("table").attr("resource", personURI);
                                    }
                                    if (index === thisLenght - 2) {
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
                                    }
                                });
                            }
                        });
                        $(this).find('p').each(function (index, elem) {
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
                            if ($(this).text().indexOf("Contact details:") >= 0) {
                                var blankNode = config['prefix']['contact']+Math.floor((Math.random() * 10000) + 1);
                                $(this).nextAll().wrapAll('<div about="'+personURI+'" property="'+config['prop']['contact']+'" href="'+blankNode+'"><div resource="'+blankNode+'" typeOf="'+config['class']['contact']+'"></div></div>');

                            }
                        });
                    });
                    $(this).nextUntil(config['section_header']).add($(this).closest(config['section_header'])).wrapAll('<div resource="'+config['prefix']['service']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                    break;
                case "Digital Public Administration Infrastructure":
                case "Digital Public Administration Infrastructures":
                    $(this).nextUntil(config['section_header']).each(function (index, elem) {
                        $(this).find("img").addClass('keepElement');
                        $(this).find('a').each(function (index, elem) {
                            var linkText = $(this).text().toLowerCase();
                            var linkURI = encodeURI($(this).attr('href'));
                            $(this).attr("typeOf", config['class']['framework']);
                            $(this).attr('property', config['prop']['relation']);
                            $(this).attr("title", linkText);
                            $(this).attr("resource", linkURI);
                        });
                    });
                    $(this).nextUntil(config['section_header']).add($(this).closest(config['section_header'])).wrapAll('<div resource="'+config['prefix']['datastructure']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                    break;
                case "Cross border Digital Public Administration Services for Citizens and Businesses":
                case "Cross Border Digital Public Administration Services for Citizens and Business":
                    $(this).nextUntil(config['section_header'], 'ul').each(function (index, elem) {
                        $(this).children('li').each(function (index, elem) {
                            var publicService = $(this).find('a').text();
                            var publicServiceURI = config['prefix']['service']+countryLabel+"/"+publicService.replace(/[^\w]/g,'');
                            $(this).attr("about", publicServiceURI);
                            $(this).attr("typeOf", config['class']['publicservice']);
                            $(this).attr("property", config['prop']['title']);
                            $(this).attr("title", publicService);
                            $(this).attr("property", config['prop']['url']);
                            $(this).attr("resource", $(this).children('a').first().attr('href'));
                        });
                        if ($(this).text().indexOf("The Digital Government Factsheets") >= 0) {
                            $(this).nextAll("p:contains('isa'), p:contains('ISA')").each(function(index, element){
                                $(this).addClass('keepElement');
                            });
                        }
                    });
                    $(this).nextUntil(config['section_header']).add($(this).closest(config['section_header'])).wrapAll('<div resource="'+config['prefix']['datastructure']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                    break;
            }
        });

        $('body').children('div').first().children('p').each(function(index, element){
            if ($(this).text().indexOf("Digital Government Factsheet 2021") >= 0 ||
                $(this).text().indexOf(countryLabel) >= 0 ||
                $(this).text().indexOf('The United Kingdom') >= 0 ||
                $(this).text().indexOf('Czech Republic') >= 0 ||
                $(this).text().indexOf('Republic of North Macedonia') >= 0 /*||
                $(this).text().indexOf('European Union') >= 0*/) {
                $(this).remove();
            }
        });

         $( "p:contains('ISA')" ).each(function(index, element){
            var _this = $(this);
            if(!_this.hasClass("keepElement")) {
                _this.remove();
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
        $('p.image-container').append('<img style="width: 20%;" src="../assets/european-commission.png" /><img style="width: 100%;" src="'+'../html/' + imgSrcCountry+'" />');
        switch(countryLabel){
            case 'UK':
                $('p.image-container').after('<h2>The United Kingdom</h2>');   
                break;
            case 'North_Macedonia':
                $('p.image-container').after('<h2>Republic of North Macedonia</h2>');
                break;
            case 'Czech_Republic':
                $('p.image-container').after('<h2>Czech Republic</h2>');
                break;
            case 'European_Union':
                if (fileName.indexOf('EU_v3.00') >= 0 && $('body').children('div').first().children('h2').first().children().length === 0) {
                    $('body').children('div').first().children('h2').first().remove();
                }
                $('p.image-container').after('<h2>European Union</h2>');
                break;
            case 'Germany':
                if (fileName.indexOf('2023_Germany_vFINAL') >= 0 && $('body').children('div').first().children('h2').first().children().length === 0) {
                    $('body').children('div').first().children('h2').first().remove();
                }
                break;
            case 'Greece':
                if (fileName.indexOf('2023_Greece_vFINAL') >= 0 && $('body').children('div').first().children('h3').first().children().length === 0) {
                    $('body').children('div').first().children('h3').first().remove();
                }
                break;
            case 'Malta':
                if (fileName.includes('2023_Malta_vFinal')) {
                    $('body').children('div').first().find('h1').first().remove();
                }
                break;
            case 'Denmark':
                if (fileName.includes('2023_Denmark_vFINAL')) {
                    $('body').children('div').first().find('h1').eq(3).remove();
                }
                break;
            default:
                $('p.image-container').after('<h2>'+countryLabel+'</h2>');
        }
        if (fileName.includes("2021")) {
            $('p.image-container').after('<h2>Digital Public Administration factsheet 2021</h2>');
        }
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
                // If link === 'undefined'
                // remove the tag
                that.remove();
            }
        });
        var output = fileName.split('.html');
        fs.writeFile(outputPath + "/" + output[0] + ".html", unescape($.html()), function (err) {
            if (err) {
                return console.log(err);
            }
            var countryLabelToShow = countryLabel.replace(/\_/g, ' ');
            console.log("The "+countryLabelToShow+" RDFa file was saved!");
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

