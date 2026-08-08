function generateWordSearch(level){
  const size=[8,9,10,11,12][level-1],directions=[[0,1],[1,0],[1,1],[-1,1]];
  const chosen=U.sample(DATA.words.filter(word=>word[0].length<=size),[4,5,6,7,8][level-1]);
  const grid=Array.from({length:size},()=>Array(size).fill('')),placed=[];
  for(const[word]of chosen){
    let completed=false;
    for(let attempt=0;attempt<300&&!completed;attempt++){
      const[deltaRow,deltaCol]=U.pick(directions),row=U.rand(0,size-1),col=U.rand(0,size-1),cells=[];
      for(let index=0;index<word.length;index++){
        const nextRow=row+deltaRow*index,nextCol=col+deltaCol*index;
        if(nextRow<0||nextCol<0||nextRow>=size||nextCol>=size||grid[nextRow][nextCol]&&grid[nextRow][nextCol]!==word[index])break;
        cells.push([nextRow,nextCol])
      }
      if(cells.length===word.length){
        cells.forEach(([cellRow,cellCol],index)=>grid[cellRow][cellCol]=word[index]);
        placed.push({word,cells});
        completed=true
      }
    }
  }
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){
    if(!grid[row][col])grid[row][col]='ABCDEFGHIJKLMNOPQRSTUVWXYZ'[U.rand(0,25)]
  }
  return{size,grid,placed}
}

App.register({
  id:'wordsearch',cat:'spatial',icon:'🔤',title:'Sopa de letras',
  run(root,L,t){
    const{size:N,grid,placed}=generateWordSearch(L);
    const g=U.el('div',{class:'wordgrid',style:`grid-template-columns:repeat(${N},1fr);width:min(100%,520px)`}),wordList=U.el('div',{class:'word-list','aria-label':'Palabras por encontrar'},...placed.map(item=>{item.el=U.el('span',{class:'word-item'},item.word);return item.el}));
    root.append(wordList,g);
    const els=[];
    grid.forEach((row,r)=>row.forEach((v,c)=>{
      const e=U.el('button',{dataset:{r,c}},v);
      els.push(e);
      g.append(e);
    }));
    let start=null;
    const point=e=>{const x=document.elementFromPoint(e.clientX,e.clientY);return x?.dataset?.r!=null?[+x.dataset.r,+x.dataset.c]:null};
    function line(a,b){
      const dr=Math.sign(b[0]-a[0]),dc=Math.sign(b[1]-a[1]),len=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
      if(a[0]!==b[0]&&a[1]!==b[1]&&Math.abs(b[0]-a[0])!==Math.abs(b[1]-a[1]))return[a];
      return U.range(0,len).map(i=>[a[0]+dr*i,a[1]+dc*i]);
    }
    function paint(a){els.forEach(x=>x.classList.remove('selected'));a.forEach(([r,c])=>els[r*N+c].classList.add('selected'))}
    g.addEventListener('pointerdown',e=>{start=point(e);if(start)paint([start])});
    g.addEventListener('pointermove',e=>{if(start){const p=point(e);if(p)paint(line(start,p))}});
    const onPointerUp=e=>{
      if(t!==App.active?.token){start=null;return}
      if(!start)return;
      const end=point(e),cells=end?line(start,end):[start],str=cells.map(([r,c])=>grid[r][c]).join(''),hit=placed.find(item=>!item.done&&(item.word===str||item.word===str.split('').reverse().join('')));
      if(hit){
        hit.done=true;
        cells.forEach(([r,c])=>els[r*N+c].classList.add('found'));
        hit.el.classList.add('done');
        if(placed.every(x=>x.done))App.finish('wordsearch',{perfect:true,score:placed.length*25,detail:`Has encontrado ${placed.length} palabras.`},t);
      }
      start=null;
      paint([]);
    };
    App.listen(window,'pointerup',onPointerUp);
  }
});
