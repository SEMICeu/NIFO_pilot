// Annotate HTML with RDFa

/******************************/
/***LOAD MODULES***************/
/******************************/
var fs = require('fs');
var mammoth = require('mammoth');
var cheerio = require('cheerio');
var extendCheerio = require('./wrapAll.js');
var sparql = require('sparql');
var request = require('sync-request');
var getRdfaGraph = require('graph-rdfa-processor');
var jsdom = require('jsdom');
const _cliProgress = require('cli-progress');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/
const bar1 = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
var config = require('./config.json');
var args = process.argv.slice(2);
var filePath = 'output';
var outputPath = 'rdfa';
var outputPathJSONLD = 'jsonld';
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
    $nal('tr').each(function(index, element){
        countryCodes[$nal(this).children("td:nth-of-type(3)").text()] = $nal(this).children("td:nth-of-type(1)").text();
        countries.push($nal(this).children("td:nth-of-type(3)").text());
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
    $ = cheerio.load(html, {
        normalizeWhitespace: true
    });
    extendCheerio($);
    //Define variables
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

    //Add namespaces to document
    $('body').contents().wrapAll('<div resource="'+country+'" prefix="'+config['prefixes']+'"></div>');
    $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['relation']+'" href="http://dbpedia.org/page/'+countryLabel+'"></span><span property="'+config['prop']['issued']+'" content="'+config['issued']+'"></span><span property="'+config['prop']['licence']+'" content="'+config['licence']+'"></span><span property="'+config['prop']['country']+'" content="'+config['prefix']['country']+countryCodes[countryLabel]+'"></span>');

    /*=================*/
    /*Annotate document*/
    /*=================*/
    $(config['section_header']).each(function (index, elem) {
        content = $(this).text().trim();
        switch(content){
            case "Basic Data":
                $(this).nextUntil('h1').each(function (index, elem) {
                    switch(index){
                        case 0:
                            //Population
                            $(this).attr("property", config['prop']['population']);
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 1:
                            //GDP at market prices
                            $(this).attr("property", config['prop']['gdpnominal']);
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 2:
                            //GDP per inhabitant in PPS
                            $(this).attr("property", config['prop']['gdppercapita']);
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 3:
                            //GDP growth rate
                            break;
                        case 4:
                            //Inflation
                            break;
                        case 5:
                            //Unemployment rate
                            break;
                        case 6:
                            //General government gross debt (Percentage of GDP)
                            break;
                        case 7:
                            //General government deficit/surplus (Percentage of GDP)
                            break;
                        case 8:
                            //Area
                            $(this).attr("property", config['prop']['area']);
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 9:
                            //Capital city
                            $(this).attr("property", config['prop']['capital']);
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 10:
                            //Official EU language
                            /*
                            var language_uri = [];
                            language = $(this).text().replace("Official EU language: ", "").split(", ");
                            for(var i = 0; i < language.length; i++){
                                var client = new sparql.Client('http://publications.europa.eu/webapi/rdf/sparql');
                                client.query('select * where { ?p <http://www.w3.org/2004/02/skos/core#prefLabel> "'+language[i]+'"@en . ?p <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://publications.europa.eu/ontology/cdm#language> } limit 1', function(err, res){
                                  console.log(res.toString());
                                });
                            }
                            */
                            
                            $(this).attr("property", config['prop']['language']);
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 11:
                            //Currency
                            currency = $(this).text().replace(config['text_identifier']['currency'], "");
                            $(this).attr("property", config['prop']['currency']);
                            $(this).attr("href", config['prefix']['currency']+currency);
                            break;
                        case 12:
                            //Source
                            $(this).attr("property", config['prop']['source']);
                            text= encodeURI($(this).children('a').attr('href'));
                            $(this).attr("href", text);
                            break;
                    }
                });
                break;
            case "Political Structure":
                $(this).nextUntil(config['section_header']).each(function (index, elem) {
                    content = $(this).text();
                    if( (content.indexOf(config['text_identifier']['headofstate']) >= 0) || (content.indexOf(config['text_identifier']['headofgovernment']) >= 0)){
                        link = encodeURI($(this).children('a').first().attr("href"));
                        $(this).attr("property", config['prop']['leader']);
                        $(this).attr("content", link.replace(/ /g,'%20'));
                    }
                });
                break;
            case "Information Society Indicators":
                $(this).nextUntil(config['section_header'], config['subsection_header']).each(function (index, elem) {
                    label = $(this).text()+" "+countryLabel;
                    var sources = [];
                    var source = [];
                    $(this).attr("property", config['prop']['title']);
                    $(this).nextUntil('h1, h2', 'table').each(function (index, elem) {
                        $(this).find('strong').each(function (index, elem) {
                            var dimensionLabel = $(this).text();
                            var parentNode =  $(this).parent();
                            $(this).attr('property', config['prop']['label']);
                            parentNode.attr('resource', config['prefix']['measure']+dimensionLabel.replace(/ /g,''));
                            parentNode.attr('typeOf', config['class']['measure']);
                            parentNode.parent().attr('property', 'qb:component');
                            parentNode.parent().attr('href', config['prefix']['measure']+dimensionLabel.replace(/ /g,''));
                        });
                        $(this).find('p:contains("Source:")').each(function (index, elem) {
                            sources.push(encodeURI($(this).children('a').first().attr("href")));
                        });
                    });
                    $(this).nextUntil('h1, h2', 'table').wrapAll('<div resource="'+config['prefix']['datastructure']+label.replace(/ /g,'')+'" typeOf="'+config['class']['datastructure']+'"></div>');
                    for(var i = 0; i < sources.length; i++){
                        if(source.toString().indexOf(sources[i]) === -1 ){ source.push(sources[i]); }
                    }
                    $(this).after('<span style="display:none;" property="'+config['prop']['source']+'" content="'+source.toString()+'"></span>')
                    $(this).after('<span style="display:none;" property="'+config['prop']['structure']+'" href="'+config['prefix']['datastructure']+label.replace(/ /g,'')+'"></span>');
                    $(this).nextUntil('h1, h2').add($(this)).wrapAll('<div resource="'+config['prefix']['dataset']+label.replace(/ /g,'')+'" typeOf="'+config['class']['dataset']+'"></div>');
                    $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['relation']+'" href="'+config['prefix']['dataset']+label.replace(/ /g,'')+'"></span>');
                });
                break;
            case "eGovernment State of Play":
                $(this).nextUntil(config['section_header'], 'p:contains("Source:")').children('a').attr('property', config['prop']['relation']);
                break;
            case "eGovernment Legal Framework":
               $('body').children('div').first().children('p').first().before('<span property="'+config['prop']['relation']+'" href="'+config['prefix']['legalframework']+countryLabel+'"></span>');
                $(this).parentsUntil('table').parents().nextUntil('table').find('a').each(function(index, element){
                    var linkText = $(this).text().toLowerCase();
                    if( checkArray(linkText, Object.keys(config['type_framework']).map(function(k) { return config['type_framework'][k] })) ){
                        $(this).attr('typeOf', config['class']['legalresource']);
                        $(this).attr('property', config['prop']['relation']);
                        var linkURI = encodeURI($(this).attr('href'));
                        $(this).attr('href', linkURI);
                    }
                });
                $(this).parentsUntil('table').parents().nextUntil('table').add($(this).closest('table')).wrapAll('<div resource="'+config['prefix']['legalframework']+countryLabel+'" typeOf="'+config['class']['framework']+'"></div>');
                break;
            case "National eGovernment":
                $(this).nextUntil(config['section_header'], 'table').each(function (index, elem) {
                    $(this).attr('typeOf', config['class']['person']);
                    $(this).find('p').each(function (index, elem) {
                        //Annotate contact points
                        switch(index){                            
                            case 1:
                                //Full name
                                $(this).attr("property", config['prop']['name']);
                                break;
                            case 2:
                                //Role
                                var role = $(this).text();
                                var childNode = $(this).children('strong').first();
                                $(this).attr("property", config['prop']['holds']);
                                $(this).attr("href", "#Post-"+role.replace(/ /g,''));
                                childNode.attr("about", config['prefix']['role']+role.replace(/ /g,''));
                                childNode.attr("typeOf", config['class']['role']);
                                childNode.attr("property", config['prop']['label']);
                                childNode.wrap('<span about="'+config['prefix']['post']+role.replace(/ /g,'')+'" typeOf="'+config['class']['post']+'"><span property="'+config['prop']['role']+'" href="'+config['prefix']['role']+role.replace(/ /g,'')+'"></span></span>');
                                break;                      
                        }
                        if($(this).text().indexOf("Tel.") >= 0) {
                            $(this).attr("property", config['prop']['telephone']);
                        } else if($(this).text().indexOf("Fax:") >= 0) {
                            $(this).attr("property", config['prop']['fax']);
                        } else if( ($(this).text().indexOf("E-mail:") >= 0) || ($(this).text().indexOf("Contact:") >= 0) ) {
                             $(this).attr("property", config['prop']['email']);
                        } else if($(this).text().indexOf("Source:") >= 0) {
                            $(this).attr("property", config['prop']['url']);
                        }
                    });
                    $(this).find('p').each(function (index, elem) {
                        switch(index){    
                            case 3:
                            //Contact details wrapper
                            $(this).nextAll().wrapAll('<div property="'+config['prop']['contact']+'" typeOf="'+config['class']['contact']+'"></div>');
                            break; 
                        }
                    });
                });
                break;
            case "eGovernment Services for Citizens":
                $(this).parentsUntil('table').parents().nextAll('table').first().find('p > strong').each(function(index, element){
                    var publicService = $(this).text();
                    $(this).attr("about", config['prefix']['service']+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                    $(this).attr("property", config['prop']['title']);
                    $(this).parentsUntil('table').nextAll('tr').each(function(index, element){
                        switch(index){
                            case 0:
                                $(this).find('p').last().attr("about", config['prefix']['service']+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                                $(this).find('p').last().attr("property", config['prop']['competent']);
                                break;
                            case 1:
                                $(this).find('p').last().attr("about", config['prefix']['service']+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                                $(this).find('p').last().attr("property", config['prop']['url']);
                                break;
                            case 2:
                                $(this).find('p').last().parent().attr("about", config['prefix']['service']+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                                $(this).find('p').last().parent().attr("property", config['prop']['description']);
                                break;
                        }
                    });
                });
                break;
        }
    });


    /*=================*/
    /* GENERATE OUTPUT */
    /*=================*/

    //Save the RDFa file
    var output = fileName.split('.');
    fs.writeFile(outputPath + "/" + output[0] + ".html", unescape($.html()), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The RDFa file was saved!");
    });
    //Save the file in N3 syntax
    let { document } = jsdom(html).defaultView.window;
    let opts = {baseURI: 'http://example.com'};
    let graph = getRdfaGraph(document, opts);
    console.log(graph.toString());
    /*
    $('body').find('a').each(function (index, elem) {
        link = encodeURI($(this).attr('href'));
        link = link.replace(/[^a-zA-Z-0-9-\/]/g,'');
        $(this).attr('href', link);
    });
    let triples = rdfaParser.parseRDFa(unescape($.html()));
    var triples_output = [];
    */
    fs.writeFile(outputPathJSONLD + "/" + output[0] + ".jsonld", graph, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The N3 file was saved!");
    });
    bar1.increment(100);
});
bar1.stop();