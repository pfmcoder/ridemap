
/*
  Responsible for the 'Info' box or top line metrics including
    * bounding box coordinates
    * total trips selected
*/
var ToplineInfoBox = {

  year : 2014,
  month : 4,
  bbox : undefined,

  init : function() {
    $('#share-link-modal').on('shown.bs.modal', function () {
      var shareLink = ToplineInfoBox.generateShareLink();
      $('#share-link-text').val(shareLink);
   });
    $(document).on('boxchanged', function(e, bbox) {
      ToplineInfoBox.bbox = bbox;
      ToplineInfoBox.loadValues(ToplineInfoBox.bbox, ToplineInfoBox.month, ToplineInfoBox.year);
    });
    $(document).on('monthchanged',function(e, month) {
      ToplineInfoBox.month = month;
      ToplineInfoBox.loadValues(ToplineInfoBox.bbox, ToplineInfoBox.month, ToplineInfoBox.year);
    });
  },

  loadValues : function(bbox, month, year) {
    if(!bbox || bbox.length != 2) {
      $("#tl-info").text("");
      $("#br-info").text("");
      return;
    }
    ToplineInfoBox.retrieveTopline(bbox, month, year);
    $("#tl-info").text(bbox[0].lat.toFixed(5) + ", " + bbox[0].lng.toFixed(5));
    $("#br-info").text(bbox[1].lat.toFixed(5) + ", " + bbox[1].lng.toFixed(5));
  },

  generateShareLink : function() {
    var month = ToplineInfoBox.month;
    var year = ToplineInfoBox.year;
    var bbox = ToplineInfoBox.bbox;
    var max = 1000; //TODO unhardcode this value
    ToplineInfoBox.cachePoints(bbox, month, year, max);    
    var mapCenter = map.getCenter();
    var zoom = map.getZoom();

    var query = '?' + 'zoom='+zoom + '&mapCenter='+Util.makeLatLonStr(mapCenter.lat, mapCenter.lng)
    query = query + '&month='+month + '&year='+year
    query = query + '&boxTopleft='+Util.makeLatLonStr(bbox[0].lat, bbox[0].lng)
    query = query + '&boxBottomright='+Util.makeLatLonStr(bbox[1].lat, bbox[1].lng)
    return location.origin + '/ridemap' + query
  },

  cachePoints : function(bbox, month, year, max) {
    if(!bbox || bbox.length != 2) {
      return;
    }
    
    $.ajax({
      method : "POST",
      url : "/cache_view.json",
      dataType : "json",
      data : { 
        topleft : Util.makeLatLonStr(bbox[0].lat, bbox[0].lng), 
        bottomright : Util.makeLatLonStr(bbox[1].lat, bbox[1].lng),
        year : year,
        month : month, 
        max : max
      }
    });
  },

  retrieveTopline : function(bbox, month, year){
    
    if(!bbox || bbox.length != 2){
      $("#total-info").text("");
      return;
    }

    $.ajax({
      method : "GET",
      url : "/topline.json",
      dataType : "json",
      data : { 
        topleft : Util.makeLatLonStr(bbox[0].lat, bbox[0].lng), 
        bottomright : Util.makeLatLonStr(bbox[1].lat, bbox[1].lng),
        year : year,
        month : month, 
      },
      error : function(response) {
        $("#total-info").text("");  
      },
      success : function(response) {
        $("#total-info").text(response['count']);  
      }
    }); 
  }
};
