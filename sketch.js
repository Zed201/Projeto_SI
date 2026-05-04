// ============================================================================
// CONSTANTES DE GRID
// ============================================================================
const GRID_ROWS_DEFAULT = 14;
const GRID_COLS_DEFAULT = 14;
const GRID_ROWS_MIN = 1;
const GRID_ROWS_MAX = 20;
const GRID_COLS_MIN = 1;
const GRID_COLS_MAX = 20;
const CELL_SIZE_DEFAULT = 48;
const CELL_SIZE_MIN = 16;
const CELL_SIZE_MAX = 48;
const GRID_MAX_WIDTH = GRID_COLS_MAX * CELL_SIZE_MAX;   // 960
const GRID_MAX_HEIGHT = GRID_ROWS_MAX * CELL_SIZE_MAX;  // 960

// Pesos de expansão por terreno
const TERRAIN_WEIGHTS = {
  0: 0.0,
  1: 0.3,
  2: 0.5,
  3: 0.8,
};
const PROPAGATION_SEEDS_MIN = 5;
const PROPAGATION_SEEDS_MAX = 15;
const PROPAGATION_ITERATIONS = 4;

// ============================================================================
// CONSTANTES DE LAYOUT DO PAINEL
// ============================================================================
const LEGEND_WIDTH = 300;
const CANVAS_WIDTH = GRID_MAX_WIDTH + LEGEND_WIDTH;  // 1260
const CANVAS_HEIGHT = GRID_MAX_HEIGHT;               // 960
const PANEL_X = GRID_MAX_WIDTH;                      // 960
const PANEL_PAD = 16;
const PANEL_INN_X = PANEL_X + PANEL_PAD;             // 976
const PANEL_INN_W = LEGEND_WIDTH - PANEL_PAD * 2;    // 268

const BTN_H = 34;
const BTN_HALF_W = Math.floor((PANEL_INN_W - 8) / 2); // 130
const BTN_GAP = 8;

const SLIDER_LABEL_W = 94;
const SLIDER_X = PANEL_INN_X + SLIDER_LABEL_W;       // 1070
const SLIDER_W = PANEL_INN_W - SLIDER_LABEL_W;       // 174

const TERRAIN_ITEM_H = 28;

// Posições Y dos elementos do painel
const PY_TITLE         = 16;
const PY_SUBTITLE      = 40;
const PY_DIV1          = 62;
const PY_GRID_HDR      = 76;
const PY_COLS          = 96;
const PY_ROWS          = 124;
const PY_SIZE          = 152;
const PY_DIV2          = 182;
const PY_TERRAIN_HDR   = 194;
const PY_TERRAIN_START = 214;
const PY_DIV3          = PY_TERRAIN_START + 4 * TERRAIN_ITEM_H + 8; // 338
const PY_CTRL_HDR      = PY_DIV3 + 12;                               // 350
const PY_BTN_ROW1      = PY_CTRL_HDR + 22;                           // 372
const PY_BTN_ROW2      = PY_BTN_ROW1 + BTN_H + BTN_GAP;              // 414
const PY_DIV4          = PY_BTN_ROW2 + BTN_H + 14;                   // 462
const PY_ALGO_HDR      = PY_DIV4 + 12;                               // 474
const PY_ALGO1         = PY_ALGO_HDR + 22;                           // 496
const PY_ALGO2         = PY_ALGO1 + BTN_H + BTN_GAP;                 // 538
const PY_ALGO3         = PY_ALGO2 + BTN_H + BTN_GAP;                 // 580
const PY_ALGO4         = PY_ALGO3 + BTN_H + BTN_GAP;                 // 622
const PY_ALGO5         = PY_ALGO4 + BTN_H + BTN_GAP;                 // 664
const PY_DIV5          = PY_ALGO5 + BTN_H + 14;                      // 712
const PY_SCORE_LBL     = PY_DIV5 + 14;                               // 726
const PY_SCORE_VAL     = PY_SCORE_LBL + 18;                          // 744
const PY_STATUS_LBL    = PY_SCORE_VAL + 58;                          // 802
const PY_STATUS_VAL    = PY_STATUS_LBL + 20;                         // 822

// ============================================================================
// ESTADO GLOBAL
// ============================================================================
let grid;
let gridmap;
let sizeSlider, rowSlider, colSlider;
let container;
let resetBtn, randomBtn, propagateBtn;
let algorithmBtn1, algorithmBtn2, algorithmBtn3, algorithmBtn4, algorithmBtn5;
let currentAlgorithm = null;
let foodsCollected = 0;
let scoreFlashTimer = 0;

// ============================================================================
// CALLBACKS DOS SLIDERS
// ============================================================================

function updateCellSize() {
  grid.setCellSize(sizeSlider.value());
  gridmap.setCellSize(sizeSlider.value());
}

function updateGridDimensions() {
  grid.resize(rowSlider.value(), colSlider.value());
  gridmap.resize(rowSlider.value(), colSlider.value());
  onResetClick();
}

// ============================================================================
// CALLBACKS DOS BOTÕES DE CONTROLE
// ============================================================================

function onResetClick() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  currentAlgorithm = null;

  const totalCells = grid.rows * grid.cols;
  if (totalCells < 2) return;

  let pos1Valid = false, pos2Valid = false;
  let row1, col1, row2, col2;
  let attempts = 0;

  while ((!pos1Valid || !pos2Valid) && attempts < 1000) {
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
    attempts++;
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

// ============================================================================
// CALLBACKS DOS ALGORITMOS
// ============================================================================

// BFS
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

// DFS
function onAlgorithm2Click() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  if (gridmap.fruitRow === -1) return;
  currentAlgorithm = new DFS(
    gridmap,
    gridmap.markerRow, gridmap.markerCol,
    gridmap.fruitRow, gridmap.fruitCol
  );
}

// UNIFORM
function onAlgorithm3Click() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  if (gridmap.fruitRow === -1) return;
  currentAlgorithm = new CustoUniforme(
    gridmap,
    gridmap.markerRow, gridmap.markerCol,
    gridmap.fruitRow, gridmap.fruitCol
  );
}

// Gulosa
function onAlgorithm4Click() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  if (gridmap.fruitRow === -1) return;
  currentAlgorithm = new Greedy(
    gridmap,
    gridmap.markerRow, gridmap.markerCol,
    gridmap.fruitRow, gridmap.fruitCol
  );
}

// A*
function onAlgorithm5Click() {
  gridmap.clearConnections();
  gridmap.clearAllShade();
  if (gridmap.fruitRow === -1) return;

  currentAlgorithm = new AStar(
    gridmap,
    gridmap.markerRow, gridmap.markerCol,
    gridmap.fruitRow, gridmap.fruitCol
  );
}

// ============================================================================
// GERAÇÃO DO GRID
// ============================================================================

function random_original() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      grid.setElement(r, c, Math.floor(Math.random() * 4));
    }
  }
  if (gridmap) syncGridValues();
}

function syncGridValues() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = gridmap.getElement(r, c);
      if (cell) cell.value = grid.getElement(r, c).value;
    }
  }
}

function randomizeGridWithPropagation() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) grid.setElement(r, c, 0);
  }

  const numSeeds = Math.floor(Math.random() * (PROPAGATION_SEEDS_MAX - PROPAGATION_SEEDS_MIN + 1)) + PROPAGATION_SEEDS_MIN;
  for (let i = 0; i < numSeeds; i++) {
    const r = Math.floor(Math.random() * grid.rows);
    const c = Math.floor(Math.random() * grid.cols);
    grid.setElement(r, c, Math.floor(Math.random() * 3) + 1);
  }

  for (let iter = 0; iter < PROPAGATION_ITERATIONS; iter++) {
    const newCells = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const val = grid.getElement(r, c).value;
        if (val === 0) continue;
        const w = TERRAIN_WEIGHTS[val] || 0;
        for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
          if (!grid.inBounds(nr, nc)) continue;
          if (grid.getElement(nr, nc).value !== 0) continue;
          if (Math.random() < w) newCells.push([nr, nc, val]);
        }
      }
    }
    for (const [r, c, v] of newCells) grid.setElement(r, c, v);
  }
  syncGridValues();
}

// ============================================================================
// HELPERS DE ESTILO
// ============================================================================

function styleCtrlBtn(btn, fullWidth = false) {
  btn.style('width',            `${fullWidth ? PANEL_INN_W : BTN_HALF_W}px`);
  btn.style('height',           `${BTN_H}px`);
  btn.style('background-color', '#e0e7ff');
  btn.style('color',            '#3730a3');
  btn.style('border',           '1px solid #c7d2fe');
  btn.style('border-radius',    '6px');
  btn.style('font-size',        '12px');
  btn.style('cursor',           'pointer');
}

function styleAlgoBtn(btn, active) {
  btn.style('width',  `${PANEL_INN_W}px`);
  btn.style('height', `${BTN_H}px`);
  btn.style('border-radius', '6px');
  btn.style('font-size',     '12px');

  if (active) {
    btn.style('background-color', '#ede9fe');
    btn.style('color',            '#4338ca');
    btn.style('border',           '1px solid #c4b5fd');
    btn.style('cursor',           'pointer');
  } else {
    btn.style('background-color', '#f1f5f9');
    btn.style('color',            '#94a3b8');
    btn.style('border',           '1px solid #e2e8f0');
    btn.style('cursor',           'not-allowed');
  }
}

// ============================================================================
// SETUP
// ============================================================================

function setup() {
  container = select('#canvas-wrap');
  container.style('position', 'relative');

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent(container);

  grid    = new Grid(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);
  gridmap = new AlgorithmGrid(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);
  random_original();
  syncGridValues();
  gridmap.setMarkerSpeed(0.05);

  // Sliders
  colSlider  = createSlider(GRID_COLS_MIN, GRID_COLS_MAX, GRID_COLS_DEFAULT, 1);
  rowSlider  = createSlider(GRID_ROWS_MIN, GRID_ROWS_MAX, GRID_ROWS_DEFAULT, 1);
  sizeSlider = createSlider(CELL_SIZE_MIN, CELL_SIZE_MAX, CELL_SIZE_DEFAULT, 1);

  [colSlider, rowSlider, sizeSlider].forEach(s => {
    s.parent(container);
    s.style('width', `${SLIDER_W}px`);
  });

  colSlider.position(SLIDER_X,  PY_COLS  + 7);
  rowSlider.position(SLIDER_X,  PY_ROWS  + 7);
  sizeSlider.position(SLIDER_X, PY_SIZE  + 7);

  colSlider.input(updateGridDimensions);
  rowSlider.input(updateGridDimensions);
  sizeSlider.input(updateCellSize);

  // Botões de controle
  resetBtn     = createButton('RESET');
  randomBtn    = createButton('RANDOM');
  propagateBtn = createButton('PROPAGATE');

  [resetBtn, randomBtn, propagateBtn].forEach(b => b.parent(container));

  resetBtn.position(PANEL_INN_X, PY_BTN_ROW1);
  randomBtn.position(PANEL_INN_X + BTN_HALF_W + BTN_GAP, PY_BTN_ROW1);
  propagateBtn.position(PANEL_INN_X, PY_BTN_ROW2);

  styleCtrlBtn(resetBtn);
  styleCtrlBtn(randomBtn);
  styleCtrlBtn(propagateBtn, true);

  resetBtn.mousePressed(onResetClick);
  randomBtn.mousePressed(onRandomClick);
  propagateBtn.mousePressed(onPropagateClick);

  // Botões de algoritmo
  algorithmBtn1 = createButton('BFS — Largura');
  algorithmBtn2 = createButton('DFS — Profundidade');
  algorithmBtn3 = createButton('Custo Uniforme');
  algorithmBtn4 = createButton('Busca Gulosa');
  algorithmBtn5 = createButton('A* (A-Star)');

  [algorithmBtn1, algorithmBtn2, algorithmBtn3, algorithmBtn4, algorithmBtn5]
    .forEach(b => b.parent(container));

  algorithmBtn1.position(PANEL_INN_X, PY_ALGO1);
  algorithmBtn2.position(PANEL_INN_X, PY_ALGO2);
  algorithmBtn3.position(PANEL_INN_X, PY_ALGO3);
  algorithmBtn4.position(PANEL_INN_X, PY_ALGO4);
  algorithmBtn5.position(PANEL_INN_X, PY_ALGO5);

  // Hbilitar ou desabilitar o botao
  styleAlgoBtn(algorithmBtn1, true);
  styleAlgoBtn(algorithmBtn2, true);
  styleAlgoBtn(algorithmBtn3, true);
  styleAlgoBtn(algorithmBtn4, true);
  styleAlgoBtn(algorithmBtn5, true);

  algorithmBtn1.mousePressed(onAlgorithm1Click);
  algorithmBtn2.mousePressed(onAlgorithm2Click);
  algorithmBtn3.mousePressed(onAlgorithm3Click);
  algorithmBtn4.mousePressed(onAlgorithm4Click);
  algorithmBtn5.mousePressed(onAlgorithm5Click);

  onRandomClick();
}

// ============================================================================
// DRAW
// ============================================================================

function draw() {
  background(235, 238, 252);
  grid.render();

  // ── Motor de busca ──────────────────────────────────────────────────────
  if (currentAlgorithm) {
    if (!currentAlgorithm.completed) {
      if (frameCount % 3 === 0) currentAlgorithm.step();

      gridmap.clearAllShade();
      for (const vKey of currentAlgorithm.visited) {
        const [r, c] = vKey.split('-').map(Number);
        gridmap.setShade(r, c, 0.4);
      }
      for (const [r, c] of currentAlgorithm.frontier) {
        gridmap.setShade(r, c, 0.7);
      }
    } else if (currentAlgorithm.pathFound) {
      const path = currentAlgorithm.path;
      gridmap.clearAllShade();

      // Destaque dourado no caminho
      fill(251, 191, 36, 200);
      noStroke();
      for (const [r, c] of path) {
        rect(c * gridmap.cellSize + 1, r * gridmap.cellSize + 1,
             gridmap.cellSize - 2, gridmap.cellSize - 2, 3);
      }

      if (gridmap.connections.length === 0 && path.length > 0) {
        for (let i = 0; i < path.length - 1; i++) {
          gridmap.addConnection(path[i][0], path[i][1], path[i+1][0], path[i+1][1]);
        }
        gridmap.markerProgress = 1;
      }

      gridmap.updateMarker();
    }
  }

  // ── Colisão e reinício ──────────────────────────────────────────────────
  if (gridmap.fruitRow !== -1 &&
      Math.round(gridmap.markerRow) === gridmap.fruitRow &&
      Math.round(gridmap.markerCol) === gridmap.fruitCol &&
      currentAlgorithm && currentAlgorithm.completed) {

    foodsCollected++;
    scoreFlashTimer = 40;
    gridmap.clearConnections();
    currentAlgorithm = null;

    let posValid = false;
    let r, c;
    while (!posValid) {
      r = Math.floor(Math.random() * grid.rows);
      c = Math.floor(Math.random() * grid.cols);
      if (grid.getElement(r, c).value !== 0 &&
          !(r === Math.round(gridmap.markerRow) && c === Math.round(gridmap.markerCol))) {
        posValid = true;
      }
    }
    gridmap.setFruitPosition(r, c);
  }

  gridmap.render();
  if (scoreFlashTimer > 0) scoreFlashTimer--;

  // ── Painel lateral ──────────────────────────────────────────────────────
  drawPanel();
}

// ============================================================================
// PAINEL LATERAL
// ============================================================================

function drawPanel() {
  const px = PANEL_INN_X;

  // Fundo do painel — branco limpo
  noStroke();
  fill(255, 255, 255);
  rect(PANEL_X, 0, LEGEND_WIDTH, CANVAS_HEIGHT);

  // Borda esquerda suave
  fill(224, 228, 255, 120);
  rect(PANEL_X, 0, 2, CANVAS_HEIGHT);

  // Linha de acento índigo no topo
  fill(99, 102, 241);
  rect(PANEL_X, 0, LEGEND_WIDTH, 4);

  // ── Título ──
  textFont("'Nunito', 'Segoe UI', Arial, sans-serif");
  textAlign(LEFT, TOP);

  fill(49, 46, 129);
  textSize(20);
  textStyle(BOLD);
  text('PATHFINDER', px, PY_TITLE);

  fill(148, 163, 184);
  textSize(10);
  textStyle(NORMAL);
  text('VISUALIZADOR DE ALGORITMOS DE BUSCA', px, PY_SUBTITLE);

  // ── Divisor 1 ──
  panelDivider(PY_DIV1);

  // ── Configuração do Grid ──
  sectionLabel('CONFIGURAÇÃO DO GRID', px, PY_GRID_HDR);

  fill(30, 32, 72);
  textSize(13);
  textStyle(NORMAL);
  text(`Colunas: ${colSlider.value()}`,  px, PY_COLS + 4);
  text(`Linhas:  ${rowSlider.value()}`,  px, PY_ROWS + 4);
  text(`Tamanho: ${sizeSlider.value()}`, px, PY_SIZE + 4);

  // ── Divisor 2 ──
  panelDivider(PY_DIV2);

  // ── Terrenos ──
  sectionLabel('TERRENOS', px, PY_TERRAIN_HDR);

  const terrains = [
    { r: 75,  g: 78,  b: 108, name: 'Intransponível', tag: 'Bloqueado' },
    { r: 235, g: 195, b: 110, name: 'Areia',           tag: 'Custo  1' },
    { r: 162, g: 120, b: 72,  name: 'Atoleiro',        tag: 'Custo  2' },
    { r: 100, g: 168, b: 215, name: 'Água',            tag: 'Custo  3' },
  ];

  for (let i = 0; i < terrains.length; i++) {
    const ty = PY_TERRAIN_START + i * TERRAIN_ITEM_H;
    const t = terrains[i];

    // Swatch
    fill(t.r, t.g, t.b);
    stroke(200, 210, 240);
    strokeWeight(1);
    rect(px, ty + 1, 15, 15, 3);
    noStroke();

    fill(30, 32, 72);
    textSize(13);
    textStyle(BOLD);
    text(t.name, px + 22, ty + 1);

    fill(100, 116, 139);
    textSize(11);
    textStyle(NORMAL);
    text(t.tag, px + 160, ty + 4);
  }

  // ── Divisor 3 ──
  panelDivider(PY_DIV3);

  // ── Controles (label só) ──
  sectionLabel('CONTROLES', px, PY_CTRL_HDR);

  // ── Divisor 4 ──
  panelDivider(PY_DIV4);

  // ── Algoritmos ──
  sectionLabel('ALGORITMOS DE BUSCA', px, PY_ALGO_HDR);

  // Badge "em breve" apenas para A* (ainda não implementado)
  const unimplementedY = [PY_ALGO5];
  for (const by of unimplementedY) {
    fill(238, 240, 255);
    noStroke();
    rect(px + PANEL_INN_W - 62, by + 8, 60, 18, 4);
    fill(148, 163, 184);
    textSize(10);
    textStyle(NORMAL);
    textAlign(CENTER, TOP);
    text('em breve', px + PANEL_INN_W - 32, by + 11);
    textAlign(LEFT, TOP);
  }

  // ── Divisor 5 ──
  panelDivider(PY_DIV5);

  // ── Pontuação ──
  sectionLabel('PONTUAÇÃO', px, PY_SCORE_LBL);

  const flashActive = scoreFlashTimer > 0;
  if (flashActive) {
    fill(234, 88, 12);
  } else {
    fill(22, 163, 74);
  }
  textSize(40);
  textStyle(BOLD);
  text(`${foodsCollected}`, px, PY_SCORE_VAL);

  fill(100, 116, 139);
  textSize(12);
  textStyle(NORMAL);
  text('comidas coletadas', px + 52, PY_SCORE_VAL + 16);

  // ── Status ──
  sectionLabel('STATUS', px, PY_STATUS_LBL);

  let statusMsg = 'Aguardando um algoritmo...';
  let sr = 148, sg = 163, sb = 184;

  if (currentAlgorithm) {
    if (!currentAlgorithm.completed) {
      const algoName = currentAlgorithm.constructor.name;
      statusMsg = `${algoName} — buscando...`;
      sr = 217; sg = 119; sb = 6;
    } else if (currentAlgorithm.pathFound) {
      statusMsg = 'Caminho encontrado!';
      sr = 22; sg = 163; sb = 74;
    } else {
      statusMsg = 'Sem caminho possível.';
      sr = 220; sg = 38; sb = 38;
    }
  }

  fill(sr, sg, sb);
  textSize(13);
  textStyle(NORMAL);
  text(statusMsg, px, PY_STATUS_VAL);
}

// ── Helpers de desenho ──────────────────────────────────────────────────────

function panelDivider(y) {
  stroke(224, 228, 255);
  strokeWeight(1);
  line(PANEL_X + 8, y, PANEL_X + LEGEND_WIDTH - 8, y);
  noStroke();
}

function sectionLabel(label, x, y) {
  fill(99, 102, 241);
  textSize(10);
  textStyle(BOLD);
  text(label, x, y);
}
