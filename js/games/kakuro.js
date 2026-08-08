function generateKakuro(level){
  const[rows,cols]=[[2,2],[2,3],[3,3],[4,4],[5,5]][level-1];
  const digits=U.shuffle(U.range(1,9));
  const rowOffsets=U.sample(U.range(0,8),rows),colOffsets=U.sample(U.range(0,8),cols);
  const solution=Array.from({length:rows},(_,row)=>
    Array.from({length:cols},(_,col)=>digits[(rowOffsets[row]+colOffsets[col])%9])
  );
  return{
    rows,cols,solution,
    rowClues:solution.map(row=>row.reduce((sum,value)=>sum+value,0)),
    colClues:U.range(0,cols-1).map(col=>solution.reduce((sum,row)=>sum+row[col],0))
  }
}

App.register({
  id:'kakuro',cat:'numbers',icon:'🧮',title:'Kakuro',
  run(root,L,t){
    const{rows,cols,solution,rowClues,colClues}=generateKakuro(L);
    const values=Array.from({length:rows},()=>Array(cols).fill(0));
    const cells={};
    const board=U.el('div',{
      class:'sd kakuro',
      style:`grid-template-columns:repeat(${cols+1},1fr);max-width:${Math.min(430,(cols+1)*68)}px;width:100%`
    });
    const pad=U.el('div',{class:'pad'}),status=U.el('p',{class:'center'});
    let selected=null,wrong=0,done=false;

    status.textContent=`Kakuro ${rows}×${cols}: completa las sumas sin repetir dígitos en cada fila o columna.`;
    root.append(status,board,pad);

    board.append(U.el('div',{class:'kk-black kakuro-corner'},'↘'));
    colClues.forEach(sum=>board.append(U.el('div',{class:'kk-black kakuro-clue'},`↓ ${sum}`)));
    for(let r=0;r<rows;r++){
      board.append(U.el('div',{class:'kk-black kakuro-clue'},`→ ${rowClues[r]}`));
      for(let c=0;c<cols;c++){
        const key=`${r},${c}`;
        const button=U.el('button',{
          'aria-label':`Fila ${r+1}, columna ${c+1}`,
          onclick:()=>select(key)
        },'');
        cells[key]=button;
        board.append(button)
      }
    }

    function select(key){
      if(done)return;
      selected=key;
      Object.values(cells).forEach(cell=>cell.classList.remove('selected'));
      cells[key].classList.add('selected')
    }
    function invalidRun(nums,target){
      const filled=nums.filter(Boolean);
      return new Set(filled).size!==filled.length||
        filled.reduce((sum,n)=>sum+n,0)>target||
        (filled.length===nums.length&&filled.reduce((sum,n)=>sum+n,0)!==target)
    }
    function invalidCells(){
      const invalid=new Set();
      for(let r=0;r<rows;r++){
        if(invalidRun(values[r],rowClues[r]))for(let c=0;c<cols;c++)if(values[r][c])invalid.add(`${r},${c}`)
      }
      for(let c=0;c<cols;c++){
        const column=U.range(0,rows-1).map(r=>values[r][c]);
        if(invalidRun(column,colClues[c]))for(let r=0;r<rows;r++)if(values[r][c])invalid.add(`${r},${c}`)
      }
      return invalid
    }
    function refresh(){
      const invalid=invalidCells();
      Object.entries(cells).forEach(([key,cell])=>cell.classList.toggle('wrong',invalid.has(key)));
      return invalid
    }
    function solved(){
      if(values.some(row=>row.some(n=>!n)))return false;
      if(values.some((row,r)=>invalidRun(row,rowClues[r])))return false;
      return !U.range(0,cols-1).some(c=>invalidRun(U.range(0,rows-1).map(r=>values[r][c]),colClues[c]))
    }
    function put(value){
      if(!selected||done)return;
      const [r,c]=selected.split(',').map(Number),cell=cells[selected];
      values[r][c]=value;
      cell.textContent=value||'';
      const invalid=refresh();
      if(value&&invalid.has(selected)){
        wrong++;
        App.mistake();
        status.textContent='❌ Revisa las casillas rojas: hay un repetido o la suma no coincide.'
      }else{
        status.textContent=`Kakuro ${rows}×${cols} · suma filas y columnas sin repetir dígitos.`
      }
      if(solved()){
        done=true;
        App.finish('kakuro',{
          perfect:wrong===0,
          score:Math.max(30,70+L*45-wrong*6),
          detail:`Kakuro ${rows}×${cols} resuelto correctamente.`
        },t)
      }
    }

    U.range(1,9).forEach(v=>pad.append(U.el('button',{class:'btn',onclick:()=>put(v)},v)));
    pad.append(U.el('button',{class:'btn',onclick:()=>put(0)},'⌫'))
  }
});
