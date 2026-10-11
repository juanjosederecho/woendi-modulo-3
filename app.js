(() => {
  'use strict';
  const STORE = 'rutaInteriorWoendiM3.v1';
  const VIDEO_IDS = ['U23YIKZyHvI', 'U4IU-y9-J8Q'];
  const VIDEO_DURATIONS = {'U23YIKZyHvI':249,'U4IU-y9-J8Q':199};
  const VIDEO_THRESHOLD = .70;
  const getState = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {videos:{},attempts:[]}; } catch { return {videos:{},attempts:[]}; } };
  const saveState = (state) => localStorage.setItem(STORE, JSON.stringify(state));
  const fmtDate = (date) => new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short'}).format(date);

  // Navigation and page progress
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle?.addEventListener('click', () => { const open = mainNav.classList.toggle('open'); navToggle.setAttribute('aria-expanded', String(open)); navToggle.textContent = open ? '×' : '☰'; });
  mainNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mainNav.classList.remove('open'); navToggle?.setAttribute('aria-expanded','false'); if(navToggle) navToggle.textContent='☰'; }));
  const readingProgress = document.getElementById('readingProgress');
  const updateScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; if(readingProgress) readingProgress.style.width = `${max > 0 ? scrollY/max*100 : 0}%`; };
  addEventListener('scroll', updateScroll, {passive:true}); updateScroll();

  // Expandable accessible images
  const dialog = document.getElementById('imageDialog');
  const dialogImage = document.getElementById('dialogImage');
  document.querySelectorAll('[data-zoom]').forEach(img => { img.tabIndex=0; img.setAttribute('role','button'); img.setAttribute('aria-label',`${img.alt}. Toca para ampliar.`); const open=()=>{dialogImage.src=img.src;dialogImage.alt=img.alt;dialog.showModal();}; img.addEventListener('click',open);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}}); });
  document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

  // Practice feedback
  const practiceFeedback = {
    strength:{correct:'Correcto. Nombras una conducta observable que funciona como evidencia de una habilidad.',incorrect:'Busca una acción concreta que otra persona podría observar; evita “siempre”, “nunca” o “perfecta”.'},
    analysis:{correct:'Bien analizado. El hecho no define toda la capacidad: puedes identificar qué ocurrió, qué faltó y qué práctica probar.',incorrect:'Una dificultad puntual no es una etiqueta permanente. Separa el hecho y busca una práctica o recurso.'}
  };
  document.querySelectorAll('.choice-list').forEach(group=>{
    group.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
      group.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));button.classList.add('selected');
      const feedback=document.getElementById(group.dataset.activity==='strength'?'strengthFeedback':'analysisFeedback');
      const correct=button.dataset.answer==='1';feedback.textContent=practiceFeedback[group.dataset.activity][correct?'correct':'incorrect'];feedback.dataset.state=correct?'correct':'incorrect';
    }));
  });

  // Video progress gate. Progress is accumulated from playback updates; an explicit fallback confirmation is offered if the embed cannot run.
  function renderVideoProgress(){
    const state=getState(); let complete=0;
    VIDEO_IDS.forEach((id,index)=>{
      const seconds=Math.max(0,Math.min(VIDEO_DURATIONS[id],Number(state.videos?.[id]?.seconds||0)));
      const percent=state.videos?.[id]?.confirmed ? 100 : Math.floor(seconds/VIDEO_DURATIONS[id]*100);
      if(percent>=70) complete++;
      const p=document.getElementById(`progress${index+1}`),t=document.getElementById(`progress${index+1}Text`);
      if(p)p.style.width=`${percent}%`;if(t)t.textContent=`${percent}%`;
    });
    const counter=document.getElementById('gateCount');if(counter)counter.textContent=`${complete} / 2`;
    const gate=document.getElementById('examGate');if(gate){gate.classList.toggle('unlocked',complete===2);gate.querySelector('b').textContent=complete===2?'¡Evaluación habilitada! Ya puedes integrar todo el recorrido.':'La evaluación se abre al completar el 70 % de cada video.';gate.querySelector('p').textContent=complete===2?'Tu progreso se guarda solo en este dispositivo.':'Progreso local de esta página; puedes volver a reproducirlos cuando quieras.';}
    document.getElementById('examLock').hidden=complete===2;
    document.getElementById('examApp').hidden=complete!==2;
    return complete===2;
  }
  document.querySelectorAll('[data-confirm-watch]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.confirmWatch;
    if(!confirm('Confirma que ya viste el video completo en la pestaña que abriste.'))return;
    const state=getState();state.videos=state.videos||{};state.videos[id]={seconds:VIDEO_DURATIONS[id],confirmed:true,confirmedAt:new Date().toISOString()};saveState(state);renderVideoProgress();
  }));
  function handleYouTubeReady(){
    if(!window.YT?.Player)return;
    VIDEO_IDS.forEach((id,index)=>{
      const playerId=`player${index+1}`;
      try{
        new YT.Player(playerId,{videoId:id,playerVars:{playsinline:1,rel:0,modestbranding:1,cc_load_policy:1,cc_lang_pref:'es',hl:'es',origin:location.origin},events:{
          onReady:()=>{const fallback=document.getElementById(`fallback${index+1}`);fallback.hidden=true;setTimeout(()=>{if(!document.querySelector(`#${playerId} iframe`))fallback.hidden=false;},15000);},
          onError:()=>{document.getElementById(`fallback${index+1}`).hidden=false;},
          onStateChange:(event)=>{if(event.data===YT.PlayerState.PLAYING){let prior=Number(event.target.getCurrentTime()||0);const timer=setInterval(()=>{if(event.target.getPlayerState()!==YT.PlayerState.PLAYING){clearInterval(timer);return;}const now=Number(event.target.getCurrentTime()||0);const delta=now-prior;prior=now;if(delta>0&&delta<3){const state=getState();state.videos=state.videos||{};const rec=state.videos[id]||{seconds:0};rec.seconds=Math.min(VIDEO_DURATIONS[id],Number(rec.seconds||0)+delta);state.videos[id]=rec;saveState(state);renderVideoProgress();}},2000);}}
        }});
      }catch{document.getElementById(`fallback${index+1}`).hidden=false;}
    });
  }
  window.onYouTubeIframeAPIReady=handleYouTubeReady;
  const api=document.createElement('script');api.src='https://www.youtube.com/iframe_api';api.async=true;api.onerror=()=>{document.querySelectorAll('.player-fallback').forEach(x=>x.hidden=false);};document.head.appendChild(api);
  setTimeout(()=>{if(!window.YT)document.querySelectorAll('.player-fallback').forEach(x=>x.hidden=false);},12000);
  renderVideoProgress();

  // Five-room short escape game
  const rooms=[
    {tag:'SALA 01 · OBSERVA',title:'La sala de las pistas',prompt:'Encuentra la descripción que usa una acción observable.',options:['“Nunca necesito ayuda”.','“En el grupo resumí las ideas y comprobé que todos tuvieran espacio para opinar”.','“Soy mejor que mis compañeros”.'],answer:1,yes:'Una acción observable da una pista concreta de una fortaleza.',no:'Elige una conducta que describa lo que la persona hizo, no una etiqueta absoluta.'},
    {tag:'SALA 02 · VERDADERO O FALSO',title:'El reloj de las conclusiones',prompt:'Reto contra el tiempo: una dificultad en una exposición demuestra que una persona jamás podrá mejorar.',options:['Verdadero','Falso'],answer:1,kind:'timed',yes:'Falso. Un resultado puntual informa qué pasó esa vez; no describe todas las posibilidades futuras.',no:'Un hecho puntual no permite afirmar “jamás”. Piensa en práctica, apoyo y nuevas evidencias.'},
    {tag:'SALA 03 · CLASIFICA',title:'El gabinete de recursos',prompt:'Una estudiante quiere practicar una lectura y pide diez minutos extra de ensayo. ¿Qué representan esos diez minutos?',options:['Una etiqueta personal','Una emoción','Un recurso o condición que puede apoyar la práctica'],answer:2,yes:'Bien. El tiempo puede ser un recurso necesario para poner en práctica una habilidad.',no:'Busca qué elemento facilita la acción concreta; no es un rasgo permanente de la persona.'},
    {tag:'SALA 04 · AJUSTA LA META',title:'El puente SMART',prompt:'¿Qué meta se puede medir y revisar dentro de un plazo?',options:['“Ser excelente en todo desde mañana”.','“Practicaré diez minutos el lunes y jueves por dos semanas y marcaré cada práctica”.','“Quiero que nadie me critique”.'],answer:1,yes:'La segunda indica acción, frecuencia, un registro y un plazo razonable.',no:'Revisa si hay una acción propia, una señal de avance y un plazo que permita probarla.'},
    {tag:'SALA 05 · DECIDE',title:'La salida responsable',prompt:'Ari se siente frustrada por un error y quiere abandonar una meta. ¿Qué paso refleja autoconocimiento y una decisión responsable?',options:['Ocultar el error y obligarse a no sentir frustración.','Compararse con alguien que ya domina la tarea.','Observar qué obstáculo apareció, identificar un recurso y ajustar el siguiente paso.'],answer:2,yes:'¡Ruta completada! Nombrar el obstáculo y ajustar el plan permite decidir con nueva información.',no:'Elige la opción que reconoce lo ocurrido y propone un siguiente paso con apoyo posible.'}
  ];
  let roomIndex=0, stars=0, roomSolved=false, timerId=null, roomSeconds=25;
  const $=id=>document.getElementById(id);
  function renderRoom(){
    clearInterval(timerId);roomSolved=false;const r=rooms[roomIndex];$('roomTitle').textContent=r.title;$('roomPrompt').textContent=r.prompt;$('roomType').textContent=r.tag;$('roomOptions').innerHTML='';$('gameFeedback').textContent='';$('checkRoom').hidden=false;$('checkRoom').disabled=false;$('nextRoom').hidden=true;$('retryRoom').hidden=true;
    r.options.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.index=i;b.addEventListener('click',()=>{if(roomSolved)return;document.querySelectorAll('#roomOptions button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});$('roomOptions').appendChild(b);});
    document.querySelectorAll('#roomDots i').forEach((dot,i)=>{dot.classList.toggle('active',i===roomIndex);dot.classList.toggle('done',i<roomIndex);});
    $('timerText').textContent=r.kind==='timed'?`00:${String(roomSeconds).padStart(2,'0')}`:'SIN CRONÓMETRO';
    if(r.kind==='timed')timerId=setInterval(()=>{roomSeconds--;if(roomSeconds<0)roomSeconds=0;$('timerText').textContent=`00:${String(roomSeconds).padStart(2,'0')}`;if(roomSeconds===0){clearInterval(timerId);$('gameFeedback').textContent='Se acabó el tiempo. Lee la pista y vuelve a intentarlo.';document.querySelectorAll('#roomOptions button').forEach(x=>x.disabled=true);$('checkRoom').disabled=true;$('retryRoom').hidden=false;}},1000);
  }
  $('checkRoom').addEventListener('click',()=>{if(roomSolved)return;const sel=document.querySelector('#roomOptions button.selected');if(!sel){$('gameFeedback').textContent='Elige una alternativa para abrir la pista.';return;}const r=rooms[roomIndex];roomSolved=true;const correct=Number(sel.dataset.index)===r.answer;$('gameFeedback').textContent=correct?r.yes:r.no;if(correct)stars++;$('gameScore').textContent=`${stars} / 5`;document.querySelectorAll('#roomOptions button').forEach(x=>x.disabled=true);$('checkRoom').hidden=true;if(roomIndex<rooms.length-1)$('nextRoom').hidden=false;else{$('gameFeedback').textContent+=(correct?' ':' ')+'Has llegado al final. Pulsa “Volver a empezar” si quieres repetir el reto.';}});
  $('nextRoom').addEventListener('click',()=>{roomIndex++;roomSeconds=25;renderRoom();});
  $('retryRoom').addEventListener('click',()=>{roomSeconds=25;renderRoom();});
  $('restartGame').addEventListener('click',()=>{roomIndex=0;stars=0;roomSeconds=25;$('gameScore').textContent='0 / 5';renderRoom();});
  renderRoom();

  // Twenty-question assessment. Four correct answers per A–E; categories intentionally require the learner to use videos, infographics, narration, and application cases.
  const questions=[
    {source:'VIDEO 1',q:'Según el video de Smile and Learn, ¿qué tres ideas se trabajan juntas?',o:['Memoria, atención y sueño','Autoconocimiento, autoimagen y autoestima','Respiración, emoción y movimiento','Interés, necesidad y autonomía','Deseo, talento y hábito'],a:1,f:'El título y la explicación del video presentan autoconocimiento, autoimagen y autoestima.'},
    {source:'VIDEO 1',q:'¿Con qué aspectos relaciona el video el autoconocimiento?',o:['Solo con la apariencia física','Únicamente con las calificaciones','Emociones, pensamientos y comportamientos','Con el número de amistades','Con escoger una profesión definitiva'],a:2,f:'La descripción del recurso explica que conocerse ayuda a comprender emociones, pensamientos y comportamientos.'},
    {source:'VIDEO 1',q:'¿Qué señala el video sobre la autoimagen?',o:['Permanece idéntica toda la vida','Solo depende de comentarios ajenos','Es igual a una meta SMART','Puede cambiar a lo largo del tiempo','Demuestra una capacidad mediante una acción'],a:3,f:'El video aborda cómo la autoimagen puede cambiar a lo largo del tiempo.'},
    {source:'VIDEO 1',q:'¿Cuál es el tercer concepto nombrado junto al autoconocimiento y la autoimagen?',o:['Autoestima','Autonomía','Autoevaluación escolar','Autoridad','Autobiografía'],a:0,f:'La autoestima completa el trío de conceptos del título y la explicación del video.'},
    {source:'VIDEO 2',q:'En la lección de Khan Academy, ¿qué combinación corresponde a SMART?',o:['Simple, memorable, ágil, rápida y técnica','Social, motivadora, amable, regular y temporal','Secreta, mediana, automática, relevante y tardía','Segura, manual, artística, responsable y tranquila','Específica, medible, alcanzable, realista y temporal'],a:4,f:'La lección presenta los cinco criterios: específica, medible, alcanzable, realista y con tiempo definido.'},
    {source:'VIDEO 2',q:'¿Qué diferencia propone el video entre un deseo y una meta?',o:['Un deseo siempre se cumple y una meta no','Las metas no necesitan tiempo','Los deseos son únicamente escolares','No existe diferencia entre ambos','Una meta incluye acciones y una forma de revisar el avance; un deseo por sí solo no'],a:4,f:'El ejemplo explica que querer algo no basta; una meta concreta agrega acciones y criterios.'},
    {source:'VIDEO 2',q:'En el ejemplo de Thinky Pinky, ¿qué quería poder hacer?',o:['Hacer dos dominadas seguidas antes de fin de año','Practicar ciclismo tres veces por semana','Levantar un auto','Correr una maratón el siguiente mes','Viajar a la Luna al día siguiente'],a:0,f:'El personaje plantea alcanzar dos dominadas consecutivas antes de fin de año.'},
    {source:'VIDEO 2',q:'¿Con qué frecuencia proponía practicar Thinky Pinky?',o:['Una vez al año','Todos los días sin pausa','Una vez al mes','Solo al final del año','Tres veces por semana'],a:4,f:'El plan del video incluye practicar tres veces por semana.'},
    {source:'INFOGRAFÍA 1',q:'¿Qué tres inicios de frase usa la ficha para organizar pistas personales?',o:['Pienso, siento, gano','Antes, durante, después','Soy, tengo, puedo','Siempre, a veces, nunca','Quiero, debo, merezco'],a:2,f:'La infografía de autoconocimiento propone “Soy”, “Tengo” y “Puedo”.'},
    {source:'INFOGRAFÍA 1',q:'¿Qué convierte una fortaleza en una descripción mejor sustentada?',o:['Decir que nunca se falla','Compararse con otra persona','Usar una palabra absoluta','Nombrar una acción y una evidencia cotidiana','Escribir una etiqueta sin ejemplo'],a:3,f:'Una capacidad se explica con una acción concreta que sirve de evidencia.'},
    {source:'INFOGRAFÍA 2',q:'¿Qué dimensiones reúne la mirada amplia del desarrollo presentada en la ficha?',o:['Física, cognitiva, emocional-social y autonomía','Solo estatura y edad','Únicamente emociones y calificaciones','Intereses, marcas y redes sociales','Deporte, competencia, premio y fama'],a:0,f:'La ficha distingue cuatro áreas relacionadas: física, cognitiva, emocional-social y autonomía.'},
    {source:'INFOGRAFÍA 2',q:'Dos estudiantes practican una habilidad a ritmos distintos. ¿Qué idea clave corresponde?',o:['El primero siempre es más capaz','El ritmo individual puede variar y no determina el valor de la persona','Ambas deben necesitar la misma ayuda','Solo cuenta quien termina primero','La diferencia prueba que una no puede aprender'],a:1,f:'El desarrollo es personal y compararse no revela qué apoyo necesita cada quien.'},
    {source:'INFOGRAFÍA 3',q:'¿Qué pregunta ayuda a revisar si una meta es medible?',o:['¿A quién voy a complacer?','¿Qué pensará todo el salón?','¿Qué señal mostrará mi avance?','¿Cómo puedo hacerlo perfecto?','¿Puedo terminarlo sin practicar?'],a:2,f:'Una meta medible incluye una señal observable del avance.'},
    {source:'AUDIO 1',q:'En la narración 1, ¿qué ejemplo se usa para mostrar “Puedo”?',o:['Puedo hacer todo sin ayuda','Puedo practicar una exposición','Puedo adivinar lo que alguien piensa','Puedo cambiar quién soy para agradar','Puedo evitar siempre cualquier error'],a:1,f:'La narración propone “puedo practicar una exposición” como ejemplo de acción.'},
    {source:'AUDIO 2',q:'¿Qué se concluye en la narración sobre dos estudiantes que aprenden a exponer?',o:['Una vale más si habla primero','Ambas deben sentirse igual','Quien ensaya tiene menos capacidad','Sus necesidades de práctica pueden ser distintas','Una debe dejar de intentarlo'],a:3,f:'La narración explica que las necesidades de práctica varían; eso no hace que una persona valga más.'},
    {source:'AUDIO 3',q:'Si un plan no funciona como se esperaba, ¿qué propone la narración?',o:['Ocultar el resultado','Concluir que la meta era imposible','Abandonar todas las metas','Culpar a quien dio apoyo','Usar la información para ajustar el camino'],a:4,f:'La ficha 3 dice que revisar el plan es usar nueva información para ajustar el camino.'},
    {source:'APLICACIÓN',q:'Noa dice: “Quiero ser excelente en todo para mañana”. ¿Qué revisión sería más útil?',o:['Elegir una habilidad, una acción pequeña, una medida y un plazo posible','Mantener la frase exactamente igual','Agregar “nunca fallaré”','Pedir a otra persona que decida la meta','Cambiarla por “quiero que todos me admiren”'],a:0,f:'La propuesta convierte una aspiración amplia en una acción propia, medible y con plazo.'},
    {source:'APLICACIÓN',q:'Sam escribe “soy mala para trabajar en grupo”. ¿Qué evidencia ayudaría a analizar esa idea con equilibrio?',o:['Recordar solo un error y cerrar el tema','Preguntar qué acciones realizó en distintas tareas y qué recurso podría ayudar','Buscar quién del grupo es mejor','Decidir que una dificultad define su identidad','Repetir la frase hasta creerla'],a:1,f:'Observar varias acciones concretas permite reemplazar una etiqueta general por información útil.'},
    {source:'APLICACIÓN',q:'Después de equivocarse en una actividad, Ari siente frustración. ¿Qué respuesta conecta mejor con el Módulo 2 y este módulo?',o:['“No sientas eso” y abandonar la tarea','Ignorar la emoción y fijar una meta enorme','Nombrar la emoción, identificar qué necesita y elegir un paso realista','Concluir que la emoción demuestra que no puede','Compararse con otra estudiante'],a:2,f:'Reconocer la emoción y la necesidad ayuda a elegir una acción responsable y posible.'},
    {source:'ANÁLISIS',q:'¿Cuál plan describe mejor una decisión personal responsable y revisable?',o:['“Voy a ser la mejor de la clase en todo”.','“Haré una meta que eligió otra persona y no cambiaré nada”.','“Nunca pediré ayuda para demostrar que puedo”.','“Practicaré una habilidad dos veces esta semana, marcaré cada intento y revisaré qué necesito”.','“No me equivocaré durante el resto del año”.'],a:3,f:'El plan propuesto incluye acción, registro, plazo corto y revisión de recursos; no exige perfección.'}
  ];
  function renderQuestions(){
    const root=document.getElementById('questionList');if(!root)return;root.innerHTML='';
    questions.forEach((item,index)=>{
      const card=document.createElement('article');card.className='question-card';card.dataset.question=String(index);
      const meta=document.createElement('div');meta.className='question-meta';meta.innerHTML=`<span>PREGUNTA ${String(index+1).padStart(2,'0')}</span><span>${item.source}</span>`;
      const title=document.createElement('h3');title.textContent=item.q;
      const opts=document.createElement('div');opts.className='question-options';
      item.o.forEach((text,oi)=>{const b=document.createElement('button');b.type='button';b.className='question-option';b.dataset.index=String(oi);b.innerHTML=`<span class="option-letter">${'ABCDE'[oi]}</span><span>${text}</span>`;b.addEventListener('click',()=>{if(card.dataset.submitted)return;opts.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');card.dataset.answer=String(oi);});opts.appendChild(b);});
      const feedback=document.createElement('div');feedback.className='question-feedback';feedback.id=`qfeedback${index}`;
      card.append(meta,title,opts,feedback);root.appendChild(card);
    });
  }
  renderQuestions();
  document.getElementById('submitExam').addEventListener('click',()=>{
    if(!renderVideoProgress()){document.getElementById('examLock').scrollIntoView({behavior:'smooth'});return;}
    const cards=[...document.querySelectorAll('.question-card')];const unanswered=cards.filter(c=>c.dataset.answer===undefined);
    if(unanswered.length){unanswered[0].scrollIntoView({behavior:'smooth',block:'center'});const btn=document.getElementById('submitExam');btn.textContent=`Faltan ${unanswered.length} respuestas`;setTimeout(()=>btn.textContent='Entregar evaluación',2200);return;}
    let score=0;cards.forEach((card,index)=>{const item=questions[index],chosen=Number(card.dataset.answer),correct=chosen===item.a;if(correct)score++;card.dataset.submitted='true';card.querySelectorAll('button').forEach(b=>{b.disabled=true;if(Number(b.dataset.index)===item.a)b.classList.add('correct-answer');});const fb=card.querySelector('.question-feedback');fb.className=`question-feedback show ${correct?'correct':'incorrect'}`;fb.textContent=`${correct?'Correcto.':'Revisa esta idea.'} ${item.f}`;});
    const state=getState();state.attempts=state.attempts||[];const attempt={name:'Woendi',module:3,score,total:20,date:new Date().toISOString(),answers:cards.map(c=>Number(c.dataset.answer)),correct:questions.map(q=>q.a)};state.attempts.push(attempt);saveState(state);
    const result=document.getElementById('examResult');result.hidden=false;result.innerHTML=`<h3>${score} / 20 puntos</h3><p>${score>=16?'Has integrado muy bien las ideas. Revisa las explicaciones para afinar tus argumentos.':score>=11?'Vas construyendo una buena ruta. Repasa las fichas vinculadas con las preguntas que revisaste.':'Cada intento ofrece información nueva. Revisa las fichas y vuelve a responder cuando quieras.'}</p><p>Intento ${state.attempts.length} · ${fmtDate(new Date(attempt.date))}. Este registro queda en el almacenamiento local de este dispositivo.</p><a class="button button-light" href="resultados.html">Abrir página de resultados ↗</a>`;result.scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('submitExam').disabled=true;
  });

  // Printable, optional worksheet; form contents are never stored or transmitted.
  document.getElementById('printEvidence').addEventListener('click',()=>window.print());

  // Installable PWA
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
})();
