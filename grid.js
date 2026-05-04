// ============================================================================
// TERRENOS E CÉLULA BASE
// ============================================================================

class Cell {
  constructor(value = 0) {
    this.value = value;
  }

  getBaseColor() {
    const palette = [
      color(75, 78, 108),   // 0: Intransponível — ardósia média
      color(235, 195, 110), // 1: Areia — areia quente suave
      color(162, 120, 72),  // 2: Atoleiro — barro/terra
      color(100, 168, 215), // 3: Água — azul pastel
    ];
    const index = ((this.value % palette.length) + palette.length) % palette.length;
    return palette[index];
  }

  render(x, y, size) {
    fill(this.getBaseColor());
    noStroke();
    rect(x, y, size, size, 3);
  }
}

// ============================================================================
// CÉLULA COM EFFECTS (SHADE e MARKER)
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
  }
}

// ============================================================================
// GRID BASE
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
    if (!this.inBounds(row, col)) return null;
    return this.cells[row][col];
  }

  setElement(row, col, value) {
    if (!this.inBounds(row, col)) return;
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

  render() {
    // Light gap between cells
    fill(215, 220, 242);
    noStroke();
    rect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);

    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const x = c * this.cellSize + 1;
        const y = r * this.cellSize + 1;
        this.cells[r][c].render(x, y, this.cellSize - 2);
      }
    }
  }
}

// ============================================================================
// ALGORITHM GRID — Grid com Conexões, Bolinhas e Velocidades Variáveis
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

    this.connections = [];

    this.markerRow = 0;
    this.markerCol = 0;
    this.markerNextRow = 0;
    this.markerNextCol = 0;
    this.markerPrevRow = -1;
    this.markerPrevCol = -1;
    this.markerProgress = 0;
    this.markerBaseSpeed = 0.05;

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
        const cell = this.cells[r][c];
        if (cell.shadeIntensity <= 0) continue;

        const x = c * this.cellSize + 1;
        const y = r * this.cellSize + 1;
        const s = this.cellSize - 2;
        noStroke();

        // Visited: índigo forte | Frontier: âmbar forte
        if (cell.shadeIntensity < 0.6) {
          fill(109, 40, 217, min(255, Math.round(cell.shadeIntensity * 520)));
        } else {
          fill(245, 120, 0, min(255, Math.round(cell.shadeIntensity * 350)));
        }
        rect(x, y, s, s, 3);
      }
    }
  }

  renderMarkers() {
    const cs = this.cellSize;
    const x1 = this.markerCol * cs + cs / 2;
    const y1 = this.markerRow * cs + cs / 2;
    const x2 = this.markerNextCol * cs + cs / 2;
    const y2 = this.markerNextRow * cs + cs / 2;
    const mx = x1 + (x2 - x1) * this.markerProgress;
    const my = y1 + (y2 - y1) * this.markerProgress;

    // Player — bola coral com brilho
    drawingContext.shadowBlur = cs * 0.55;
    drawingContext.shadowColor = 'rgba(239, 68, 68, 0.85)';
    fill(239, 68, 68);
    noStroke();
    circle(mx, my, cs * 0.56);

    drawingContext.shadowBlur = 0;
    fill(255, 200, 200);
    circle(mx - cs * 0.09, my - cs * 0.09, cs * 0.2);

    // Fruta — bola esmeralda com brilho
    if (this.fruitRow >= 0 && this.fruitCol >= 0 && this.inBounds(this.fruitRow, this.fruitCol)) {
      const fx = this.fruitCol * cs + cs / 2;
      const fy = this.fruitRow * cs + cs / 2;

      drawingContext.shadowBlur = cs * 0.55;
      drawingContext.shadowColor = 'rgba(34, 197, 94, 0.85)';
      fill(34, 197, 94);
      noStroke();
      circle(fx, fy, cs * 0.56);

      drawingContext.shadowBlur = 0;
      fill(180, 255, 210);
      circle(fx - cs * 0.09, fy - cs * 0.09, cs * 0.2);
    }

    drawingContext.shadowColor = 'transparent';
  }

  renderConnections() {
    stroke(99, 102, 241);
    strokeWeight(max(2, this.cellSize * 0.075));

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
    noStroke();
  }

  // ========================================================================
  // SISTEMA DE CONEXÕES
  // ========================================================================

  addConnection(row1, col1, row2, col2) {
    if (!this.inBounds(row1, col1) || !this.inBounds(row2, col2)) return;
    const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
    if (distance !== 1) return;
    const key = this.getConnectionKey(row1, col1, row2, col2);
    if (!this.connections.includes(key)) this.connections.push(key);
  }

  removeConnection(row1, col1, row2, col2) {
    const key = this.getConnectionKey(row1, col1, row2, col2);
    const index = this.connections.indexOf(key);
    if (index > -1) this.connections.splice(index, 1);
  }

  hasConnection(row1, col1, row2, col2) {
    return this.connections.includes(this.getConnectionKey(row1, col1, row2, col2));
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
  // SISTEMA DE SHADE
  // ========================================================================

  setMarker(row, col, hasMarker = true) {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const cell = this.getElement(r, c);
        if (cell instanceof CellMap) cell.hasMarker = false;
      }
    }
    const cell = this.getElement(row, col);
    if (cell instanceof CellMap) cell.hasMarker = hasMarker;
  }

  setShade(row, col, intensity) {
    const cell = this.getElement(row, col);
    if (cell instanceof CellMap) {
      cell.shadeIntensity = Math.max(0, Math.min(1, intensity));
    }
  }

  setLineShade(row, startCol, endCol, intensity) {
    for (let c = startCol; c <= endCol; c += 1) this.setShade(row, c, intensity);
  }

  setColumnShade(startRow, endRow, col, intensity) {
    for (let r = startRow; r <= endRow; r += 1) this.setShade(r, col, intensity);
  }

  setRectShade(startRow, endRow, startCol, endCol, intensity) {
    for (let r = startRow; r <= endRow; r += 1) {
      for (let c = startCol; c <= endCol; c += 1) this.setShade(r, c, intensity);
    }
  }

  clearAllShade() {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) this.setShade(r, c, 0);
    }
  }

  // ========================================================================
  // SISTEMA DE MOVIMENTO — Velocidade Variável por Terreno
  // ========================================================================

  setMarkerSpeed(speed) {
    this.markerBaseSpeed = Math.max(0, Math.min(1, speed));
  }

  getSpeedModifier(row, col) {
    const cell = this.getElement(row, col);
    if (!cell) return 1;
    return Math.max(0.1, 1 / (Math.abs(cell.value) * 0.5 + 1));
  }

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

      if (!foundNext) this.markerProgress = 0;
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

  setFruitPosition(row, col) {
    if (this.inBounds(row, col)) {
      this.fruitRow = row;
      this.fruitCol = col;
    }
  }
}
