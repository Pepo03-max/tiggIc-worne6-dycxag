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

function canCompleteKakuroRun(values,target){
  const filled=values.filter(value=>value>0),empty=values.length-filled.length;
  if(filled.some(value=>value<1||value>9)||new Set(filled).size!==filled.length)return false;
  const missing=target-filled.reduce((sum,value)=>sum+value,0);
  if(missing<empty||missing>empty*9)return false;
  if(!empty)return missing===0;
  const available=U.range(1,9).filter(value=>!filled.includes(value));
  function search(start,slots,total){
    if(slots===0)return total===missing;
    if(missing-total<slots||missing-total>slots*9)return false;
    for(let index=start;index<available.length;index++){
      if(search(index+1,slots-1,total+available[index]))return true
    }
    return false
  }
  return search(0,empty,0)
}

function validateKakuro(values,rowClues,colClues){
  const rows=values.length,cols=values[0]?.length||0;
  const statuses=values.map(row=>row.map(value=>value?'valid':'empty'));
  const markRun=(coordinates,target)=>{
    const filled=coordinates.filter(([row,col])=>values[row][col]);
    if(!filled.length)return;
    const numbers=coordinates.map(([row,col])=>values[row][col]);
    if(canCompleteKakuroRun(numbers,target))return;
    filled.forEach(([row,col])=>{statuses[row][col]='invalid'})
  };
  const rowCoordinates=U.range(0,rows-1).map(row=>U.range(0,cols-1).map(col=>[row,col]));
  const colCoordinates=U.range(0,cols-1).map(col=>U.range(0,rows-1).map(row=>[row,col]));
  rowCoordinates.forEach((coordinates,row)=>markRun(coordinates,rowClues[row]));
  colCoordinates.forEach((coordinates,col)=>markRun(coordinates,colClues[col]));
  const complete=values.every(row=>row.every(Boolean));
  const hasErrors=statuses.some(row=>row.includes('invalid'));
  return{statuses,complete,hasErrors,completeValid:complete&&!hasErrors}
}

App.register({
  id:'kakuro',cat:'numbers',icon:'🧮',title:'Kakuro',
  run(root,L,t){
    const{rows,cols,rowClues,colClues}=generateKakuro(L);
    const values=Array.from({length:rows},()=>Array(cols).fill(0));
    const cells={};
    const board=U.el('div',{
      class:'sd kakuro',
      style:`grid-template-columns:repeat(${cols+1},1fr);max-width:${Math.min(430,(cols+1)*68)}px;width:100%`
    });
    const pad=U.el('div',{class:'pad'}),actions=U.el('div',{class:'row kakuro-actions'}),status=U.el('p',{class:'center'});
    let selected=null,wrong=0,done=false,lastCheckedSignature=null;

    status.textContent=`Kakuro ${rows}×${cols}: completa las sumas sin repetir dígitos en cada fila o columna.`;
    root.append(status,board,actions,pad);

    board.append(U.el('div',{class:'kk-black kakuro-corner'},'↘'));
    colClues.forEach(sum=>board.append(U.el('div',{class:'kk-black kakuro-clue'},
      U.el('span',{class:'kk-clue-arrow','aria-hidden':'true'},'↓'),U.el('strong',{class:'kk-clue-sum'},sum)
    )));
    for(let r=0;r<rows;r++){
      board.append(U.el('div',{class:'kk-black kakuro-clue'},
        U.el('span',{class:'kk-clue-arrow','aria-hidden':'true'},'→'),U.el('strong',{class:'kk-clue-sum'},rowClues[r])
      ));
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
    function clearValidation(){
      Object.values(cells).forEach(cell=>cell.classList.remove('valid','wrong'))
    }
    function renderValidation(validation){
      validation.statuses.forEach((row,r)=>row.forEach((state,c)=>{
        const cell=cells[`${r},${c}`];
        cell.classList.toggle('valid',state==='valid');
        cell.classList.toggle('wrong',state==='invalid')
      }))
    }
    function stateSignature(){return values.map(row=>row.join(',')).join('|')}
    function check(){
      if(done)return;
      const validation=validateKakuro(values,rowClues,colClues),signature=stateSignature();
      renderValidation(validation);
      if(validation.completeValid){
        done=true;
        App.finish('kakuro',{
          perfect:wrong===0,
          score:Math.max(30,70+L*45-wrong*6),
          detail:`Kakuro ${rows}×${cols} resuelto correctamente.`
        },t);
        return
      }
      const newState=signature!==lastCheckedSignature;
      if(validation.hasErrors&&newState){
        wrong++;
        App.mistake()
      }
      lastCheckedSignature=signature;
      if(validation.complete)status.textContent='❌ Hay casillas rojas: la fila o columna completa no cumple las reglas.';
      else if(validation.hasErrors)status.textContent='❌ Hay casillas rojas: esta fila o columna ya no puede completarse.';
      else status.textContent='⚠️ El tablero está incompleto. Las casillas verdes son compatibles con las reglas.'
    }
    function put(value){
      if(!selected||done)return;
      const [r,c]=selected.split(',').map(Number),cell=cells[selected];
      values[r][c]=value;
      cell.textContent=value||'';
      clearValidation();
      status.textContent=`Kakuro ${rows}×${cols} · pulsa «Comprobar» para validar.`
    }

    actions.append(U.el('button',{class:'btn primary',onclick:check},'Comprobar'));
    U.range(1,9).forEach(v=>pad.append(U.el('button',{class:'btn',onclick:()=>put(v)},v)));
    pad.append(U.el('button',{class:'btn',onclick:()=>put(0)},'⌫'))
  }
});
