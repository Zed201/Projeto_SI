// ============================================================================
// TERRENOS E CÉLULA BASE(apenas valores e renderização simples)
// ============================================================================

class Cell {
  constructor(value = 0) {
    this.value = value;
  }

  getBaseColor() {
    const palette = [
      color(0x1B, 0x1A, 0x1A), // 0: Intransponível
      color(0xE9, 0xB8, 0x72), // 1: Areia
      color(0xE2, 0x98, 0x49), // 2: Atoleiro
      color(0x64, 0x94, 0xAA), // 3: Água
    ];
    const index = ((this.value % palette.length) + palette.length) % palette.length;
    return palette[index];
  }

  render(x, y, size) {
    const base = this.getBaseColor();
    fill(base);
    noStroke();
    rect(x, y, size, size);

    noFill();
    stroke(255, 255, 255);
    strokeWeight(max(1, size * 0.05));
    rect(x + size * 0.01, y + size * 0.01, size * 0.99, size * 0.99);
  }
}

// ============================================================================
// CÉLULA COM EFFECTS (SHADE e MARKER) - Usada no Grid de Algoritmos 
// para renderizar efeitos visuais e a bolinha de comida
// ============================================================================

class CellMap extends Cell {
  constructor(hasMarker = false, shadeIntensity = 0) {
    super(0);
    this.hasMarker = hasMarker;
    this.shadeIntensity = shadeIntensity;
  }

  render(x, y, size) {
    if (this.shadeIntensity > 0) {
      fill(0, 0, 0, this.shadeIntensity * 255);
      noStroke();
      rect(x, y, size, size);
    }

    if (this.hasMarker) {
      fill(255, 50, 50);
      noStroke();
      circle(x + size / 2, y + size / 2, size * 0.4);
    }
  }
}

// ============================================================================
// GRID BASE - Matriz de Células
// ============================================================================

class Grid {
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

  inBounds(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  getElement(row, col) {
    if (!this.inBounds(row, col)) {
      return null;
    }
    return this.cells[row][col];
  }

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

  setCellSize(cellSize) {
    this.cellSize = cellSize;
  }
  // loop de rendezerização do grid, chama o render de cada célula passando a posição e o tamanho
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

// ============================================================================
// ALGORITHM GRID - Grid com Conexões, Bolinhas e Velocidades Variáveis
// ============================================================================

class AlgorithmGrid extends Grid {
  constructor(rows, cols, cellSize) {
    super(rows, cols, cellSize);
    this.cells = [];
    for (let r = 0; r < rows; r += 1) {
      const row = [];
      for (let c = 0; c < cols; c += 1) {
        row.push(new CellMap());
      }
      this.cells.push(row);
    }

    // Sistema de Conexões (Linhas entre Células Adjacentes)
    this.connections = [];

    // Sistema de Movimento da Comida (Bolinha Vermelha)
    this.markerRow = 0;
    this.markerCol = 0;
    this.markerNextRow = 0;
    this.markerNextCol = 0;
    this.markerPrevRow = -1;
    this.markerPrevCol = -1;
    this.markerProgress = 0;
    this.markerBaseSpeed = 0.05;

    // Posição da Fruta (Bolinha Verde Estática)
    this.fruitRow = -1;
    this.fruitCol = -1;
  }

  // ========================================================================
  // RENDERIZAÇÃO
  // ========================================================================

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
    const x1 = this.markerCol * this.cellSize + this.cellSize / 2;
    const y1 = this.markerRow * this.cellSize + this.cellSize / 2;
    const x2 = this.markerNextCol * this.cellSize + this.cellSize / 2;
    const y2 = this.markerNextRow * this.cellSize + this.cellSize / 2;

    const x = x1 + (x2 - x1) * this.markerProgress;
    const y = y1 + (y2 - y1) * this.markerProgress;

    fill(255, 50, 50);
    noStroke();
    circle(x, y, this.cellSize * 0.4);

    if (this.fruitRow >= 0 && this.fruitCol >= 0 &&
        this.inBounds(this.fruitRow, this.fruitCol)) {
      const fruitX = this.fruitCol * this.cellSize + this.cellSize / 2;
      const fruitY = this.fruitRow * this.cellSize + this.cellSize / 2;
      fill(100, 255, 100);
      noStroke();
      circle(fruitX, fruitY, this.cellSize * 0.4);
    }
  }

  // desenha as linhas apenas entre celulas adjascentes que tem conexao, 
  // usando a lista de conexões para determinar quais linhas desenhar
  renderConnections() {
    stroke(255, 255, 255);
    strokeWeight(4);

    for (const connection of this.connections) {
      const [key1, key2] = connection.split('|');
      const [row1, col1] = key1.split('-').map(Number);
      const [row2, col2] = key2.split('-').map(Number);

      const x1 = col1 * this.cellSize + this.cellSize / 2;
      const y1 = row1 * this.cellSize + this.cellSize / 2;
      const x2 = col2 * this.cellSize + this.cellSize / 2;
      const y2 = row2 * this.cellSize + this.cellSize / 2;

      line(x1, y1, x2, y2);
    }
  }

  // ========================================================================
  // SISTEMA DE CONEXÕES (Grafo de Adjacências)
  // ========================================================================

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

  removeConnection(row1, col1, row2, col2) {
    const key = this.getConnectionKey(row1, col1, row2, col2);
    const index = this.connections.indexOf(key);
    if (index > -1) {
      this.connections.splice(index, 1);
    }
  }

  hasConnection(row1, col1, row2, col2) {
    const key = this.getConnectionKey(row1, col1, row2, col2);
    return this.connections.includes(key);
  }

  clearConnections() {
    this.connections = [];
  }

  getConnectionKey(row1, col1, row2, col2) {
    const key1 = `${row1}-${col1}`;
    const key2 = `${row2}-${col2}`;
    return key1 < key2 ? `${key1}|${key2}` : `${key2}|${key1}`;
  }

  // ========================================================================
  // SISTEMA DE SHADE (Sobreamento/Effects)
  // ========================================================================

  setMarker(row, col, hasMarker = true) {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const cell = this.getElement(r, c);
        if (cell instanceof CellMap) {
          cell.hasMarker = false;
        }
      }
    }
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

  // ========================================================================
  // SISTEMA DE MOVIMENTO - Velocidade Variável por Terreno
  // ========================================================================

  setMarkerSpeed(speed) {
    this.markerBaseSpeed = Math.max(0, Math.min(1, speed));
  }

  getSpeedModifier(row, col) {
    const cell = this.getElement(row, col);
    if (!cell) return 1;
    return Math.max(0.1, 1 / (Math.abs(cell.value) * 0.5 + 1));
  }

  // ========================================================================
  // SISTEMA DE MOVIMENTO DA COMIDA (Bolinha Vermelha)
  // Se move automaticamente entre as conexões, com velocidade ajustável e modificadores de terreno
  // so precisa ter uma linha na celula com a bolinha vermelha, e o sistema de conexões para determinar para onde ela pode se mover,
  // o sistema de shade pode ser usado para mostrar o progresso do movimento, ou simplesmente deixar a bolinha se mover suavemente entre as conexões
  // ========================================================================

  // para movimentar a bolinha, so chamar essa função
  updateMarker() {
    if (this.markerProgress >= 1) {
      this.markerPrevRow = this.markerRow;
      this.markerPrevCol = this.markerCol;
      this.markerRow = this.markerNextRow;
      this.markerCol = this.markerNextCol;

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

  setMarkerStartPosition(row, col) {
    if (this.inBounds(row, col)) {
      this.markerRow = row;
      this.markerCol = col;
      this.markerNextRow = row;
      this.markerNextCol = col;
      this.markerProgress = 0;
    }
  }

  // ========================================================================
  // POSICIONAMENTO DA FRUTA (Bolinha Verde Estática)
  // ========================================================================

  setFruitPosition(row, col) {
    if (this.inBounds(row, col)) {
      this.fruitRow = row;
      this.fruitCol = col;
    }
  }
}
