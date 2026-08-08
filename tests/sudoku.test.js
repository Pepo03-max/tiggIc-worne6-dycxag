const test=require('node:test');
const assert=require('node:assert/strict');
const{createU,loadClassic}=require('./helpers/runtime');

function sudokuRuntime(seed){
  return loadClassic('js/games/sudoku.js',{
    context:{U:createU(seed),App:{register(){}}},
    expose:['sudokuConfig','generateSudokuPuzzle','countSudokuSolutions']
  }).exposed
}

test('los sudokus de todos los niveles tienen exactamente una solución',()=>{
  const api=sudokuRuntime(20260807);
  for(let level=1;level<=5;level++){
    const recent=[];
    for(let attempt=0;attempt<20;attempt++){
      const game=api.generateSudokuPuzzle(level,recent);
      const solutions=api.countSudokuSolutions(
        game.puzzle.map(row=>row.slice()),game.blockRows,game.blockCols
      );
      assert.equal(solutions,1,`nivel ${level}, intento ${attempt}`);
      assert.equal(game.removed,api.sudokuConfig(level).removeTarget);
      assert.ok(!recent.includes(game.signature),'se repitió una firma reciente');
      recent.push(game.signature)
    }
  }
});

test('la solución generada completa correctamente todas las pistas',()=>{
  const api=sudokuRuntime(77);
  for(let level=1;level<=5;level++){
    const game=api.generateSudokuPuzzle(level);
    game.puzzle.forEach((row,rowIndex)=>row.forEach((value,colIndex)=>{
      if(value)assert.equal(value,game.solution[rowIndex][colIndex])
    }))
  }
});
