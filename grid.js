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

  // Converte um p5.Color em string RGBA para uso no canvas 2D.
  static toRgba(col, alpha) {
    return `rgba(${Math.round(red(col))}, ${Math.round(green(col))}, ${Math.round(blue(col))}, ${alpha})`;
  }

  // Render complexo com gradiente, sombra e textura baseada no valor.
  // apenas para um efeito legal
  render(x, y, size) {
    // Calcula cores base, clara e escura para o gradiente.
    const base = this.getBaseColor();
    const light = lerpColor(base, color(255), 0.35);
    const dark = lerpColor(base, color(0), 0.35);
    // Usa o contexto 2D do canvas para criar o gradiente e a sombra.
    const ctx = drawingContext;
    const radius = size * 0.18;

    // Desenha o bloco principal com gradiente e glow.
    push();
    ctx.save();
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, Cell.toRgba(light, 0.95));
    gradient.addColorStop(1, Cell.toRgba(dark, 0.95));
    ctx.fillStyle = gradient;
    ctx.shadowBlur = size * 0.25;
    ctx.shadowColor = Cell.toRgba(base, 0.55);
    noStroke();
    rect(x, y, size, size, radius);
    ctx.restore();

    // Adiciona um contorno interno para destaque.
    noFill();
    stroke(lerpColor(base, color(255), 0.5));
    strokeWeight(max(1, size * 0.05));
    rect(x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88, radius * 0.8);

    // Aplica pequenos brilhos usando noise para textura.
    noStroke();
    for (let i = 0; i < 8; i += 1) {
      const nx = noise((x + i * 13) * 0.08, (y + i * 7) * 0.08, this.value * 0.3);
      const ny = noise((x + i * 5) * 0.08, (y + i * 11) * 0.08, this.value * 0.5);
      const px = x + nx * size;
      const py = y + ny * size;
      const alpha = 30 + 60 * noise((x + i * 17) * 0.05, (y + i * 19) * 0.05, this.value * 0.7);
      fill(255, alpha);
      circle(px, py, size * 0.08);
    }

    pop();
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
