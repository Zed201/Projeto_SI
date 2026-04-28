// ====== CLASSE NODE ======
class Node {
  constructor(x, y, parent = null) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.g = parent ? parent.g + grid[y][x].cost : 0; // Custo acumulado
    this.h = 0; // Heurística (calculada depois)
    this.f = this.g; // g + h
  }
}

// ====== BUSCA EM LARGURA (BFS) ======
function breadthFirstSearch(start, goal) {
  const queue = [start];
  const visited = new Set();
  const visitedOrder = [];
  const frontier = new Set([hashPos(start.x, start.y)]);
  
  visited.add(hashPos(start.x, start.y));
  
  while (queue.length > 0) {
    const current = queue.shift();
    visitedOrder.push({x: current.x, y: current.y});
    frontier.delete(hashPos(current.x, current.y));
    
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(current),
        visited: visitedOrder,
        frontier: Array.from(frontier).map(h => unhashPos(h)),
        success: true,
        nodesExpanded: visited.size
      };
    }
    
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = hashPos(nx, ny);
      
      if (isValid(nx, ny) && !visited.has(key)) {
        visited.add(key);
        const neighbor = new Node(nx, ny, current);
        queue.push(neighbor);
        frontier.add(key);
      }
    }
  }
  
  return { path: [], visited: visitedOrder, frontier: [], success: false, nodesExpanded: visited.size };
}

// ====== BUSCA EM PROFUNDIDADE (DFS) ======
function depthFirstSearch(start, goal) {
  const stack = [start];
  const visited = new Set();
  const visitedOrder = [];
  const frontier = new Set([hashPos(start.x, start.y)]);
  
  visited.add(hashPos(start.x, start.y));
  
  while (stack.length > 0) {
    const current = stack.pop();
    visitedOrder.push({x: current.x, y: current.y});
    frontier.delete(hashPos(current.x, current.y));
    
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(current),
        visited: visitedOrder,
        frontier: Array.from(frontier).map(h => unhashPos(h)),
        success: true,
        nodesExpanded: visited.size
      };
    }
    
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = hashPos(nx, ny);
      
      if (isValid(nx, ny) && !visited.has(key)) {
        visited.add(key);
        const neighbor = new Node(nx, ny, current);
        stack.push(neighbor);
        frontier.add(key);
      }
    }
  }
  
  return { path: [], visited: visitedOrder, frontier: [], success: false, nodesExpanded: visited.size };
}

// ====== BUSCA DE CUSTO UNIFORME (UCS) ======
function uniformCostSearch(start, goal) {
  const openSet = [start];
  const visited = new Set();
  const visitedOrder = [];
  const frontier = new Set([hashPos(start.x, start.y)]);
  
  while (openSet.length > 0) {
    // Encontra o nó com menor custo
    let minIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].g < openSet[minIdx].g) {
        minIdx = i;
      }
    }
    
    const current = openSet.splice(minIdx, 1)[0];
    const currentKey = hashPos(current.x, current.y);
    
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    visitedOrder.push({x: current.x, y: current.y});
    frontier.delete(currentKey);
    
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(current),
        visited: visitedOrder,
        frontier: Array.from(frontier).map(h => unhashPos(h)),
        success: true,
        nodesExpanded: visited.size
      };
    }
    
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = hashPos(nx, ny);
      
      if (isValid(nx, ny) && !visited.has(key)) {
        const neighbor = new Node(nx, ny, current);
        openSet.push(neighbor);
        frontier.add(key);
      }
    }
  }
  
  return { path: [], visited: visitedOrder, frontier: [], success: false, nodesExpanded: visited.size };
}

// ====== BUSCA GULOSA ======
function greedySearch(start, goal) {
  const openSet = [start];
  const visited = new Set();
  const visitedOrder = [];
  const frontier = new Set([hashPos(start.x, start.y)]);
  
  // Calcula heurística para start
  start.h = manhattanDistance(start.x, start.y, goal.x, goal.y);
  start.f = start.h;
  
  while (openSet.length > 0) {
    // Encontra nó com menor h
    let minIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].h < openSet[minIdx].h) {
        minIdx = i;
      }
    }
    
    const current = openSet.splice(minIdx, 1)[0];
    const currentKey = hashPos(current.x, current.y);
    
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    visitedOrder.push({x: current.x, y: current.y});
    frontier.delete(currentKey);
    
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(current),
        visited: visitedOrder,
        frontier: Array.from(frontier).map(h => unhashPos(h)),
        success: true,
        nodesExpanded: visited.size
      };
    }
    
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = hashPos(nx, ny);
      
      if (isValid(nx, ny) && !visited.has(key)) {
        const neighbor = new Node(nx, ny, current);
        neighbor.h = manhattanDistance(nx, ny, goal.x, goal.y);
        neighbor.f = neighbor.h;
        openSet.push(neighbor);
        frontier.add(key);
      }
    }
  }
  
  return { path: [], visited: visitedOrder, frontier: [], success: false, nodesExpanded: visited.size };
}

// ====== BUSCA A* ======
function aStarSearch(start, goal) {
  const openSet = [start];
  const visited = new Set();
  const visitedOrder = [];
  const frontier = new Set([hashPos(start.x, start.y)]);
  
  // Calcula heurística para start
  start.h = manhattanDistance(start.x, start.y, goal.x, goal.y);
  start.f = start.g + start.h;
  
  while (openSet.length > 0) {
    // Encontra nó com menor f = g + h
    let minIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[minIdx].f) {
        minIdx = i;
      }
    }
    
    const current = openSet.splice(minIdx, 1)[0];
    const currentKey = hashPos(current.x, current.y);
    
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    visitedOrder.push({x: current.x, y: current.y});
    frontier.delete(currentKey);
    
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(current),
        visited: visitedOrder,
        frontier: Array.from(frontier).map(h => unhashPos(h)),
        success: true,
        nodesExpanded: visited.size
      };
    }
    
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = hashPos(nx, ny);
      
      if (isValid(nx, ny) && !visited.has(key)) {
        const neighbor = new Node(nx, ny, current);
        neighbor.h = manhattanDistance(nx, ny, goal.x, goal.y);
        neighbor.f = neighbor.g + neighbor.h;
        openSet.push(neighbor);
        frontier.add(key);
      }
    }
  }
  
  return { path: [], visited: visitedOrder, frontier: [], success: false, nodesExpanded: visited.size };
}

// ====== FUNÇÕES AUXILIARES ======
function reconstructPath(node) {
  const path = [];
  let current = node;
  while (current) {
    path.unshift({x: current.x, y: current.y});
    current = current.parent;
  }
  return path;
}

function manhattanDistance(x1, y1, x2, y2) {
  return abs(x1 - x2) + abs(y1 - y2);
}

function euclideanDistance(x1, y1, x2, y2) {
  return sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2));
}

function isValid(x, y) {
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
  return grid[y][x].type !== 3; // 3 = obstáculo
}

function hashPos(x, y) {
  return x + ',' + y;
}

function unhashPos(hash) {
  const [x, y] = hash.split(',').map(Number);
  return {x, y};
}
