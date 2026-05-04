class DFS extends PathfindingAlgorithm {
  constructor(grid_algorith, startRow, startCol, goalRow, goalCol) {
    super(grid_algorith, startRow, startCol, goalRow, goalCol);

    // Set auxiliar para checagem rápida de vizinhos já visitados/na pilha
    this.visitedSet = new Set();
    this.visitedSet.add(`${startRow}-${startCol}`);
  }

  step() {
    if (this.completed) return;

    // Se a pilha esvaziar e não achou a fruta, caminho impossível
    if (this.frontier.length === 0) {
      this.completed = true;
      this.pathFound = false;
      return;
    }

    // DFS usa PILHA (LIFO): removemos sempre do FINAL (.pop)
    // Isso garante que o algoritmo aprofunde um caminho antes de explorar outros
    const [currentRow, currentCol] = this.frontier.pop();
    const currentKey = `${currentRow}-${currentCol}`;

    // Adiciona aos visitados (para desenhar na tela)
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

    // Expande os vizinhos e os adiciona no TOPO da pilha
    const neighbors = this.getNeighbors(currentRow, currentCol);
    for (const [nRow, nCol] of neighbors) {
      const nKey = `${nRow}-${nCol}`;

      if (!this.visitedSet.has(nKey)) {
        this.visitedSet.add(nKey);
        this.parentMap[nKey] = [currentRow, currentCol]; // Salva a origem para traçar a volta
        this.frontier.push([nRow, nCol]); // Adiciona no FINAL (topo da pilha)
      }
    }

    this.steps++;
  }
}
