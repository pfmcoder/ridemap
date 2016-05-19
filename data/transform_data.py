import sys
import json

in_filename = sys.argv[1]
out_filename = sys.argv[2]

with open(in_filename) as infile:
  infile.readline()
  with open(out_filename, 'w') as outfile:
    prev = None
    min_lat = 90
    max_lat = -90
    min_lon = 180
    max_lon = -180
    for line in infile:
      if prev is None:
        prev = line.strip().split(",")
      else:
        curr = json.loads('[' + line.strip() + ']')[:-1]
        outfile.write(json.dumps(curr + [float(prev[1]), float(prev[2])]) + '\n')
        max_lat = max(max_lat, curr[1]) 
        min_lat = min(min_lat, curr[1]) 
        max_lon = max(max_lon, curr[2]) 
        min_lon = min(min_lon, curr[2]) 
        prev = None
   #TODO print max,min lat for use in QuadTree 
  
