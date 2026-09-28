const test=require('node:test');
const assert=require('node:assert/strict');
const{createU,loadClassicFiles}=require('./helpers/runtime');

function generator(file,expose,seed=1234){
  const App={descriptions:{},register(){}};
  return loadClassicFiles(['js/data.js',`js/games/${file}`],{
    context:{U:createU(seed),App},expose
  }).exposed
}

test('los generadores de memoria crean tableros completos sin duplicados indebidos',()=>{
  const memory=generator('memory-match.js',['generateMemoryMatch'],11);
  const positional=generator('positional-memory.js',['generatePositionalMemory'],12);
  for(let level=1;level<=5;level++){
    const match=memory.generateMemoryMatch(level),counts=new Map();
    match.deck.forEach(value=>counts.set(value,(counts.get(value)||0)+1));
    assert.equal(match.deck.length,match.cols*match.rows);
    assert.ok([...counts.values()].every(count=>count===2));
    const positions=positional.generatePositionalMemory(level);
    assert.equal(new Set(positions.spots).size,positions.count);
    assert.equal(positions.symbols.length,positions.count)
  }
});

test('cálculo mental y balanzas siempre ofrecen respuestas utilizables',()=>{
  const math=generator('mental-math.js',['generateMentalMathQuestion'],21);
  const balance=generator('balance.js',['generateBalanceQuestion','generateBalanceChoices'],22);
  for(let level=1;level<=5;level++)for(let attempt=0;attempt<100;attempt++){
    const question=math.generateMentalMathQuestion(level);
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0);
    assert.ok(question.text.length>0);
    assert.ok(!question.text.includes('÷'));
    const scale=balance.generateBalanceQuestion(level),choices=balance.generateBalanceChoices(scale.answer);
    assert.equal(choices.length,4);
    assert.equal(new Set(choices).size,4);
    assert.ok(choices.includes(scale.answer));
    assert.ok(choices.every(value=>value>0))
  }
});

test('Kakuro genera sumas correctas sin repetir dígitos en sus tramos',()=>{
  const{generateKakuro}=generator('kakuro.js',['generateKakuro'],31);
  for(let level=1;level<=5;level++)for(let attempt=0;attempt<40;attempt++){
    const game=generateKakuro(level);
    game.solution.forEach((row,index)=>{
      assert.equal(new Set(row).size,row.length);
      assert.equal(row.reduce((sum,value)=>sum+value,0),game.rowClues[index])
    });
    for(let col=0;col<game.cols;col++){
      const values=game.solution.map(row=>row[col]);
      assert.equal(new Set(values).size,values.length);
      assert.equal(values.reduce((sum,value)=>sum+value,0),game.colClues[col])
    }
  }
});

test('Kakuro valida estados incompletos, errores y soluciones alternativas',()=>{
  const{canCompleteKakuroRun,validateKakuro}=generator('kakuro.js',['canCompleteKakuroRun','validateKakuro'],32);
  assert.equal(canCompleteKakuroRun([3,0],3),false);
  assert.equal(canCompleteKakuroRun([1,0],3),true);
  assert.equal(canCompleteKakuroRun([8,0],17),true);
  assert.equal(canCompleteKakuroRun([4,4,0],12),false);
  assert.equal(canCompleteKakuroRun([8,0],3),false);
  assert.equal(canCompleteKakuroRun([1,0,0],4),false);
  const rowClues=[3,7],colClues=[4,6];
  const impossiblePartial=validateKakuro([[3,0],[2,1]],[3,3],[5,2]);
  assert.equal(impossiblePartial.statuses[0][0],'invalid');
  assert.equal(impossiblePartial.statuses[0][1],'empty');
  const incomplete=validateKakuro([[1,0],[3,0]],rowClues,colClues);
  assert.equal(incomplete.complete,false);
  assert.equal(incomplete.hasErrors,false);
  assert.deepEqual(incomplete.statuses,[['valid','empty'],['valid','empty']]);

  const repeated=validateKakuro([[1,1],[3,4]],rowClues,colClues);
  assert.equal(repeated.complete,true);
  assert.equal(repeated.completeValid,false);
  assert.equal(repeated.statuses[0][0],'invalid');
  assert.equal(repeated.statuses[0][1],'invalid');
  assert.equal(repeated.statuses[1][1],'invalid');

  const exceeded=validateKakuro([[2,2],[3,4]],rowClues,colClues);
  assert.equal(exceeded.hasErrors,true);
  assert.equal(exceeded.statuses[0][0],'invalid');
  assert.equal(exceeded.statuses[0][1],'invalid');

  const alternative=validateKakuro([[4,1],[1,4]],[5,5],[5,5]);
  assert.equal(alternative.completeValid,true);
  assert.deepEqual(alternative.statuses,[['valid','valid'],['valid','valid']]);
});

test('los puzles deslizantes parten de una permutación válida y resoluble',()=>{
  const{generateSlidingPuzzle}=generator('sliding.js',['generateSlidingPuzzle'],41);
  for(let level=1;level<=5;level++)for(let attempt=0;attempt<30;attempt++){
    const game=generateSlidingPuzzle(level);
    assert.equal(game.board.length,game.total);
    assert.deepEqual([...game.board].sort((a,b)=>a-b),Array.from({length:game.total},(_,index)=>index));
    assert.equal(game.board[game.blank],0)
  }
});

test('laberintos, sopas y diferencias conservan sus invariantes espaciales',()=>{
  const maze=generator('maze.js',['generateMaze'],51);
  const words=generator('word-search.js',['generateWordSearch'],52);
  const spots=generator('spot-difference.js',['generateSpotDifference'],53);
  for(let level=1;level<=5;level++){
    for(let attempt=0;attempt<20;attempt++){
      const labyrinth=maze.generateMaze(level),queue=[labyrinth.start],seen=new Set([labyrinth.start.join(',')]);
      while(queue.length){
        const[row,col]=queue.shift();
        for(const[dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]]){
          const next=[row+dr,col+dc],key=next.join(',');
          if(next[0]>=0&&next[1]>=0&&next[0]<labyrinth.size&&next[1]<labyrinth.size&&!labyrinth.matrix[next[0]][next[1]]&&!seen.has(key)){
            seen.add(key);queue.push(next)
          }
        }
      }
      assert.ok(seen.has(labyrinth.end.join(',')));

      const search=words.generateWordSearch(level);
      assert.ok(search.placed.length>0);
      search.placed.forEach(item=>assert.equal(item.cells.map(([row,col])=>search.grid[row][col]).join(''),item.word));

      const difference=spots.generateSpotDifference(level);
      const actual=Array.from(difference.left).flatMap((value,index)=>value===difference.right[index]?[]:[index]);
      assert.deepEqual(actual,Array.from(difference.differentIndexes).sort((a,b)=>a-b));
      assert.equal(actual.length,difference.differences)
    }
  }
});

test('series y patrones producen respuestas y opciones únicas',()=>{
  const sequences=generator('sequences.js',['generateSequence','generateSequenceChoices'],61);
  const patterns=generator('patterns.js',['generatePattern','generatePatternChoices','patternTokenKey'],62);
  for(let level=1;level<=5;level++){
    const sequenceState={testHistory:{},lastFamilies:{}},patternState={familyBags:{},lastFamilies:{},testHistory:{}};
    const signatures=new Set();
    for(let attempt=0;attempt<60;attempt++){
      const sequence=sequences.generateSequence(level,sequenceState),choices=sequences.generateSequenceChoices(sequence.answer);
      assert.ok(Number.isFinite(sequence.answer));
      assert.ok(choices.includes(sequence.answer));
      assert.equal(new Set(choices).size,4);
      assert.ok(!signatures.has(sequence.signature));
      signatures.add(sequence.signature);

      const pattern=patterns.generatePattern(level,patternState),patternChoices=patterns.generatePatternChoices(pattern.answer,pattern.focus);
      assert.equal(patternChoices.length,4);
      assert.equal(new Set(patternChoices.map(patterns.patternTokenKey)).size,4);
      assert.ok(patternChoices.some(choice=>patterns.patternTokenKey(choice)===patterns.patternTokenKey(pattern.answer)))
    }
  }
});

test('los colores de patrones mantienen distancia visual suficiente',()=>{
  const patterns=generator('patterns.js',[
    'generatePattern','generatePatternChoices','patternTokenKey','selectPatternColors','patternColorDistance','PATTERN_MIN_COLOR_DISTANCE'
  ],63);
  for(let attempt=0;attempt<80;attempt++){
    const colors=patterns.selectPatternColors(4);
    assert.equal(new Set(colors).size,4);
    for(let first=0;first<colors.length;first++)for(let second=first+1;second<colors.length;second++){
      assert.ok(patterns.patternColorDistance(colors[first],colors[second])>=patterns.PATTERN_MIN_COLOR_DISTANCE)
    }
    const state={familyBags:{},lastFamilies:{},testHistory:{}},pattern=patterns.generatePattern((attempt%5)+1,state);
    const used=[...new Set([...pattern.shown,pattern.answer].map(token=>token.color))];
    for(let first=0;first<used.length;first++)for(let second=first+1;second<used.length;second++){
      assert.ok(patterns.patternColorDistance(used[first],used[second])>=patterns.PATTERN_MIN_COLOR_DISTANCE)
    }
    const choices=patterns.generatePatternChoices(pattern.answer,pattern.focus);
    const visibleColors=[...new Set([...pattern.shown,...choices].map(token=>token.color))];
    for(let first=0;first<visibleColors.length;first++)for(let second=first+1;second<visibleColors.length;second++){
      assert.ok(patterns.patternColorDistance(visibleColors[first],visibleColors[second])>=patterns.PATTERN_MIN_COLOR_DISTANCE)
    }
  }
});

test('la paleta de patrones conserva separación con deficiencias de visión cromática simuladas',()=>{
  const{selectPatternColors}=generator('patterns.js',['selectPatternColors'],64);
  const colors=selectPatternColors();
  const matrices=[
    [[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
    [[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.01182,.04294,.968881]],
    [[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.3039]]
  ];
  const linear=color=>[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)/255)
    .map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  const luminance=color=>linear(color).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
  for(const color of colors){
    assert.ok((luminance('#fffdfa')+.05)/(luminance(color)+.05)>=3,`${color} tiene poco contraste con el fondo`)
  }
  const oklab=rgb=>{
    const l=Math.cbrt(.4122214708*rgb[0]+.5363325363*rgb[1]+.0514459929*rgb[2]);
    const m=Math.cbrt(.2119034982*rgb[0]+.6806995451*rgb[1]+.1073969566*rgb[2]);
    const s=Math.cbrt(.0883024619*rgb[0]+.2817188376*rgb[1]+.6299787005*rgb[2]);
    return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]
  };
  const simulated=(color,matrix)=>{
    const rgb=linear(color);
    return oklab(matrix.map(row=>row.reduce((sum,value,index)=>sum+value*rgb[index],0)))
  };
  for(let first=0;first<colors.length;first++)for(let second=first+1;second<colors.length;second++){
    for(const matrix of matrices){
      const a=simulated(colors[first],matrix),b=simulated(colors[second],matrix);
      assert.ok(Math.hypot(...a.map((value,index)=>value-b[index]))>=.1,`${colors[first]} y ${colors[second]} se parecen demasiado`)
    }
  }
});

test('ordenación, elemento diferente y Hanói evitan repeticiones inmediatas',()=>{
  const ordering=generator('ordering.js',['generateOrderingRound'],71);
  const odd=generator('odd-one-out.js',['generateOddOneOut'],72);
  const hanoi=generator('hanoi.js',['generateHanoi'],73);
  for(let level=1;level<=5;level++){
    const orderingState={processBags:{},lastProcess:{}},oddState={categoryBags:{},lastCategories:{},testHistory:{}},hanoiState={routeBags:{},lastRoutes:{}};
    const oddSignatures=new Set();
    for(let attempt=0;attempt<30;attempt++){
      const ordered=ordering.generateOrderingRound(level,orderingState);
      assert.ok(ordered.correct.every(step=>ordered.shown.includes(step)));
      assert.equal(ordered.shown.length,ordered.needed+ordered.incorrectAmount);

      const different=odd.generateOddOneOut(level,oddState);
      assert.equal(different.items.filter(item=>item===different.out).length,1);
      assert.ok(!oddSignatures.has(different.signature));
      oddSignatures.add(different.signature);

      const tower=hanoi.generateHanoi(level,hanoiState);
      assert.notEqual(tower.start,tower.goal);
      assert.equal(tower.minMoves,2**tower.disks-1)
    }
  }
});
