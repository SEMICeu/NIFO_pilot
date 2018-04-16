# NIFO Pilot

## Project description

The objective of this pilot is to develop a reusable proof of concept, to convert existig Word-based NIFO factsheets into structured data following the Resource Description Framework (RDF). This pilot uses existing vocabularies to describe the information within the factsheets, including:

* [ISA Core Vocabularies](https://joinup.ec.europa.eu/page/core-vocabularies)
* [Dublin Core Terms](http://dublincore.org/documents/dcmi-terms/)
* [European Legislation Identifier Ontology](http://publications.europa.eu/mdr/eli/)
* [DBPedia Ontology](http://wiki.dbpedia.org/services-resources/ontology)
* [Schema.org](http://schema.org/)
* [RDF Data Cube Vocabulary](https://www.w3.org/TR/vocab-data-cube/)


## Requirements and dependencies

* NodeJS v4.4 or above
* Cheerio.js v1.0.0
* Mammoth.js v1.4.4
* rdf-translator v2.0.0
* sparql v0.1.3

## Installation

1. Clone or download this repository.
2. From the project's root folder, run `npm install` from the command line to install the dependencies.

## How to use

### Converting Word documents to HTML

Copy the Word documents (in docx format) that you want to conver to html in the `/input` folder and run `node docxtohtml.js` from the command line.
All documents in the input folder will be transformed into HTML and stored in the `/output` folder.

### Annotating HTML with RDFa

To annotate the HTML files with RDFA, run `node transform.js` from the command line. The annotated HTML documents will be stored in the `/rdfa` folder. Subsequently, these can be copy-pasted into a WYSIWYG text editor, or directly uploaded to a Triple Store.

The following variables can be edited in the `transform.js` file:
```
/******************************/
/***DEFINE VARIABLES***********/
/******************************/
var issued = '2018-02-01'   //The document issue date, applied to all documents in the input folder
var section = 'h1';         //The HTML element identified with a section
var subsection = 'h2';      //The HTML element identified with a subsection
```

Annotations can be customised by modifying the `transform.js` code that is applied to the relevant section or subsection in the document.
The different sections are identified based on their title. To apply the annotations, we refer to the [methods provided by the Cheerio module](https://github.com/cheeriojs/cheerio).
```
switch(content){
     case "Basic Data":
         //Custom code here
         break;
     case "Political Structure":
         //Custom code here
         break;
     case "Information Society Indicators":
         //Custom code here
         break;
     case "eGovernment State of Play":
         //Custom code here
         break;
     case "eGovernment Legal Framework":
         //Custom code here
         break;
     case "National eGovernment":
         //Custom code here
         break;
     case "eGovernment Services for Citizens":
         //Custom code here
         break;
```

## License

Licensed under the EUROPEAN UNION PUBLIC LICENCE v.1.2 

Authors: Jens Scheerlinck (PwC EU Services), Emidio Stani (PwC EU Services)