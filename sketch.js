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

// Estado global do sketch.
let grid;
let gridmap;

let sizeSlider;
let rowSlider;
let colSlider;
let container;
let resetBtn;
let randomBtn;

// Atualiza o tamanho das celulas quando o slider muda.
function updateCellSize() {
  grid.setCellSize(sizeSlider.value());
}

// Atualiza o numero de linhas/colunas do grid.
function updateGridDimensions() {
  grid.resize(rowSlider.value(), colSlider.value());
}

// Aplica um padrao espacial baseado em (linha + coluna).
function fillGridPattern() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      grid.setElement(r, c, 1);
    }
  }
}

// Botões e funções de controle.
function onResetClick() {
  // TODO: Implementar reset do grid
}

function onRandomClick() {
  randomizeGrid();
}

function randomizeGrid() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const randomValue = Math.floor(Math.random() * 6);
      grid.setElement(r, c, randomValue);
    }
  }
}

// Configuracao inicial do p5.
function setup() {
  // Container para posicionar canvas e sliders.
  container = createDiv();
  container.style("position", "relative");
  container.style("width", `${CANVAS_WIDTH}px`);
  container.style("height", `${CANVAS_HEIGHT}px`);

  // Canvas fixo com area extra para a legenda lateral.
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent(container);

  // Cria o grid.
  grid = new Grid(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);
  randomizeGrid();

  gridmap = new GridMap(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);
  gridmap.setMarker(2,2);
  gridmap.setLineShade(2, 2, 8, 0.5)

  // Cria sliders.
  sizeSlider = createSlider(CELL_SIZE_MIN, CELL_SIZE_MAX, CELL_SIZE_DEFAULT, 1);
  rowSlider = createSlider(GRID_ROWS_MIN, GRID_ROWS_MAX, GRID_ROWS_DEFAULT, 1);
  colSlider = createSlider(GRID_COLS_MIN, GRID_COLS_MAX, GRID_COLS_DEFAULT, 1);

  // Coloca sliders dentro do container.
  sizeSlider.parent(container);
  rowSlider.parent(container);
  colSlider.parent(container);

  // Posiciona sliders na area da legenda.
  colSlider.position(LEGEND_X + LEGEND_LABEL_OFFSET, LEGEND_Y);
  rowSlider.position(LEGEND_X + LEGEND_LABEL_OFFSET, LEGEND_Y + LEGEND_ROW_GAP);
  sizeSlider.position(LEGEND_X + LEGEND_LABEL_OFFSET, LEGEND_Y + LEGEND_ROW_GAP * 2);

  // Define largura dos sliders.
  colSlider.style("width", "140px");
  rowSlider.style("width", "140px");
  sizeSlider.style("width", "140px");

  // Liga eventos dos sliders.
  sizeSlider.input(updateCellSize);
  rowSlider.input(updateGridDimensions);
  colSlider.input(updateGridDimensions);

  // Cria botões de controle.
  resetBtn = createButton("Reset");
  randomBtn = createButton("Random");

  // Coloca botões dentro do container.
  resetBtn.parent(container);
  randomBtn.parent(container);

  // Posiciona botões na area da legenda.
  const buttonsY = LEGEND_Y + LEGEND_ROW_GAP * 3 + 15;
  resetBtn.position(LEGEND_X, buttonsY);
  randomBtn.position(LEGEND_X, buttonsY + BUTTON_HEIGHT + BUTTON_GAP);

  // Estila botões.
  [resetBtn, randomBtn].forEach(btn => {
    btn.style("width", `${BUTTON_WIDTH}px`);
    btn.style("height", `${BUTTON_HEIGHT}px`);
    btn.style("background-color", "#4CAF50");
    btn.style("color", "white");
    btn.style("border", "none");
    btn.style("border-radius", "4px");
    btn.style("font-size", "14px");
    btn.style("font-weight", "bold");
    btn.style("cursor", "pointer");
    btn.style("transition", "background-color 0.3s");
  });

  // Liga eventos dos botões.
  resetBtn.mousePressed(onResetClick);
  randomBtn.mousePressed(onRandomClick);
}

// Loop de renderizacao.
function draw() {
  background(240);
  // Renderiza o grid.
  grid.render();
  gridmap.render();

  // Desenha a area da legenda lateral.
  noStroke();
  fill(245);
  rect(GRID_MAX_WIDTH, 0, LEGEND_WIDTH, CANVAS_HEIGHT);

  // Desenha os textos de legenda.
  fill(0);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Cols: ${colSlider.value()}`, LEGEND_X, LEGEND_Y);
  text(`Rows: ${rowSlider.value()}`, LEGEND_X, LEGEND_Y + LEGEND_ROW_GAP);
  text(`Size: ${sizeSlider.value()}`, LEGEND_X, LEGEND_Y + LEGEND_ROW_GAP * 2);
}
