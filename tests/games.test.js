const test=require('node:test');
const assert=require('node:assert/strict');
const{createU,elementText,findElement,interactiveElement,loadClassicFiles}=require('./helpers/runtime');

function mentalMathRuntime(){
  let game;
  const callbacks=[];
  const App={
    active:{token:1,mistakes:0},
    register(registered){game=registered},
    mistake(){this.active.mistakes++},
    after(callback){callbacks.push(callback)},
    finish(){this.finished=true}
  };
  const U={...createU(91),el:interactiveElement};
  loadClassicFiles(['js/games/mental-math.js'],{context:{U,App}});
  return{App,callbacks,game}
}

function kakuroRuntime(){
  let game;
  const App={
    active:{token:1,mistakes:0},
    register(registered){game=registered},
    mistake(){this.active.mistakes++},
    finish(){this.finished=true}
  };
  const U={...createU(92),el:interactiveElement};
  loadClassicFiles(['js/games/kakuro.js'],{context:{U,App}});
  return{App,game}
}

test('un error de cálculo queda bloqueado hasta pulsar Siguiente',()=>{
  const{App,callbacks,game}=mentalMathRuntime(),root=interactiveElement('main');
  game.run(root,1,1);
  const question=findElement(root,element=>element.props.class==='question'),answer=findElement(root,element=>element.props.class==='question math-answer');
  const pad=findElement(root,element=>element.props.class==='pad');
  const one=pad.children.find(button=>elementText(button)==='1'),check=pad.children.find(button=>elementText(button)==='✓');
  one.props.onclick();
  check.props.onclick();

  assert.equal(App.active.mistakes,1);
  assert.equal(callbacks.length,0);
  assert.match(answer.textContent,/Respuesta introducida: 1/);
  assert.match(findElement(root,element=>(element.props.class||'').includes('math-solution')).textContent,/Solución correcta:/);
  assert.ok(pad.children.every(button=>button.disabled));
  assert.equal(findElement(root,element=>(element.props.class||'').includes('math-actions')).children.length,1);
  const questionDuringReview=question.textContent;
  pad.children.find(button=>elementText(button)==='2').props.onclick();
  assert.equal(question.textContent,questionDuringReview);

  const next=findElement(root,element=>element.tag==='button'&&elementText(element)==='Siguiente');
  next.props.onclick();
  assert.equal(answer.textContent,'—');
  assert.notEqual(question.textContent,questionDuringReview)
});

test('Kakuro solo penaliza una vez el mismo estado y limpia sus marcas al editar',()=>{
  const{App,game}=kakuroRuntime(),root=interactiveElement('main');
  game.run(root,1,1);
  const cellOne=findElement(root,element=>element.props['aria-label']==='Fila 1, columna 1');
  const cellTwo=findElement(root,element=>element.props['aria-label']==='Fila 1, columna 2');
  const nine=findElement(root,element=>element.tag==='button'&&elementText(element)==='9');
  const check=findElement(root,element=>element.tag==='button'&&elementText(element)==='Comprobar');
  cellOne.props.onclick();
  nine.props.onclick();
  cellTwo.props.onclick();
  nine.props.onclick();
  check.props.onclick();
  assert.equal(App.active.mistakes,1);
  assert.ok(cellOne.classList.contains('wrong'));
  check.props.onclick();
  assert.equal(App.active.mistakes,1);
  cellOne.props.onclick();
  nine.props.onclick();
  assert.equal(cellOne.classList.contains('wrong'),false);
  assert.equal(cellTwo.classList.contains('wrong'),false)
});
