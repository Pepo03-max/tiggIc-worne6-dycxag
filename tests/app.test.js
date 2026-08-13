const test=require('node:test');
const assert=require('node:assert/strict');
const{createU,loadClassic,loadClassicFiles}=require('./helpers/runtime');

function appRuntime(){
  const saved=[];
  const localStorage={
    getItem(){return null},
    setItem(key,value){saved.push({key,value:JSON.parse(value)})},
    removeItem(){}
  };
  const{exposed:store}=loadClassic('js/core/storage.js',{
    context:{localStorage},expose:['MindGymStore']
  });
  const{exposed}=loadClassicFiles(['js/app.js'],{
    context:{
      U:createU(7),MindGymStore:store.MindGymStore,localStorage,
      document:{},addEventListener(){},clearInterval(){},setInterval(){},Date
    },
    expose:['App']
  });
  return{App:exposed.App,saved}
}

test('el primer cambio manual se conserva al salir del nivel adaptativo',()=>{
  const{App,saved}=appRuntime();
  App.state={game:{bestStreak:6,manualLevel:0}};
  let reopened;
  App.play=id=>{reopened=id};

  App.changeLevel('game',1);

  assert.equal(App.state.game.manualLevel,4);
  assert.equal(saved.at(-1).value.game.manualLevel,4);
  assert.equal(reopened,'game')
});

test('los cambios posteriores parten del nivel manual seleccionado',()=>{
  const{App}=appRuntime();
  App.state={game:{bestStreak:12,manualLevel:3}};
  App.play=()=>{};

  App.changeLevel('game',-1);

  assert.equal(App.state.game.manualLevel,2)
});
