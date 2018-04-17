// Annotate HTML with RDFa

/******************************/
/***LOAD MODULES***************/
/******************************/
var fs = require('fs');
var mammoth = require('mammoth');
var cheerio = require('cheerio');
var extendCheerio = require('./wrapAll.js');
var sparql = require('sparql');
var request = require('request');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/
var issued = '2018-02';
var licence = 'https://creativecommons.org/licenses/by/4.0/';
var section = 'h1';
var subsection = 'h2';

var args = process.argv.slice(2);
var filePath = 'output';
var outputPath = 'rdfa';
var input = fs.readdirSync(filePath);
var html;


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
        countries,
        country,
        language,
        client,
        currency,
        countryLabel,
        link,
        label

    //Determine country
    countries = ["Sweden", "Cyprus"];
    for(var i = 0; i < countries.length; i++){
        if(fileName.indexOf(countries[i]) >= 0){
            country = "http://data.europa.eu/nifo/factsheet/"+countries[i];
            countryLabel = countries[i];
        }
    }

    //Add namespaces to document
    $('body').contents().wrapAll('<div resource="'+country+'" prefix="dct: http://purl.org/dc/terms/ dbo: http://dbpedia.org/ontology/ dbp: http://dbpedia.org/property/ qb: http://purl.org/linked-data/cube# rdfs: http://www.w3.org/2000/01/rdf-schema# cpsv: http://purl.org/vocab/cpsv# eli: http://data.europa.eu/eli/ontology# foaf: http://xmlns.com/foaf/0.1/ org: https://www.w3.org/ns/org# schema: http://schema.org/"></div>');
    $('body').children('div').first().children('p').first().before('<span property="dct:relation" href="http://dbpedia.org/page/'+countryLabel+'"></span><span property="dct:issued" content="'+issued+'"></span><span property="dct:license" content="'+licence+'"></span>');

    /*=================*/
    /*Annotate document*/
    /*=================*/
    $(section).each(function (index, elem) {
        content = $(this).text().trim();
        switch(content){
            case "Basic Data":
                $(this).nextUntil('h1').each(function (index, elem) {
                    switch(index){
                        case 0:
                            //Population
                            $(this).attr("property", "dbo:populationTotal");
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 1:
                            //GDP at market prices
                            $(this).attr("property", "dbp:gdpNominal");
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 2:
                            //GDP per inhabitant in PPS
                            $(this).attr("property", "dbp:gdpPppPerCapita");
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
                            $(this).attr("property", "dbo:areaTotal");
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 9:
                            //Capital city
                            $(this).attr("property", "dbo:capital");
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
                            $(this).attr("property", "dct:language");
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                        case 11:
                            //Currency
                            currency = $(this).text().replace("Currency: ", "");
                            $(this).attr("property", "dbo:currency");
                            $(this).attr("href", "http://publications.europa.eu/resource/authority/currency/"+currency);
                            break;
                        case 12:
                            //Source
                            $(this).attr("property", "dct:source");
                            text= $(this).text().replace(/.*: /,'');
                            $(this).attr("content", text);
                            break;
                    }
                });
                break;
            case "Political Structure":
                $(this).nextUntil(section).each(function (index, elem) {
                    content = $(this).text();
                    if( (content.indexOf("Head of State:") >= 0) || (content.indexOf("Head of Government:") >= 0)){
                        link = $(this).children('a').first().attr("href");
                        $(this).attr("property", "dbo:leader");
                        $(this).attr("content", link.replace(/ /g,'%20'));
                    }
                });
                break;
            case "Information Society Indicators":
                $(this).nextUntil(section, subsection).each(function (index, elem) {
                    label = $(this).text()+" "+countryLabel;
                    var sources = [];
                    var source = [];
                    $(this).attr("property", "dct:title");
                    $(this).nextUntil('h1, h2', 'table').each(function (index, elem) {
                        $(this).find('strong').each(function (index, elem) {
                            var dimensionLabel = $(this).text();
                            $(this).attr('property', 'rdfs:label');
                            $(this).parent().attr('resource', 'http://example.org/nifo/MeasureProperty/'+dimensionLabel.replace(/ /g,''));
                            $(this).parent().attr('typeOf', 'qb:MeasureProperty');
                            $(this).parent().parent().attr('property', 'qb:component');
                            $(this).parent().parent().attr('href', 'http://example.org/nifo/MeasureProperty/'+dimensionLabel.replace(/ /g,''));
                        });
                        $(this).find('p:contains("Source:")').each(function (index, elem) {
                            sources.push(encodeURI($(this).children('a').first().attr("href")));
                        });
                    });
                    $(this).nextUntil('h1, h2', 'table').wrapAll('<div resource="http://example.org/nifo/structure/'+label.replace(/ /g,'')+'" typeOf="qb:DataStructureDefinition"></div>');
                    for(var i = 0; i < sources.length; i++){
                        if(source.toString().indexOf(sources[i]) === -1 ){ source.push(sources[i]); }
                    }
                    $(this).after('<span style="display:none;" property="dct:source" content="'+source.toString()+'"></span>')
                    $(this).after('<span style="display:none;" property="qb:structure" href="http://example.org/nifo/structure/'+label.replace(/ /g,'')+'"></span>');
                    $(this).nextUntil('h1, h2').add($(this)).wrapAll('<div resource="http://example.org/nifo/dataset/'+label.replace(/ /g,'')+'" typeOf="qb:DataSet"></div>');
                    $('body').children('div').first().children('p').first().before('<span property="dct:relation" href="http://example.org/nifo/dataset/'+label.replace(/ /g,'')+'"></span>');
                });
                break;
            case "eGovernment State of Play":
                $(this).nextUntil(section, 'p:contains("Source:")').children('a').attr('property', 'dct:relation');
                break;
            case "eGovernment Legal Framework":
               $('body').children('div').first().children('p').first().before('<span property="dct:relation" href="http://example.org/nifo/legalframework/'+countryLabel+'"></span>');
                $(this).parentsUntil('table').parents().nextUntil('table').find('a').each(function(index, element){
                    var linkText = $(this).text().toLowerCase();
                    if( linkText.indexOf("act") >= 0 || linkText.indexOf("regulation") >= 0 || linkText.indexOf("directive") >= 0 || linkText.indexOf("law") >= 0 || linkText.indexOf("constitution") >= 0 ){
                        $(this).attr('typeOf', 'eli:LegalResource');
                        $(this).attr('property', 'dct:relation');
                        var linkURI = encodeURI($(this).attr('href'));
                        $(this).attr('href', linkURI);

                    }
                });
                $(this).parentsUntil('table').parents().nextUntil('table').add($(this).closest('table')).wrapAll('<div resource="http://example.org/nifo/legalframework/'+countryLabel+'" typeOf="cpsv:FormalFramework"></div>');
                break;
            case "National eGovernment":
                $(this).nextUntil(section, 'table').each(function (index, elem) {
                    $(this).attr('typeOf', 'foaf:Person');
                    $(this).find('p').each(function (index, elem) {
                        //Annotate contact points
                        switch(index){                            
                            case 1:
                                //Full name
                                $(this).attr("property", "foaf:name");
                                break;
                            case 2:
                                //Role
                                var role = $(this).text();
                                $(this).attr("property", "org:holds");
                                $(this).attr("href", "#Post-"+role.replace(/ /g,''));
                                $(this).children('strong').first().attr("about", "http://example.org/nifo/role/Role-"+role.replace(/ /g,''));
                                $(this).children('strong').first().attr("typeOf", "org:Role");
                                $(this).children('strong').first().attr("property", "rdfs:label");
                                $(this).children('strong').first().wrap('<span about="http://example.org/nifo/post/Post-'+role.replace(/ /g,'')+'" typeOf="org:Post"><span property="org:role" href="http://example.org/nifo/role/Role-'+role.replace(/ /g,'')+'"></span></span>');
                                break;                      
                        }
                        if($(this).text().indexOf("Tel.") >= 0) {
                            $(this).attr("property", "schema:telephone");
                        } else if($(this).text().indexOf("Fax:") >= 0) {
                            $(this).attr("property", "schema:faxNumber");
                        } else if( ($(this).text().indexOf("E-mail:") >= 0) || ($(this).text().indexOf("Contact:") >= 0) ) {
                             $(this).attr("property", "schema:email");
                        } else if($(this).text().indexOf("Source:") >= 0) {
                            $(this).attr("property", "schema:url");
                        }
                    });
                    $(this).find('p').each(function (index, elem) {
                        switch(index){    
                            case 3:
                            //Contact details wrapper
                            $(this).nextAll().wrapAll('<div property="schema:contactPoint" typeOf="schema:ContactPoint"></div>');
                            break; 
                        }
                    });
                });
                break;
            case "eGovernment Services for Citizens":
                $(this).parentsUntil('table').parents().nextAll('table').first().find('p > strong').each(function(index, element){
                    var publicService = $(this).text();
                    $(this).attr("about", "http://example.org/nifo/publicservice/"+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                    $(this).attr("property", "dct:title");
                    $(this).parentsUntil('table').nextAll('tr').each(function(index, element){
                        switch(index){
                            case 0:
                                $(this).find('p').last().attr("about", "http://example.org/nifo/publicservice/"+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                                $(this).find('p').last().attr("property", "http://data.europa.eu/m8g/hasCompetentAuthority");
                                break;
                            case 1:
                                $(this).find('p').last().attr("about", "http://example.org/nifo/publicservice/"+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                                $(this).find('p').last().attr("property", "schema:url");
                                break;
                            case 2:
                                $(this).find('p').last().parent().attr("about", "http://example.org/nifo/publicservice/"+countryLabel+"-"+publicService.replace(/[^\w]/g,''));
                                $(this).find('p').last().parent().attr("property", "dct:description");
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
    //Save the N3 file
    // Set the headers
    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/x-www-form-urlencoded'
    }
    // Configure the request
    var options = {
        url: 'http://rdf-translator.appspot.com/convert/rdfa/n3/content',
        method: 'POST',
        headers: headers,
        content: $.html()
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log(body);
        } else {
            console.log(error);
        }
    });

});