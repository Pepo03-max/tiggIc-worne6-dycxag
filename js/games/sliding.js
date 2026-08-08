function generateSlidingPuzzle(level){
  const size=[3,3,4,4,5][level-1],total=size*size;
  const board=U.range(1,total);
  board[total-1]=0;
  let blank=total-1,previous=-1;
  for(let step=0;step<80+level*20;step++){
    const row=Math.floor(blank/size),col=blank%size,options=[];
    if(row)options.push(blank-size);
    if(row<size-1)options.push(blank+size);
    if(col)options.push(blank-1);
    if(col<size-1)options.push(blank+1);
    const useful=options.filter(index=>index!==previous);
    const next=U.pick(useful.length?useful:options);
    [board[blank],board[next]]=[board[next],board[blank]];
    previous=blank;
    blank=next
  }
  return{size,total,board,blank}
}

App.register({
  id:'sliding',cat:'spatial',icon:'🧩',title:'Puzle deslizante',
  run(root,L,t){
    const generated=generateSlidingPuzzle(L);
    const{size,total,board}=generated;
    let blank=generated.blank,moves=0;
    const grid=U.el('div',{class:'slide',style:`grid-template-columns:repeat(${size},1fr);width:min(100%,480px)`});
    root.append(grid);

    function draw(){
      grid.replaceChildren(...board.map((value,index)=>U.el('button',{
        class:value?'':'blank',onclick:()=>tap(index)
      },value||'')))
    }
    function tap(index){
      const row=Math.floor(index/size),col=index%size;
      const blankRow=Math.floor(blank/size),blankCol=blank%size;
      if(Math.abs(row-blankRow)+Math.abs(col-blankCol)!==1)return;
      [board[blank],board[index]]=[board[index],board[blank]];
      blank=index;
      moves++;
      draw();
      if(board.every((value,position)=>value===(position+1)%total))App.finish('sliding',{
        perfect:true,score:total*10-moves,detail:`Resuelto en ${moves} movimientos.`
      },t)
    }
    draw()
  }
});
