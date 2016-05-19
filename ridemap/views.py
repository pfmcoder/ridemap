from datetime import datetime
from collections import defaultdict
import json
from flask import Flask, request, render_template
from ridemap import app
from lib.tripstore import TripStoreProvider

"""
  Views for RideMap application. 
    Because of the few number of routes, both html and json routes are contained within this file
    In the future, we can split those out for the json endpoints vs. html serving
"""

#immediately load the tripstore before we start serving requests
tripstore = TripStoreProvider.get('inmemory')

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
  return (int(month), int(year), [float(x) for x in top_left.split(',')], [float(x) for x in bottom_right.split(',')], maximum)


#------ routes
@app.route('/ping')
def ping():
  return 'pong'

@app.route('/ridemap')
def index():
  return render_template('index.html')

@app.route('/top_pickups.json')
def top_pickups():
  try:
    month, year, top_left, bottom_right, maximum = parse_request(request)
  except Exception as e:
    return json.dumps({'error': str(e)})

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
