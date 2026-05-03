class Greedy extends PathfindingAlgorithm {
  constructor(grid_algorith, startRow, startCol, goalRow, goalCol) {
    super(grid_algorith, startRow, startCol, goalRow, goalCol);
    
    // Set auxiliar para checagem rápida de vizinhos já visitados/na fronteira
    this.visitedSet = new Set();
    this.visitedSet.add(`${startRow}-${startCol}`);
  }

  step() {
    if (this.completed) return;

    // Se a fronteira esvaziar e não achou a fruta, caminho impossível
    if (this.frontier.length === 0) {
      this.completed = true;
      this.pathFound = false;
      return;
    }

    // BUSCA GULOSA: Fila de Prioridade baseada APENAS na heurística h(n)
    // Ordenamos a fronteira para que a menor distância Manhattan fique no índice [0]
    this.frontier.sort((a, b) => {
      const hA = this.manhattanDistance(a[0], a[1], this.goalRow, this.goalCol);
      const hB = this.manhattanDistance(b[0], b[1], this.goalRow, this.goalCol);
      return hA - hB; 
    });

    // Removemos o nó mais promissor (o que ficou no Início da fila após ordenar)
    const [currentRow, currentCol] = this.frontier.shift();
    const currentKey = `${currentRow}-${currentCol}`;

    // Adiciona aos visitados (para desenhar na tela de cinza claro)
    if (!this.visited.includes(currentKey)) {
      this.visited.push(currentKey);
    }

    // Objetivo encontrado!
    if (currentRow === this.goalRow && currentCol === this.goalCol) {
      this.completed = true;
      this.pathFound = true;
      this.reconstructPath(this.parentMap, currentRow, currentCol);
      return;
    }

    // Expande os vizinhos
    const neighbors = this.getNeighbors(currentRow, currentCol);
    for (const [nRow, nCol] of neighbors) {
      const nKey = `${nRow}-${nCol}`;
      
      if (!this.visitedSet.has(nKey)) {
        this.visitedSet.add(nKey);
        this.parentMap[nKey] = [currentRow, currentCol]; // Salva a origem para traçar a volta
        this.frontier.push([nRow, nCol]); // Adiciona na fronteira (será ordenado no próximo passo)
      }
    }
    
    this.steps++;
  }
}