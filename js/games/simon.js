function simonConfig(level){
  const colorCount=4+(level>2);
  return{goal:4+level*2,colors:DATA.pal.slice(0,colorCount)}
}

App.register({
  id:'simon',cat:'memory',icon:'🎨',title:'Simón de secuencias',
  run(root,L,t){
    const{goal,colors}=simonConfig(L),sequence=[];
    const pads=U.el('div',{class:'simon'}),note=U.el('p',{class:'center'},'Cuando estés listo, empieza la partida.');
    const startButton=U.el('button',{class:'btn primary',onclick:start},'Empezar partida');
    let round=0,index=0,accepting=false,started=false;
    root.append(note,startButton,pads);

    function start(){
      if(started||t!==App.active?.token)return;
      started=true;
      startButton.remove();
      [...pads.children].forEach(pad=>pad.disabled=false);
      next()
    }
    function light(colorIndex){
      const pad=pads.children[colorIndex];
      pad.classList.add('lit');
      App.after(()=>pad.classList.remove('lit'),280)
    }
    function next(){
      if(t!==App.active?.token)return;
      round++;
      index=0;
      accepting=false;
      sequence.push(U.rand(0,colors.length-1));
      note.textContent=`Ronda ${round} de ${goal} — observa`;
      let delay=400;
      sequence.forEach(value=>{
        App.after(()=>light(value),delay);
        delay+=520
      });
      App.after(()=>{accepting=true;note.textContent='Tu turno'},delay)
    }
    function tap(colorIndex){
      if(!accepting)return;
      light(colorIndex);
      if(colorIndex!==sequence[index]){
        App.mistake();
        accepting=false;
        App.after(()=>App.finish('simon',{
          status:'failed',perfect:false,score:Math.max(0,sequence.length-1)*25,
          detail:`Has llegado a ${sequence.length-1}.`
        },t),500);
        return
      }
      if(++index===sequence.length){
        accepting=false;
        if(sequence.length===goal)App.finish('simon',{
          perfect:App.active.mistakes===0,score:goal*25,detail:`Has recordado ${goal} luces.`
        },t);
        else App.after(next,500)
      }
    }

    colors.forEach((color,colorIndex)=>pads.append(U.el('button',{
      disabled:true,style:`background:${color}`,onclick:()=>tap(colorIndex)
    })));
  }
});
