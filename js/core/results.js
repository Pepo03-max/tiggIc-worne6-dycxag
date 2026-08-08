Object.assign(App,{
  finish(id,result,token=this.active?.token){
    if(!this.active||this.active.over||this.active.id!==id||this.active.token!==token)return;
    const active=this.active;
    const status=result.status||(result.perfect?'perfect':'completed'),perfect=status==='perfect';
    active.over=true;
    active.lifecycle?.cleanup();
    clearInterval(this.timer);
    this.timer=null;

    const state=this.st(id),seconds=this.elapsed();
    state.played++;
    state.streak=perfect?state.streak+1:0;
    state.bestStreak=Math.max(state.bestStreak,state.streak);
    if(result.score!=null){
      const numericScore=Number(result.score);
      const score=Math.max(0,Number.isFinite(numericScore)?numericScore:0);
      state.bestScore=Math.max(state.bestScore,score);
      state.totalScore+=score
    }
    if(status!=='failed'&&(!state.bestTime||seconds<state.bestTime))state.bestTime=Math.round(seconds);

    const day=this.today(),daily=this.state.dailyPlayCounts??={};
    daily[day]=(daily[day]||0)+1;
    const cutoff=new Date();
    cutoff.setDate(cutoff.getDate()-90);
    const cutoffKey=this.today(cutoff);
    for(const date of Object.keys(daily))if(date<cutoffKey)delete daily[date];

    const progressionTurn=perfect&&state.streak>0&&state.streak%3===0;
    const autoLevel=U.clamp(1+Math.floor(state.bestStreak/3),1,5);
    const automaticRise=progressionTurn&&!state.manualLevel&&autoLevel>active.L;
    const manualRise=progressionTurn&&state.manualLevel>0&&state.manualLevel<5;
    this.save();

    const copy={
      perfect:{icon:'🏆',title:'Ronda perfecta',lines:['Resuelto sin ningún error.','Precisión total.','Un ejercicio muy bien resuelto.','Hoy la mente ha estado especialmente ágil.','Ejecución impecable.','Bien pensado, de principio a fin.']},
      completed:{icon:'✅',title:'Completado',lines:['Resuelto. Buen trabajo.','Completado con solvencia.','Lo has llevado hasta el final.','Bien concluido.']},
      failed:{icon:'🔁',title:'Conviene reintentarlo',lines:['No del todo, pero cerca.','Vale la pena intentarlo una vez más.','Con un poco más de margen, saldrá.','El planteamiento era correcto, ha faltado un detalle.','Se puede intentar de nuevo con calma.']}
    }[status]||{icon:'✅',title:'Completado',lines:['Partida terminada.']};
    const summary=[result.detail||'',automaticRise?`¡Subes automáticamente al nivel ${autoLevel}!`:''].filter(Boolean).join(' ');
    const actions=U.el('div',{class:'row'}),levelDecision=manualRise?U.el('div',{class:'grid'}):null;
    let overlay;
    const showNavigation=()=>actions.replaceChildren(
      U.el('button',{class:'btn primary',onclick:()=>{overlay.remove();this.finishRecallTurn(()=>this.play(id))}},'Jugar otra vez'),
      U.el('button',{class:'btn',onclick:()=>{overlay.remove();this.finishRecallTurn(()=>this.home())}},'Inicio')
    );
    if(manualRise){
      const currentLevel=state.manualLevel,nextLevel=currentLevel+1;
      const choose=rise=>{
        if(rise){state.manualLevel=nextLevel;this.save()}
        levelDecision.replaceChildren(U.el('p',{class:'muted'},rise?`La próxima partida será de nivel ${nextLevel}.`:`Mantienes el nivel ${currentLevel}.`));
        showNavigation()
      };
      levelDecision.append(
        U.el('p',{},`Has completado otra racha de 3 partidas perfectas. ¿Quieres subir del nivel ${currentLevel} al ${nextLevel}?`),
        U.el('div',{class:'row'},
          U.el('button',{class:'btn primary',onclick:()=>choose(true)},`Subir al nivel ${nextLevel}`),
          U.el('button',{class:'btn',onclick:()=>choose(false)},`Mantener nivel ${currentLevel}`)
        )
      )
    }else showNavigation();

    overlay=U.el('div',{class:'overlay'},U.el('section',{class:'sheet'},
      U.el('div',{class:'result'},copy.icon),
      U.el('h2',{},copy.title),
      U.el('p',{},U.pick(copy.lines)),
      summary?U.el('p',{class:'muted'},summary):null,
      U.el('p',{class:'muted'},`⏱ ${U.fmtTime(seconds)} · 🔥 racha ${state.streak}`),
      levelDecision,
      actions
    ));
    document.body.append(overlay)
  }
});
