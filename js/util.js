const U={
  el(tag,props={},...children){
    const element=document.createElement(tag);
    for(const[key,value]of Object.entries(props)){
      if(value==null)continue;
      if(key==='class')element.className=value;
      else if(key==='dataset')Object.assign(element.dataset,value);
      else if(key.startsWith('on')&&typeof value==='function')element.addEventListener(key.slice(2),value);
      else if(key==='style')element.setAttribute('style',value);
      else if(key in element){
        try{element[key]=value}catch{element.setAttribute(key,value)}
      }else element.setAttribute(key,value)
    }
    for(const child of children.flat(Infinity)){
      if(child!=null)element.append(child.nodeType?child:document.createTextNode(child))
    }
    return element
  },

  rand(min,max){return Math.floor(Math.random()*(max-min+1))+min},
  pick(values){return values[Math.floor(Math.random()*values.length)]},
  shuffle(values){
    const result=values.slice();
    for(let index=result.length-1;index;index--){
      const other=U.rand(0,index);
      [result[index],result[other]]=[result[other],result[index]]
    }
    return result
  },
  sample(values,count){return U.shuffle(values).slice(0,count)},
  range(min,max){return Array.from({length:max-min+1},(_,index)=>min+index)},
  clamp(value,min,max){return Math.max(min,Math.min(max,value))},
  fmtTime(seconds){
    const rounded=Math.round(seconds);
    return`${Math.floor(rounded/60)}:${String(rounded%60).padStart(2,'0')}`
  },

  tone(frequency=600,duration=.12,type='sine',volume=.15){
    try{
      U.ctx??=new(window.AudioContext||window.webkitAudioContext)();
      const oscillator=U.ctx.createOscillator(),gain=U.ctx.createGain();
      oscillator.type=type;
      oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(volume,U.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,U.ctx.currentTime+duration);
      oscillator.connect(gain).connect(U.ctx.destination);
      oscillator.start();
      oscillator.stop(U.ctx.currentTime+duration)
    }catch{}
  },
  good(){U.tone(720,.1);setTimeout(()=>U.tone(980,.14),90)},
  bad(){U.tone(220,.2,'square',.08)}
};
