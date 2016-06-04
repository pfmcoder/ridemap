
class CacheNode(object):
  """ 
    Class to represent a node in a doubly linked list.
    Meant to be used within an LruCache
  """
  def __init__(self, data, left, right):
    self.data = data
    self.left = left
    self.right = right

  def move(self, left, right):
    self.remove()
    self.left = left
    self.right = right

  def remove(self):
    left = self.left
    right = self.right
    if (left):
      left.right = right
    if (right):
      right.left = left

  def right_size(self):
    size = 1
    right = self.right
    while right is not None:
      size = size + 1
      right = right.right
    return size

class LruCache(object):

  """
    LruCache which tracks least recently removed item and removes it
      put() and get() update the "recently used" call
      

    size: max size of cache in number of items

  """
  def __init__(self, size):
    self.key_map = {}
    self.head = None
    self.tail = None
    self.max_size = size

  def _move_to_head(self, node):
    if(self.head is not node):
      node.move(None, self.head)
      self.head = node

  def _remove_from_list(self, node):
    node.remove()
    if node is self.head:
      self.head = None
      self.tail = None

  def get(self, key):
    if key in self.key_map:
      self._move_to_head(self.key_map[key])
      return self.key_map[key].data
    else:
      return None

  def put(self, key, value):
    if key in self.key_map:
      self._remove_from_list(self.key_map[key])
      del self.key_map[key]

    if self.size() >= self.max_size:
      self._remove_from_list(self.tail)
    
    node = CacheNode(value, None, None)
    self._move_to_head(node)
    self.key_map[key] = node
    if (self.size() == 1):
      self.tail = self.head
  
  def size(self):
    return len(self.key_map)
