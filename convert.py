import rdflib
import os
import html5lib

path = 'rdfa'

directory = os.fsencode(path)

for file in os.listdir(directory):
    filename = os.fsdecode(file)
    html = open(path+"/"+filename,'r').read()
    g = rdflib.Graph()
    #print(html)
    g.parse(data = html, format='rdfa')
    print(graph.serialize(format='turtle'))