import rdflib
import os
import html5lib
from bs4 import BeautifulSoup

path = 'rdfa'

directory = os.fsencode(path)

def fix(s):
    i = s.rindex('/')
    return s[:i]+urllib.quote(s[i:])

for file in os.listdir(directory):
    filename = os.fsdecode(file)
    html = open(path+"/"+filename,'r',encoding='utf-8').read()
    #soup = BeautifulSoup(html,'lxml').prettify(formatter="xml")
    #for link in soup.findAll('a', attrs={'href': re.compile("^http://")}):
    #    print(link.get('href'))
    g = rdflib.Graph()
    g.parse(data = html, format='rdfa')
    g.serialize(destination=filename+'.ttl',format='turtle')
    #fixedgraph = rdflib.Graph()
    #fixedgraph += [(url_fix(s), url_fix(p), url_fix(o)) for s, p, o in g]
    #fixedgraph.serialize(destination=filename+'.rdf',format='turtle')