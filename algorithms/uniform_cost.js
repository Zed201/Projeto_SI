class CustoUniforme extends PathfindingAlgorithm {
  constructor(grid_algorith, startRow, startCol, goalRow, goalCol) {
    super(grid_algorith, startRow, startCol, goalRow, goalCol);

    // Mapa de custos acumulados até cada célula: { "r-c": custo }
    this.costMap = {};
    this.costMap[`${startRow}-${startCol}`] = 0;

    // A fronteira aqui armazena [row, col, custo_acumulado]
    // Sobrescrevemos a fronteira padrão do construtor pai
    this.frontier = [[startRow, startCol, 0]];

    // Set auxiliar para marcar células já expandidas definitivamente
    this.visitedSet = new Set();
  }

  step() {
    if (this.completed) return;

    // Se a fronteira esvaziar e não achou a fruta, caminho impossível
    if (this.frontier.length === 0) {
      this.completed = true;
      this.pathFound = false;
      return;
    }

    // CUSTO UNIFORME: Fila de Prioridade pelo menor custo acumulado g(n)
    // Ordenamos para que o nó de menor custo total fique no índice [0]
    this.frontier.sort((a, b) => a[2] - b[2]);

    // Removemos o nó de menor custo (frente da fila de prioridade)
    const [currentRow, currentCol, currentCost] = this.frontier.shift();
    const currentKey = `${currentRow}-${currentCol}`;

    // Se este nó já foi expandido com um custo menor, descartamos
    if (this.visitedSet.has(currentKey)) return;
    this.visitedSet.add(currentKey);

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

    // Expande os vizinhos considerando o custo do terreno de cada um
    const neighbors = this.getNeighbors(currentRow, currentCol);
    for (const [nRow, nCol] of neighbors) {
      const nKey = `${nRow}-${nCol}`;

      if (this.visitedSet.has(nKey)) continue;

      // Custo acumulado = custo até o nó atual + custo do terreno do vizinho
      const custoTerreno = this.getTerrainCost(nRow, nCol);
      const novoCusto = currentCost + custoTerreno;

      // Só enfileira se encontramos um caminho mais barato para este vizinho
      if (this.costMap[nKey] === undefined || novoCusto < this.costMap[nKey]) {
        this.costMap[nKey] = novoCusto;
        this.parentMap[nKey] = [currentRow, currentCol]; // Salva a origem para traçar a volta
        this.frontier.push([nRow, nCol, novoCusto]); // Enfileira com custo acumulado
      }
    }

    this.steps++;
  }
}
