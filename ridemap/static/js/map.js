
/*
  Responsible for displaying the box drawn with mouse cursor and also
  converting the box points to coordinates
  Events triggered:
    * boxchangedd : signifies when the box has finished being drawn,
        a [LatLng, LatLng] array will be passed in the event as topleft, bottomright box coords
    * boxcleared : if the box has been removed, the event will fire without any data  
*/
var Draw = {

  boxSource : new mapboxgl.GeoJSONSource({ 
    data: { type: 'FeatureCollection', features: [] }
  }),

  init: function() {
    map.boxZoom.disable(); 
    var canvas = map.getCanvasContainer();

    // Variable to hold the starting xy coordinates
    // when `mousedown` occured.
    var start;

    // Variable to hold the current xy coordinates
    // when `mousemove` or `mouseup` occurs.
    var current;

    // Variable for the draw box element.
    var box;

    map.addSource('boxsource', Draw.boxSource);

    map.addLayer({
        "id": "box",
        "type": "line",
        "source": "boxsource",
        "paint": {
            "line-color": "#111",
            "line-dasharray": [2,1],
            "line-width": 1,
        }
    });

    // Return the xy coordinates of the mouse position
    var mousePos = function(e) {
      var rect = canvas.getBoundingClientRect();
      return new mapboxgl.Point(
          e.clientX - rect.left - canvas.clientLeft,
          e.clientY - rect.top - canvas.clientTop
      );
    }

    var mouseDown = function(e) {
      if (!(e.shiftKey && e.button === 0)) return;

      // Disable default drag zooming when the shift key is held down.
      map.dragPan.disable();

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('keydown', onKeyDown);

      if(box) {
        box.parentNode.removeChild(box);
        box = null;
      }
      // Capture the first xy coordinates
      start = mousePos(e);
    }

    var onMouseMove = function(e) {
      // Capture the ongoing xy coordinates
      current = mousePos(e);

      // Append the box element if it doesnt exist
      if (!box) {
          box = document.createElement('div');
          box.classList.add('boxdraw');
          canvas.appendChild(box);
      }

      var minX = Math.min(start.x, current.x),
          maxX = Math.max(start.x, current.x),
          minY = Math.min(start.y, current.y),
          maxY = Math.max(start.y, current.y);

      // Adjust width and xy position of the box element ongoing
      var pos = 'translate(' + minX + 'px,' + minY + 'px)';
      box.style.transform = pos;
      box.style.WebkitTransform = pos;
      box.style.width = maxX - minX + 'px';
      box.style.height = maxY - minY + 'px';
    }

    var onMouseUp = function(e) {
      // Capture xy coordinates
      finish([start, mousePos(e)]);
    }

    var onKeyDown = function(e) {
      // If the ESC key is pressed
      if (e.keyCode === 27){ 
        finish();
        $(document).trigger('boxcleared');
      }
    }

    var boundingBoxToPoly = function(boundingBox) {
      var poly = []
      poly.push([boundingBox[0].lng, boundingBox[0].lat]);
      poly.push([boundingBox[0].lng, boundingBox[1].lat]);
      poly.push([boundingBox[1].lng, boundingBox[1].lat]);
      poly.push([boundingBox[1].lng, boundingBox[0].lat]);
      poly.push([boundingBox[0].lng, boundingBox[0].lat]);
      return poly;
    }

    var finish = function(bbox) {
      // Remove these events now that finish has been called.
      document.removeEventListener('mousemove', onMouseMove);
      //document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mouseup', onMouseUp);

      if (bbox) {
        bb = bbox || []
        var boxcoords = [map.unproject(bb[0]), map.unproject(bb[1])];
        var polycoords = boundingBoxToPoly(boxcoords);
        Draw.boxSource.setData({ 
          type : "FeatureCollection",
          features : [
            { type: "Feature",
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: polycoords
              }
            }
          ]
        });
        $(document).trigger('boxchanged', [boxcoords]);
        
        box.classList = "";
      } else {
        if(box) {
          Draw.boxSource.setData({type : "FeatureCollection", features : [] });
          box.parentNode.removeChild(box);
          box = null;
        } 
      }

      map.dragPan.enable();
    }
    // dragging behaviour.
    canvas.addEventListener('mousedown', mouseDown, true);
  }

}

/*
  Responsible for displaying pickup locations on the map based on
  a bounding box and month

  Events triggered:
    * pickupsloaded : signifies when the data has returned from the server 
           and been set on the map for display  
*/
var Pickups = {
  
  init : function() {

    map.addSource('topPickups', Pickups._topPickupsSource);

    //using these colors, create a pseudo-heatmap
    // values int the array are [minCount, color, markerRadius]
    var layers = [
        [20, 'red', 24],
        [12, 'orange', 18],
        [4, 'green', 18],
        [0, 'blue', 15]
    ];

    layers.forEach(function (layer, i) {
        map.addLayer({
          "id": "marker-" + i,
          "type": "circle",
          "source": "topPickups",
          "paint": {
            "circle-color": layer[1],
            "circle-radius": layer[2],
            "circle-blur": 1,
          },
          "filter": i == 0 ?
            [">=", "count", layer[0]] :
            ["all",
              [">=", "count", layer[0]],
              ["<", "count", layers[i - 1][0]]]
        });
    });

    map.addLayer({
      "id": "markers",
      "type": "symbol",
      "source": "topPickups",
      "layout": {
        "text-field": "{count}",
      },
      "paint" :{
         "text-color" : "#FFF"
      }
    });
    Pickups._addListeners();
  },

  _addListeners : function() {
    $(document).on('monthchanged',function(e, month) {
      Pickups.month = month;
      Pickups.retrievePoints();
    });

    $(document).on('boxchanged',function(e, box) {
      Pickups.box = box;
      Pickups.retrievePoints();
    });
    $(document).on('boxcleared',function(e) {
      Pickups.box = undefined;
      Pickups.retrievePoints();
    });
  },
 
  max : 1000,
  box : [],
  month : 4,
  year : 2014,

  _topPickupsSource : new mapboxgl.GeoJSONSource({
    data: { type: 'FeatureCollection', features: [] }
  }),
  
  _topPickupsToGeoJson : function(pickup) {
    var out = {
      type:  "Feature",
      geometry: {
         type: "Point",
         coordinates: pickup[0].slice().reverse() // call slice to make a copy so that reverse doesn't mutate original
      },
      properties: { count : pickup[1] }
    }; 
    return out;
  },

  retrievePoints : function() {
    var bbox = Pickups.box 
    if(!bbox || bbox.length != 2) {
      Pickups._topPickupsSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    
    $.ajax({
      method : "GET",
      url : "/top_pickups.json",
      dataType : "json",
      data : { 
        topleft : Util.makeLatLonStr(bbox[0].lat, bbox[0].lng), 
        bottomright : Util.makeLatLonStr(bbox[1].lat, bbox[1].lng),
        year : Pickups.year, 
        month : Pickups.month, 
        max : Pickups.max
      },
      success : function(response) {
        
        var geoJsonFeatures = response.map(Pickups._topPickupsToGeoJson);
        Pickups._topPickupsSource.setData({ type: 'FeatureCollection', features: geoJsonFeatures });
        $(document).trigger('pickupsloaded', [geoJsonFeatures]);
      }
    }); 
  }
}

/*
  Utility methods that can be used by multiple components 
*/
var Util = {
  makeLatLonStr : function(a,b) { return a.toString() + "," + b.toString() }
}

/* 
  Entry Point and map initialization 
  Register components by adding to the map.on('load') block 
*/
var Map = {
  init: function() {
    //TODO get access token from server instead of hardcoding here 
    mapboxgl.accessToken =  "Removed From Github";
    window.map = new mapboxgl.Map({
          container: 'map',
            style: 'mapbox://styles/mapbox/streets-v8',
            center: [-74.0315, 40.6989], //TODO roughly NYC, this can be obtained from the server in the future
            maxZoom: 20,
            minZoom: 8,
            zoom: 9.68,
            dragRotate: false,
            touchZoomRotate: false
    })
    
    map.on('load', function() {
      Draw.init();
      Pickups.init();
      MonthSlider.init();
      PickupsInfoBox.init();
      ToplineInfoBox.init();
    });
  }
}

$(document).ready(Map.init);
