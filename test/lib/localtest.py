import unittest
from tripstore.local import InMemoryTripStore

class TestInMemoryTripStore(unittest.TestCase):
 
  def test_load_data(self):
    trip_store = InMemoryTripStore()
    trip_store.load(["../../data/test/small.json"])
    found_trips = trip_store.get_trips_by_pickup((5, 2014), (40.7607, -73.9879), (40.7212, -73.9625))
    self.assertEquals(len(found_trips), 480)
    self.assertEquals(len(found_trips[(40.7212, -73.9879)]), 1)
  
  def test_get_trips_by_pickup(self):
    trip_store = InMemoryTripStore()
    trips = ['["8/31/2014 18:11:00",40.6789,-73.9217,40.7299,-73.9994]',
      '["8/31/2014 18:12:00",40.7269,-73.9856,40.7817,-73.9532]']

    trip_store._read_in(trips)

    found_trips = trip_store.get_trips_by_pickup((8, 2014), (41, -75), (40, -72))
    self.assertEquals(len(found_trips), 2)
    self.assertTrue((40.7269,-73.9856) in found_trips)
    self.assertTrue((40.6789,-73.9217) in found_trips)
   
    # exact bounds check 
    found_trips = trip_store.get_trips_by_pickup((8, 2014), (40.7817, -73.9856), (40.7269, -73.9532))
    self.assertEquals(len(found_trips), 1)
    self.assertTrue((40.7269,-73.9856) in found_trips)
  
  def test_top_pickups(self):
    trip_store = InMemoryTripStore()
    trips = ['["8/31/2014 18:11:00",40.6789,-73.9217,40.7299,-73.9994]',
      '["8/23/2014 18:11:00",40.6789,-73.9217,40.7299,-73.9994]',
      '["8/22/2014 14:12:00",40.7269,-73.9856,40.7817,-73.9532]',
      '["8/15/2014 15:12:00",40.7269,-73.9856,40.7817,-73.9532]',
      '["8/31/2014 18:12:00",40.7269,-73.9856,40.7817,-73.9532]']

    trip_store._read_in(trips)

    found_trips = trip_store.get_top_pickups((8, 2014), (41, -75), (40, -72), 1)
    self.assertEquals(len(found_trips), 1)
    self.assertEquals(found_trips[0], ((40.7269,-73.9856), 3))
  
    # test we don't error if more than pickup locations is given
    found_trips = trip_store.get_top_pickups((8, 2014), (41, -75), (40, -72), 3)
    self.assertEquals(len(found_trips), 2)
    self.assertEquals(found_trips[0], ((40.7269,-73.9856), 3))
    self.assertEquals(found_trips[1], ((40.6789,-73.9217), 2))

if __name__ == '__main__':
  unittest.main()
