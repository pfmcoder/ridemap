from datetime import datetime
import heapq
import json
import pyqtree
from collections import namedtuple

class Trip(namedtuple('Trip', 'pickuptime pickup_location dropoff_location')):
  """
    Wrapper class to store Trip data in Quad Tree
  """
  pass

class InMemoryTripStore(object):
  """
    An implementation of a TripStore that is served from memory (as opposed to a remote location)
    Underlying this InMemoryTripStore is a QuadTree
  """

  def __init__(self):
    # we will store each set of trips broken down by (month, year)
    self.monthyear_trips = {}
  
  def load(self, json_filenames=[]):
    for json_filename in json_filenames:
      with open(json_filename) as json_file:
        self._read_in(json_file)

  def _read_in(self, trip_lines):
    # TODO: very rough NYC estimate, range could be calculated from file 
    # TODO test scaling of maxdepth, maxitems
    quad_tree = pyqtree.Index(bbox=[43.001,-75.001, 39.001, -71.001])     
    for tripjson in trip_lines:
      tripline = json.loads(tripjson)
      pickuptime = datetime.strptime(tripline[0], '%m/%d/%Y %H:%M:%S')
      trip = Trip(tripline[0], (tripline[1], tripline[2]), (tripline[3], tripline[4]))
      quad_tree.insert(item=trip, bbox=[tripline[1], tripline[2], tripline[1], tripline[2]])

    monthyear = (pickuptime.month, pickuptime.year)
    self.monthyear_trips[monthyear] = quad_tree

  def _get_trips(self, monthyear, top_left, bottom_right, group_by):
    def trip_contained(item):
      return ((item.dropoff_location[0] <= top_left[0] and 
                item.dropoff_location[0] >= bottom_right[0]) and
              (item.dropoff_location[1] >= top_left[1] and 
                item.dropoff_location[1] <= bottom_right[1]))
    return self.monthyear_trips[monthyear].intersect(bbox=top_left + bottom_right, groupby=group_by, nodefilter=trip_contained)

  def get_trips_by_pickup(self, monthyear, top_left, bottom_right):
    """
      Return the trips for in dict with the key being a string representing the pickup location
        a return value looks like { "(40.2333, -71.1231)" : [Trip(...),] }


      monthyear: a tuple specifying (month, year) in ints, ie. (5, 2014)

      top_left: a 2 item Array with floats specifying latitude,longitude for the top left corner
          of a bounding box

      bottom_right: a 2 item Array with floats specifying latitude,longitude for the bottom right corner
          of a bounding box
    """
    return self._get_trips(monthyear, top_left, bottom_right, lambda x: x.pickup_location)

  def get_top_pickups(self, monthyear, top_left, bottom_right, size):
    """
      Return the top pickups in dict with the key being a string representing the pickup location
        a return value looks like { "(40.2333, -71.1231)" : 121 }

      monthyear: a tuple specifying (month, year) in ints, ie. (5, 2014)

      top_left: a 2 item Array with floats specifying latitude,longitude for the top left corner
          of a bounding box

      bottom_right: a 2 item Array with floats specifying latitude,longitude for the bottom right corner
          of a bounding box

      size: the number pickups to retrieve
    """
    pickups = self.get_trips_by_pickup(monthyear, top_left, bottom_right)
    return [(p, len(pickups[p])) for p in heapq.nlargest(size, pickups, key=lambda x: len(pickups[x]))] 
