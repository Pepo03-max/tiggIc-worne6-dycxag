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

function mazeElement(tag,props={},...children){
  const element=interactiveElement(tag,props,...children),listeners=new Map();
  element.addEventListener=(type,handler)=>{
    const handlers=listeners.get(type)||[];
    handlers.push(handler);
    listeners.set(type,handlers)
  };
  element.removeEventListener=(type,handler)=>{
    const handlers=listeners.get(type)||[];
    listeners.set(type,handlers.filter(item=>item!==handler))
  };
  element.dispatchEvent=event=>{
    event.target=element;
    (listeners.get(event.type)||[]).slice().forEach(handler=>handler(event))
  };
  return element
}

function mazeRuntime(){
  let game,now=0,registeredIntervals=0,periodic,clearedIntervals=0;
  const pointCells=new Map(),windowTarget=mazeElement('window'),document={
    elementFromPoint(x,y){return pointCells.get(`${x},${y}`)||null}
  };
  const App={
    active:{token:1,mistakes:0,over:false,lifecycle:null},
    register(registered){game=registered},
    finish(){this.finished=true;this.active.over=true},
    listen(target,type,handler,options){return this.active.lifecycle.listen(target,type,handler,options)},
    every(callback,delay){assert.equal(delay,200);periodic=callback;registeredIntervals++;return this.active.lifecycle.interval(callback,delay)}
  };
  const U={...createU(101),el:mazeElement};
  const fakeDate={now:()=>now};
  const fakeSetInterval=()=>({});
  const fakeClearInterval=()=>{clearedIntervals++};
  const{exposed}=loadClassicFiles(['js/core/lifecycle.js','js/games/maze.js'],{
    context:{U,App,document,window:windowTarget,Date:fakeDate,setTimeout,clearTimeout,setInterval:fakeSetInterval,clearInterval:fakeClearInterval},
    expose:['GameLifecycle']
  });
  App.active.lifecycle=exposed.GameLifecycle.create(()=>!App.active.over);
  const root=mazeElement('main');
  game.run(root,1,1);
  const board=root.children[0],size=Math.sqrt(board.children.length),cells=board.children;
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){
    cells[row*size+col].getBoundingClientRect=()=>({left:row-10,top:col-10,width:20,height:20});
    pointCells.set(`${row},${col}`,cells[row*size+col])
  }
  const route=[];
  const queue=[[[1,1],[]]],seen=new Set(['1,1']);
  while(queue.length){
    const[current,trail]=queue.shift(),nextTrail=[...trail,current];
    if(current[0]===size-2&&current[1]===size-2){route.push(...nextTrail);break}
    for(const[dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]]){
      const next=[current[0]+dr,current[1]+dc],key=next.join(',');
      if(next[0]>=0&&next[1]>=0&&next[0]<size&&next[1]<size&&!cells[next[0]*size+next[1]].classList.contains('wall')&&!seen.has(key)){
        seen.add(key);queue.push([next,nextTrail])
      }
    }
  }
  const dispatch=(target,type,point,pointerType='mouse')=>{
    const event={type,pointerType,clientX:point[0],clientY:point[1],preventDefault(){this.defaultPrevented=true}};
    target.dispatchEvent(event)
  };
  return{App,board,cells,size,route,windowTarget,dispatch,setNow(value){now=value},tick(){periodic?.()},cleanup(){App.active.lifecycle.cleanup()},getIntervals:()=>registeredIntervals,getClearedIntervals:()=>clearedIntervals}
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

test('el laberinto permite continuar desde el extremo después de soltar',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first,second]=runtime.route;
  runtime.dispatch(runtime.board,'pointerdown',start);
  runtime.dispatch(runtime.board,'pointermove',first);
  runtime.dispatch(runtime.windowTarget,'pointerup',first);
  runtime.dispatch(runtime.board,'pointerdown',first);
  runtime.dispatch(runtime.board,'pointermove',second);

  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path'),true);
  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path-current'),true)
});

test('el laberinto amplía 12 px el área táctil alrededor del extremo',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first,second]=runtime.route;
  runtime.dispatch(runtime.board,'pointerdown',start,'touch');
  runtime.dispatch(runtime.board,'pointermove',first,'touch');
  runtime.dispatch(runtime.windowTarget,'pointerup',first,'touch');
  runtime.dispatch(runtime.board,'pointerdown',[first[0]+20,first[1]],'touch');
  runtime.dispatch(runtime.board,'pointermove',second,'touch');

  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path-current'),true)
});

test('el laberinto no reanuda fuera de la tolerancia táctil',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first,second]=runtime.route;
  runtime.dispatch(runtime.board,'pointerdown',start,'touch');
  runtime.dispatch(runtime.board,'pointermove',first,'touch');
  runtime.dispatch(runtime.windowTarget,'pointerup',first,'touch');
  runtime.dispatch(runtime.board,'pointerdown',[first[0]+23,first[1]],'touch');
  runtime.dispatch(runtime.board,'pointermove',second,'touch');

  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path'),false);
  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path-current'),true)
});

test('el laberinto no permite iniciar desde una casilla intermedia y permite retroceder',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first,second,third]=runtime.route;
  runtime.dispatch(runtime.board,'pointerdown',start);
  runtime.dispatch(runtime.board,'pointermove',first);
  runtime.dispatch(runtime.board,'pointermove',second);
  runtime.dispatch(runtime.windowTarget,'pointerup',second);

  runtime.dispatch(runtime.board,'pointerdown',first);
  runtime.dispatch(runtime.board,'pointermove',third);
  assert.equal(runtime.cells[third[0]*size+third[1]].classList.contains('path'),false);

  runtime.dispatch(runtime.board,'pointerdown',second);
  runtime.dispatch(runtime.board,'pointermove',first);
  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path'),false);
  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path-current'),true)
});

test('las paredes y saltos no cambian el recorrido, y un movimiento válido reinicia la inactividad',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first,second]=runtime.route;
  const adjacentWall=first[0]===1?[0,first[1]]:[first[0],0];
  runtime.setNow(100);
  runtime.dispatch(runtime.board,'pointerdown',start);
  runtime.dispatch(runtime.board,'pointermove',first);
  runtime.dispatch(runtime.windowTarget,'pointerup',first);

  runtime.setNow(4900);
  runtime.dispatch(runtime.board,'pointerdown',first);
  runtime.dispatch(runtime.board,'pointermove',adjacentWall);
  runtime.dispatch(runtime.board,'pointermove',[0,0]);
  runtime.setNow(5000);
  runtime.tick();
  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path'),true);

  runtime.dispatch(runtime.board,'pointerdown',first);
  runtime.dispatch(runtime.board,'pointermove',second);
  runtime.setNow(9900);
  runtime.tick();
  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path-current'),true);

  runtime.setNow(10001);
  runtime.tick();
  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path'),false);
  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path'),false)
});

test('la inactividad borra solo la línea y pointercancel termina el arrastre táctil',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first,second]=runtime.route;
  const end=runtime.cells[(size-2)*size+size-2],wall=runtime.cells[0];
  runtime.setNow(100);
  runtime.dispatch(runtime.board,'pointerdown',start,'touch');
  runtime.dispatch(runtime.board,'pointermove',first,'touch');
  runtime.dispatch(runtime.windowTarget,'pointercancel',first,'touch');
  runtime.dispatch(runtime.board,'pointermove',second,'touch');
  assert.equal(runtime.cells[second[0]*size+second[1]].classList.contains('path'),false);

  runtime.setNow(5100);
  runtime.tick();
  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path'),false);
  assert.equal(runtime.cells[(size-2)*size+size-2],end);
  assert.equal(end.classList.contains('end'),true);
  assert.equal(wall.classList.contains('wall'),true);
  assert.equal(runtime.cells[1*size+1].classList.contains('path-current'),true)
});

test('el ciclo de vida limpia el intervalo y los eventos del laberinto',()=>{
  const runtime=mazeRuntime(),{size}=runtime,[start,first]=runtime.route;
  runtime.cleanup();
  runtime.dispatch(runtime.board,'pointerdown',start);
  runtime.dispatch(runtime.board,'pointermove',first);

  assert.equal(runtime.getIntervals(),1);
  assert.equal(runtime.getClearedIntervals(),1);
  assert.equal(runtime.cells[first[0]*size+first[1]].classList.contains('path'),false)
});
