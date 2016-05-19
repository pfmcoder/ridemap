/* Responseible for Top Pickups box */

var PickupsInfoBox = {

  maxToShow: 20, //TODO value could be user selected

  init : function() {
    $(document).on('pickupsloaded', function(e, topPickups) {
      PickupsInfoBox.loadHtml(topPickups);
    });
  },

  loadHtml : function(topPickups) {
    var li = document.createElement('li');
    li.classList = ["list-group-item"];
    var ul = $("#top-pickups-list");
    ul.empty();
    topPickups.slice(0, PickupsInfoBox.maxToShow).forEach(function(pickup) {
      var currListItem = $(li.cloneNode());
      currListItem.html(
        '<span class="badge">'+ parseInt(pickup.properties.count,10) + '</span>' +
        // have to copy array to make sure not to mutate original
        Array.prototype.slice.call(pickup.geometry.coordinates).reverse())
      
        currListItem.on('click', pickup.geometry.coordinates, function (e) { 
        map.flyTo({ center: e.data, zoom : 20});
      });
      ul.append(currListItem); 
    });
  } 
};
