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

// classe de grid que usa o cell map
class GridMap extends Grid {
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
  }

  // Renderiza apenas os filtros por cima (marcador + shade), sem a cor base
  render() {
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
}