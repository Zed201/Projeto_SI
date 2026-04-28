// ====== CONSTANTES ======
const GRID_WIDTH = 25;
const GRID_HEIGHT = 20;
const CELL_SIZE = 25;
const ANIMATION_SPEED = 50; // ms por frame de animação

// ====== TIPOS DE TERRENO ======
const TERRAIN = {
  SAND: 0,      // Areia, custo 1
  SWAMP: 1,     // Atoleiro, custo 5
  WATER: 2,     // Água, custo 10
  OBSTACLE: 3   // Obstáculo
};

const TERRAIN_COST = {
  0: 1,
  1: 5,
  2: 10,
  3: Infinity
};

const TERRAIN_COLORS = {
  0: [194, 178, 128],  // Areia
  1: [188, 156, 84],   // Atoleiro
  2: [74, 144, 226],   // Água
  3: [50, 50, 50]      // Obstáculo
};

// ====== VARIÁVEIS GLOBAIS ======
let grid = [];
let agentPos = {x: 0, y: 0};
let foodPos = {x: 0, y: 0};
let searchResult = null;
let currentAlgorithm = 'astar';
let gameState = 'setup'; // setup, searching, moving, collecting, paused
let animationFrame = 0;
let agentProgress = 0; // 0 a 1, progresso no caminho
let foodCollected = 0;
let searchStartTime = 0;
let lastAnimationTime = 0;

// Visualização
let visualizedVisited = [];
let visualizedFrontier = [];
let visualizedPath = [];

function setup() {
  const container = document.getElementById('p5-container');
  const canvasWidth = GRID_WIDTH * CELL_SIZE + 280;
  const canvasHeight = GRID_HEIGHT * CELL_SIZE + 120;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('p5-container');
  
  initializeGame();
}

function initializeGame() {
  generateMap();
  gameState = 'setup'; // Será processado no próximo draw()
  foodCollected = 0;
  searchResult = null;
  visualizedVisited = [];
  visualizedFrontier = [];
  visualizedPath = [];
  agentProgress = 0;
  placeAgentAndFood();
}

function generateMap() {
  grid = [];
  randomSeed(random()); // Nova seed a cada vez
  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const rand = Math.random();
      let type;
      if (rand < 0.15) {
        type = TERRAIN.OBSTACLE;
      } else if (rand < 0.35) {
        type = TERRAIN.WATER;
      } else if (rand < 0.55) {
        type = TERRAIN.SWAMP;
      } else {
        type = TERRAIN.SAND;
      }
      grid[y][x] = {
        type: type,
        cost: TERRAIN_COST[type]
      };
    }
  }
}

function placeAgentAndFood() {
  let agentPlaced = false;
  let foodPlaced = false;
  
  // Reseta progresso
  agentProgress = 0;
  
  // Coloca agente
  while (!agentPlaced) {
    agentPos.x = Math.floor(Math.random() * GRID_WIDTH);
    agentPos.y = Math.floor(Math.random() * GRID_HEIGHT);
    if (grid[agentPos.y][agentPos.x].type !== TERRAIN.OBSTACLE) {
      agentPlaced = true;
    }
  }
  
  // Coloca comida em posição diferente do agente
  while (!foodPlaced) {
    foodPos.x = Math.floor(Math.random() * GRID_WIDTH);
    foodPos.y = Math.floor(Math.random() * GRID_HEIGHT);
    if (grid[foodPos.y][foodPos.x].type !== TERRAIN.OBSTACLE && 
        !(foodPos.x === agentPos.x && foodPos.y === agentPos.y)) {
      foodPlaced = true;
    }
  }
  
  // NÃO muda gameState aqui - deixe o chamador fazer isso
  console.log('Novo agente em (' + agentPos.x + ',' + agentPos.y + '), comida em (' + foodPos.x + ',' + foodPos.y + ')');
}

function startSearch() {
  // Evita executar múltiplas vezes
  if (gameState !== 'setup') return;
  
  gameState = 'searching';
  animationFrame = 0;
  visualizedVisited = [];
  visualizedFrontier = [];
  visualizedPath = [];
  lastAnimationTime = millis();
  
  // IMPORTANTE: Usar posição inteira do agente
  const startX = Math.round(agentPos.x);
  const startY = Math.round(agentPos.y);
  const start = new Node(startX, startY);
  const goal = {x: foodPos.x, y: foodPos.y};
  
  console.log('Iniciando busca de (' + startX + ',' + startY + ') para (' + goal.x + ',' + goal.y + ')');
  
  // Seleciona algoritmo
  switch(currentAlgorithm) {
    case 'bfs':
      searchResult = breadthFirstSearch(start, goal);
      break;
    case 'dfs':
      searchResult = depthFirstSearch(start, goal);
      break;
    case 'ucs':
      searchResult = uniformCostSearch(start, goal);
      break;
    case 'greedy':
      searchResult = greedySearch(start, goal);
      break;
    case 'astar':
      searchResult = aStarSearch(start, goal);
      break;
  }
  
  searchStartTime = millis();
}

function draw() {
  // Limpa canvas completamente
  background(200);
  
  // Desenha grid
  drawGrid();
  
  // Máquina de estados
  if (gameState === 'setup') {
    // Garante que agentPos é inteiro antes de busca
    agentPos.x = Math.round(agentPos.x);
    agentPos.y = Math.round(agentPos.y);
    startSearch();
  } else if (gameState === 'searching') {
    animateSearch();
  } else if (gameState === 'moving') {
    animateAgentMovement();
  }
  
  // Desenha interface (sempre por cima)
  drawUI();
}

function drawGrid() {
  // Desenha terrenos base
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;
      
      // Desenha terreno
      fill(TERRAIN_COLORS[grid[y][x].type]);
      stroke(100);
      strokeWeight(1);
      rect(px, py, CELL_SIZE, CELL_SIZE);
    }
  }
  
  // Desenha visitados (azul claro)
  fill(150, 200, 255);
  noStroke();
  for (const pos of visualizedVisited) {
    const px = pos.x * CELL_SIZE + 2;
    const py = pos.y * CELL_SIZE + 2;
    rect(px, py, CELL_SIZE - 4, CELL_SIZE - 4);
  }
  
  // Desenha fronteira (verde)
  fill(150, 255, 150);
  noStroke();
  for (const pos of visualizedFrontier) {
    const px = pos.x * CELL_SIZE + 5;
    const py = pos.y * CELL_SIZE + 5;
    ellipse(px + CELL_SIZE/2 - 5, py + CELL_SIZE/2 - 5, CELL_SIZE - 10);
  }
  
  // Desenha caminho final (vermelho grosso)
  if (visualizedPath.length > 1) {
    stroke(255, 50, 50);
    strokeWeight(4);
    noFill();
    beginShape();
    for (const p of visualizedPath) {
      vertex(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
    }
    endShape();
  }
  
  // Desenha comida (círculo laranja grande, sempre visível)
  fill(255, 140, 0);
  stroke(200, 100, 0);
  strokeWeight(2);
  const foodScreenX = foodPos.x * CELL_SIZE + CELL_SIZE/2;
  const foodScreenY = foodPos.y * CELL_SIZE + CELL_SIZE/2;
  ellipse(foodScreenX, foodScreenY, CELL_SIZE * 0.7);
  
  // Desenha agente (círculo verde escuro, bem visível por cima de tudo)
  fill(34, 139, 34);
  stroke(0, 100, 0);
  strokeWeight(2);
  const agentScreenX = agentPos.x * CELL_SIZE + CELL_SIZE/2;
  const agentScreenY = agentPos.y * CELL_SIZE + CELL_SIZE/2;
  ellipse(agentScreenX, agentScreenY, CELL_SIZE * 0.75);
  
  // Ponto central do agente para referência
  fill(200, 255, 200);
  ellipse(agentScreenX, agentScreenY, 4);
}

function animateSearch() {
  if (!searchResult) return;
  
  const elapsed = millis() - searchStartTime;
  const totalFrames = searchResult.visited.length + 5;
  const currentFrame = Math.floor(elapsed / ANIMATION_SPEED);
  
  // Mostra visitados gradualmente
  if (currentFrame < searchResult.visited.length) {
    visualizedVisited = searchResult.visited.slice(0, currentFrame);
    visualizedFrontier = [];
    visualizedPath = [];
  } else if (searchResult.success) {
    // Animação de busca completa, mostra caminho
    gameState = 'moving';
    agentProgress = 0;
    visualizedPath = searchResult.path;
    visualizedVisited = searchResult.visited;
    visualizedFrontier = [];
  }
}

function animateAgentMovement() {
  if (!searchResult || !searchResult.path || searchResult.path.length === 0) {
    // Sem caminho, coloca comida nova
    placeAgentAndFood();
    return;
  }
  
  // Move agent ao longo do caminho
  agentProgress += 0.015; // Velocidade base
  
  if (agentProgress >= 1.0) {
    // Chegou na comida - atualiza para última posição do caminho (inteiro)
    const lastPos = searchResult.path[searchResult.path.length - 1];
    agentPos.x = lastPos.x;
    agentPos.y = lastPos.y;
    foodCollected++;
    placeAgentAndFood();
    gameState = 'setup'; // Gatilho para próxima busca
    return;
  }
  
  // Interpolação no caminho
  const path = searchResult.path;
  const targetSegment = agentProgress * (path.length - 1);
  const segmentIndex = Math.floor(targetSegment);
  const localProgress = targetSegment - segmentIndex;
  
  if (segmentIndex < path.length - 1) {
    const p1 = path[segmentIndex];
    const p2 = path[segmentIndex + 1];
    
    agentPos.x = lerp(p1.x, p2.x, localProgress);
    agentPos.y = lerp(p1.y, p2.y, localProgress);
    
    // Verifica colisão com comida
    const distToFood = dist(agentPos.x, agentPos.y, foodPos.x, foodPos.y);
    if (distToFood < 0.5) {
      const lastPos = path[path.length - 1];
      agentPos.x = lastPos.x;
      agentPos.y = lastPos.y;
      foodCollected++;
      placeAgentAndFood();
      gameState = 'setup'; // Gatilho para próxima busca
    }
  }
}

function drawUI() {
  const panelX = GRID_WIDTH * CELL_SIZE + 10;
  const panelY = 10;
  const panelW = 260;
  
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(panelX, panelY, panelW, height - 20);
  
  fill(0);
  noStroke();
  textSize(11);
  textAlign(LEFT, TOP);
  
  let y = panelY + 12;
  
  // Algoritmo atual
  fill(0);
  textSize(11);
  text('ALGORITMO', panelX + 10, y);
  y += 18;
  
  const algorithms = [
    {key: 'bfs', label: 'BFS'},
    {key: 'dfs', label: 'DFS'},
    {key: 'ucs', label: 'UCS'},
    {key: 'greedy', label: 'Gulosa'},
    {key: 'astar', label: 'A*'}
  ];
  
  for (const alg of algorithms) {
    fill(currentAlgorithm === alg.key ? 80 : 200);
    stroke(0);
    strokeWeight(1);
    rect(panelX + 10, y, 100, 16);
    
    fill(0);
    noStroke();
    textSize(10);
    text(alg.label, panelX + 14, y + 2);
    
    y += 18;
  }
  
  y += 8;
  
  // Botão Reiniciar
  if (drawButton(panelX + 10, y, 240, 20, 'Reiniciar')) {
    initializeGame();
  }
  
  y += 28;
  
  // Estatísticas compactas
  fill(0);
  textSize(10);
  text('ESTATÍSTICAS', panelX + 10, y);
  y += 15;
  
  text('Comida: ' + foodCollected, panelX + 10, y);
  y += 13;
  
  if (searchResult) {
    text('Nós: ' + searchResult.nodesExpanded, panelX + 10, y);
    y += 13;
    
    if (searchResult.success) {
      text('Custo: ' + (searchResult.path.length - 1), panelX + 10, y);
    } else {
      fill(255, 0, 0);
      text('Sem caminho!', panelX + 10, y);
      fill(0);
    }
  }
  
  y += 13;
  text('Estado: ' + gameState, panelX + 10, y);
  y += 13;
  text('Ag: (' + Math.round(agentPos.x) + ',' + Math.round(agentPos.y) + ')', panelX + 10, y);
  y += 13;
  text('Com: (' + foodPos.x + ',' + foodPos.y + ')', panelX + 10, y);
  
  // Legenda (fixo no final)
  y = height - 70;
  fill(0);
  textSize(10);
  text('LEGENDA', panelX + 10, y);
  
  y += 15;
  fill(150, 200, 255);
  rect(panelX + 10, y, 12, 12);
  fill(0);
  text('Visitados', panelX + 27, y + 1);
  
  y += 15;
  fill(150, 255, 150);
  ellipse(panelX + 16, y + 6, 12);
  fill(0);
  text('Fronteira', panelX + 27, y + 1);
  
  y += 15;
  fill(255, 50, 50);
  line(panelX + 10, y + 6, panelX + 22, y + 6);
  fill(0);
  text('Caminho', panelX + 27, y + 1);
}

function drawButton(x, y, w, h, label) {
  fill(200);
  stroke(0);
  strokeWeight(1);
  rect(x, y, w, h);
  
  fill(0);
  noStroke();
  textSize(11);
  textAlign(CENTER, CENTER);
  text(label, x + w/2, y + h/2);
  textAlign(LEFT, TOP);
  
  // Detecta clique
  if (mouseIsPressed && 
      mouseX > x && mouseX < x + w &&
      mouseY > y && mouseY < y + h) {
    return true;
  }
  return false;
}

function mousePressed() {
  const panelX = GRID_WIDTH * CELL_SIZE + 10;
  const panelY = 10;
  
  let y = panelY + 30; // Começa após "ALGORITMO"
  
  // Clique em algoritmo (botões de 100px x 16px)
  const algorithms = [
    {key: 'bfs'},
    {key: 'dfs'},
    {key: 'ucs'},
    {key: 'greedy'},
    {key: 'astar'}
  ];
  
  for (const alg of algorithms) {
    if (mouseX > panelX + 10 && mouseX < panelX + 110 &&
        mouseY > y && mouseY < y + 16) {
      currentAlgorithm = alg.key;
      gameState = 'setup';
      return false;
    }
    y += 18;
  }
  
  // Clique em "Reiniciar"
  const buttonY = y + 8;
  if (mouseX > panelX + 10 && mouseX < panelX + 250 &&
      mouseY > buttonY && mouseY < buttonY + 20) {
    initializeGame();
    return false;
  }
  
  return false;
}
