const sequenceMakers={
  1:[
    {id:'small-up',make(){const start=U.rand(1,20),step=U.rand(2,9),values=U.range(0,4).map(index=>start+step*index);return{values,answer:start+step*5,label:'Suma constante'}}},
    {id:'small-down',make(){const step=U.rand(2,7),start=U.rand(step*5+1,step*5+30),values=U.range(0,4).map(index=>start-step*index);return{values,answer:start-step*5,label:'Resta constante'}}},
    {id:'odd-even',make(){const start=U.rand(1,18),values=U.range(0,4).map(index=>start+2*index);return{values,answer:start+10,label:start%2?'Números impares':'Números pares'}}}
  ],
  2:[
    {id:'large-up',make(){const start=U.rand(10,70),step=U.rand(6,18),values=U.range(0,5).map(index=>start+step*index);return{values,answer:start+step*6,label:'Suma constante amplia'}}},
    {id:'large-down',make(){const step=U.rand(5,14),start=U.rand(step*6+5,step*6+80),values=U.range(0,5).map(index=>start-step*index);return{values,answer:start-step*6,label:'Resta constante amplia'}}},
    {id:'alternating-sums',make(){const start=U.rand(2,20),first=U.rand(2,8),second=U.rand(9,18),values=[start];for(let index=0;index<5;index++)values.push(values.at(-1)+(index%2?second:first));return{values,answer:values.at(-1)+second,label:'Dos sumas alternas'}}}
  ],
  3:[
    {id:'fibonacci',make(){const values=[U.rand(1,9),U.rand(2,12)];while(values.length<6)values.push(values.at(-1)+values.at(-2));return{values,answer:values.at(-1)+values.at(-2),label:'Cada número suma los dos anteriores'}}},
    {id:'growing-gap',make(){const values=[U.rand(1,15)],growth=U.rand(1,4);let gap=U.rand(2,6);while(values.length<6){values.push(values.at(-1)+gap);gap+=growth}return{values,answer:values.at(-1)+gap,label:'Diferencia creciente'}}},
    {id:'interleaved',make(){const first=U.rand(1,12),second=U.rand(15,30),firstStep=U.rand(2,7),secondStep=U.rand(3,9),values=[first,second,first+firstStep,second+secondStep,first+2*firstStep,second+2*secondStep];return{values,answer:first+3*firstStep,label:'Dos series intercaladas'}}}
  ],
  4:[
    {id:'geometric',make(){const start=U.rand(2,8),multiplier=U.pick([2,3]),values=U.range(0,4).map(index=>start*multiplier**index);return{values,answer:values.at(-1)*multiplier,label:`Multiplica por ${multiplier}`}}},
    {id:'multiply-add',make(){const multiplier=U.pick([2,3]),addition=U.rand(1,6),values=[U.rand(1,7)];while(values.length<5)values.push(values.at(-1)*multiplier+addition);return{values,answer:values.at(-1)*multiplier+addition,label:`Multiplica por ${multiplier} y suma ${addition}`}}},
    {id:'double-interleaved',make(){const first=U.rand(2,12),second=U.rand(3,15),firstStep=U.rand(4,10),secondStep=U.rand(5,12),values=[first,second,first+firstStep,second+secondStep,first+2*firstStep,second+2*secondStep];return{values,answer:first+3*firstStep,label:'Dos progresiones intercaladas'}}}
  ],
  5:[
    {id:'quadratic',make(){const start=U.rand(1,12),linear=U.rand(1,5),quadratic=U.rand(2,6),value=index=>start+linear*index+quadratic*index*index,values=U.range(0,5).map(value);return{values,answer:value(6),label:'Crecimiento cuadrático'}}},
    {id:'cubic',make(){const start=U.rand(1,10),factor=U.rand(1,4),value=index=>start+factor*index**3,values=U.range(0,4).map(value);return{values,answer:value(5),label:'Crecimiento cúbico'}}},
    {id:'multiply-subtract',make(){const start=U.rand(3,9),multiplier=U.pick([2,3]),maxSubtraction=Math.min(6,Math.floor((start*multiplier**3-1)/(multiplier*multiplier+multiplier+1))),subtraction=U.rand(1,maxSubtraction),values=[start];for(let index=0;index<5;index++)values.push(index%2?values.at(-1)-subtraction:values.at(-1)*multiplier);return{values,answer:values.at(-1)-subtraction,label:`Alterna ×${multiplier} y −${subtraction}`}}}
  ]
};

function generateSequence(level,state){
  const key=String(level),history=state.testHistory[key]??[],lastFamily=state.lastFamilies[key];
  const tiers=level===1?[1]:[level-1,level];
  let test,signature,family;
  for(let attempt=0;attempt<100;attempt++){
    const tier=U.pick(tiers),available=sequenceMakers[tier].filter(maker=>maker.id!==lastFamily);
    const maker=U.pick(available.length?available:sequenceMakers[tier]);
    test=maker.make();
    family=maker.id;
    signature=`${test.values.join(',')}|${test.answer}`;
    if(!history.includes(signature))break
  }
  history.push(signature);
  state.testHistory[key]=history.slice(-100);
  state.lastFamilies[key]=family;
  return{...test,family,signature}
}

function generateSequenceChoices(answer){
  const choices=new Set([answer]),spread=Math.max(5,Math.round(Math.abs(answer)*.12));
  while(choices.size<4){
    const candidate=answer+U.rand(-spread,spread);
    if(candidate>0&&candidate!==answer)choices.add(candidate)
  }
  return U.shuffle([...choices])
}

App.register({
  id:'sequences',cat:'numbers',icon:'🔁',title:'Series numéricas',layout:'compact',
  run(root,L,t){
    let round=0,score=0,currentLabel='',waitingForAnswer=true;
    const sequence=U.el('div',{class:'sequence'}),options=U.el('div',{class:'answers'});
    const note=U.el('p',{class:'center'}),actions=U.el('div',{class:'row'});
    const state=App.st('sequences');
    state.testHistory??={};
    state.lastFamilies??={};
    const updatePatternVisibility=()=>{
      if(waitingForAnswer&&round)note.textContent=`Ronda ${round}/6${App.active.showPattern===true?` · ${currentLabel}`:''}`
    };
    App.active.updatePatternVisibility=updatePatternVisibility;
    root.append(note,sequence,options,actions);

    function next(){
      if(round===6)return App.finish('sequences',{
        perfect:App.active.mistakes===0,score,detail:`${score/25}/6 series resueltas.`
      },t);
      const{values,answer,label}=generateSequence(L,state),choices=generateSequenceChoices(answer);
      App.save();
      round++;
      currentLabel=label;
      waitingForAnswer=true;
      updatePatternVisibility();
      sequence.replaceChildren(...values.map(value=>U.el('span',{},value)),U.el('span',{},'?'));
      options.replaceChildren(...choices.map(value=>U.el('button',{class:'btn',onclick:event=>{
        options.querySelectorAll('button').forEach(button=>button.disabled=true);
        waitingForAnswer=false;
        if(value===answer){
          score+=25;
          event.currentTarget.classList.add('ok');
          note.textContent='✅ ¡Correcto!'
        }else{
          App.mistake();
          event.currentTarget.classList.add('no');
          options.querySelectorAll('button').forEach(button=>{if(+button.textContent===answer)button.classList.add('ok')});
          note.textContent=`❌ La respuesta era ${answer}.`
        }
        actions.replaceChildren(U.el('button',{class:'btn primary',onclick:next},'Siguiente'))
      }},value)));
      actions.replaceChildren()
    }
    next()
  }
});
