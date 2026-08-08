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
