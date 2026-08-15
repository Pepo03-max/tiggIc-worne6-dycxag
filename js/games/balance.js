function generateBalanceQuestion(level){
  let value,factor,constant;
  if(level===1){
    value=U.rand(2,10);constant=U.rand(1,9);
    return{answer:value,text:`🔴 + ${constant} = ${value+constant}`}
  }
  if(level===2){
    value=U.rand(3,12);factor=U.rand(2,3);constant=U.rand(2,12);
    return{answer:value,text:`${factor} × 🔴 + ${constant} = ${factor*value+constant}`}
  }
  if(level===3){
    value=U.rand(5,18);factor=U.rand(2,5);constant=U.rand(5,25);
    return{answer:value,text:`${factor} × 🔴 + ${constant} = ${factor*value+constant}`}
  }
  if(level===4){
    value=U.rand(8,25);factor=U.rand(3,7);constant=U.rand(10,35);
    return{answer:value,text:`${factor} × 🔴 + ${constant} = ${factor*value+constant}`}
  }
  value=U.rand(8,28);factor=U.rand(3,7);constant=U.rand(2,15);
  return U.pick([
    {answer:value,text:`${factor} × 🔴 + ${constant} = ${factor*value+constant}`},
    {answer:value,text:`${factor} × (🔴 + ${constant}) = ${factor*(value+constant)}`}
  ])
}

function generateBalanceChoices(correct){
  const values=new Set([correct]),spread=Math.max(3,Math.ceil(correct*.35));
  while(values.size<4){
    const candidate=correct+U.rand(-spread,spread);
    if(candidate>0)values.add(candidate)
  }
  return U.shuffle([...values])
}

App.register({
  id:'balance',cat:'numbers',icon:'⚖️',title:'Number Balance',layout:'compact',
  run(root,L,t){
    let round=0,score=0,answer,locked=false;
    const note=U.el('p',{class:'center'}),progress=U.el('div',{class:'progress'});
    const question=U.el('div',{class:'question'}),options=U.el('div',{class:'answers'}),actions=U.el('div',{class:'row'});
    root.append(note,progress,question,options,actions);
    for(let i=0;i<8;i++)progress.append(U.el('span'));

    function next(){
      if(t!==App.active?.token)return;
      if(round===8)return App.finish('balance',{perfect:App.active.mistakes===0,score,detail:`${score/30}/8 balanzas resueltas.`},t);
      const test=generateBalanceQuestion(L);answer=test.answer;
      round++;locked=false;
      note.textContent=`Balanza ${round}/8 · nivel ${L}`;
      question.textContent=test.text;
      [...progress.children].forEach((dot,i)=>dot.classList.toggle('done',i<round-1));
      actions.replaceChildren();
      const buttons=generateBalanceChoices(answer).map(value=>U.el('button',{class:'btn',onclick:e=>{
        if(locked)return;locked=true;
        options.querySelectorAll('button').forEach(button=>button.disabled=true);
        if(value===answer){score+=30;e.currentTarget.classList.add('ok');note.textContent='✅ ¡Correcto!'}
        else{App.mistake();e.currentTarget.classList.add('no');buttons.find(button=>+button.textContent===answer)?.classList.add('ok');note.textContent=`❌ Incorrecto. Era ${answer}.`}
        actions.replaceChildren(U.el('button',{class:'btn primary',onclick:next},'Siguiente'));
      }},value));
      options.replaceChildren(...buttons);
    }
    next();
  }
});
