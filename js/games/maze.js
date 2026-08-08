function generateMaze(level){
  const size=[9,11,13,15,17][level-1];
  const matrix=Array.from({length:size},()=>Array(size).fill(1));
  (function carve(row,col){
    matrix[row][col]=0;
    for(const[deltaRow,deltaCol]of U.shuffle([[2,0],[-2,0],[0,2],[0,-2]])){
      const nextRow=row+deltaRow,nextCol=col+deltaCol;
      if(nextRow>0&&nextCol>0&&nextRow<size-1&&nextCol<size-1&&matrix[nextRow][nextCol]){
        matrix[row+deltaRow/2][col+deltaCol/2]=0;
        carve(nextRow,nextCol)
      }
    }
  })(1,1);
  return{size,matrix,start:[1,1],end:[size-2,size-2]}
}

App.register({
  id:'maze',cat:'spatial',icon:'🌀',title:'Laberinto lógico',
  run(root,L,t){
    const{size:N,matrix:m,start,end}=generateMaze(L);
    const g=U.el('div',{class:'maze',style:`grid-template-columns:repeat(${N},1fr);width:min(100%,520px)`}),path=[start];
    root.append(g);
    const cells=[];
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const e=U.el('div',{class:m[r][c]?'wall':''});
      if(r===1&&c===1)e.classList.add('start');
      if(r===N-2&&c===N-2)e.classList.add('end');
      cells.push(e);
      g.append(e);
    }
    const at=(r,c)=>cells[r*N+c];
    function paint(){cells.forEach(x=>x.classList.remove('path'));path.slice(1).forEach(([r,c])=>at(r,c).classList.add('path'))}
    let drag=false;
    function step(p){
      const last=path.at(-1);
      if(p[0]===last[0]&&p[1]===last[1])return;
      const back=path.findIndex(x=>x[0]===p[0]&&x[1]===p[1]);
      if(back>=0){path.splice(back+1);return paint()}
      if(Math.abs(p[0]-last[0])+Math.abs(p[1]-last[1])!==1||m[p[0]][p[1]])return;
      path.push(p);
      paint();
      if(p[0]===end[0]&&p[1]===end[1])App.finish('maze',{perfect:true,score:N*10,detail:'Has salido del laberinto.'},t);
    }
    const point=e=>{const x=document.elementFromPoint(e.clientX,e.clientY),i=cells.indexOf(x);return i<0?null:[Math.floor(i/N),i%N]};
    g.addEventListener('pointerdown',e=>{const p=point(e);if(p&&p[0]===1&&p[1]===1){drag=true;path.splice(1);paint();e.preventDefault()}});
    g.addEventListener('pointermove',e=>{if(drag){const p=point(e);if(p)step(p)}});
    const onPointerUp=()=>drag=false;
    App.listen(window,'pointerup',onPointerUp);
  }
});
