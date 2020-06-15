
import datetime
import ee
import io
import requests
import zipfile

ee.Authenticate()  #"please click the link above to authorize your program"

ee.Initialize()
ee_date = ee.Date("2020-01-01")
py_date = datetime.datetime.utcfromtimestamp(ee_date.getInfo()["value"]/1000.0)
py_date = datetime.datetime.utcnow()
ee_date = ee.Date(py_date)
#img = ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_034033_20000913')

# image information
image1 = ee.Image('CGIAR/SRTM90_V4')
path = image1.getDownloadUrl({
    'scale': 30,
    'crs': 'EPSG:4326',
    'region': '[[-120, 35], [-119, 35], [-119, 34], [-120, 34]]'
})
print(path)   #image download link

print("downloading......")
r = requests.get(path)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall()
print("downloading finished")