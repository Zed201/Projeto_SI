// Configuracao inicial e limites do grid.
const GRID_ROWS_DEFAULT = 14;
const GRID_COLS_DEFAULT = 14;
const GRID_ROWS_MIN = 1;
const GRID_ROWS_MAX = 20;
const GRID_COLS_MIN = 1;
const GRID_COLS_MAX = 20;
// Tamanho das celulas (pixels).
const CELL_SIZE_DEFAULT = 48;
const CELL_SIZE_MIN = 16;
const CELL_SIZE_MAX = 48;
// Parametros de layout da legenda/controles.
const UI_PADDING = 10;
const LEGEND_ROW_GAP = 26;
const LEGEND_LABEL_OFFSET = 70;
const LEGEND_WIDTH = 300;
const BUTTON_WIDTH = 120;
const BUTTON_HEIGHT = 32;
const BUTTON_GAP = 8;
const GRID_MAX_WIDTH = GRID_COLS_MAX * CELL_SIZE_MAX;
const GRID_MAX_HEIGHT = GRID_ROWS_MAX * CELL_SIZE_MAX;
const CANVAS_WIDTH = GRID_MAX_WIDTH + LEGEND_WIDTH;
const CANVAS_HEIGHT = GRID_MAX_HEIGHT;
const LEGEND_X = GRID_MAX_WIDTH + UI_PADDING;
const LEGEND_Y = UI_PADDING;

// Pesos de expansão por terreno (0-1)
const TERRAIN_WEIGHTS = {
  0: 0.0,    // intransponível - não expande
  1: 0.3,    // areia - expande pouco
  2: 0.5,    // atoleiro - expande moderadamente
  3: 0.8,    // água - expande bastante
};
const PROPAGATION_SEEDS_MIN = 5;
const PROPAGATION_SEEDS_MAX = 15;
const PROPAGATION_ITERATIONS = 4;

// Estado global do sketch.
let grid;
let gridmap;

let sizeSlider;
let rowSlider;
let colSlider;
let container;
let resetBtn;
let randomBtn;
let propagateBtn;

// Agora temos 5 botões para os 5 algoritmos da atividade!
let algorithmBtn1, algorithmBtn2, algorithmBtn3, algorithmBtn4, algorithmBtn5;

// *** VARIÁVEIS DO SISTEMA DE JOGO ***
let currentAlgorithm = null;
let foodsCollected = 0;

function updateCellSize() {
  grid.setCellSize(sizeSlider.value());
  gridmap.setCellSize(sizeSlider.value());
}

function updateGridDimensions() {
  grid.resize(rowSlider.value(), colSlider.value());
  gridmap.resize(rowSlider.value(), colSlider.value());
  onResetClick();
}

function fillGridPattern() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      grid.setElement(r, c, 1);
    }
  }
}

function onResetClick() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  currentAlgorithm = null; 

  const totalCells = grid.rows * grid.cols;
  if (totalCells < 2) return;

  let pos1Valid = false;
  let pos2Valid = false;
  let row1, col1, row2, col2;
  let attempts = 0;
  const maxAttempts = 1000;

  while ((!pos1Valid || !pos2Valid) && attempts < maxAttempts) {
    if (!pos1Valid) {
      row1 = Math.floor(Math.random() * grid.rows);
      col1 = Math.floor(Math.random() * grid.cols);
      if (grid.getElement(row1, col1).value !== 0) pos1Valid = true;
    }

    if (!pos2Valid) {
      row2 = Math.floor(Math.random() * grid.rows);
      col2 = Math.floor(Math.random() * grid.cols);
      if (grid.getElement(row2, col2).value !== 0 && !(row2 === row1 && col2 === col1)) {
        pos2Valid = true;
      }
    }
    attempts += 1;
  }

  if (pos1Valid && pos2Valid) {
    gridmap.setMarkerStartPosition(row1, col1);
    gridmap.setFruitPosition(row2, col2);
  }
}

function onRandomClick() {
  random_original();
  onResetClick();
}

function onPropagateClick() {
  randomizeGridWithPropagation();
  onResetClick();
}

function onAlgorithm1Click() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  if (gridmap.fruitRow === -1) return;

  currentAlgorithm = new BFS(
    gridmap,
    gridmap.markerRow, gridmap.markerCol,
    gridmap.fruitRow, gridmap.fruitCol
  );
}

function onAlgorithm2Click() {
  console.log("Busca em Profundidade (DFS) ainda não implementada");
}

function onAlgorithm3Click() {
  console.log("Custo Uniforme ainda não implementado");
}

function onAlgorithm4Click() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  if (gridmap.fruitRow === -1) return;

  // Inicia a BUSCA GULOSA
  currentAlgorithm = new Greedy(
    gridmap,
    gridmap.markerRow, gridmap.markerCol,
    gridmap.fruitRow, gridmap.fruitCol
  );
}

function onAlgorithm5Click() {
  console.log("Busca A* ainda não implementada");
}

function random_original() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      grid.setElement(r, c, Math.floor(Math.random() * 4));
    }
  }
  if (gridmap) syncGridValues();
}

function syncGridValues() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const value = grid.getElement(r, c).value;
      const cell = gridmap.getElement(r, c);
      if (cell) cell.value = value;
    }
  }
}

function randomizeGridWithPropagation() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) grid.setElement(r, c, 0);
  }

  const numSeeds = Math.floor(Math.random() * (PROPAGATION_SEEDS_MAX - PROPAGATION_SEEDS_MIN + 1)) + PROPAGATION_SEEDS_MIN;
  for (let i = 0; i < numSeeds; i += 1) {
    const r = Math.floor(Math.random() * grid.rows);
    const c = Math.floor(Math.random() * grid.cols);
    const value = Math.floor(Math.random() * 3) + 1;
    grid.setElement(r, c, value);
  }

  for (let iteration = 0; iteration < PROPAGATION_ITERATIONS; iteration += 1) {
    const newCells = [];
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        const currentValue = grid.getElement(r, c).value;
        if (currentValue === 0) continue;

        const weight = TERRAIN_WEIGHTS[currentValue] || 0;
        const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];

        for (const [nr, nc] of neighbors) {
          if (!grid.inBounds(nr, nc)) continue;
          if (grid.getElement(nr, nc).value !== 0) continue;
          if (Math.random() < weight) newCells.push([nr, nc, currentValue]);
        }
      }
    }
    for (const [r, c, value] of newCells) grid.setElement(r, c, value);
  }
  syncGridValues();
}

function setup() {
  container = createDiv();
  container.style("position", "relative");
  container.style("width", `${CANVAS_WIDTH}px`);
  container.style("height", `${CANVAS_HEIGHT}px`);

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent(container);

  grid = new Grid(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);
  random_original();

  gridmap = new AlgorithmGrid(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);
  syncGridValues();
  gridmap.setMarkerSpeed(0.05);

  sizeSlider = createSlider(CELL_SIZE_MIN, CELL_SIZE_MAX, CELL_SIZE_DEFAULT, 1);
  rowSlider = createSlider(GRID_ROWS_MIN, GRID_ROWS_MAX, GRID_ROWS_DEFAULT, 1);
  colSlider = createSlider(GRID_COLS_MIN, GRID_COLS_MAX, GRID_COLS_DEFAULT, 1);

  sizeSlider.parent(container);
  rowSlider.parent(container);
  colSlider.parent(container);

  colSlider.position(LEGEND_X + LEGEND_LABEL_OFFSET, LEGEND_Y);
  rowSlider.position(LEGEND_X + LEGEND_LABEL_OFFSET, LEGEND_Y + LEGEND_ROW_GAP);
  sizeSlider.position(LEGEND_X + LEGEND_LABEL_OFFSET, LEGEND_Y + LEGEND_ROW_GAP * 2);

  colSlider.style("width", "140px");
  rowSlider.style("width", "140px");
  sizeSlider.style("width", "140px");

  sizeSlider.input(updateCellSize);
  rowSlider.input(updateGridDimensions);
  colSlider.input(updateGridDimensions);

  resetBtn = createButton("Reset");
  randomBtn = createButton("Random");
  propagateBtn = createButton("Propagate");
  
  // Nomes corretos para os botões exigidos na atividade
  algorithmBtn1 = createButton("BFS (Largura)");
  algorithmBtn2 = createButton("DFS (Profund.)");
  algorithmBtn3 = createButton("Custo Uniforme");
  algorithmBtn4 = createButton("Gulosa");
  algorithmBtn5 = createButton("A*");

  resetBtn.parent(container);
  randomBtn.parent(container);
  propagateBtn.parent(container);
  algorithmBtn1.parent(container);
  algorithmBtn2.parent(container);
  algorithmBtn3.parent(container);
  algorithmBtn4.parent(container);
  algorithmBtn5.parent(container); // Novo botão

  const buttonsY = LEGEND_Y + LEGEND_ROW_GAP * 3 + 15;
  resetBtn.position(LEGEND_X, buttonsY);
  randomBtn.position(LEGEND_X, buttonsY + BUTTON_HEIGHT + BUTTON_GAP);
  propagateBtn.position(LEGEND_X, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 2);

  const algoX = LEGEND_X + BUTTON_WIDTH + BUTTON_GAP;
  algorithmBtn1.position(algoX, buttonsY);
  algorithmBtn2.position(algoX, buttonsY + BUTTON_HEIGHT + BUTTON_GAP);
  algorithmBtn3.position(algoX, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 2);
  algorithmBtn4.position(algoX, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 3);
  algorithmBtn5.position(algoX, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 4); // Novo botão

  [resetBtn, randomBtn, propagateBtn].forEach(btn => {
    btn.style("width", `${BUTTON_WIDTH}px`);
    btn.style("height", `${BUTTON_HEIGHT}px`);
    btn.style("background-color", "#4CAF50");
    btn.style("color", "white");
    btn.style("border", "none");
    btn.style("border-radius", "4px");
    btn.style("font-size", "14px");
    btn.style("font-weight", "bold");
    btn.style("cursor", "pointer");
  });

  [algorithmBtn1, algorithmBtn2, algorithmBtn3, algorithmBtn4, algorithmBtn5].forEach(btn => {
    btn.style("width", `${BUTTON_WIDTH}px`);
    btn.style("height", `${BUTTON_HEIGHT}px`);
    btn.style("background-color", "#2196F3");
    btn.style("color", "white");
    btn.style("border", "none");
    btn.style("border-radius", "4px");
    btn.style("font-size", "12px");
    btn.style("font-weight", "bold");
    btn.style("cursor", "pointer");
  });

  resetBtn.mousePressed(onResetClick);
  randomBtn.mousePressed(onRandomClick);
  propagateBtn.mousePressed(onPropagateClick);
  algorithmBtn1.mousePressed(onAlgorithm1Click);
  algorithmBtn2.mousePressed(onAlgorithm2Click);
  algorithmBtn3.mousePressed(onAlgorithm3Click);
  algorithmBtn4.mousePressed(onAlgorithm4Click);
  algorithmBtn5.mousePressed(onAlgorithm5Click); // Evento do novo botão

  onRandomClick();
}

function draw() {
  background(240);
  grid.render(); 

  // =========================================================
  // MOTOR DE ANIMAÇÃO DA BUSCA E DO CAMINHO
  // =========================================================
  if (currentAlgorithm) {
    
    // ESTÁGIO 1: A BUSCA AINDA ESTÁ RODANDO
    if (!currentAlgorithm.completed) {
      
      // Controla a velocidade (1 passo a cada 3 frames)
      if (frameCount % 3 === 0) { 
        currentAlgorithm.step();
      }

      gridmap.clearAllShade();
      
      // Visitados (Sombra Média)
      for (const vKey of currentAlgorithm.visited) {
        const [r, c] = vKey.split('-').map(Number);
        gridmap.setShade(r, c, 0.4);
      }
      
      // Fronteira (Sombra Escura)
      for (const [r, c] of currentAlgorithm.frontier) {
        gridmap.setShade(r, c, 0.7);
      }
    } 
    
    // ESTÁGIO 2: BUSCA TERMINOU E ENCONTROU A COMIDA
    else if (currentAlgorithm.pathFound) {
      const path = currentAlgorithm.path;
      
      // Limpa as sombras cinzas de visitados/fronteira para dar destaque ao caminho
      gridmap.clearAllShade(); 

      // Renderiza o fundo amarelo translúcido por todo o caminho descoberto
      fill(255, 215, 0, 150); // Amarelo com transparência
      noStroke();
      for (const [r, c] of path) {
        rect(c * gridmap.cellSize, r * gridmap.cellSize, gridmap.cellSize, gridmap.cellSize);
      }

      // Se as conexões (linhas brancas) ainda não foram criadas, cria agora
      if (gridmap.connections.length === 0 && path.length > 0) {
        for (let i = 0; i < path.length - 1; i++) {
          gridmap.addConnection(path[i][0], path[i][1], path[i+1][0], path[i+1][1]);
        }
        // Força a bolinha a atualizar seu estado inicial para começar a andar
        gridmap.markerProgress = 1; 
      }

      // Executa o movimento do agente (bolinha) pelo caminho
      gridmap.updateMarker();
    }
  }

  // =========================================================
  // SISTEMA DE COLISÃO E REINÍCIO (Passos 9 e 10)
  // =========================================================
  
  if (gridmap.fruitRow !== -1 && 
      Math.round(gridmap.markerRow) === gridmap.fruitRow && 
      Math.round(gridmap.markerCol) === gridmap.fruitCol &&
      currentAlgorithm && currentAlgorithm.completed) { 
    
    foodsCollected++;               
    gridmap.clearConnections();     
    currentAlgorithm = null;        
    
    let posValid = false;
    let r, c;
    while (!posValid) {
      r = Math.floor(Math.random() * grid.rows);
      c = Math.floor(Math.random() * grid.cols);
      if (grid.getElement(r, c).value !== 0 && !(r === Math.round(gridmap.markerRow) && c === Math.round(gridmap.markerCol))) {
        posValid = true;
      }
    }
    gridmap.setFruitPosition(r, c);
  }

  gridmap.render();

  // =========================================================
  // INTERFACE DE USUÁRIO (Legenda)
  // =========================================================
  noStroke();
  fill(245);
  rect(GRID_MAX_WIDTH, 0, LEGEND_WIDTH, CANVAS_HEIGHT);

  fill(0);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Cols: ${colSlider.value()}`, LEGEND_X, LEGEND_Y);
  text(`Rows: ${rowSlider.value()}`, LEGEND_X, LEGEND_Y + LEGEND_ROW_GAP);
  text(`Size: ${sizeSlider.value()}`, LEGEND_X, LEGEND_Y + LEGEND_ROW_GAP * 2);

  textSize(16);
  fill(40, 150, 40);
  text(`Comidas Coletadas: ${foodsCollected}`, LEGEND_X, LEGEND_Y + LEGEND_ROW_GAP * 8);
}