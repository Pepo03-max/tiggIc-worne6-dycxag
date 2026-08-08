function generateMemoryMatch(level){
  const[cols,rows]=[[3,2],[4,3],[4,4],[5,4],[6,5]][level-1];
  const pairs=cols*rows/2;
  const theme=U.pick(Object.values(DATA.themes));
  const deck=U.shuffle(U.sample(theme,pairs).flatMap(value=>[value,value]));
  return{cols,rows,pairs,deck}
}

App.register({
  id:'memory',cat:'memory',icon:'🃏',title:'Parejas de memoria',
  run(root,L,t){
    const{cols,rows,pairs,deck}=generateMemoryMatch(L);
    const grid=U.el('div',{class:'grid mm',style:`--n:${cols}`});
    const note=U.el('p',{class:'center'},'Encuentra todas las parejas.');
    const open=[];
    let locked=false,found=0,moves=0;
    root.append(note,grid);

    deck.forEach((value,index)=>{
      const button=U.el('button',{class:'tile hidden',onclick:()=>flip(button)},'?');
      button.dataset.v=value;
      button.dataset.i=index;
      grid.append(button)
    });

    function flip(button){
      if(locked||!button.classList.contains('hidden')||button.classList.contains('found'))return;
      button.textContent=button.dataset.v;
      button.classList.remove('hidden');
      open.push(button);
      if(open.length<2)return;
      moves++;
      const[first,second]=open;
      open.length=0;
      if(first.dataset.v===second.dataset.v){
        first.classList.add('found');
        second.classList.add('found');
        if(++found===pairs)App.finish('memory',{
          perfect:App.active.mistakes===0,
          score:pairs*20-moves*2,
          detail:`Tablero ${cols}×${rows} resuelto en ${moves} movimientos.`
        },t)
      }else{
        locked=true;
        App.mistake();
        App.after(()=>{
          first.textContent=second.textContent='?';
          first.classList.add('hidden');
          second.classList.add('hidden');
          locked=false
        },650)
      }
    }
  }
});
