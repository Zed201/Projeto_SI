// Representa uma celula do grid com um valor e um render proprio.
class Cell {
  // Guarda o valor logico da celula.
  constructor(value = 0) {
    this.value = value;
  }

  // Escolhe uma cor base a partir do valor da celula.
  getBaseColor() {
    const palette = [
      color(235, 235, 240),
      color(70, 160, 240),
      color(255, 120, 120),
      color(120, 220, 160),
      color(240, 200, 90),
      color(170, 150, 240),
    ];
    const index = ((this.value % palette.length) + palette.length) % palette.length;
    return palette[index];
  }

  // Render complexo com gradiente, sombra e textura baseada no valor.
  // apenas para um efeito legal
  render(x, y, size) {
    // Calcula cores base, clara e escura para o gradiente.
    const base = this.getBaseColor()
    fill(base);
    noStroke();
    rect(x, y, size, size);

    // Adiciona um contorno interno para destaque.
    noFill();
    stroke(255,255,255);
    strokeWeight(max(1, size * 0.05));
    rect(x + size * 0.01, y + size * 0.01, size * 0.99, size * 0.99);
  }
}


// celular para o mapa onde teremos a bolinha e os shade para mostrar o mapeamento
// TODO: Trocar o nome
class CellMap extends Cell {
  constructor(hasMarker = false, shadeIntensity = 0) {
    super(0);
    this.hasMarker = hasMarker;
    this.shadeIntensity = shadeIntensity;
  }

  render(x, y, size) {
    // Aplica filtro/shade por cima se shadeIntensity > 0
    if (this.shadeIntensity > 0) {
      fill(0, 0, 0, this.shadeIntensity * 255);
      noStroke();
      rect(x, y, size, size);
    }

    // Desenha a bolinha (marcador) se hasMarker for true
    if (this.hasMarker) {
      fill(255, 50, 50);
      noStroke();
      circle(x + size / 2, y + size / 2, size * 0.4);
    }
  }
}



// Representa o grid como matriz de celulas.
class Grid {
  // Cria o grid com linhas, colunas e tamanho das celulas.
  constructor(rows, cols, cellSize) {
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
    this.cells = [];

    for (let r = 0; r < rows; r += 1) {
      const row = [];
      for (let c = 0; c < cols; c += 1) {
        row.push(new Cell());
      }
      this.cells.push(row);
    }
  }

  // Verifica se a coordenada esta dentro do grid.
  inBounds(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  // Retorna a celula na posicao, ou null se fora dos limites.
  getElement(row, col) {
    if (!this.inBounds(row, col)) {
      return null;
    }

    return this.cells[row][col];
  }

  // Define o valor ou substitui a celula inteira na posicao.
  setElement(row, col, value) {
    if (!this.inBounds(row, col)) {
      return;
    }

    if (value instanceof Cell) {
      this.cells[row][col] = value;
      return;
    }

    this.cells[row][col].value = value;
  }

  // Redimensiona o grid mantendo as celulas existentes.
  resize(newRows, newCols) {
    const nextCells = [];
    for (let r = 0; r < newRows; r += 1) {
      const row = [];
      for (let c = 0; c < newCols; c += 1) {
        if (r < this.rows && c < this.cols) {
          row.push(this.cells[r][c]);
        } else {
          row.push(new Cell());
        }
      }
      nextCells.push(row);
    }

    this.rows = newRows;
    this.cols = newCols;
    this.cells = nextCells;
  }

  // Atualiza o tamanho de cada celula.
  setCellSize(cellSize) {
    this.cellSize = cellSize;
  }

  // Renderiza todas as celulas no canvas.
  render() {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const x = c * this.cellSize;
        const y = r * this.cellSize;
        this.cells[r][c].render(x, y, this.cellSize);
      }
    }
  }
}

// Grid com linhas de conexão entre células
class AlgorithmGrid extends Grid {
  constructor(rows, cols, cellSize) {
    super(rows, cols, cellSize);
    // Reconstrói o grid com CellMap ao invés de Cell
    this.cells = [];
    for (let r = 0; r < rows; r += 1) {
      const row = [];
      for (let c = 0; c < cols; c += 1) {
        row.push(new CellMap());
      }
      this.cells.push(row);
    }
    this.connections = [];
    this.markerRow = 0;
    this.markerCol = 0;
    this.markerNextRow = 0;
    this.markerNextCol = 0;
    this.markerPrevRow = -1;
    this.markerPrevCol = -1;
    this.markerProgress = 0;
    this.markerBaseSpeed = 0.05;
  }

  // Renderiza os filtros, marcadores e linhas de conexão
  render() {
    this.renderShade();
    this.renderConnections();
    this.renderMarkers();
  }

  renderShade() {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const x = c * this.cellSize;
        const y = r * this.cellSize;
        const cell = this.cells[r][c];

        if (cell.shadeIntensity > 0) {
          fill(0, 0, 0, cell.shadeIntensity * 255);
          noStroke();
          rect(x, y, this.cellSize, this.cellSize);
        }
      }
    }
  }

  renderMarkers() {
    // Renderiza bolinha na posição interpolada se há movimento
    const x1 = this.markerCol * this.cellSize + this.cellSize / 2;
    const y1 = this.markerRow * this.cellSize + this.cellSize / 2;
    const x2 = this.markerNextCol * this.cellSize + this.cellSize / 2;
    const y2 = this.markerNextRow * this.cellSize + this.cellSize / 2;

    const x = x1 + (x2 - x1) * this.markerProgress;
    const y = y1 + (y2 - y1) * this.markerProgress;

    fill(255, 50, 50);
    noStroke();
    circle(x, y, this.cellSize * 0.4);
  }

  renderCells() {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const x = c * this.cellSize;
        const y = r * this.cellSize;
        const cell = this.cells[r][c];

        // Aplica filtro/shade por cima se shadeIntensity > 0
        if (cell.shadeIntensity > 0) {
          fill(0, 0, 0, cell.shadeIntensity * 255);
          noStroke();
          rect(x, y, this.cellSize, this.cellSize);
        }

        // Desenha a bolinha (marcador) por cima se hasMarker for true
        if (cell.hasMarker) {
          fill(255, 50, 50);
          noStroke();
          circle(x + this.cellSize / 2, y + this.cellSize / 2, this.cellSize * 0.4);
        }
      }
    }
  }

  // Adiciona uma conexão (linha) entre duas células
  addConnection(row1, col1, row2, col2) {
    if (!this.inBounds(row1, col1) || !this.inBounds(row2, col2)) {
      return;
    }
    const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
    if (distance !== 1) {
      return;
    }
    const key = this.getConnectionKey(row1, col1, row2, col2);
    if (!this.connections.includes(key)) {
      this.connections.push(key);
    }
  }

  // Remove uma conexão entre duas células
  removeConnection(row1, col1, row2, col2) {
    const key = this.getConnectionKey(row1, col1, row2, col2);
    const index = this.connections.indexOf(key);
    if (index > -1) {
      this.connections.splice(index, 1);
    }
  }

  // Verifica se existe conexão entre duas células
  hasConnection(row1, col1, row2, col2) {
    const key = this.getConnectionKey(row1, col1, row2, col2);
    return this.connections.includes(key);
  }

  // Limpa todas as conexões
  clearConnections() {
    this.connections = [];
  }

  // Retorna chave única para uma conexão (ordem normalizada)
  getConnectionKey(row1, col1, row2, col2) {
    const key1 = `${row1}-${col1}`;
    const key2 = `${row2}-${col2}`;
    return key1 < key2 ? `${key1}|${key2}` : `${key2}|${key1}`;
  }

  // Renderiza as linhas de conexão
  renderConnections() {
    stroke(255, 255, 255);
    strokeWeight(4);

    for (const connection of this.connections) {
      const [key1, key2] = connection.split('|');
      const [row1, col1] = key1.split('-').map(Number);
      const [row2, col2] = key2.split('-').map(Number);

      // Calcula o centro das células
      const x1 = col1 * this.cellSize + this.cellSize / 2;
      const y1 = row1 * this.cellSize + this.cellSize / 2;
      const x2 = col2 * this.cellSize + this.cellSize / 2;
      const y2 = row2 * this.cellSize + this.cellSize / 2;

      line(x1, y1, x2, y2);
    }
  }

  setMarker(row, col, hasMarker = true) {
    // Limpa todas as marcas anteriores
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const cell = this.getElement(r, c);
        if (cell instanceof CellMap) {
          cell.hasMarker = false;
        }
      }
    }
    // Define a nova marca
    const cell = this.getElement(row, col);
    if (cell instanceof CellMap) {
      cell.hasMarker = hasMarker;
    }
  }

  setShade(row, col, intensity) {
    const cell = this.getElement(row, col);
    if (cell instanceof CellMap) {
      cell.shadeIntensity = Math.max(0, Math.min(1, intensity));
    }
  }

  setLineShade(row, startCol, endCol, intensity) {
    for (let c = startCol; c <= endCol; c += 1) {
      this.setShade(row, c, intensity);
    }
  }

  setColumnShade(startRow, endRow, col, intensity) {
    for (let r = startRow; r <= endRow; r += 1) {
      this.setShade(r, col, intensity);
    }
  }

  setRectShade(startRow, endRow, startCol, endCol, intensity) {
    for (let r = startRow; r <= endRow; r += 1) {
      for (let c = startCol; c <= endCol; c += 1) {
        this.setShade(r, c, intensity);
      }
    }
  }

  clearAllShade() {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        this.setShade(r, c, 0);
      }
    }
  }

  // Define a velocidade base da bolinha (0 a 1, onde 1 é mais rápido)
  setMarkerSpeed(speed) {
    this.markerBaseSpeed = Math.max(0, Math.min(1, speed));
  }

  // Retorna o modificador de velocidade baseado no value da célula
  getSpeedModifier(row, col) {
    const cell = this.getElement(row, col);
    if (!cell) return 1;
    return Math.max(0.1, 1 / (Math.abs(cell.value) * 0.5 + 1));
  }

  // Move a bolinha ao longo das linhas de conexão
  updateMarker() {
    if (this.markerProgress >= 1) {
      this.markerPrevRow = this.markerRow;
      this.markerPrevCol = this.markerCol;
      this.markerRow = this.markerNextRow;
      this.markerCol = this.markerNextCol;

      // Encontra próxima célula conectada (evita voltar para a anterior)
      const neighbors = [
        [this.markerRow - 1, this.markerCol],
        [this.markerRow + 1, this.markerCol],
        [this.markerRow, this.markerCol - 1],
        [this.markerRow, this.markerCol + 1],
      ];

      let foundNext = false;
      for (const [r, c] of neighbors) {
        if (r === this.markerPrevRow && c === this.markerPrevCol) continue;
        if (this.hasConnection(this.markerRow, this.markerCol, r, c)) {
          this.markerNextRow = r;
          this.markerNextCol = c;
          this.markerProgress = 0;
          foundNext = true;
          break;
        }
      }

      if (!foundNext) {
        this.markerProgress = 0;
      }
    }

    const speedMod = this.getSpeedModifier(this.markerRow, this.markerCol);
    this.markerProgress += this.markerBaseSpeed * speedMod;
  }

  // Define a posição inicial da bolinha
  setMarkerStartPosition(row, col) {
    if (this.inBounds(row, col)) {
      this.markerRow = row;
      this.markerCol = col;
      this.markerNextRow = row;
      this.markerNextCol = col;
      this.markerProgress = 0;
    }
  }
}