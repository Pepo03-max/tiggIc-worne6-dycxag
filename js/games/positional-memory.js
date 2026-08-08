function generatePositionalMemory(level){
  const side=[3,4,4,5,5][level-1],count=[4,5,7,9,12][level-1];
  return{
    side,count,
    spots:U.sample(U.range(0,side*side-1),count),
    symbols:U.sample(DATA.themes.objects.concat(DATA.themes.nature),count),
    revealTime:[4000,3500,3200,3000,2800][level-1]
  }
}

App.register({
  id:'posmem',cat:'memory',icon:'📍',title:'Memoria de posiciones',
  run(root,L,t){
    const{side,count,spots,symbols,revealTime}=generatePositionalMemory(L);
    const grid=U.el('div',{class:'grid',style:`grid-template-columns:repeat(${side},1fr)`});
    const note=U.el('p',{class:'center'},`Memoriza ${count} posiciones…`);
    let recalling=false,found=0;
    root.append(note,grid);
    for(let index=0;index<side*side;index++){
      const spotIndex=spots.indexOf(index);
      grid.append(U.el('button',{class:'tile',onclick:event=>{
        if(!recalling||event.currentTarget.classList.contains('found'))return;
        if(spotIndex<0){
          App.mistake();
          event.currentTarget.classList.add('no');
          return
        }
        event.currentTarget.textContent=symbols[spotIndex];
        event.currentTarget.classList.add('found');
        if(++found===count)App.finish('posmem',{
          perfect:App.active.mistakes===0,score:count*20,detail:`Has recordado ${count} posiciones.`
        },t)
      }},spotIndex<0?'':symbols[spotIndex]))
    }
    App.after(()=>{
      recalling=true;
      [...grid.children].forEach(cell=>cell.textContent='');
      note.textContent='Toca las posiciones que recuerdes.'
    },revealTime)
  }
});
