Object.assign(App,{
  recall(){return this.state.recall},

  newRecallWords(count,previous=[]){
    const fresh=DATA.recallWords.filter(word=>!previous.includes(word));
    return U.sample(fresh.length>=count?fresh:DATA.recallWords,count)
  },

  showRecallWords(after=()=>this.home()){
    let count=this.recall()?.count||this.state.recallLastCount||5,words=[];
    const countText=U.el('strong',{},count),list=U.el('div',{class:'recall-words'});
    const render=()=>{
      words=this.newRecallWords(count,this.recall()?.words||[]);
      countText.textContent=count;
      list.replaceChildren(...words.map(word=>U.el('span',{},word)))
    };
    const start=()=>{
      this.state.recallLastCount=count;
      this.state.recallEnabled=true;
      this.state.recall={count,words,games:0,checks:0};
      this.save();
      modal.remove();
      after()
    };
    const skip=()=>{
      this.state.recallEnabled=false;
      delete this.state.recall;
      this.save();
      modal.remove();
      this.home()
    };
    const modal=U.el('div',{class:'overlay'},U.el('section',{class:'sheet'},
      U.el('div',{class:'result'},'🧠'),
      U.el('h2',{},'Reto de recuerdo'),
      U.el('p',{},'Elige cuántas palabras quieres recordar. Te las preguntaremos después de cada dos partidas.'),
      U.el('div',{class:'count-picker'},
        U.el('button',{class:'level-btn',onclick:()=>{count=U.clamp(count-1,1,20);render()}},'−'),
        countText,
        U.el('button',{class:'level-btn',onclick:()=>{count=U.clamp(count+1,1,20);render()}},'+')
      ),
      U.el('p',{class:'muted small'},'Memoriza estas palabras antes de empezar:'),
      list,
      U.el('div',{class:'grid'},
        U.el('button',{class:'btn primary',onclick:start},'Las he memorizado'),
        U.el('button',{class:'link',onclick:skip},'Ahora no, jugar sin reto')
      )
    ));
    render();
    document.body.append(modal)
  },

  finishRecallTurn(after){
    const recall=this.recall();
    if(!recall)return after();
    recall.games++;
    if(recall.games%2!==0){this.save();return after()}
    this.save();
    this.showRecallPrompt(after)
  },

  normalizeRecall(text){
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim()
  },

  showRecallPrompt(after){
    const recall=this.recall();
    const input=U.el('textarea',{
      class:'recall-input',placeholder:'Escribe una palabra por línea o sepáralas con comas',
      rows:6,autocapitalize:'characters',spellcheck:false
    });
    const submit=()=>{
      const written=[...new Set(input.value.split(/[\n,;]+/).map(word=>this.normalizeRecall(word)).filter(Boolean))];
      const expected=recall.words.map(word=>this.normalizeRecall(word));
      const right=expected.filter(word=>written.includes(word));
      const wrong=written.filter(word=>!expected.includes(word));
      const missed=expected.filter(word=>!written.includes(word));
      recall.checks++;
      const renew=recall.checks>=2;
      const continueAfter=()=>{
        modal.remove();
        if(renew)this.showRecallWords(after);
        else after()
      };
      this.save();
      result.replaceChildren(
        U.el('div',{class:'result'},right.length===expected.length?'🎉':'📝'),
        U.el('h2',{},`Has recordado ${right.length} de ${expected.length}`),
        U.el('p',{class:'muted'},'Comprobación de las palabras que has escrito:'),
        U.el('div',{class:'recall-result'},
          ...right.map(word=>U.el('span',{class:'ok'},word)),
          ...wrong.map(word=>U.el('span',{class:'no'},word)),
          ...missed.map(word=>U.el('span',{class:'missed'},word))
        ),
        U.el('p',{class:'small muted'},renew?'Ahora tendrás una lista nueva para las dos próximas partidas.':'Volveremos a preguntarte estas mismas palabras tras dos partidas más.'),
        U.el('button',{class:'btn primary',onclick:continueAfter},renew?'Ver nuevas palabras':'Continuar')
      )
    };
    const result=U.el('section',{class:'sheet'},
      U.el('div',{class:'result'},'✍️'),
      U.el('h2',{},'¿Qué palabras recuerdas?'),
      U.el('p',{},'Escribe todas las que recuerdes, sin mirar la lista.'),
      input,
      U.el('button',{class:'btn primary',onclick:submit},'Comprobar')
    );
    const modal=U.el('div',{class:'overlay'},result);
    document.body.append(modal);
    setTimeout(()=>input.focus(),0)
  }
});
