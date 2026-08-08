const test=require('node:test');
const assert=require('node:assert/strict');
const{createU,elementText,fakeElement,findElement,loadClassic,loadClassicFiles}=require('./helpers/runtime');

function resultRuntime(){
  let appended;
  const U={...createU(5),el:fakeElement};
  const localStorage={getItem(){return null},setItem(){},removeItem(){}};
  const{exposed:store}=loadClassic('js/core/storage.js',{
    context:{localStorage},expose:['MindGymStore']
  });
  const document={body:{append(element){appended=element}},getElementById(){return fakeElement('main')}};
  const{exposed}=loadClassicFiles(['js/app.js','js/core/recall.js','js/core/results.js'],{
    context:{U,DATA:{},MindGymStore:store.MindGymStore,localStorage,document,addEventListener(){},clearInterval(){},setInterval(){},setTimeout(){},Date},
    expose:['App']
  });
  return{App:exposed.App,getOverlay:()=>appended}
}

function gameState(overrides={}){
  return{played:0,streak:0,bestStreak:0,bestScore:0,bestTime:0,totalScore:0,manualLevel:0,helpSeen:true,...overrides}
}

test('las puntuaciones negativas no reducen el total',()=>{
  const{App}=resultRuntime();
  App.state={game:gameState({totalScore:25})};
  App.active={id:'game',token:1,L:1,over:false};
  App.t0=Date.now()-1000;
  App.finish('game',{perfect:true,score:-100},1);
  assert.equal(App.state.game.totalScore,25)
});

test('un resultado fallido no sustituye el mejor tiempo',()=>{
  const{App,getOverlay}=resultRuntime();
  App.state={game:gameState({bestTime:20,streak:4,bestStreak:4})};
  App.active={id:'game',token:2,L:2,over:false};
  App.t0=Date.now()-1000;
  App.finish('game',{status:'failed',perfect:false,score:5},2);
  assert.equal(App.state.game.bestTime,20);
  assert.match(elementText(getOverlay()),/Conviene reintentarlo/)
});

test('el nivel manual pregunta si se desea subir después de tres perfectas',()=>{
  const{App,getOverlay}=resultRuntime();
  App.state={game:gameState({streak:2,bestStreak:2,manualLevel:2})};
  App.active={id:'game',token:3,L:2,over:false};
  App.t0=Date.now()-1000;
  App.finish('game',{perfect:true,score:10},3);
  assert.match(elementText(getOverlay()),/¿Quieres subir del nivel 2 al 3\?/);
  const rise=findElement(getOverlay(),element=>element.tag==='button'&&elementText(element).includes('Subir al nivel 3'));
  rise.props.onclick();
  assert.equal(App.state.game.manualLevel,3)
});
