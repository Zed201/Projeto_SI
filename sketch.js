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
let algorithmBtn1, algorithmBtn2, algorithmBtn3, algorithmBtn4;

// Atualiza o tamanho das celulas quando o slider muda.
function updateCellSize() {
  grid.setCellSize(sizeSlider.value());
  gridmap.setCellSize(sizeSlider.value());
}

// Atualiza o numero de linhas/colunas do grid.
function updateGridDimensions() {
  grid.resize(rowSlider.value(), colSlider.value());
  gridmap.resize(rowSlider.value(), colSlider.value());
  onResetClick();
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
  // Limpar todas as conexões e efeitos de shade
  gridmap.clearConnections();
  gridmap.clearAllShade();

  // Verificar se há espaço suficiente para 2 bolinhas
  const totalCells = grid.rows * grid.cols;
  if (totalCells < 2) {
    return;
  }

  let pos1Valid = false;
  let pos2Valid = false;
  let row1, col1, row2, col2;
  let attempts = 0;
  const maxAttempts = 1000;

  // Encontrar 2 posições válidas (não intransponíveis e diferentes)
  while ((!pos1Valid || !pos2Valid) && attempts < maxAttempts) {
    if (!pos1Valid) {
      row1 = Math.floor(Math.random() * grid.rows);
      col1 = Math.floor(Math.random() * grid.cols);
      if (grid.getElement(row1, col1).value !== 0) {
        pos1Valid = true;
      }
    }

    if (!pos2Valid) {
      row2 = Math.floor(Math.random() * grid.rows);
      col2 = Math.floor(Math.random() * grid.cols);
      if (grid.getElement(row2, col2).value !== 0 &&
          !(row2 === row1 && col2 === col1)) {
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
  console.log("Algoritmo 1 clicado");
  // TODO: Implementar algoritmo 1
}

function onAlgorithm2Click() {
  console.log("Algoritmo 2 clicado");
  // TODO: Implementar algoritmo 2
}

function onAlgorithm3Click() {
  console.log("Algoritmo 3 clicado");
  // TODO: Implementar algoritmo 3
}

function onAlgorithm4Click() {
  console.log("Algoritmo 4 clicado");
  // TODO: Implementar algoritmo 4
}


// Função de random que nao usa propagação, para comparação. Gera valores aleatórios entre 0 e 3 para cada célula do grid.
function random_original() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const randomValue = Math.floor(Math.random() * 4);
      grid.setElement(r, c, randomValue);
    }
  }
  if (gridmap) {
    syncGridValues();
  }
}

// Copia os valores do grid principal para o gridmap
// deixa ele atualizado para computar coisas tipo a velocidade de propagação e custo de terreno corretamente
// se tiver algum gargalo de desempenho, podemos otimizar essa função para só copiar os valores que mudaram, ou usar um sistema de eventos para atualizar apenas as células que foram alteradas
// ou simplesmente deixar apenas um grid, ja que ambos estão com mesmo valores so mudando o render, mas por enquanto vamos manter os dois grids separados para ter mais flexibilidade no futuro
function syncGridValues() {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const value = grid.getElement(r, c).value;
      const cell = gridmap.getElement(r, c);
      if (cell) {
        cell.value = value;
      }
    }
  }
}

// Random com propagação de terrenos
function randomizeGridWithPropagation() {
  // Fase 1: Limpar grid
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      grid.setElement(r, c, 0);
    }
  }

  // Criar seeds aleatórias (apenas 1-3, sem intransponível)
  const numSeeds = Math.floor(Math.random() * (PROPAGATION_SEEDS_MAX - PROPAGATION_SEEDS_MIN + 1)) + PROPAGATION_SEEDS_MIN;
  for (let i = 0; i < numSeeds; i += 1) {
    const r = Math.floor(Math.random() * grid.rows);
    const c = Math.floor(Math.random() * grid.cols);
    const value = Math.floor(Math.random() * 3) + 1; // 1-3 (sem intransponível)
    grid.setElement(r, c, value);
  }

  // Fase 2: Propagação
  // basicamente olha para todos os vizinhos de cada célula e decide aleatoriamente se expande o valor
  //  da célula para o vizinho, baseado no peso do terreno (TERRAIN_WEIGHTS)
  for (let iteration = 0; iteration < PROPAGATION_ITERATIONS; iteration += 1) {
    const newCells = [];
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        const currentValue = grid.getElement(r, c).value;
        if (currentValue === 0) continue;

        const weight = TERRAIN_WEIGHTS[currentValue] || 0;
        const neighbors = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];

        for (const [nr, nc] of neighbors) {
          if (!grid.inBounds(nr, nc)) continue;
          if (grid.getElement(nr, nc).value !== 0) continue;
          if (Math.random() < weight) {
            newCells.push([nr, nc, currentValue]);
          }
        }
      }
    }

    for (const [r, c, value] of newCells) {
      grid.setElement(r, c, value);
    }
  }

  syncGridValues();
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
  random_original();

  gridmap = new AlgorithmGrid(GRID_ROWS_DEFAULT, GRID_COLS_DEFAULT, CELL_SIZE_DEFAULT);

  // Sincroniza valores do grid principal
  syncGridValues();

  // velocidade inicial do marcador (bolinha) - pode ser ajustada dinamicamente pelos algoritmos
  gridmap.setMarkerSpeed(0.05);

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
  // ------------------------
  // Botão para resetar o grid e as posições das bolinhas, apenas
  resetBtn = createButton("Reset");
  // Botão para gerar um novo grid aleatório sem propagação, para comparação
  randomBtn = createButton("Random");
  // Botão para gerar um novo grid aleatório usando propagação, para comparação
  propagateBtn = createButton("Propagate");

  // TODO:
  // Botões para rodar os algoritmos de pathfinding (ainda sem implementação)
  algorithmBtn1 = createButton("Algoritmo 1");
  algorithmBtn2 = createButton("Algoritmo 2");
  algorithmBtn3 = createButton("Algoritmo 3");
  algorithmBtn4 = createButton("Algoritmo 4");

  // Coloca botões dentro do container.
  resetBtn.parent(container);
  randomBtn.parent(container);
  propagateBtn.parent(container);
  algorithmBtn1.parent(container);
  algorithmBtn2.parent(container);
  algorithmBtn3.parent(container);
  algorithmBtn4.parent(container);

  // Posiciona botões na area da legenda.
  const buttonsY = LEGEND_Y + LEGEND_ROW_GAP * 3 + 15;
  resetBtn.position(LEGEND_X, buttonsY);
  randomBtn.position(LEGEND_X, buttonsY + BUTTON_HEIGHT + BUTTON_GAP);
  propagateBtn.position(LEGEND_X, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 2);

  // Botões de algoritmos em segunda coluna
  const algoX = LEGEND_X + BUTTON_WIDTH + BUTTON_GAP;
  algorithmBtn1.position(algoX, buttonsY);
  algorithmBtn2.position(algoX, buttonsY + BUTTON_HEIGHT + BUTTON_GAP);
  algorithmBtn3.position(algoX, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 2);
  algorithmBtn4.position(algoX, buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 3);

  // Estila botões.
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
    btn.style("transition", "background-color 0.3s");
  });

  // Estila botões de algoritmos com cor diferente
  [algorithmBtn1, algorithmBtn2, algorithmBtn3, algorithmBtn4].forEach(btn => {
    btn.style("width", `${BUTTON_WIDTH}px`);
    btn.style("height", `${BUTTON_HEIGHT}px`);
    btn.style("background-color", "#2196F3");
    btn.style("color", "white");
    btn.style("border", "none");
    btn.style("border-radius", "4px");
    btn.style("font-size", "12px");
    btn.style("font-weight", "bold");
    btn.style("cursor", "pointer");
    btn.style("transition", "background-color 0.3s");
  });

  // Liga eventos dos botões.
  resetBtn.mousePressed(onResetClick);
  randomBtn.mousePressed(onRandomClick);
  propagateBtn.mousePressed(onPropagateClick);
  algorithmBtn1.mousePressed(onAlgorithm1Click);
  algorithmBtn2.mousePressed(onAlgorithm2Click);
  algorithmBtn3.mousePressed(onAlgorithm3Click);
  algorithmBtn4.mousePressed(onAlgorithm4Click);

  // Aleatoriza grid e posições das bolinhas na inicialização
  onRandomClick();
}

// Loop de renderizacao.
// dependendo de como for chamada a execução dos algoritmos, talvez seja necessário ajustar a lógica de 
// renderização para mostrar o progresso dos algoritmos em tempo real, ou simplesmente mostrar o resultado final após a execução
function draw() {
  background(240);
  // Renderiza o grid.
  grid.render();
  gridmap.updateMarker();
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
