
# RideMap

RideMap is a web application that allows for selecting areas on a map to show ride data. Only trips that are contained within a selected area are provided with relevant data, and only top pickup locations are shown on the map.

Some of the design tradeoffs are highlighted or alluded to below given the time limit, resources, and uncertainity around usage.

### Dependencies
I made use of the following projects (with reason):
  * mapbox-gl-js: Looked into other tile maps (Google Maps, Mapbox JS) and found this to be the best feel for interactive experiences
  * pyqtree: The implementation of this was straightforward and allowed me to make edits cleanly
  * jQuery, bootstrap : I am familiar with these libraries

I had never used some of these libraries, but once I got going they were really fun to work with. I did want to look at using React or Angular, however these would also be new to me and I wanted to make sure I wasn't spending all of my time learning new technologies.

### Adding View Components
Adding components to the view should be pretty easy as the different components communicate with each other using jQuery events and don't call methods directly.
This allows for components to be removed without the page breaking and added with minimal effort.
For instance, to add a histogram view of ride times, you would need to:
  * create a histogram.html with the layout
  * create a histogram.js file with the interactions
  * reference the template from the index.html template (and optionally call init() from map.js on map load)

### Next Features:
  * When clicking on a top pickup location and the map zooms, show the dropoff location and the arc connecting them
  * Show a histogram of the most active pickup hours
  * Translate the coordinates into actual places using foursquare or google data
  * Mixin driving directions data and compute busiest routes. Overlay this data on the map 
  
### Possible Improvements:
  * Starting up the web application takes forever, loading the trees in parallel would give a speed up but see #Scaling section for separation of web app from storage
  * Cache the initial top pickup locations for when the page loads they will be present 
  * Large selection areas can still take a couple of seconds to load, tune to mapbox-gl-js limits
  * There wasn't any time spent on tuning the configuration parameters of the QuadTree, it might be tuned appropriately
  * Look into using Google s2 library (didn't make use of it here because wasn't sure about getting the bindings setup)
  * Clean up the look and feel when no box is selected, now there are just empty fields

#### Scaling 
  Right now the entirety of the application is a single Python process. This has a couple of issues:
    * if this process dies, the application is unusable
    * data cannot be updated easily
    * the process is very heavy weight in memory (and computing the intersects)
  If this were to be used in a manner that was more critical, I would separate the storage of the coordinates from the web app.
  I can discuss in more detail, but the idea would be to partition the space and assign ids to each cell and store that cell data in a key,value db.

  The python code should also be modular enough to swap out the backend easily (by adding a new TripStore and putting in the TripStoreProvider) 
       
### Known Issues/Bugs:
  * If a lot of actions are taken before the server can respond, the results may happen out of order
  * NYC coordinates are hardcoded within the InMemoryTripStore() and within the starting location of the map
    * One way to solve this would be to print the range of the coordinates in a metadata section of the data, which will then be used when loading the InMemoryTripStore
  * Store the mapbox access token in a better way, maybe retrieving from the server. 
  * We hardcode the months we know we have data for. It would be better to retrieve the available months from location metadata
  * We also hardcode the number of top pickups, it would be better to ask the user how many to display 
  * Error handling is pretty lacking, and there is no clear way to show the users the errors. This was intentionally focused less on given the time constraints
