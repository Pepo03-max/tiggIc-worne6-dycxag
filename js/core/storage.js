const MindGymStore={
  key:'mindgym.v2',
  currentVersion:3,
  gameDefaults:{
    played:0,streak:0,bestStreak:0,bestScore:0,bestTime:0,totalScore:0,
    manualLevel:0,helpSeen:false
  },

  isRecord(value){return!!value&&typeof value==='object'&&!Array.isArray(value)},
  int(value,fallback=0,min=0,max=Number.MAX_SAFE_INTEGER){
    const number=Number(value);
    return Number.isFinite(number)?Math.max(min,Math.min(max,Math.floor(number))):fallback
  },

  migrate(raw){
    const state=this.isRecord(raw)?{...raw}:{};
    let version=this.int(state.schemaVersion,1,1,this.currentVersion);
    while(version<this.currentVersion){
      if(version===1){
        if(state.recallEnabled!=null)state.recallEnabled=state.recallEnabled!==false;
        version=2
      }else if(version===2){
        state.dailyPlayCounts=this.isRecord(state.dailyPlayCounts)?state.dailyPlayCounts:{};
        version=3
      }
    }
    state.schemaVersion=this.currentVersion;
    return state
  },

  normalizeGame(value){
    const game=this.isRecord(value)?{...value}:{};
    for(const[key,defaultValue]of Object.entries(this.gameDefaults)){
      if(key==='helpSeen')game[key]=game[key]===true;
      else if(key==='manualLevel')game[key]=this.int(game[key],defaultValue,0,5);
      else game[key]=this.int(game[key],defaultValue)
    }
    return game
  },

  normalize(raw){
    const state=this.migrate(raw),reserved=new Set([
      'schemaVersion','dailyPlayCounts','recall','recallEnabled','recallLastCount'
    ]);
    for(const key of Object.keys(state)){
      if(!reserved.has(key)&&this.isRecord(state[key]))state[key]=this.normalizeGame(state[key])
    }

    const daily={};
    if(this.isRecord(state.dailyPlayCounts)){
      for(const[date,count]of Object.entries(state.dailyPlayCounts)){
        if(/^\d{4}-\d{2}-\d{2}$/.test(date))daily[date]=this.int(count)
      }
    }
    state.dailyPlayCounts=daily;

    if(this.isRecord(state.recall)&&Array.isArray(state.recall.words)){
      const words=state.recall.words.filter(word=>typeof word==='string'&&word.trim()).slice(0,20);
      if(words.length){
        const count=Math.min(words.length,this.int(state.recall.count,words.length,1,20));
        state.recall={
          count,words:words.slice(0,count),
          games:this.int(state.recall.games),
          checks:this.int(state.recall.checks)
        }
      }else delete state.recall
    }else delete state.recall;
    if(state.recallEnabled!=null)state.recallEnabled=state.recallEnabled!==false;
    state.recallLastCount=this.int(state.recallLastCount,5,1,20);
    return state
  },

  load(){
    try{
      const stored=JSON.parse(localStorage.getItem(this.key));
      return this.normalize(stored)
    }catch{
      return this.normalize({})
    }
  },

  save(state){
    try{
      state.schemaVersion=this.currentVersion;
      localStorage.setItem(this.key,JSON.stringify(state));
      return true
    }catch{
      return false
    }
  },

  game(state,id){
    const normalized=this.normalizeGame(state[id]);
    state[id]=normalized;
    return normalized
  },

  clear(){
    try{localStorage.removeItem(this.key)}catch{}
  }
};
