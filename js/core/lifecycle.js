const GameLifecycle={
  create(isCurrent){
    const timers=new Set(),intervals=new Set(),cleanups=new Set();
    let closed=false;
    return{
      add(cleanup){
        if(typeof cleanup!=='function')return cleanup;
        if(closed){try{cleanup()}catch{}}
        else cleanups.add(cleanup);
        return cleanup
      },
      timeout(callback,delay){
        if(closed)return null;
        const id=setTimeout(()=>{
          timers.delete(id);
          if(!closed&&isCurrent())callback()
        },delay);
        timers.add(id);
        return id
      },
      interval(callback,delay){
        if(closed)return null;
        const id=setInterval(()=>{
          if(!closed&&isCurrent())callback()
        },delay);
        intervals.add(id);
        return id
      },
      listen(target,type,handler,options){
        if(closed)return null;
        target.addEventListener(type,handler,options);
        const cleanup=()=>target.removeEventListener(type,handler,options);
        cleanups.add(cleanup);
        return cleanup
      },
      cleanup(){
        if(closed)return;
        closed=true;
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        timers.clear();
        intervals.clear();
        for(const cleanup of cleanups){try{cleanup()}catch{}}
        cleanups.clear()
      }
    }
  }
};
