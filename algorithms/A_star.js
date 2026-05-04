class AStar extends PathfindingAlgorithm {
  constructor(grid_algorith, startRow, startCol, goalRow, goalCol) {
    super(grid_algorith, startRow, startCol, goalRow, goalCol);

    // Set auxiliar para checagem rápida de vizinhos já visitados/na fronteira
    this.closedSet = new Set();

    // Guarda o custo g(n) do início até cada nó conhecido
    this.gScore = {};
    const startKey = `${startRow}-${startCol}`;
    this.gScore[startKey] = 0;
  }

  step() {
    if (this.completed) return;

    // Se a fronteira esvaziar e não achou o objetivo, caminho impossível
    if (this.frontier.length === 0) {
      this.completed = true;
      this.pathFound = false;
      return;
    }

    // A*: Ordena a fronteira por f(n) = g(n) + h(n) (menor primeiro)
    this.frontier.sort((a, b) => {
      const aKey = `${a[0]}-${a[1]}`;
      const bKey = `${b[0]}-${b[1]}`;
      const gA = this.gScore[aKey] ?? Infinity;
      const gB = this.gScore[bKey] ?? Infinity;
      const fA = gA + this.manhattanDistance(a[0], a[1], this.goalRow, this.goalCol);
      const fB = gB + this.manhattanDistance(b[0], b[1], this.goalRow, this.goalCol);
      return fA - fB;
    });

    // Remove o nó com menor f(n)
    const [currentRow, currentCol] = this.frontier.shift();
    const currentKey = `${currentRow}-${currentCol}`;

    // Evitar reprocessar versões antigas (lazy skip)
    const currentG = this.gScore[currentKey];
    if (currentG === undefined)
        return;

    // Marca como visitado (para renderização)
    // Se já foi processado com melhor custo, ignora
    if (this.closedSet.has(currentKey))
        return;

    this.closedSet.add(currentKey);

    if (!this.visited.includes(currentKey)) {
        this.visited.push(currentKey);
    }
    this.nodesExplored++;

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

      const tentativeG = currentG + this.getTerrainCost(nRow, nCol);

      // Se nunca viu ou encontrou um caminho melhor, atualiza
      if (!(nKey in this.gScore) || tentativeG < this.gScore[nKey]) {
        this.parentMap[nKey] = [currentRow, currentCol];
        this.gScore[nKey] = tentativeG;

        // Adiciona à fronteira. Se já estava na fronteira, re-adiciona
        // (estratégia simples para contornar falta de decrease-key)
        if (this.closedSet.has(nKey))
            continue;

        this.frontier.push([nRow, nCol]);
      }
    }

    this.steps++;
  }
}
