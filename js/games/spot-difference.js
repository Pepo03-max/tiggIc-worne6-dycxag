function generateSpotDifference(level){
  const cols=4,rows=2+level,total=rows*cols;
  const differences=U.clamp(2+level,3,Math.floor(total/2));
  const pool=DATA.themes.nature.concat(DATA.themes.food,DATA.themes.symbols);
  const left=U.sample(pool,total),differentIndexes=U.sample(U.range(0,total-1),differences);
  const right=left.map((value,index)=>differentIndexes.includes(index)?U.pick(DATA.themes.animals.filter(item=>item!==value)):value);
  return{cols,rows,total,differences,left,right,differentIndexes}
}

App.register({
  id:'spotdiff',cat:'spatial',icon:'🕵️',title:'Spot the Difference',layout:'wide',
  run(root,L,t){
    const generated=generateSpotDifference(L);
    const{cols,rows,differences:n,left:base,right,differentIndexes:diff}=generated;
    const wrap=U.el('div',{class:'diff'}),note=U.el('p',{class:'center'}),clock=U.el('p',{class:'center'},'⏱ 1:00');
    let found=0,left=60,done=false,errors=0;
    const maxErrors=L===1?Infinity:5;
    root.append(note,clock,wrap);
    function status(){const limit=maxErrors===Infinity?'sin límite':`${errors}/5 errores`;note.textContent=`Encuentra ${n} diferencias en ${rows} filas · ${limit}`}
    status();
    const timer=App.every(()=>{
      if(t!==App.active?.token||done)return;
      left--;
      clock.textContent=`⏱ 0:${String(left).padStart(2,'0')}`;
      if(left<=0){done=true;App.finish('spotdiff',{status:'failed',perfect:false,score:found*15,detail:`Tiempo agotado: encontraste ${found}/${n}.`},t)}
    },1000);
    [base,right].forEach(a=>{
      const g=U.el('div',{class:'diffgrid',style:`grid-template-columns:repeat(${cols},1fr)`});
      a.forEach((x,i)=>g.append(U.el('button',{onclick:e=>{
        if(done)return;
        const targets=[...wrap.querySelectorAll('.diffgrid')].map(z=>z.children[i]);
        if(!diff.includes(i)){
          if(maxErrors!==Infinity)App.mistake();
          errors++;
          targets.forEach(x=>x.classList.add('no'));
          if(errors>=maxErrors){
            done=true;
            clearInterval(timer);
            App.finish('spotdiff',{status:'failed',perfect:false,score:found*15,detail:`Demasiados errores: ${found}/${n} diferencias encontradas.`},t);
          }else{
            status();
            note.textContent=`❌ Esa casilla no es diferente · ${maxErrors===Infinity?'errores sin límite':`${errors}/5 errores`}`;
          }
          return;
        }
        if(!e.currentTarget.classList.contains('found')){
          found++;
          targets.forEach(x=>x.classList.add('found'));
          if(found===n){done=true;clearInterval(timer);App.finish('spotdiff',{perfect:errors===0,score:n*20,detail:'Todas las diferencias encontradas.'},t)}
          else status();
        }
      }},x)));
      wrap.append(g);
    });
  }
});
