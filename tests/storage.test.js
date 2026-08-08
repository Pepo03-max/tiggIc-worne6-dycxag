const test=require('node:test');
const assert=require('node:assert/strict');
const{loadClassic}=require('./helpers/runtime');

function storeRuntime(value){
  let saved;
  const localStorage={
    getItem(){return value},
    setItem(key,next){saved={key,value:next}},
    removeItem(){}
  };
  const{exposed}=loadClassic('js/core/storage.js',{
    context:{localStorage},expose:['MindGymStore']
  });
  return{store:exposed.MindGymStore,getSaved:()=>saved}
}

test('migra un progreso antiguo y conserva sus datos válidos',()=>{
  const legacy=JSON.stringify({
    sudoku:{played:4,streak:2,bestStreak:6,manualLevel:3,customHistory:['x']},
    dailyPlayCounts:{'2026-08-07':3,incorrecta:99}
  });
  const{store}=storeRuntime(legacy);
  const state=store.load();
  assert.equal(state.schemaVersion,store.currentVersion);
  assert.equal(state.sudoku.played,4);
  assert.equal(state.sudoku.manualLevel,3);
  assert.deepEqual(Array.from(state.sudoku.customHistory),['x']);
  assert.deepEqual({...state.dailyPlayCounts},{'2026-08-07':3})
});

test('repara tipos y valores corruptos sin impedir el arranque',()=>{
  const broken=JSON.stringify({
    schemaVersion:1,
    sudoku:{played:-4,streak:'3',bestScore:'no',manualLevel:99,helpSeen:'sí'},
    recall:{count:100,words:['ÁRBOL','',4],games:-2,checks:'2'}
  });
  const{store}=storeRuntime(broken);
  const state=store.load();
  assert.equal(state.sudoku.played,0);
  assert.equal(state.sudoku.streak,3);
  assert.equal(state.sudoku.bestScore,0);
  assert.equal(state.sudoku.manualLevel,5);
  assert.equal(state.sudoku.helpSeen,false);
  assert.deepEqual(Array.from(state.recall.words),['ÁRBOL']);
  assert.equal(state.recall.count,1);
  assert.equal(state.recall.games,0)
});

test('guarda siempre la versión actual del esquema',()=>{
  const{store,getSaved}=storeRuntime(null),state={};
  assert.equal(store.save(state),true);
  assert.equal(state.schemaVersion,store.currentVersion);
  assert.equal(JSON.parse(getSaved().value).schemaVersion,store.currentVersion)
});
