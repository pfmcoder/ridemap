from local import InMemoryTripStore
import glob

class TripStoreProvider(object):
  """
    Simple factory class that takes in string and loads and returns the wanted TripStore
  """
  @staticmethod
  def get(tripstore_desc):
    if tripstore_desc == 'inmemory_test':
      in_mem = InMemoryTripStore()
      in_mem.load(glob.glob('data/test/*.json'))
      return in_mem
    elif tripstore_desc == 'inmemory':
      in_mem = InMemoryTripStore()
      in_mem.load(glob.glob('data/*.json'))
      return in_mem
  # for example if we want to add DynamoDbTripStore()
  #  else if tripstore_desc == 'remote':
  #   return DynamoDbTripStore()
