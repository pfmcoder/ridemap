/*
  Responsible for the month slider 
  
  Events triggered:
    * monthchanged : will pass the month value as an int
*/
var MonthSlider = {

  //TODO this doesn't work for anything more than the exact data we know we have,
  // in the future, we should grab this list from the server and populate it
  months : ["April 2014", "May 2014", "June 2014", "July 2014", "August 2014", "September 2014"],
  init : function() {
    $('#slider').on('input', function(e) {
      var month = parseInt(e.target.value, 10);
      $("#month").text(MonthSlider.months[month - 4]) // we just happen to know we start with the 4th month
      $( document ).trigger('monthchanged', [month])  
    });
  }
};
