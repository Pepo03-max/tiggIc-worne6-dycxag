function takeOrderingProcess(state,levelKey,needed){
  const eligible=DATA.processes.filter(process=>process.steps.length>=needed),bagKey=`${levelKey}:${needed}`;
  let bag=state.processBags[bagKey];
  if(!Array.isArray(bag)||!bag.length){
    bag=U.shuffle(eligible.map(process=>process.name));
    if(bag.length>1&&bag[0]===state.lastProcess[bagKey])[bag[0],bag[1]]=[bag[1],bag[0]];
    state.processBags[bagKey]=bag
  }
  const name=bag.shift();
  state.lastProcess[bagKey]=name;
  return eligible.find(process=>process.name===name)
}

function generateOrderingRound(level,state){
  const tier=U.rand(Math.max(1,level-1),level),needed=Math.min(2+tier,6);
  const process=takeOrderingProcess(state,String(level),needed),correct=process.steps.slice(0,needed);
  const incorrectAmount=tier>=5?2:tier>=4?1:0;
  const candidates=U.shuffle(DATA.processes.filter(other=>other!==process).flatMap(other=>other.steps));
  const wrong=[...new Set(candidates.filter(step=>!process.steps.includes(step)))].slice(0,incorrectAmount);
  return{process,correct,shown:U.shuffle([...correct,...wrong]),needed,incorrectAmount}
}

App.register({
  id:'ordering',cat:'numbers',icon:'📋',title:'Sequence Ordering',
  run(root,L,t){
    let round=0,score=0,correct=[],shown=[],selected=[],count=0,attempted=false,revealed=false;
    const gameState=App.st('ordering');
    gameState.processBags??={};
    gameState.lastProcess??={};
    const note=U.el('p',{class:'center'}),progress=U.el('div',{class:'progress'});
    const list=U.el('div',{class:'list'}),actions=U.el('div',{class:'row'});
    root.append(note,progress,list,actions);
    for(let i=0;i<6;i++)progress.append(U.el('span'));
    const check=U.el('button',{class:'btn primary',onclick:submit},'Corregir');
    const clear=U.el('button',{class:'btn',onclick:()=>{selected.length=0;draw()}},'Limpiar');
    const reveal=U.el('button',{class:'btn',onclick:showAnswer},'Mostrar orden correcto');
    actions.append(check,clear,reveal);

    function next(){
      if(t!==App.active?.token)return;
      if(round===6)return App.finish('ordering',{perfect:App.active.mistakes===0,score,detail:`${score}/6 órdenes correctos.`},t);
      actions.replaceChildren(check,clear,reveal);
      const generated=generateOrderingRound(L,gameState);
      const{process,needed,incorrectAmount}=generated;
      correct=generated.correct;
      shown=generated.shown;
      App.save();
      selected=[];count=needed;attempted=false;revealed=false;round++;
      note.textContent=`Ronda ${round}/6 · Objetivo: ${process.name} · ordena ${needed} pasos${incorrectAmount?` · hay ${incorrectAmount===1?'una opción incorrecta':'dos opciones incorrectas'} que no debes seleccionar`:''}`;
      [...progress.children].forEach((dot,index)=>dot.classList.toggle('done',index<round-1));
      list.replaceChildren(...shown.map((step,index)=>U.el('button',{dataset:{index},onclick:()=>{
        if(!selected.includes(index)&&selected.length<count){selected.push(index);draw()}
      }},step)));
      draw();
    }
    function draw(){
      [...list.children].forEach((button,index)=>{
        const position=selected.indexOf(index);
        button.classList.toggle('ok',position>=0);
        button.textContent=(position>=0?`${position+1}. `:'')+shown[index];
      });
    }
    function submit(){
      if(selected.length!==count){note.textContent=`Selecciona los ${count} pasos antes de corregir.`;return}
      attempted=true;
      const good=selected.every((index,position)=>shown[index]===correct[position]);
      if(good){
        score++;
        note.textContent='✅ Orden correcto';
        App.after(next,650);
      }else{
        App.mistake();
        note.textContent='❌ Hay algún paso incorrecto o está en una posición equivocada. Puedes limpiar y probar de nuevo.';
      }
    }
    function showAnswer(){
      if(revealed)return;
      revealed=true;
      if(!attempted)App.mistake();
      selected=correct.map(step=>shown.indexOf(step));
      [...list.children].forEach(button=>button.disabled=true);
      draw();
      note.textContent='💡 Este es el orden correcto. Revísalo antes de continuar.';
      actions.replaceChildren(U.el('button',{class:'btn primary',onclick:next},'Siguiente'));
    }
    next();
  }
});
