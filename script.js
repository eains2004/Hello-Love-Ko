/* Beginner-friendly game logic. Progress lasts until the page is reloaded. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const SAVE_KEY = 'baby-surprise-progress-v1';
const defaults = {puzzle:false,box:false,letters:[],dice:false,video:false,quiz:false,envelope:false,letterDone:false,neon:false};
try{[SAVE_KEY,`${SAVE_KEY}-puzzle-revision`,`${SAVE_KEY}-garden`,`${SAVE_KEY}-box`].forEach(key=>localStorage.removeItem(key));}catch{/* Storage is optional; game progress is memory-only. */}
let progress = {...defaults};
function save(){ /* Progress intentionally remains in memory and resets on reload. */ }
const stageIds = ['welcome','puzzle','tease1','boxes','tease2','flowers','dice','video','quiz','envelope','neon'];
const navRequirements = {welcome:()=>true,puzzle:()=>true,boxes:()=>progress.puzzle,flowers:()=>progress.box,dice:()=>progress.letters.length===6,video:()=>progress.dice,quiz:()=>progress.video,letter:()=>progress.quiz,neon:()=>progress.neon};
let currentStage='welcome';
let navRevealed=false;
function showStage(id,addHistory=true){
  if(!stageIds.includes(id)) return;
  const requirements={tease1:progress.puzzle,boxes:progress.puzzle,tease2:progress.box,flowers:progress.box,dice:progress.letters.length===6,video:progress.dice,quiz:progress.video,envelope:progress.quiz,neon:progress.neon};
  if(Object.hasOwn(requirements,id)&&!requirements[id]){toast('Keep playing to unlock that page 💗');return;}
  if(id==='quiz'&&!progress.video){toast('Finish the video to unlock the quiz 💗');return;}
  if(id==='envelope'&&!progress.quiz){toast('Answer the final question first 💌');return;}
  if(id==='neon'&&!progress.neon){toast('Finish your letter to unlock the reveal 💍');return;}
  if(addHistory&&id!==currentStage){try{history.pushState({romanticStage:id},'',`#${id}`);}catch{/* Keep stage navigation working when opened from a restricted local file URL. */}}
  const previousStage=currentStage;
  if(previousStage==='neon'&&id!=='neon')stopLetterMusic();
  if(id==='neon'&&previousStage!=='neon'){navRevealed=true;music.pause();}
  $$('.stage').forEach(s=>s.classList.toggle('active',s.id===id)); currentStage=id;
  if(id==='video') music.pause();
  $('#siteNav').hidden=!navRevealed;
  $('#backButton').hidden=id==='welcome'||navRevealed;
  $$('.nav-links button').forEach(b=>b.classList.toggle('current',b.dataset.go===(id==='envelope'?'letter':id)));
  if(id==='tease1') typeMessage('teaseText1',"HI BABY, I KNOW MASAYADONG MARAMI 'TONG PAGES HAHAHA. KAYA MO KAYA? 😭💗 YOU HAVE ANOTHER SURPRISE PAGDATING SA DULO, BUT IT WILL BE FUN!",'teaseNext1');
  if(id==='tease2') typeMessage('teaseText2',"CONGRATS, BABY! YOU'RE HERE NA, BUT WE'RE NOT DONE YET. HAHAHAHA! 💗",'teaseNext2');
  if(id==='boxes') renderBoxes();
  if(id==='flowers') renderGarden();
  if(id==='quiz') renderQuiz();
  if(id==='video'&&progress.video) $('#videoContinue').hidden=false;
  if(id==='dice'&&progress.dice){$('#diceFeedback').textContent='YESSS, BABY!!! YOU GOT IT! 💗❤️';$('#diceContinue').hidden=false;$('#rollDice').hidden=true;}
  else if(id==='dice'&&progress.lastDice){$('#die1').textContent=dieGlyphs[progress.lastDice[0]-1];$('#die2').textContent=dieGlyphs[progress.lastDice[1]-1];$('#diceFeedback').textContent='LAST ROLL SAVED — TRY AGAIN, BABY! 🎲';}
  if(id==='envelope'){ $('#letterPaper').hidden=true; $('.envelope-art').classList.remove('open'); $('#envelopeButton').disabled=false; $('.envelope-scene').classList.remove('letter-open'); }
  window.scrollTo({top:0,behavior:'smooth'});
}
window.addEventListener('popstate',event=>showStage(event.state?.romanticStage||'welcome',false));
$('#backButton').addEventListener('click',()=>{const index=stageIds.indexOf(currentStage);if(index>0)showStage(stageIds[index-1]);});
$$('[data-next]').forEach(b=>b.addEventListener('click',()=>showStage(b.dataset.next)));
$('#navToggle').addEventListener('click',()=>{const nav=$('#siteNav'),open=nav.classList.toggle('menu-open');$('#navToggle').setAttribute('aria-expanded',String(open));});
$('#navBrand').addEventListener('click',()=>showStage('welcome'));
$$('.nav-links button').forEach(b=>b.addEventListener('click',()=>{
  const key=b.dataset.go, allowed=navRequirements[key]?.()??false;
  if(!allowed){toast('Keep playing to unlock that page 💗');return;}
  showStage(key==='letter'?'envelope':key);
  $('#siteNav').classList.remove('menu-open');$('#navToggle').setAttribute('aria-expanded','false');
}));
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2300);}
function confetti(big=false){
  const layer=$('#confetti'),colors=['#E63946','#FF8FB1','#FFFFFF'],count=big?100:50;
  for(let i=0;i<count;i++){const heart=document.createElement('span');heart.className='confetti-heart';heart.textContent=Math.random()>.45?'♥':'♡';heart.style.left=`${Math.random()*100}%`;heart.style.color=colors[Math.floor(Math.random()*colors.length)];heart.style.fontSize=`${12+Math.random()*(big?32:20)}px`;heart.style.setProperty('--duration',`${2.4+Math.random()*2.2}s`);heart.style.setProperty('--drift',`${Math.random()*180-90}px`);heart.style.setProperty('--spin',`${Math.random()*720-360}deg`);layer.append(heart);setTimeout(()=>heart.remove(),5000);}
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let selectedPiece=null;
const PUZZLE_GRID=3, PUZZLE_COUNT=PUZZLE_GRID*PUZZLE_GRID;
function buildPuzzle(){
  const board=$('#puzzleBoard'),tray=$('#puzzleTray');board.replaceChildren();tray.replaceChildren();
  for(let i=0;i<PUZZLE_COUNT;i++){const slot=document.createElement('div');slot.className='puzzle-slot';slot.setAttribute('role','button');slot.tabIndex=0;slot.dataset.slot=i;slot.setAttribute('aria-label',`Heart puzzle spot ${i+1}`);slot.addEventListener('click',()=>placePuzzlePiece(slot));slot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();placePuzzlePiece(slot);}});slot.addEventListener('dragover',e=>e.preventDefault());slot.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const p=$(`[data-piece="${id}"]`);if(p){selectedPiece=p;placePuzzlePiece(slot);}});board.append(slot);}
  if(!Array.isArray(progress.puzzlePieceOrder)||progress.puzzlePieceOrder.length!==PUZZLE_COUNT)progress.puzzlePieceOrder=Array.from({length:PUZZLE_COUNT},(_,i)=>i).sort(()=>Math.random()-.5);
  if(!Array.isArray(progress.puzzlePlaced)||progress.puzzlePlaced.length!==PUZZLE_COUNT)progress.puzzlePlaced=Array(PUZZLE_COUNT).fill(null);
  const order=progress.puzzle?Array.from({length:PUZZLE_COUNT},(_,i)=>i):progress.puzzlePieceOrder;
  order.forEach(i=>{const piece=document.createElement('button');piece.className='puzzle-piece';piece.dataset.piece=i;piece.draggable=true;piece.style.backgroundImage='url("puzzle.png")';piece.style.backgroundSize=`${PUZZLE_GRID*100}% ${PUZZLE_GRID*100}%`;piece.style.backgroundPosition=`${(i%PUZZLE_GRID)/(PUZZLE_GRID-1)*100}% ${Math.floor(i/PUZZLE_GRID)/(PUZZLE_GRID-1)*100}%`;piece.setAttribute('aria-label',`Heart image puzzle piece ${i+1}`);piece.addEventListener('click',e=>{e.stopPropagation();$$('.puzzle-piece').forEach(p=>p.classList.remove('selected'));piece.classList.add('selected');selectedPiece=piece;});piece.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',String(i)));tray.append(piece);});
  const placed=progress.puzzle?Array.from({length:PUZZLE_COUNT},(_,i)=>i):progress.puzzlePlaced;
  placed.forEach((pieceIndex,slotIndex)=>{if(Number.isInteger(pieceIndex)){const slot=$(`[data-slot="${slotIndex}"]`),piece=$(`[data-piece="${pieceIndex}"]`);if(slot&&piece)slot.append(piece);}});
  updatePuzzle();
}
function placePuzzlePiece(slot){if(!selectedPiece)return;const existing=$('.puzzle-piece',slot);if(existing)$('#puzzleTray').append(existing);slot.append(selectedPiece);selectedPiece.classList.remove('selected');selectedPiece=null;progress.puzzlePlaced=Array(PUZZLE_COUNT).fill(null);$$('.puzzle-slot').forEach(s=>{const piece=$('.puzzle-piece',s);if(piece)progress.puzzlePlaced[Number(s.dataset.slot)]=Number(piece.dataset.piece);});save();updatePuzzle();}
function updatePuzzle(){const slots=$$('.puzzle-slot');const done=slots.filter(s=>$('.puzzle-piece',s)?.dataset.piece===s.dataset.slot).length;$('#puzzleProgress').textContent=`${done} OF ${PUZZLE_COUNT} PIECES PLACED`;if(done===PUZZLE_COUNT){if(!progress.puzzle){progress.puzzle=true;save();confetti();}$('#puzzleContinue').hidden=false;$('#puzzleProgress').textContent='YAYYYY, BABY! YOU DID IT! 💗';}}
$('#puzzleReset').addEventListener('click',()=>{progress.puzzle=false;progress.puzzlePlaced=Array(PUZZLE_COUNT).fill(null);progress.puzzlePieceOrder=Array.from({length:PUZZLE_COUNT},(_,i)=>i).sort(()=>Math.random()-.5);save();$('#puzzleContinue').hidden=true;buildPuzzle();});buildPuzzle();
const typed=new Set();function typeMessage(id,message,buttonId){if(typed.has(id)){$(`#${id}`).textContent=message;$(`#${buttonId}`).hidden=false;return;}typed.add(id);const target=$(`#${id}`),button=$(`#${buttonId}`);target.textContent='';button.hidden=true;let i=0;const timer=setInterval(()=>{if(!target.closest('.stage').classList.contains('active')){clearInterval(timer);return;}target.textContent=message.slice(0,++i);if(i>=message.length){clearInterval(timer);button.hidden=false;}},34);}
let correctBox=Math.floor(Math.random()*8);let boxSuccess=progress.box;
function showBoxResult(button,message){$('.box-result',button).textContent=message;button.classList.add('opened');}
function resetBoxLook(button){$('.box-result',button).textContent='';button.classList.remove('opened');}
function renderBoxes(){const grid=$('#boxGrid');grid.replaceChildren();if(!Array.isArray(progress.openedBoxes))progress.openedBoxes=[];if(boxSuccess){$('#boxFeedback').textContent='YOU FOUND IT! 💗';$('#boxContinue').hidden=false;}else{$('#boxFeedback').textContent='PICK A BOX, BABY!';$('#boxContinue').hidden=true;}for(let i=0;i<8;i++){const b=document.createElement('button');b.className='mystery-box';b.setAttribute('aria-label',`Mystery box ${i+1}`);b.innerHTML='<span class="gift-art" aria-hidden="true"><span class="gift-bow-left"></span><span class="gift-bow-right"></span><span class="gift-knot"></span><span class="gift-lid"></span><span class="gift-body"></span></span><span class="box-result" aria-hidden="true"></span>';if(boxSuccess)showBoxResult(b,i===correctBox?"I'M":'♥');else if(progress.openedBoxes.includes(i))showBoxResult(b,'♥');b.addEventListener('click',()=>{if(boxSuccess)return;if(i===correctBox){boxSuccess=true;progress.box=true;save();showBoxResult(b,"I'M");$('#boxFeedback').textContent='YOU FOUND IT! 💗';$('#boxContinue').hidden=false;confetti();}else{if(!progress.openedBoxes.includes(i))progress.openedBoxes.push(i);save();showBoxResult(b,'♥');$('#boxFeedback').textContent='AY HALA, HEART LANG! TRY AGAIN, BABY HAHAHA 😭💗';setTimeout(()=>{if(!boxSuccess)resetBoxLook(b);},950);}});grid.append(b);}}
const flowerLetters=['S','A','Y','I','N','G'];const flowers=['🌷','🌹','🌷','🌹','🌷','🌹','🌷','🌹','🌷','🌹'];let flowerMap=[];
function setupGarden(){const positions=[...Array(flowers.length).keys()].sort(()=>Math.random()-.5);flowerMap=Array(flowers.length).fill(null);flowerLetters.forEach((letter,i)=>flowerMap[positions[i]]=letter);}
setupGarden();function renderGarden(){const garden=$('#garden');garden.replaceChildren();const found=progress.letters;$('#letterProgress').textContent=flowerLetters.map((l,i)=>found[i]===l?l:'_').join(' ');if(found.length===6){$('#flowerFeedback').textContent='YOU FOUND ALL THE LETTERS, BABY! 🌷💗';$('#flowerContinue').hidden=false;}else{$('#flowerFeedback').textContent=`YOUR NEXT LETTER IS ${flowerLetters[found.length]} 🌷`;$('#flowerContinue').hidden=true;}flowers.forEach((emoji,index)=>{const b=document.createElement('button');b.className='flower';b.textContent=emoji;b.setAttribute('aria-label',`Flower ${index+1}`);if(progress.flowerFound?.includes(index)){b.classList.add('found');b.textContent=progress.flowerContents?.[index]||'💗';}b.addEventListener('click',()=>{if(progress.flowerFound?.includes(index)||progress.letters.length===6)return;const letter=flowerMap[index];if(!progress.flowerFound)progress.flowerFound=[];if(!progress.flowerContents)progress.flowerContents={};if(letter){const expected=flowerLetters[progress.letters.length];if(letter!==expected){$('#flowerFeedback').textContent=`THAT'S ${letter}! FIND ${expected} FIRST, BABY 💗`;return;}progress.letters.push(letter);progress.flowerContents[index]=letter;$('#flowerFeedback').textContent=`YOU FOUND ${letter}! 🌷`;b.textContent=letter;b.classList.add('found');}else{progress.flowerContents[index]='♥';b.textContent='♥';b.classList.add('found');$('#flowerFeedback').textContent='JUST A LITTLE HEART! TRY ANOTHER FLOWER 💕';}progress.flowerFound.push(index);save();renderGarden();if(progress.letters.length===6){confetti();$('#flowerFeedback').textContent='YOU FOUND ALL THE LETTERS, BABY! 🌷💗';$('#flowerContinue').hidden=false;}});garden.append(b);});}
function randDie(){return Math.floor(Math.random()*6)+1;}const dieGlyphs=['⚀','⚁','⚂','⚃','⚄','⚅'];const DICE_ROLLS_TO_WIN=6;let diceRollCount=0,rolling=false;
if(progress.lastDice){$('#die1').textContent=dieGlyphs[progress.lastDice[0]-1];$('#die2').textContent=dieGlyphs[progress.lastDice[1]-1];}
$('#rollDice').addEventListener('click',async()=>{if(rolling||progress.dice)return;rolling=true;const button=$('#rollDice'),d1=$('#die1'),d2=$('#die2');button.disabled=true;d1.classList.add('rolling');d2.classList.add('rolling');$('#diceFeedback').textContent='ROLLING... 🎲';for(let i=0;i<8;i++){d1.textContent=dieGlyphs[randDie()-1];d2.textContent=dieGlyphs[randDie()-1];await wait(90);}diceRollCount++;let a,b;if(diceRollCount>=DICE_ROLLS_TO_WIN){a=2;b=4;}else{do{a=randDie();b=randDie();}while((a===2&&b===4)||(a===4&&b===2));}d1.textContent=dieGlyphs[a-1];d2.textContent=dieGlyphs[b-1];progress.lastDice=[a,b];save();d1.classList.remove('rolling');d2.classList.remove('rolling');rolling=false;button.disabled=false;if((a===2&&b===4)||(a===4&&b===2)){progress.dice=true;save();$('#diceFeedback').textContent='YESSS, BABY!!! YOU GOT IT! 💗❤️';$('#diceContinue').hidden=false;button.hidden=true;confetti(true);}else $('#diceFeedback').textContent='NOT YET, BABY! ROLL AGAIN HAHAHA 😭';});
const music=$('#backgroundMusic'),letterMusic=$('#letterMusic');let musicStarted=false,letterMusicActive=false;music.volume=.35;letterMusic.volume=.45;
function stopLetterMusic(){letterMusicActive=false;letterMusic.loop=false;letterMusic.pause();letterMusic.currentTime=0;}
function playLetterMusic(){letterMusic.loop=true;letterMusicActive=true;letterMusic.currentTime=0;letterMusic.play().catch(()=>{});}
letterMusic.addEventListener('timeupdate',()=>{if(letterMusicActive&&letterMusic.currentTime>=39)letterMusic.currentTime=0;});
function startBackgroundMusic(){if(musicStarted)return;musicStarted=true;music.play().catch(()=>{musicStarted=false;});}
document.addEventListener('pointerdown',startBackgroundMusic);
document.addEventListener('keydown',startBackgroundMusic);
const video=$('#loveVideo');video.addEventListener('ended',()=>{progress.video=true;save();$('#videoStatus').textContent='YOU WATCHED IT ALL THE WAY THROUGH! 💗';$('#videoContinue').hidden=false;if(musicStarted)music.play().catch(()=>{});confetti();});video.addEventListener('error',()=>{$('#videoStatus').textContent='VIDEO NOT FOUND. Check that vid.mp4 exists, then refresh this page.';$('#videoStatus').classList.add('error');});
const quizAnswers=["I'M SAYING YES",'I LOVE YOU','WILL YOU MARRY ME','YOU ARE MY EVERYTHING'];let quizShuffled=[];function renderQuiz(){quizShuffled=[...quizAnswers].sort(()=>Math.random()-.5);const holder=$('#answers');holder.replaceChildren();quizShuffled.forEach(answer=>{const b=document.createElement('button');b.className='answer';b.textContent=answer;b.addEventListener('click',()=>{if(answer==="I'M SAYING YES"){progress.quiz=true;progress.envelope=true;save();$('#quizFeedback').textContent='YESSSSS, YOU GOT IT, BABY!!! 💗💗💗';$('#openLetter').hidden=false;confetti(true);}else $('#quizFeedback').textContent='HALAAA, TRY AGAIN BABY HAHAHAHA 😭💗';});holder.append(b);});if(progress.quiz){$('#quizFeedback').textContent='YESSSSS, YOU GOT IT, BABY!!! 💗💗💗';$('#openLetter').hidden=false;}}
$('#envelopeButton').addEventListener('click',async()=>{if(!progress.quiz){toast('The envelope is still locked 💌');return;}if(!$('#letterPaper').hidden)return;progress.envelope=true;save();music.pause();playLetterMusic();$('#envelopeButton').disabled=true;$('.envelope-art').classList.add('open');await wait(250);$('.envelope-scene').classList.add('letter-open');await wait(350);$('#letterPaper').hidden=false;typeLetter();});
const letterBody="IF YOU'RE READING THIS, IT MEANS YOU MADE IT THROUGH ALL MY LITTLE GAMES AND SURPRISES HAHAHA. 💗\n\nI WANTED TO MAKE SOMETHING SPECIAL FOR YOU, SOMETHING THAT WOULD MAKE YOU SMILE AND REMIND YOU HOW MUCH YOU MEAN TO ME.\n\nTHANK YOU FOR BEING YOU, FOR MAKING ME HAPPY, AND FOR BEING SOMEONE I WANT TO SHARE MY LITTLE MOMENTS WITH.\n\nI HOPE THIS LITTLE SURPRISE MADE YOU FEEL LOVED, BECAUSE YOU TRULY ARE.\n\nALAM MO BA, I PLANNED TO ANSWER TALAGA ON OCTOBER 24. I LET YOU COURT ME FOR MORE THAN SIX MONTHS, I THINK, HAHAHA. BASTA, EVER SINCE I FIRST MADE YOU A SURPRISE WEBSITE, I WAS ALREADY CONSIDERING YOU MY BOYFRIEND; I JUST HADN'T GIVEN YOU THE TITLE YET. BUT NOW... HMM, LET ME THINK FIRST, HAHAHAHA. YOU KNOW, MY LOVE, I'M HAPPY TO BE WITH YOU AND SPEND MORE TIME WITH YOU. EVEN THOUGH WE'RE FAR APART AND ONLY GET TO SEE EACH OTHER ONCE A MONTH, I'M STILL GRATEFUL THAT YOU STAY AND STILL MANAGE TO HANDLE MY ATTITUDE. I'M SORRY FOR BEING A PAIN IN THE ASS MOST OF THE TIME, HEHEHE. BUT IT'S YOUR FAULT FOR SPOILING ME SO MUCH, HEHE.\n\nI LOVE YOU SO MUCH, BABY. 💗";let letterTimer=null;
function typeLetter(){if(letterTimer)clearInterval(letterTimer);const target=$('#loveLetterText');target.textContent='';$('#letterSignature').hidden=true;$('#toNeon').hidden=true;let i=0;letterTimer=setInterval(()=>{target.textContent=letterBody.slice(0,++i);if(i>=letterBody.length){clearInterval(letterTimer);letterTimer=null;$('#letterSignature').hidden=false;progress.letterDone=true;progress.neon=true;save();$('#toNeon').hidden=false;confetti();}},23);}
$('#toNeon').addEventListener('click',()=>{showStage('neon');confetti(true);});
// The navigation stays hidden until the neon reveal is opened.
$('#siteNav').hidden=true;
// Always replace a stale URL stage so a reload begins at the welcome page.
try{history.replaceState({romanticStage:'welcome'},'','#welcome');}catch{/* The welcome stage is already active if history is restricted. */}


