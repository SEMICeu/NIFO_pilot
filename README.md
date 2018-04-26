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

This pilot requires [Node JS](https://nodejs.org/en/download/) v8.10.0 or above, along with the following packages:

* cheerio v1.0.0-rc.2
* cli-progress v1.8.0
* graph-rdfa-processor v1.3.0
* jsdom v11.9.0
* jsesc v2.5.1
* jsonld-request v0.2.0
* ldtr v0.2.3
* mammoth v1.4.4
* rdf-translator v2.0.0
* rdfa-parser v1.0.1
* request v2.85.0
* sync-request v6.0.0

## Architecture

![Architecture](assets/NIFO-architecture.jpg?raw=true "Title")
## Installation

1. Clone or download this repository.
2. From the project's root folder, run `npm install` from the command line to install the dependencies.

## How to use

### Converting Word documents to HTML

Copy the Word documents (in docx format) that you want to conver to html in the `/docx` folder and run `node docxtohtml.js` from the command line.
All documents in the input folder will be transformed into HTML and stored in the `/html` folder.

### Annotating HTML with RDFa

To annotate the HTML files with RDFA, run `node htmltordf.js` from the command line. The annotated HTML documents will be stored in the `/rdfa` folder. Subsequently, these can be copy-pasted into a WYSIWYG text editor, or directly uploaded to a Triple Store.

The `config.json` file allows users to customise the transformation script and mappings to existing RDF vocabularies.

* Configure document metadata, including the date issued, the applicable licence, the HTML tag used to identify the main sections in the document and the HTML tag used to identify the subsections in the document:
```
{
    "issued" : "2018-02",
    "licence" : "https://creativecommons.org/licenses/by/4.0/",
    "section_header" : "h1",
    "subsection_header" : "h2",
```

* Configure the prefixes that are used to generate URIs for new entities discovered within the document:
```
    "prefix": {
        "nifo" : "http://data.europa.eu/nifo/factsheet/",
        "currency": "http://publications.europa.eu/resource/authority/currency/",
        "measure" : "http://example.org/nifo/MeasureProperty/",
        "datastructure" : "http://example.org/nifo/structure/",
        "dataset" : "http://example.org/nifo/dataset/",
        "legalframework" : "http://example.org/nifo/legalframework/",
        "role" : "http://example.org/nifo/role/Role-",
        "post" : "http://example.org/nifo/post/Post-",
        "service" : "http://example.org/nifo/publicservice/",
    }
```

* Set the prefix used for the RDF properties and classes, as well as the mapping of different terms to properties and classes in existing vocabularies:
```
    "prefixes" : "dct: http://purl.org/dc/terms/ dbo: http://dbpedia.org/ontology/ dbp: http://dbpedia.org/property/ qb: http://purl.org/linked-data/cube# rdfs: http://www.w3.org/2000/01/rdf-schema# cpsv: http://purl.org/vocab/cpsv# eli: http://data.europa.eu/eli/ontology# foaf: http://xmlns.com/foaf/0.1/ org: https://www.w3.org/ns/org# schema: http://schema.org/",
    "prop" : {
        "issued" : "dct:issued",
        "licence" : "dct:license",
        "population" : "dbo:populationTotal",
        "gdpnominal" : "dbp:gdpNominal",
        "gdppercapita" : "dbp:gdpPppPerCapita",
        "area" : "dbo:areaTotal",
        "capital" : "dbo:capital",
        "language" : "dct:language",
        "currency" : "dbo:currency",
        "source" : "dct:source",
        "leader" : "dbo:leader",
        "title" : "dct:title",
        "label" : "rdfs:label",
        "component" : "qb:component",
        "structure" : "qb:structure",
        "relation" : "dct:relation",
        "name" : "foaf:name",
        "holds" : "org:holds",
        "telephone" : "schema:telephone",
        "fax" : "schema:faxNumber",
        "email" : "schema:email",
        "url" : "schema:url",
        "contact" : "schema:contactPoint",
        "description" : "dct:description",
        "competent" : "http://data.europa.eu/m8g/hasCompetentAuthority"
    },
    "class" : {
        "measure" : "qb:MeasureProperty",
        "datastructure" :"qb:DataStructureDefinition",
        "dataset" : "qb:DataSet",
        "framework": "cpsv:FormalFramework",
        "legalresource": "eli:LegalResource",
        "person" : "foaf:Person",
        "role" : "org:Role",
        "post" : "org:Post",
        "contact": "schema:ContactPoint"
    },
```

* Configure the text strings used to identify certain proprties such as currency, head of state and head of government. 
```
    "text_identifier" : {
        "currency" : "Currency: ",
        "headofstate" : "Head of State: ",
        "headofgovernment" : "Head of Government: "
    },
```

* Determine the keywords that are used to derive links to legal documents from the text. 
```
    "type_framework" : {
        "act" : "act",
        "reg" : "regulation",
        "dir" : "directive",
        "law" : "law",
        "con" : "constitution"
    }
}
```

More detailed customisation of the annotations can be achieved by modifying the `htmltordf.js` code that is applied to the relevant section or subsection in the document.
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

## Licence

Licensed under the EUROPEAN UNION PUBLIC LICENCE v.1.2 

Authors: Jens Scheerlinck (PwC EU Services), Emidio Stani (PwC EU Services)