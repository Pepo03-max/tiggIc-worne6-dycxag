const App={
  games:[],byId:{},state:{},session:0,active:null,timer:null,t0:0,cleanups:[],
  descriptions:{
    memory:'Encuentra todas las parejas dando la vuelta a dos cartas cada vez.',
    simon:'Observa la secuencia de colores y repítela en el mismo orden.',
    posmem:'Memoriza las posiciones de los objetos y tócalas después.',
    math:'Resuelve ocho operaciones mentales usando el teclado.',
    sudoku:'Completa filas, columnas y bloques sin repetir números.',
    kakuro:'Completa cada tramo para que sus números sumen la pista.',
    balance:'Averigua el peso de la figura roja para equilibrar la ecuación.',
    odd:'Toca el elemento que no pertenece al grupo.',
    ordering:'Sigue el procedimiento indicado y selecciona los pasos en el orden correcto. En niveles avanzados habrá opciones incorrectas que no debes seleccionar.',
    sequences:'Descubre la regla y elige el número siguiente.',
    hanoi:'Mueve toda la torre al tercer poste sin poner un disco grande sobre uno pequeño.',
    patterns:'Observa el patrón y elige qué figura continúa la serie.',
    wordsearch:'Encuentra las palabras ocultas deslizando sobre las letras.',
    spotdiff:'Toca las casillas que son distintas entre las dos imágenes.',
    sliding:'Desliza las piezas hasta ordenar los números.',
    maze:'Traza el camino desde la salida verde hasta la meta roja. Puedes levantar el dedo o soltar el ratón y continuar desde el extremo de la línea. Si pasan 5 segundos sin avanzar, el recorrido se borrará y tendrás que empezar de nuevo.'
  },

  register(game){this.games.push(game);this.byId[game.id]=game},
  load(){return MindGymStore.load()},
  save(){return MindGymStore.save(this.state)},
  st(id){return MindGymStore.game(this.state,id)},
  levelFor(state){return state.manualLevel||U.clamp(1+Math.floor(state.bestStreak/3),1,5)},
  level(id){return this.levelFor(this.st(id))},

  onCleanup(cleanup){
    if(this.active?.lifecycle)return this.active.lifecycle.add(cleanup);
    this.cleanups.push(cleanup);
    return cleanup
  },
  after(callback,delay){return this.active?.lifecycle?.timeout(callback,delay)},
  every(callback,delay){return this.active?.lifecycle?.interval(callback,delay)},
  listen(target,type,handler,options){return this.active?.lifecycle?.listen(target,type,handler,options)},

  start(){
    this.state=this.load();
    this.root=document.getElementById('app');
    addEventListener('pointerdown',()=>U.ctx?.resume(),{once:true});
    this.home();
    if(this.state.recallEnabled!==false&&!this.state.recall)this.showRecallWords()
  },

  clear(){
    this.active?.lifecycle?.cleanup();
    for(const cleanup of this.cleanups.splice(0)){try{cleanup()}catch{}}
    this.root.replaceChildren();
    clearInterval(this.timer);
    this.timer=null
  },

  startTimer(chip){
    this.t0=Date.now();
    this.timer=setInterval(()=>chip.textContent='⏱ '+U.fmtTime((Date.now()-this.t0)/1000),500)
  },
  elapsed(){return(Date.now()-this.t0)/1000},
  today(date=new Date()){
    return[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')
  },
  weeklyActivity(){
    const counts=this.state.dailyPlayCounts||{},days=[],today=new Date();
    const mondayOffset=(today.getDay()+6)%7;
    for(let index=0;index<7;index++){
      const day=new Date(today);
      day.setDate(today.getDate()-mondayOffset+index);
      days.push({label:['L','M','X','J','V','S','D'][index],done:(counts[this.today(day)]||0)>=5})
    }
    return days
  },

  home(){
    this.clear();
    this.root.className='home-screen';
    this.active=null;
    if(this.pendingServiceWorkerReload){
      this.pendingServiceWorkerReload=false;
      location.reload();
      return
    }
    const weekly=this.weeklyActivity();
    const todayCount=Math.min(5,(this.state.dailyPlayCounts||{})[this.today()]||0);
    const recallButton=this.state.recallEnabled===false?U.el('button',{class:'btn secondary',onclick:()=>this.showRecallWords()},'🧠 Activar reto de recuerdo'):null;
    const benefits={memory:'Memoria y atención',numbers:'Cálculo y razonamiento',spatial:'Observación y orientación'};
    const week=U.el('div',{class:'week'},...weekly.map(day=>U.el('div',{class:'week-day'},
      U.el('span',{class:day.done?'week-dot done':'week-dot'},day.done?'✓':''),U.el('small',{},day.label)
    )));
    const activitySummary=U.el('div',{class:'activity-summary'},
      U.el('span',{class:'activity-count'},`${weekly.filter(day=>day.done).length}/7`),
      U.el('p',{class:'daily-goal'},todayCount>=5?'✓ Objetivo de hoy completado':`Hoy: ${todayCount} de 5 partidas`)
    );
    this.root.append(
      U.el('header',{class:'home-hero'},
        U.el('img',{class:'brand-mark',src:'icons/icon.svg',alt:'Logotipo de Mente Activa'}),
        U.el('div',{},U.el('h1',{},'Mente Activa'),U.el('p',{class:'sub'},'Un ratito para cuidar tu mente.'))
      ),
      U.el('section',{class:'daily-card'},
        U.el('p',{class:'eyebrow'},'TU PROPUESTA DE HOY'),
        U.el('h2',{},'Un reto para este momento'),
        U.el('p',{},'Elige un juego y empieza cuando quieras.'),
        U.el('button',{class:'btn primary daily-action',onclick:()=>this.play(U.pick(this.games).id)},'🎲 Jugar un reto')
      ),
      U.el('section',{class:'activity-card'},
        U.el('div',{class:'activity-title'},
          U.el('div',{},U.el('strong',{},'Racha semanal'),U.el('small',{},'Completa 5 partidas para que cuente el día.'))
        ),
        week,
        activitySummary
      )
    );
    if(recallButton)this.root.append(recallButton);
    for(const[label,category]of[['Memoria','memory'],['Números y lógica','numbers'],['Visual y espacial','spatial']]){
      const grid=U.el('div',{class:`cards cards-${category}`});
      for(const game of this.games.filter(item=>item.cat===category)){
        const state=this.st(game.id);
        grid.append(U.el('button',{class:'card',onclick:()=>this.play(game.id)},
          U.el('div',{class:'card-top'},
            U.el('span',{class:'card-icon'},game.icon),
            U.el('span',{class:'card-arrow','aria-hidden':'true'},'›')
          ),
          U.el('div',{class:'card-content'},
            U.el('div',{class:'card-title'},
              U.el('div',{class:`card-heading${game.id==='ordering'?' card-heading-badged':''}`},
                U.el('b',{},game.title),
                game.id==='ordering'?U.el('span',{class:'trial-badge'},'En pruebas'):null
              ),
              U.el('small',{class:'card-desc'},benefits[category])
            ),
            U.el('div',{class:'card-meta'},
              U.el('span',{},`Nivel ${this.level(game.id)}`),U.el('span',{},`${state.played} partidas`)
            )
          )
        ))
      }
      this.root.append(U.el('section',{class:`category category-${category}`},U.el('h2',{class:'cat'},label),grid))
    }
    this.root.append(
      U.el('p',{class:'foot'},'El progreso se guarda solo en este dispositivo.'),
      U.el('button',{class:'link danger',onclick:()=>{
        if(confirm('¿Borrar todo el progreso?')){
          MindGymStore.clear();
          this.state=MindGymStore.normalize({});
          this.home();
          this.showRecallWords()
        }
      }},'Borrar progreso')
    )
  },

  play(id,options={}){
    const game=this.byId[id];
    if(!game)return;
    this.clear();
    this.root.className='play-screen';
    const token=++this.session,levelValue=this.level(id);
    const time=U.el('span',{class:'chip'},'⏱ 0:00'),body=U.el('div',{class:'game-body'}),state=this.st(id);
    this.active={id,L:levelValue,token,mistakes:0,over:false,started:false,showPattern:options.showPattern===true};
    this.active.lifecycle=GameLifecycle.create(()=>this.active?.token===token&&!this.active.over);
    const lower=U.el('button',{class:'level-btn',title:'Bajar dificultad',onclick:()=>this.changeLevel(id,-1)},'−');
    const upper=U.el('button',{class:'level-btn',title:'Subir dificultad',onclick:()=>this.changeLevel(id,1)},'+');
    const help=U.el('button',{class:'level-btn',title:'Ver ayuda',onclick:()=>this.showHelp(game,id,token)},'?');
    const levelChip=U.el('span',{class:'chip'},'Nivel '+levelValue);
    const difficulty=U.el('div',{class:'game-difficulty','aria-label':'Dificultad'},lower,levelChip,upper);
    const gameNav=U.el('div',{class:'game-nav','aria-label':'Navegación del juego'},
      U.el('button',{class:'link game-back',onclick:()=>this.home()},'‹ Volver'),
      U.el('strong',{},game.icon+' '+game.title)
    );
    const gameStatus=U.el('div',{class:'game-status','aria-label':'Tiempo de la partida'},time);
    const gameControls=U.el('div',{class:'game-controls','aria-label':'Nivel y controles del juego'},help,difficulty);
    const gameHead=U.el('header',{class:'game-head'},gameNav,gameStatus,gameControls);
    const gameAsideCopy=U.el('div',{class:'game-aside-copy'},
      U.el('p',{class:'eyebrow'},'ESTÁS ENTRENANDO'),
      U.el('h1',{},game.title),
      U.el('p',{class:'game-description'},this.descriptions[id]||'Completa el reto siguiendo las indicaciones.'),
      U.el('div',{class:'game-progress'},
        U.el('p',{class:'eyebrow'},'PROGRESO'),
        U.el('strong',{},`${state.played} partidas`),
        U.el('small',{},`Racha actual: ${state.streak}`)
      )
    );
    this.root.append(
      U.el('div',{class:`game-layout game-layout-${game.layout||'compact'}`},
        gameHead,
        U.el('section',{class:`game-main game-main-${game.layout||'compact'}`},body),
        U.el('aside',{class:'game-aside'},gameAsideCopy)
      )
    );
    const begin=()=>this.begin(game,body,levelValue,token,time);
    if(state.helpSeen)begin();
    else this.showHelp(game,id,token,begin,true)
  },

  begin(game,body,levelValue,token,time){
    if(token!==this.active?.token||this.active.started)return;
    this.active.started=true;
    this.startTimer(time);
    game.run(body,levelValue,token)
  },

  showHelp(game,id,token,onStart=null,first=false){
    const close=()=>{
      modal.remove();
      if(first&&token===this.active?.token){
        const state=this.st(id);
        state.helpSeen=true;
        this.save();
        onStart?.()
      }
    };
    const testingNote=id==='ordering'?U.el('p',{class:'testing-note'},'🧪 Este juego todavía está en pruebas. Si ves un error o no estás de acuerdo con algún orden, apúntalo para poder corregirlo en una futura mejora.'):null;
    const patternOption=['sequences','patterns'].includes(id)?U.el('label',{class:'help-toggle'},
      U.el('input',{type:'checkbox',checked:this.active?.showPattern===true,onchange:event=>{
        if(token!==this.active?.token)return;
        this.active.showPattern=event.currentTarget.checked;
        if(token===this.active?.token)this.active.updatePatternVisibility?.()
      }}),
      U.el('span',{},'Mostrar la regla de la ronda')
    ):null;
    const modal=U.el('div',{class:'overlay'},U.el('section',{class:'sheet'},
      U.el('div',{class:'result'},game.icon),U.el('h2',{},game.title),
      U.el('p',{},this.descriptions[id]||'Completa el reto siguiendo las indicaciones.'),
      patternOption,
      testingNote,
      U.el('button',{class:'btn primary',onclick:close},first?'Entendido, empezar':'Cerrar ayuda')
    ));
    document.body.append(modal)
  },

  changeLevel(id,delta){
    const showPattern=this.active?.id===id&&this.active.showPattern===true;
    const state=this.st(id);
    state.manualLevel=U.clamp(this.levelFor(state)+delta,1,5);
    this.save();
    this.play(id,{showPattern})
  },
  mistake(){if(this.active&&!this.active.over)this.active.mistakes++}
};
