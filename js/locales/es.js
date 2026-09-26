const titlesEs={
  memory:'Parejas de memoria',
  simon:'Repite la secuencia',
  posmem:'Memoria de posiciones',
  math:'Cálculo mental',
  sudoku:'Mini sudoku',
  kakuro:'Kakuro',
  balance:'Balanza numérica',
  odd:'El elemento diferente',
  ordering:'Ordenar secuencias',
  sequences:'Series numéricas',
  hanoi:'Torres de Hanói',
  patterns:'Reconocimiento de patrones',
  wordsearch:'Sopa de letras',
  spotdiff:'Encuentra las diferencias',
  sliding:'Puzle deslizante',
  maze:'Laberinto lógico'
};
Object.entries(titlesEs).forEach(([id,title])=>{if(App.byId[id])App.byId[id].title=title});
