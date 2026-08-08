const test=require('node:test');
const assert=require('node:assert/strict');
const{loadClassic}=require('./helpers/runtime');

function lifecycleRuntime(){
  return loadClassic('js/core/lifecycle.js',{
    context:{setTimeout,clearTimeout,setInterval,clearInterval},expose:['GameLifecycle']
  }).exposed.GameLifecycle
}

test('la limpieza cancela temporizadores pendientes',async()=>{
  const lifecycle=lifecycleRuntime().create(()=>true);
  let calls=0;
  lifecycle.timeout(()=>calls++,10);
  lifecycle.interval(()=>calls++,5);
  lifecycle.cleanup();
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(calls,0)
});

test('la limpieza retira listeners registrados',()=>{
  const lifecycle=lifecycleRuntime().create(()=>true),target=new EventTarget();
  let calls=0;
  lifecycle.listen(target,'ping',()=>calls++);
  target.dispatchEvent(new Event('ping'));
  lifecycle.cleanup();
  target.dispatchEvent(new Event('ping'));
  assert.equal(calls,1)
});

test('un ciclo antiguo no ejecuta callbacks aunque no se haya limpiado todavía',async()=>{
  let current=true,calls=0;
  const lifecycle=lifecycleRuntime().create(()=>current);
  lifecycle.timeout(()=>calls++,5);
  current=false;
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.equal(calls,0)
});
