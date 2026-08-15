const oddOneOutPools=[
      {cat:['🍎','🍐','🍊','🍋','🍇','🍓','🍑','🍍','🥝'],outs:['🥕','🥦','🌽','🍆','🫑']},
      {cat:['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐯','🦁'],outs:['🦅','🐧','🐍','🐢','🦎']},
      {cat:['🚗','🚌','🚕','🚚','🚜','🏎️','🚓','🚑','🚒'],outs:['✈️','🚁','⛵','🚤','🚀']},
      {cat:['🎸','🎹','🎺','🎻','🥁','🪕','🎷','🪗','🪈'],outs:['🔨','🔧','📱','⚽','🍎']},
      {cat:['👕','👖','👗','🧥','🧦','👚','🥼','🩳','👔'],outs:['🔨','🔑','📱','🍎','⚽']},
      {cat:['🔨','🔧','🪛','🪚','⛏️','🧰','🔩','⚙️','🗜️'],outs:['🎸','🍕','🐶','👕','🚗']},
      {cat:['🐟','🐠','🐡','🦈','🐙','🐬','🐳','🦀','🦞'],outs:['🐶','🐱','🦁','🐴','🐰']},
      {cat:['🌷','🌹','🌻','🌺','🌸','🪻','🌼','🪷','💐'],outs:['⭐','⚡','🔥','❄️','🌈']},
      {cat:['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🥎'],outs:['🎸','🎹','🎺','🎻','🥁']},
      {cat:['📎','✏️','🖊️','📏','📐','✂️','📌','🗂️','📒'],outs:['🍎','🐶','🚗','🎸','👕']}
];

function generateOddOneOut(level,state){
  const key=String(level),normalCount=2+level;
  let bag=state.categoryBags[key];
  if(!Array.isArray(bag)||!bag.length){
    bag=U.shuffle(U.range(0,oddOneOutPools.length-1));
    if(bag[0]===state.lastCategories[key]){
      const swap=U.rand(1,bag.length-1);
      [bag[0],bag[swap]]=[bag[swap],bag[0]]
    }
    state.categoryBags[key]=bag
  }
  const category=bag.shift(),pool=oddOneOutPools[category],history=state.testHistory[key]??=[];
  state.lastCategories[key]=category;
  let out,same,signature;
  for(let attempt=0;attempt<80;attempt++){
    out=U.pick(pool.outs);
    same=U.sample(pool.cat,normalCount);
    signature=`${category}|${out}|${same.slice().sort().join('')}`;
    if(!history.includes(signature))break
  }
  history.push(signature);
  state.testHistory[key]=history.slice(-100);
  return{out,items:U.shuffle([...same,out]),signature}
}

App.register({
  id:'odd',cat:'numbers',icon:'🔍',title:'El elemento diferente',layout:'compact',
  run(root,L,t){
    const gameState=App.st('odd');
    gameState.categoryBags??={};
    gameState.lastCategories??={};
    gameState.testHistory??={};
    let round=0,score=0;
    const note=U.el('p',{class:'center'}),grid=U.el('div',{class:'answers odd-answers'}),actions=U.el('div',{class:'row'});
    root.append(note,grid,actions);

    function next(){
      if(round===8)return App.finish('odd',{perfect:App.active.mistakes===0,score,detail:`${score/20}/8 aciertos.`},t);
      const{out,items}=generateOddOneOut(L,gameState);
      App.save();
      round++;
      grid.replaceChildren();
      note.textContent=`Ronda ${round}/8 · ${items.length} opciones`;
      items.forEach(item=>grid.append(U.el('button',{class:'btn odd-choice',onclick:e=>{
        grid.querySelectorAll('button').forEach(button=>button.disabled=true);
        if(item===out){
          score+=20;
          e.currentTarget.classList.add('ok');
          note.textContent='✅ ¡Correcto!'
        }else{
          App.mistake();
          e.currentTarget.classList.add('no');
          grid.querySelectorAll('button').forEach(button=>{if(button.textContent===out)button.classList.add('ok')});
          note.textContent=`❌ Era ${out}.`
        }
        actions.replaceChildren(U.el('button',{class:'btn primary',onclick:next},'Siguiente'))
      }},item)))
      actions.replaceChildren();
    }
    next()
  }
});
