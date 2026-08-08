function generateMentalMathQuestion(level){
  const tier=U.rand(Math.max(1,level-1),level);
  let x,y,z;
  if(tier===1){
    x=U.rand(3,14);y=U.rand(2,12);
    return U.pick([{text:`${x} + ${y}`,answer:x+y},{text:`${x+y} − ${x}`,answer:y}])
  }
  if(tier===2){
    x=U.rand(12,49);y=U.rand(8,38);
    return U.pick([{text:`${x} + ${y}`,answer:x+y},{text:`${x+y} − ${y}`,answer:x}])
  }
  if(tier===3){
    x=U.rand(3,12);y=U.rand(2,12);
    return U.pick([{text:`${x} × ${y}`,answer:x*y},{text:`${x*y} ÷ ${x}`,answer:y}])
  }
  if(tier===4){
    x=U.rand(3,12);y=U.rand(2,10);z=U.rand(2,9);
    return U.pick([{text:`${x} × ${y} + ${z}`,answer:x*y+z},{text:`(${x} + ${y}) × ${z}`,answer:(x+y)*z}])
  }
  x=U.rand(3,12);y=U.rand(2,9);z=U.rand(2,8);
  return U.pick([{text:`${x*y*z} ÷ ${x*y}`,answer:z},{text:`${x*y} + ${z} × ${y}`,answer:x*y+z*y}])
}

App.register({
  id:'math',cat:'numbers',icon:'➗',title:'Mental Math',
  run(root,L,t){
    let round=0,score=0,current,entry='';
    const note=U.el('p',{class:'center'}),progress=U.el('div',{class:'progress'});
    const question=U.el('div',{class:'question'}),answer=U.el('div',{class:'question'},'—');
    const pad=U.el('div',{class:'pad'});
    root.append(note,progress,question,answer,pad);
    for(let index=0;index<8;index++)progress.append(U.el('span'));

    function next(){
      if(t!==App.active?.token)return;
      if(round===8)return App.finish('math',{
        perfect:App.active.mistakes===0,score,detail:`${score/25}/8 correctas.`
      },t);
      current=generateMentalMathQuestion(L);
      entry='';
      question.textContent=`${current.text} = ?`;
      answer.textContent='—';
      round++;
      note.textContent=`Pregunta ${round}/8 · dificultad variable`;
      [...progress.children].forEach((dot,index)=>dot.classList.toggle('done',index<round-1))
    }

    function press(key){
      if(key==='✓'){
        if(entry===''||!current)return;
        if(+entry===current.answer){score+=25;note.textContent='✅ ¡Correcto!'}
        else{App.mistake();note.textContent=`❌ Incorrecto. La respuesta era ${current.answer}.`}
        current=null;
        App.after(next,650);
        return
      }
      if(key==='⌫')entry=entry.slice(0,-1);
      else if(entry.length<6)entry+=key;
      answer.textContent=entry||'—'
    }

    '1234567890⌫✓'.split('').forEach(key=>pad.append(U.el('button',{class:'btn',onclick:()=>press(key)},key)));
    next()
  }
});
