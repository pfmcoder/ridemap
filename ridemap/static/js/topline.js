
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
    $(document).on('boxchanged', function(e, bbox) {
      ToplineInfoBox.bbox = bbox;
      ToplineInfoBox.loadValues();
    });
    $(document).on('monthchanged',function(e, month) {
      ToplineInfoBox.month = month;
      ToplineInfoBox.loadValues();
    });
  },

  loadValues : function() {
    var bbox = Pickups.box 
    if(!bbox || bbox.length != 2) {
      $("#tl-info").text("");
      $("#br-info").text("");
      return;
    }
    ToplineInfoBox.retrieveTopline(bbox);
    $("#tl-info").text(bbox[0].lat.toFixed(5) + ", " + bbox[0].lng.toFixed(5));
    $("#br-info").text(bbox[1].lat.toFixed(5) + ", " + bbox[1].lng.toFixed(5));
  },
  
  retrieveTopline : function(bbox){
    
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
        year : ToplineInfoBox.year,
        month : ToplineInfoBox.month, 
      },
      success : function(response) {
        $("#total-info").text(response['count']);  
      }
    }); 
  }
};
