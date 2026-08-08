const patternShapes=['●','▲','■','◆','★','♥'];
const patternShapeNames={'●':'círculo','▲':'triángulo','■':'cuadrado','◆':'rombo','★':'estrella','♥':'corazón'};
const patternShapePlurals={'●':'círculos','▲':'triángulos','■':'cuadrados','◆':'rombos','★':'estrellas','♥':'corazones'};
const patternColorNames={
  '#e74c3c':'rojo','#3498db':'azul','#2ecc71':'verde','#f1c40f':'amarillo',
  '#9b59b6':'morado','#e67e22':'naranja','#1abc9c':'turquesa','#e84393':'rosa'
};
const patternSizes=[.78,1,1.25,1.5],patternSizeNames={'0.78':'pequeño','1':'mediano','1.25':'grande','1.5':'muy grande'};
const patternRotations=[0,90,180,270],patternCounts=[1,2,3,4];

function patternContext(){
  const shapes=U.shuffle(patternShapes),colors=U.shuffle(DATA.pal);
  const token=(shape=shapes[0],color=colors[0],count=1,size=1,rotate=0)=>({shape,color,count,size,rotate});
  return{shapes,colors,token}
}
function periodicPattern(period,length,label,focus){
  const shown=U.range(0,length-1).map(index=>({...period[index%period.length]}));
  return{shown,answer:{...period[length%period.length]},label,focus}
}
function independentPattern(length,label,focus,build){
  const values=U.range(0,length).map(build);
  return{shown:values.slice(0,-1),answer:values.at(-1),label,focus}
}

const patternFamilies=[
  {id:'l1-shape-ab',tier:1,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[1],colors[0])],6,'Dos figuras alternas',['shape'])}},
  {id:'l1-color-ab',tier:1,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[0],colors[1])],6,'Dos colores alternos',['color'])}},
  {id:'l1-shape-aabb',tier:1,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[0],colors[0]),token(shapes[1],colors[0]),token(shapes[1],colors[0])],6,'Figuras por parejas',['shape'])}},
  {id:'l1-color-aabb',tier:1,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[0],colors[0]),token(shapes[0],colors[1]),token(shapes[0],colors[1])],6,'Colores por parejas',['color'])}},
  {id:'l1-count-ab',tier:1,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0],1),token(shapes[0],colors[0],2)],6,'Cantidad 1–2',['count'])}},
  {id:'l1-size-ab',tier:1,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0],1,.78),token(shapes[0],colors[0],1,1.25)],6,'Pequeño–grande',['size'])}},

  {id:'l2-shape-abc',tier:2,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[1],colors[0]),token(shapes[2],colors[0])],6,'Ciclo de 3 figuras',['shape'])}},
  {id:'l2-color-abc',tier:2,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[0],colors[1]),token(shapes[0],colors[2])],6,'Ciclo de 3 colores',['color'])}},
  {id:'l2-shape-abb',tier:2,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[1],colors[0]),token(shapes[1],colors[0])],6,'Una figura y dos iguales',['shape'])}},
  {id:'l2-count-123',tier:2,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0],1),token(shapes[0],colors[0],2),token(shapes[0],colors[0],3)],6,'Cantidad 1–2–3',['count'])}},
  {id:'l2-size-123',tier:2,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0],1,.78),token(shapes[0],colors[0],1,1),token(shapes[0],colors[0],1,1.25)],6,'Tres tamaños',['size'])}},

  {id:'l3-shape2-color3',tier:3,make(){const{shapes,colors,token}=patternContext();return independentPattern(8,'Figuras y colores con ritmos distintos',['shape','color'],index=>token(shapes[index%2],colors[index%3]))}},
  {id:'l3-shape3-color2',tier:3,make(){const{shapes,colors,token}=patternContext();return independentPattern(8,'Ciclo triple y color alterno',['shape','color'],index=>token(shapes[index%3],colors[index%2]))}},
  {id:'l3-pairs-abc',tier:3,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[0],colors[0]),token(shapes[1],colors[1]),token(shapes[1],colors[1]),token(shapes[2],colors[2]),token(shapes[2],colors[2])],8,'Parejas de figura y color',['shape','color'])}},
  {id:'l3-interleaved',tier:3,make(){const{shapes,colors,token}=patternContext();return periodicPattern([token(shapes[0],colors[0]),token(shapes[3],colors[3]),token(shapes[1],colors[0]),token(shapes[3],colors[3]),token(shapes[2],colors[0]),token(shapes[3],colors[3])],8,'Una serie intercalada con una figura fija',['shape','color'])}},
  {id:'l3-rotation',tier:3,make(){const{colors,token}=patternContext();return periodicPattern(patternRotations.map(angle=>token('▲',colors[0],1,1,angle)),8,'Giro de cuarto de vuelta',['rotate'])}},

  {id:'l4-shape3-color4',tier:4,make(){const{shapes,colors,token}=patternContext();return independentPattern(10,'Dos ciclos de diferente longitud',['shape','color'],index=>token(shapes[index%3],colors[index%4]))}},
  {id:'l4-shape2-size3',tier:4,make(){const{shapes,colors,token}=patternContext();return independentPattern(8,'Figura alterna y tamaño triple',['shape','size'],index=>token(shapes[index%2],colors[0],1,patternSizes[index%3]))}},
  {id:'l4-mirror',tier:4,make(){const{shapes,colors,token}=patternContext(),block=[0,1,2,2,1,0].map(index=>token(shapes[index],colors[index]));return periodicPattern(block,9,'Bloque espejo repetido',['shape','color'])}},
  {id:'l4-count-pairs',tier:4,make(){const{shapes,colors,token}=patternContext();return periodicPattern([1,1,2,2,3,3].map(count=>token(shapes[0],colors[count-1],count)),8,'Cantidades por parejas',['count','color'])}},
  {id:'l4-rotation-color',tier:4,make(){const{colors,token}=patternContext();return independentPattern(9,'Giro y color a ritmos distintos',['rotate','color'],index=>token('▲',colors[index%3],1,1,patternRotations[index%4]))}},

  {id:'l5-shape4-color3',tier:5,make(){const{shapes,colors,token}=patternContext();return independentPattern(11,'Ciclo de 4 figuras y 3 colores',['shape','color'],index=>token(shapes[index%4],colors[index%3]))}},
  {id:'l5-shape3-color2-size2',tier:5,make(){const{shapes,colors,token}=patternContext();return independentPattern(9,'Figura, color y tamaño combinados',['shape','color','size'],index=>token(shapes[index%3],colors[index%2],1,patternSizes[index%2?2:0]))}},
  {id:'l5-growing-block',tier:5,make(){const{shapes,colors,token}=patternContext(),period=[token(shapes[0],colors[0]),token(shapes[0],colors[0]),token(shapes[1],colors[1]),token(shapes[0],colors[0]),token(shapes[1],colors[1]),token(shapes[2],colors[2])];return periodicPattern(period,9,'Bloques de 1, 2 y 3 elementos',['shape','color'])}},
  {id:'l5-long-mirror',tier:5,make(){const{shapes,colors,token}=patternContext(),block=[0,1,2,3,2,1,0].map(index=>token(shapes[index],colors[index%3]));return periodicPattern(block,10,'Simetría larga repetida',['shape','color'])}},
  {id:'l5-count-color',tier:5,make(){const{shapes,colors,token}=patternContext();return independentPattern(9,'Cantidad triple y color alterno',['count','color'],index=>token(shapes[0],colors[index%2],index%3+1))}}
];

function patternTokenKey(token){return[token.shape,token.color,token.count,token.size,token.rotate].join(':')}

function takePatternFamily(level,state){
  const key=String(level);
  let bag=state.familyBags[key];
  if(!Array.isArray(bag)||!bag.length){
    const current=patternFamilies.filter(family=>family.tier===level).map(family=>family.id);
    const previous=level===1?[]:U.sample(patternFamilies.filter(family=>family.tier===level-1).map(family=>family.id),2);
    bag=U.shuffle([...current,...previous]);
    if(bag[0]===state.lastFamilies[key]){
      const swap=U.rand(1,bag.length-1);
      [bag[0],bag[swap]]=[bag[swap],bag[0]]
    }
    state.familyBags[key]=bag
  }
  const id=bag.shift();
  state.lastFamilies[key]=id;
  return patternFamilies.find(family=>family.id===id)
}

function generatePattern(level,state){
  const key=String(level),family=takePatternFamily(level,state),history=state.testHistory[key]??=[];
  let test,signature;
  for(let attempt=0;attempt<80;attempt++){
    test=family.make();
    signature=`${family.id}|${test.shown.map(patternTokenKey).join(';')}>${patternTokenKey(test.answer)}`;
    if(!history.includes(signature))break
  }
  history.push(signature);
  state.testHistory[key]=history.slice(-100);
  return{...test,family,signature}
}

function generatePatternChoices(answer,focus){
  const domains={shape:patternShapes,color:DATA.pal,count:patternCounts,size:patternSizes,rotate:patternRotations};
  const wrong=[],seen=new Set([patternTokenKey(answer)]);
  for(const property of U.shuffle(focus)){
    for(const value of U.shuffle(domains[property].filter(value=>value!==answer[property]))){
      const candidate={...answer,[property]:value},key=patternTokenKey(candidate);
      if(!seen.has(key)){seen.add(key);wrong.push(candidate)}
      if(wrong.length>=3)break
    }
    if(wrong.length>=3)break
  }
  if(wrong.length<3){
    for(const property of ['shape','color','count','size','rotate']){
      for(const value of U.shuffle(domains[property].filter(value=>value!==answer[property]))){
        const candidate={...answer,[property]:value},key=patternTokenKey(candidate);
        if(!seen.has(key)){seen.add(key);wrong.push(candidate)}
        if(wrong.length>=3)break
      }
      if(wrong.length>=3)break
    }
  }
  return U.shuffle([answer,...wrong])
}

function describePatternToken(token){
  const amount=token.count>1?`${token.count} ${patternShapePlurals[token.shape]}`:patternShapeNames[token.shape];
  return`${amount}, ${patternColorNames[token.color]}, tamaño ${patternSizeNames[String(token.size)]}${token.rotate?`, giro ${token.rotate} grados`:''}`
}

App.register({
  id:'patterns',cat:'spatial',icon:'🧠',title:'Reconocimiento de patrones',
  run(root,L,t){
    const state=App.st('patterns');
    state.familyBags??={};
    state.lastFamilies??={};
    state.testHistory??={};
    let round=0,score=0;
    const note=U.el('p',{class:'center'}),progress=U.el('div',{class:'progress'});
    const sequence=U.el('div',{class:'sequence pattern-sequence'}),answers=U.el('div',{class:'answers'}),actions=U.el('div',{class:'row'});
    root.append(note,progress,sequence,answers,actions);
    for(let index=0;index<6;index++)progress.append(U.el('span'));

    function renderToken(tag,token,props={}){
      return U.el(tag,{...props,class:`${props.class||''} pattern-token`.trim(),'aria-label':describePatternToken(token)},
        U.el('span',{class:'pattern-symbol',style:`--pattern-color:${token.color};--pattern-size:${token.size};--pattern-rotate:${token.rotate}deg`},token.shape.repeat(token.count)))
    }
    function next(){
      if(round===6)return App.finish('patterns',{
        perfect:App.active.mistakes===0,score,detail:`${score}/6 patrones resueltos.`
      },t);
      const{shown,answer,label,focus,family}=generatePattern(L,state),choices=generatePatternChoices(answer,focus);
      App.save();
      round++;
      note.textContent=`Ronda ${round}/6 · nivel ${family.tier}: ${label}`;
      [...progress.children].forEach((dot,index)=>dot.classList.toggle('done',index<round-1));
      sequence.replaceChildren(...shown.map(token=>renderToken('span',token)),U.el('span',{class:'pattern-question'},'?'));
      const buttons=choices.map(token=>renderToken('button',token,{class:'btn pattern-option',onclick:event=>{
        answers.querySelectorAll('button').forEach(button=>button.disabled=true);
        if(patternTokenKey(token)===patternTokenKey(answer)){
          score++;
          event.currentTarget.classList.add('ok');
          note.textContent='✅ ¡Correcto!'
        }else{
          App.mistake();
          event.currentTarget.classList.add('no');
          buttons.find((_,index)=>patternTokenKey(choices[index])===patternTokenKey(answer))?.classList.add('ok');
          note.textContent=`❌ Respuesta correcta: ${describePatternToken(answer)}.`
        }
        actions.replaceChildren(U.el('button',{class:'btn primary',onclick:next},'Siguiente'))
      }}));
      actions.replaceChildren();
      answers.replaceChildren(...buttons)
    }
    next()
  }
});
