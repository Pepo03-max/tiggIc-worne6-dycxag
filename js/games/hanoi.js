App.descriptions.hanoi='Mueve toda la torre desde el poste inicial hasta el poste marcado como META, sin poner un disco grande sobre uno pequeño.';

function generateHanoi(level,state){
  const disks=[2,3,4,5,6][level-1],key=String(level);
  state.routeBags??={};
  state.lastRoutes??={};
  const routes=U.range(0,2).flatMap(from=>U.range(0,2).filter(to=>to!==from).map(to=>`${from}-${to}`));
  let bag=state.routeBags[key];
  if(!Array.isArray(bag)||!bag.length){
    bag=U.shuffle(routes);
    if(bag[0]===state.lastRoutes[key]){
      const swap=U.rand(1,bag.length-1);
      [bag[0],bag[swap]]=[bag[swap],bag[0]]
    }
    state.routeBags[key]=bag
  }
  const route=bag.shift(),[start,goal]=route.split('-').map(Number);
  state.lastRoutes[key]=route;
  return{disks,minMoves:2**disks-1,start,goal,route}
}

App.register({
  id:'hanoi',cat:'spatial',icon:'🗼',title:'Torres de Hanói',layout:'board',
  run(root,L,t){
    const gameState=App.st('hanoi');
    const{disks:N,minMoves:min,start,goal}=generateHanoi(L,gameState);
    App.save();
    // Cada poste se guarda de abajo arriba: el último elemento es el disco superior.
    const rods=[[],[],[]];
    rods[start]=U.range(1,N).reverse();
    const colors=['','#22c55e','#facc15','#3b82f6','#f97316','#a855f7','#ef4444'];
    const textColors=['','#073b18','#4a3500','#fff','#4a1d00','#fff','#fff'];
    const view=U.el('div',{class:'hanoi'});
    const note=U.el('p',{class:'center'},`Mueve ${N} discos del poste ${start+1} al poste ${goal+1}. Mínimo: ${min} movimientos.`);
    let selected=null,moves=0;

    root.append(note,view);

    function top(i){return rods[i].at(-1)}
    function canMove(from,to){
      const disk=top(from),destination=top(to);
      return disk!==undefined&&(destination===undefined||disk<destination)
    }
    function draw(){
      view.replaceChildren(...rods.map((rod,i)=>{
        const post=U.el('button',{
          class:'rod '+(selected===i?'selected ':'')+(goal===i?'goal':''),
          'aria-label':`Poste ${i+1}${rod.length?`, disco superior ${top(i)}`:', vacío'}`,
          onclick:()=>tap(i)
        });
        post.append(U.el('span',{class:'rod-label'},`Poste ${i+1}${goal===i?' · META':''}`));
        const stack=U.el('span',{class:'disks'});
        // Se dibuja de arriba abajo para que el disco mayor quede siempre en la base.
        rod.slice().reverse().forEach(d=>stack.append(U.el('span',{
          class:'disk'+(selected===i&&d===top(i)?' picked':''),
          style:`width:${38+d*12}px;--disk-color:${colors[d]};--disk-text:${textColors[d]}`,
          'data-disk':d
        },d)));
        post.append(stack);
        return post
      }))
    }
    function tap(i){
      if(selected===null){
        if(!rods[i].length){
          note.textContent='Ese poste está vacío. Elige un poste con discos.';
          return
        }
        selected=i;
        note.textContent=`Disco ${top(i)} seleccionado. Elige el poste de destino.`;
        draw();
        return
      }
      if(selected===i){
        selected=null;
        note.textContent=`Selección cancelada · ${moves} movimientos.`;
        draw();
        return
      }
      if(!canMove(selected,i)){
        App.mistake();
        note.textContent='❌ Movimiento no permitido: un disco grande no puede ir sobre uno pequeño.';
        draw();
        return
      }
      const disk=rods[selected].pop();
      rods[i].push(disk);
      moves++;
      selected=null;
      note.textContent=`Disco ${disk} movido · ${moves} movimientos · mínimo ${min}.`;
      draw();
      if(rods[goal].length===N&&rods[goal].every((d,index)=>d===N-index)){
        App.finish('hanoi',{
          perfect:moves===min,
          score:Math.max(20,min*15-(moves-min)*3),
          detail:`Torre resuelta en ${moves} movimientos.`
        },t)
      }
    }
    draw()
  }
});
