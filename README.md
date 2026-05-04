# Projeto SI - Visualizador de Algoritmos com Grid Dinâmico

Um sistema interativo de visualização de algoritmos em grid com geração procedural de terrenos, movimento de entidades e conexões entre células.

## Links
[Link github pages](https://zed201.github.io/Projeto_SI/)

[Link p5js](https://editor.p5js.org/Zed201/full/TEh66YGh0)

## Conceitos Principais

### 1. **Terrenos e Cores**
O grid é composto por 4 tipos de terreno, cada um com cor, propriedade e comportamento únicos:

- **0 - Intransponível** (`#1B1A1A`): Terreno escuro que não pode ser atravessado. Nunca se expande em mapas procedurais.
- **1 - Areia** (`#E9B872`): Terreno de movimento lento. Expande com 30% de probabilidade em propagação.
- **2 - Atoleiro** (`#E29849`): Terreno de movimento moderado. Expande com 50% de probabilidade.
- **3 - Água** (`#6494AA`): Terreno de movimento muito lento. Expande com 80% de probabilidade.

### 2. **Velocidade Variável por Terreno**
A bolinha vermelha se move com velocidade que varia conforme o terreno:
- A fórmula: `velocidade = 1 / (value * 0.5 + 1)`
- Terrenos com value 0: velocidade máxima (100%)
- Terrenos com value 3: velocidade mínima (~18%)
- Mínimo garantido de 10% de velocidade

### 3. **Geração Procedural de Mapas**

#### Random Clássico
Preenche o grid com valores aleatórios de 0-3 de forma uniforme.

#### Random com Propagação
Algoritmo mais realista que cria clusters de terrenos similares:

1. **Fase 1: Inicialização**
   - Limpa o grid (preenche com intransponível)
   - Gera 5-15 "seeds" aleatórias com valores 1-3
   - Sementes são espalhadas randomicamente

2. **Fase 2: Propagação**
   - Executa 4 iterações de expansão
   - Cada terreno expande para células vizinhas com probabilidade baseada em seu peso
   - Cria padrões naturais de agrupamento

### 4. **Sistema de Conexões**
Linhas brancas que conectam células adjacentes:
- Apenas células vizinhas (distância Manhattan = 1) podem ser conectadas
- Armazenadas em um array com chaves normalizadas para evitar duplicatas
- A bolinha segue as conexões e ajusta velocidade conforme o terreno

### 5. **Movimento da Comida (Bolinha Vermelha)**
Sistema de pathfinding automático:
- Começa em posição aleatória válida (não intransponível)
- Se move entre células conectadas
- Busca próxima célula válida, evitando voltar para a anterior
- Velocidade varia com base no terreno atual

### 6. **Fruta (Bolinha Verde)**
Marcador estático:
- Posicionada aleatoriamente em célula válida
- Diferente da posição da comida
- Renderizada apenas se em posição válida (proteção contra grids pequenos)

## Controles

| Botão | Função |
|-------|--------|
| **Random** | Gera mapa com valores aleatórios 0-3 e reposiciona bolinhas |
| **Propagate** | Gera mapa com propagação de terrenos e reposiciona bolinhas |
| **Reset** | Apenas reposiciona as bolinhas (comida e fruta) em posições válidas |

### Sliders

| Slider | Função |
|--------|--------|
| **Cols** | Ajusta número de colunas (1-20) e reposiciona bolinhas |
| **Rows** | Ajusta número de linhas (1-20) e reposiciona bolinhas |
| **Size** | Ajusta tamanho de cada célula (16-48 pixels) |

## Arquitetura de Código

### Estrutura de Classes

```
Cell (célula base)
├── CellMap (célula com shade)
│
Grid (matriz de células)
└── AlgorithmGrid (grid com algoritmos)
    ├── Sistema de Conexões
    ├── Sistema de Movimento
    ├── Sistema de Shade/Effects
    └── Renderização
```

### Separação de Responsabilidades

**grid.js**
- Definição de terrenos e células
- Gerenciamento de grid e matriz
- Lógica de movimento e velocidades
- Sistema de conexões

**sketch.js**
- Interface de usuário (botões, sliders)
- Geração procedural (Random, Propagate)
- Sincronização entre grids
- Event handlers

## Parâmetros Ajustáveis

Edite constantes no topo de `sketch.js`:

```javascript
// Pesos de expansão (0-1)
const TERRAIN_WEIGHTS = {
  0: 0.0,    // intransponível
  1: 0.3,    // areia
  2: 0.5,    // atoleiro
  3: 0.8,    // água
};

// Propagação
const PROPAGATION_SEEDS_MIN = 5;
const PROPAGATION_SEEDS_MAX = 15;
const PROPAGATION_ITERATIONS = 4;
```
