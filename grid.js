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
// vai ter um render diferente, de 2 valores apenas, um uma bolinha e outro um filtro por cima da render do grid normal
}

// classe de grid que usa o cell map
class GridMap extends Grid {

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
