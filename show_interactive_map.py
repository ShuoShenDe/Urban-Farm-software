import folium
from folium.plugins import MarkerCluster
import pandas as pd
import json
import requests
import webbrowser
import ee
import ee.mapclient
#Define coordinates of where we want to center our map
boulder_coords = [52.5200, 13.4050]


url = 'https://raw.githubusercontent.com/python-visualization/folium/master/examples/data'
vis1 = json.loads(requests.get(f'{url}/vis1.json').text)
vis2 = json.loads(requests.get(f'{url}/vis2.json').text)
vis3 = json.loads(requests.get(f'{url}/vis3.json').text)
#Create the map
my_map = folium.Map(location = boulder_coords, zoom_start = 13,tiles='Stamen Terrain')

folium.Marker(
    location=boulder_coords,
    popup=folium.Popup(max_width=450).add_child(
        folium.Vega(vis1, width=450, height=250))
).add_to(my_map)

folium.Marker(
    location=boulder_coords,
    popup=folium.Popup(max_width=450).add_child(
        folium.Vega(vis2, width=450, height=250))
).add_to(my_map)

folium.Marker(
    location=boulder_coords,
    popup=folium.Popup(max_width=450).add_child(
        folium.Vega(vis3, width=450, height=250))
).add_to(my_map)




#Display the map
my_map.save('index.html')
webbrowser.open("index.html")


