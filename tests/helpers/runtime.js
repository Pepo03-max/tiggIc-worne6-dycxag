const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const projectRoot=path.resolve(__dirname,'../..');

function seededRandom(seed=123456789){
  let value=seed>>>0;
  return()=>{
    value=(value*1664525+1013904223)>>>0;
    return value/0x100000000
  }
}

function createU(seed=123456789){
  const random=seededRandom(seed);
  const U={
    rand(a,b){return Math.floor(random()*(b-a+1))+a},
    pick(values){return values[Math.floor(random()*values.length)]},
    shuffle(values){
      const result=values.slice();
      for(let i=result.length-1;i;i--){
        const j=U.rand(0,i);
        [result[i],result[j]]=[result[j],result[i]]
      }
      return result
    },
    sample(values,count){return U.shuffle(values).slice(0,count)},
    range(a,b){return Array.from({length:b-a+1},(_,index)=>a+index)},
    clamp(value,min,max){return Math.max(min,Math.min(max,value))},
    fmtTime(){return'0:01'}
  };
  return U
}

function loadClassic(relativePath,{context={},expose=[]}={}){
  return loadClassicFiles([relativePath],{context,expose})
}

function loadClassicFiles(relativePaths,{context={},expose=[]}={}){
  const sandbox={console,...context};
  vm.createContext(sandbox);
  const exports=expose.length?`\n;globalThis.__exposed={${expose.join(',')}};`:'';
  const source=relativePaths.map(relativePath=>fs.readFileSync(path.join(projectRoot,relativePath),'utf8')).join('\n;');
  vm.runInContext(source+exports,sandbox,{filename:relativePaths.join(', ')});
  return{context:sandbox,exposed:sandbox.__exposed}
}

function fakeElement(tag,props={},...children){
  return{
    tag,props,children,
    append(...nodes){this.children.push(...nodes)},
    replaceChildren(...nodes){this.children=nodes},
    remove(){this.removed=true}
  }
}

function elementText(element){
  if(element==null)return'';
  if(typeof element==='string'||typeof element==='number')return String(element);
  return(element.children||[]).map(elementText).join(' ')
}

function findElement(element,predicate){
  if(!element||typeof element==='string'||typeof element==='number')return null;
  if(predicate(element))return element;
  for(const child of element.children||[]){
    const found=findElement(child,predicate);
    if(found)return found
  }
  return null
}

module.exports={createU,elementText,fakeElement,findElement,loadClassic,loadClassicFiles,projectRoot};
