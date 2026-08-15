function sudokuConfig(level){
  const sizes=[4,4,6,6,9],removeTargets=[6,8,15,19,44],N=sizes[level-1];
  return{
    N,
    blockCols:N===4?2:3,
    blockRows:N===9?3:2,
    removeTarget:removeTargets[level-1]
  }
}

function sudokuCanPlace(grid,row,col,value,blockRows,blockCols){
  const N=grid.length;
  for(let i=0;i<N;i++)if(grid[row][i]===value||grid[i][col]===value)return false;
  const firstRow=row-row%blockRows,firstCol=col-col%blockCols;
  for(let r=firstRow;r<firstRow+blockRows;r++){
    for(let c=firstCol;c<firstCol+blockCols;c++)if(grid[r][c]===value)return false
  }
  return true
}

function generateSudokuSolution(N,blockRows,blockCols){
  const grid=Array.from({length:N},()=>Array(N).fill(0));
  function solve(){
    for(let row=0;row<N;row++){
      for(let col=0;col<N;col++){
        if(grid[row][col])continue;
        for(const value of U.shuffle(U.range(1,N))){
          if(!sudokuCanPlace(grid,row,col,value,blockRows,blockCols))continue;
          grid[row][col]=value;
          if(solve())return true;
          grid[row][col]=0
        }
        return false
      }
    }
    return true
  }
  solve();
  return grid
}

function countSudokuSolutions(grid,blockRows,blockCols,limit=2){
  const N=grid.length;
  let solutions=0;
  function solve(){
    if(solutions>=limit)return;
    let bestRow=-1,bestCol=-1,bestValues=null;
    for(let row=0;row<N;row++){
      for(let col=0;col<N;col++){
        if(grid[row][col])continue;
        const values=U.range(1,N).filter(value=>sudokuCanPlace(grid,row,col,value,blockRows,blockCols));
        if(!values.length)return;
        if(!bestValues||values.length<bestValues.length){
          bestRow=row;
          bestCol=col;
          bestValues=values
        }
      }
    }
    if(!bestValues){
      solutions++;
      return
    }
    for(const value of bestValues){
      grid[bestRow][bestCol]=value;
      solve();
      grid[bestRow][bestCol]=0;
      if(solutions>=limit)return
    }
  }
  solve();
  return solutions
}

function generateSudokuPuzzle(level,recent=[]){
  const{N,blockRows,blockCols,removeTarget}=sudokuConfig(level);
  let candidate;
  for(let attempt=0;attempt<30;attempt++){
    const solution=generateSudokuSolution(N,blockRows,blockCols);
    const puzzle=solution.map(row=>row.slice());
    let removed=0;
    for(const index of U.shuffle(U.range(0,N*N-1))){
      if(removed===removeTarget)break;
      const row=Math.floor(index/N),col=index%N,previous=puzzle[row][col];
      puzzle[row][col]=0;
      const probe=puzzle.map(values=>values.slice());
      if(countSudokuSolutions(probe,blockRows,blockCols)===1)removed++;
      else puzzle[row][col]=previous
    }
    const signature=puzzle.flat().join('');
    candidate={N,blockRows,blockCols,puzzle,solution,signature,removed};
    if(!recent.includes(signature))break
  }
  return candidate
}

App.register({
  id:'sudoku',cat:'numbers',icon:'🔢',title:'Mini sudoku',layout:'board',
  run(root,L,t){
    const gameState=App.st('sudoku');
    gameState.puzzleHistory??={};
    const history=gameState.puzzleHistory[L]??=[];
    const{N,puzzle,solution,signature}=generateSudokuPuzzle(L,history);
    history.push(signature);
    gameState.puzzleHistory[L]=history.slice(-2000);
    App.save();

    const cells=[];
    const board=U.el('div',{class:`sd sudoku-${N}`,style:`grid-template-columns:repeat(${N},1fr);max-width:480px;width:100%`});
    const pad=U.el('div',{class:'pad'});
    root.append(board,pad);
    let selected=null,errors=0;

    for(let index=0;index<N*N;index++){
      const row=Math.floor(index/N),col=index%N,given=puzzle[row][col];
      const button=U.el('button',{class:given?'given':'',onclick:()=>{
        if(given)return;
        selected=index;
        cells.forEach(cell=>cell.classList.remove('selected'));
        button.classList.add('selected')
      }},given||'');
      cells.push(button);
      board.append(button)
    }

    function put(value){
      if(selected==null)return;
      const button=cells[selected],row=Math.floor(selected/N),col=selected%N;
      if(value===0){
        button.textContent='';
        button.classList.remove('wrong');
        return
      }
      button.textContent=value;
      if(value!==solution[row][col]){
        errors++;
        App.mistake();
        button.classList.add('wrong');
        return
      }
      button.classList.remove('wrong');
      if(cells.every((cell,index)=>+cell.textContent===solution[Math.floor(index/N)][index%N])){
        App.finish('sudoku',{
          perfect:errors===0,
          score:N*N-errors*4,
          detail:`Sudoku ${N}×${N} completado.`
        },t)
      }
    }

    U.range(1,N).forEach(value=>pad.append(U.el('button',{class:'btn',onclick:()=>put(value)},value)));
    pad.append(U.el('button',{class:'btn',onclick:()=>put(0)},'⌫'))
  }
});
