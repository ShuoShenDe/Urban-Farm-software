var image = ee.Image(ee.ImageCollection('USDA/NAIP/DOQQ')
    .filterBounds(roi)
    .filterDate('2017-01-01', '2018-12-31')
    .first());
    print(image);
Map.addLayer(image, {bands: ['R', 'G', 'B'],min:0, max: 255}, 'True colour image');
Map.centerObject(image, 15);

// Compute the Normalized Difference Vegetation Index (NDVI).
var nir = image.select('N');
var red = image.select('R');
var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');

// Display NDVI.
var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
Map.addLayer(ndvi, ndviParams, 'NDVI image');

// use ndvi as filter mask
var NDVI = ndvi.lte(0.4)
var masked_image_ndvi = image.updateMask(NDVI);

// the elevation dataset
elevationdata = ee.Image('USGS/NED');
var elevation = elevationdata.select('elevation');
var elevationVis = {
    min: 0.0,
    max: 4000.0,
    gamma: 3,};
var ELEVATION = elevation.lte(10)


// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create legend title
var legendTitle = ui.Label({
  value: 'Class-Names',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});

// Add the title to the panel
legend.add(legendTitle);

// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '6px',
          margin: '0 0 4px 0'
        }
      });
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};

//  Palette with the colors
var palette =['FF0000', '000000'];
 
// name of the legend
var names = ['RoofTops','unRoofTops'];
 
// Add color and and names
for (var i = 0; i < 2; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }
 
// add legend to map (alternatively you can also print the legend to the console)
var panel_ui = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '300px'}
});
     

// GUI
Map.drawingTools().setShown(false);

// Create a panel with vertical flow layout.
var startbutton=ui.Button("Start Training");
startbutton.style().set({
         position: 'bottom-left',
         shown:false
         });
Map.add(startbutton);

var button = ui.Button({
  label: 'Select Training Data',
  onClick: function() {
    Map.drawingTools().setShown(true);
    startbutton.style().set("shown", true);
    button.style().set("shown", false);
    ui.root.remove(panel_ui);
  }
});

button.style().set({
  shown:true,
  position: 'bottom-left'
});

startbutton.onClick(function() {
  
var classNames = Rooftops.merge(Water).merge(Vegetable).merge(Road);
var bands = ['R', 'G', 'B', 'N'];
var training = image.select(bands).sampleRegions({
  collection: classNames,
  properties: ['landcover'],
  scale: 15
});

var classifier = ee.Classifier.cart().train({
  features: training,
  classProperty: 'landcover',
  inputProperties: bands
});

//Run the classification
var classified = masked_image_ndvi.select(bands).classify(classifier);
var x=classified.eq(0).multiply(ee.Image.pixelArea());
var calculation=x.reduceRegion({
  reducer:ee.Reducer.sum(),
  scale:15,
  maxPixels:1e13
});

var area=ee.Number(calculation.values().get(0)).divide(1e6).multiply(100);
print("rooftop area",area);

// validation
var valNames = vRooftops.merge(vWater).merge(vVegetable).merge(vRoad);
var validation = classified.sampleRegions({
  collection: valNames,
  properties: ['landcover'],
  scale: 15,
});

//Compare the landcover of your validation data against the classification result
var testAccuracy = validation.errorMatrix('landcover', 'classification');
//Print the error matrix to the console
print('Validation error matrix: ', testAccuracy);
//Print the overall accuracy to the console
var accuracy = testAccuracy.accuracy();
print('Validation overall accuracy: ', accuracy);
var condusionmatrix=classifier.confusionMatrix();
print('Resubstitution error matrix: ', condusionmatrix);

var overall_accuracy = ui.Label({
          value:'Overall Accuracy =' + accuracy.getInfo()+'\n'+testAccuracy.getInfo()+'\n'+'Resubstitution error matrix'+condusionmatrix.getInfo()+'\nThe Total rooftop area is\t'+area.getInfo(),
          style: {
            fontWeight: 'bold',
            fontSize: '18px' ,
            margin: '10px 5px',
            textAlign: 'left',
          }
        });
panel_ui.add(overall_accuracy);

//Display classification
Map.centerObject(classNames, 15);
// Add a bunch of buttons.
ui.root.add(panel_ui);
button.style().set("shown", true);
Map.drawingTools().setShown(false);
startbutton.style().set("shown", false);
Map.add(legend);
//Map.addLayer(ndviParams)
Map.addLayer(masked_image_ndvi,{bands: ['R', 'G', 'B'],min:0, max: 255}, 'True colour masked image after NDVI');
Map.addLayer(classified,{min: 0, max: 3, palette: ['red', 'black', 'black','black']},'classification');
Map.addLayer(masked_image_DEM,{bands: ['R', 'G', 'B'],min:0, max: 255}, 'True colour masked image after DEM');
});

Map.add(button);
var textbox = ui.Textbox({
    placeholder: 'The result already saved in your Assets',
});
textbox.style().set({
    position: 'bottom-right'
});

// export data
var exportdata=ui.Button("Export Result");
exportdata.style().set({
  position: 'bottom-right'
});

exportdata.onClick(function(){
Export.image.toAsset({
    image: classified,
    description: 'rooftop',
    assetId:'users/susanshende/urbanfarm3',
    scale: 20,
    crs:'EPSG:26918'
});
Map.add(textbox);
});

Map.add(exportdata);
