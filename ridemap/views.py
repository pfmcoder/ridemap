from datetime import datetime
from collections import defaultdict
import json
from flask import Flask, request, render_template
from ridemap import app
from lib.tripstore import TripStoreProvider
from lib.cache.lru import LruCache

"""
  Views for RideMap application. 
    Because of the few number of routes, both html and json routes are contained within this file
    In the future, we can split those out for the json endpoints vs. html serving
"""

#immediately load the tripstore before we start serving requests
tripstore = TripStoreProvider.get('inmemory_test')

def latlon_from_str(latlon_str):
  if latlon_str is not None and len(latlon_str) > 0:
    return [float(x) for x in latlon_str.split(',')]
  else:
    return None

def parse_request(req):
  month = req.args.get('month')
  year = req.args.get('year')
  top_left = req.args.get('topleft')
  bottom_right = req.args.get('bottomright')
  maximum = int(req.args.get('max', -1))
  if month is None or year is None:
    raise Exception("month and year are required parameters")
  if top_left is None or bottom_right is None:
    raise Exception("lat and lon are required for topleft and bottomright parameters")
  return (int(month), int(year), latlon_from_str(top_left), latlon_from_str(bottom_right), maximum)

cache = LruCache(100)

#------ routes
@app.route('/ping')
def ping():
  return 'pong'

@app.route('/ridemap')
def index():
  month = request.args.get('month', default="4")
  year = request.args.get('year', default="2014")
  top_left = latlon_from_str(request.args.get('boxTopleft', default="40.83199,-74.13693"))
  bottom_right = latlon_from_str(request.args.get('boxBottomright', default="40.61306,-73.85150"))
  map_zoom = request.args.get('zoom', default=9.68, type=float)
  map_center = latlon_from_str(request.args.get('mapCenter', default="40.6989,-74.0315"))
  return render_template('index.html', month=month, year=year, 
      top_left=top_left,bottom_right=bottom_right, map_zoom=map_zoom, map_center=map_center)

@app.route('/top_pickups.json')
def top_pickups():
  try:
    month, year, top_left, bottom_right, maximum = parse_request(request)
  except Exception as e:
    return json.dumps({'error': str(e)})
  cache_val = cache.get((month, year, tuple(top_left), tuple(bottom_right), maximum))
  if cache_val is not None:
    trips = cache_val
  else :
    trips = tripstore.get_top_pickups((month, year), top_left, bottom_right, maximum)

  return json.dumps(trips)

@app.route('/topline.json')
def topline():
  try:
    month, year, top_left, bottom_right, maximum = parse_request(request)
  except Exception as e:
    return json.dumps({'error': str(e)})
  
  trips = tripstore.get_trips_by_pickup((month, year), top_left, bottom_right)
  trips = { repr(k) : v for k,v in trips.iteritems() } 
  count = reduce(lambda x, y: x + len(trips[y]), trips, 0)
  # other topline info can go here, such as trips grouped by pickup time
  output = dict(count=count)

  return json.dumps(output)

@app.route('/trips.json')
def trips():
  try:
    month, year, top_left, bottom_right, maximum = parse_request(request)
  except Exception as e:
    return json.dumps({'error': str(e)})

  trips = tripstore.get_trips_by_pickup((month, year), top_left, bottom_right)
  trips = { repr(k) : v for k,v in trips.iteritems() } 
  return json.dumps(trips)

@app.route('/cache_view.json', methods =['POST', 'GET'])
def cache_top_pickups():
  try:
    month, year, top_left, bottom_right, maximum = parse_request(request)
    trips = tripstore.get_top_pickups((month, year), top_left, bottom_right, maximum)
    cache.put((month, year, tuple(top_left), tuple(bottom_right), maximum), trips)
    return "true"
  except Exception as e:
    return json.dumps({'error': str(e)})

