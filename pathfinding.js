// ============================================================================
// BASE PARA ALGORITMOS DE BUSCA DE CAMINHOS
// ============================================================================
// Esta classe fornece a estrutura base para implementar diferentes algoritmos
// de busca (BFS, DFS, Dijkstra, A*, etc). Cada algoritmo específico deve
// estender esta classe e implementar o método step().

class PathfindingAlgorithm {
  constructor(grid_algorith, startRow, startCol, goalRow, goalCol) {
    // Grid de referência para consultar terrenos e limites
    this.grid_algorith = grid_algorith;

    // Posições de início e objetivo
    this.startRow = startRow;
    this.startCol = startCol;
    this.goalRow = goalRow;
    this.goalCol = goalCol;

    // Caminho final encontrado: [[r1, c1], [r2, c2], ...]
    this.path = [];

    // Células que foram exploradas durante a busca
    // Usado para renderizar visualização de exploração
    this.visited = [];

    // Células na fronteira (próximas a explorar)
    // Usado para renderizar visualização de expansão
    this.frontier = [];

    // Dicionário para rastrear o caminho { "row-col": [parentRow, parentCol] }
    this.parentMap = {};

    // Status da busca
    this.completed = false;
    this.pathFound = false;

    // Métricas de performance
    this.steps = 0;           // Número de iterações
    this.nodesExplored = 0;   // Quantidade de células exploradas
    this.executionTime = 0;   // Tempo em ms

    // Inicializa a fronteira com a posição de início para o passo a passo
    this.frontier.push([startRow, startCol]);
  }

  // ========================================================================
  // MÉTODO ABSTRATO - DEVE SER IMPLEMENTADO POR CADA ALGORITMO
  // ========================================================================

  step() {
    // IMPLEMENTAR: Lógica específica de busca passo a passo
    // Deve preencher: this.path, this.visited, this.frontier
    // E definir: this.completed = true, this.pathFound = (resultado)
    throw new Error("step() deve ser implementado pela subclasse");
  }

  // ========================================================================
  // GETTERS PARA RENDERIZAÇÃO
  // ========================================================================

  getPath() {
    return this.path;
  }

  getVisited() {
    return this.visited;
  }

  getFrontier() {
    return this.frontier;
  }

  getMetrics() {
    return {
      completed: this.completed,
      pathFound: this.pathFound,
      pathLength: this.path.length,
      nodesExplored: this.nodesExplored,
      executionTime: this.executionTime,
    };
  }

  // ========================================================================
  // UTILITÁRIOS PARA VALIDAÇÃO E MOVIMENTO
  // ========================================================================

  // Verifica se uma célula é válida (dentro dos limites e não intransponível)
  isValidCell(row, col) {
    if (!this.grid_algorith.inBounds(row, col)) return false;
    const cell = this.grid_algorith.getElement(row, col);
    return cell && cell.value !== 0; // 0 é intransponível
  }

  // Obtém todas as células adjacentes válidas (4 direções)
  getNeighbors(row, col) {
    const neighbors = [
      [row - 1, col],  // Cima
      [row + 1, col],  // Baixo
      [row, col - 1],  // Esquerda
      [row, col + 1],  // Direita
    ];
    return neighbors.filter(([r, c]) => this.isValidCell(r, c));
  }

  // Obtém o custo de movimento para uma célula baseado no terreno
  // Usado em algoritmos que consideram custos (Dijkstra, A*)
  getTerrainCost(row, col) {
    const cell = this.grid_algorith.getElement(row, col);
    if (!cell) return Infinity;
    
    const costs = {
      0: Infinity,  // Intransponível
      1: 1.0,       // Areia
      2: 2.0,       // Atoleiro (mais custoso)
      3: 3.0,       // Água (mais custoso ainda)
    };
    return costs[cell.value] || Infinity;
  }

  // Calcula distância Manhattan entre dois pontos
  // Útil para heurísticas em A*
  manhattanDistance(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  }

  // Calcula distância Euclidiana entre dois pontos
  euclideanDistance(r1, c1, r2, c2) {
    const dr = r1 - r2;
    const dc = c1 - c2;
    return Math.sqrt(dr * dr + dc * dc);
  }

  // ========================================================================
  // RECONSTRUÇÃO DE CAMINHO
  // ========================================================================

  // Reconstrói o caminho a partir de um dicionário de pais
  // parent: { "r-c": [parentRow, parentCol], ... }
  reconstructPath(parent, endRow, endCol) {
    const path = [];
    let current = [endRow, endCol];

    while (current) {
      path.unshift(current);
      
      // Condição de parada: chegou no nó inicial
      if (current[0] === this.startRow && current[1] === this.startCol) {
        break;
      }
      
      const key = `${current[0]}-${current[1]}`;
      current = parent[key] || null;
    }

    this.path = path;
    return path;
  }
}