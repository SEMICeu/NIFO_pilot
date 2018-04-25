cls
@ECHO OFF
::Convert from Doc to HTML
node docxtohtml.js
::Transform HTML into RDF
node transform.js