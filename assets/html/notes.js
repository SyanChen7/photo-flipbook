(() => {
  const pencil = document.createElement('button');
  pencil.className='pencil-write'; pencil.textContent='✎'; pencil.title='写下这一页的回忆'; pencil.setAttribute('aria-label','写下回忆');
  const hit = document.createElement('button'); hit.className='pencil-hit';hit.title='拿起铅笔，写下回忆';hit.setAttribute('aria-label','桌面铅笔');hit.tabIndex=-1;
  const bar=document.createElement('div');bar.className='note-bar';bar.hidden=true;
  bar.innerHTML='<span class="note-hint">点击页面空白处写字，点击已有文字修改</span><button data-action="smaller" aria-label="缩小字号">A−</button><button data-action="larger" aria-label="放大字号">A＋</button><label class="note-color">颜色 <input type="color" aria-label="文字颜色" value="#3e493d"></label><label class="note-angle">倾斜 <input type="range" aria-label="旋转角度" min="-45" max="45" step="1" value="0"><output>0°</output></label><button data-action="straight" aria-label="恢复水平">归正</button><button data-action="delete">删除</button><button data-action="cancel" title="放弃本次修改，恢复上次保存的内容">放弃修改</button><button class="save" data-action="save">✓ 保存</button>';
  const toast=document.createElement('div');toast.className='note-toast';toast.setAttribute('role','status');
  document.body.append(hit,pencil,bar,toast);
  let stored={revision:0,notes:[]}, draft=[], editing=false, selected=null, saving=false, ready=false, messageTimer;
  const hint=bar.querySelector('.note-hint');
  function message(text){clearTimeout(messageTimer);toast.textContent=text;messageTimer=setTimeout(()=>toast.textContent='',6500);}
  async function load(){
    try{const r=await fetch('/api/notes',{cache:'no-store'});if(!r.ok)throw Error();stored=await r.json();if(!Array.isArray(stored.notes))throw Error();ready=true;render();}
    catch{ready=false;message('书写功能请通过相册文件夹中的“open-flipbook”启动入口打开。现有书页仍可阅读。');}
  }
  const scene=new Image();scene.src=config.background||'assets/backgrounds/desk.png';scene.onload=positionPencil;
  function positionPencil(){
    if(!scene.naturalWidth)return;
    const scale=Math.max(innerWidth/scene.naturalWidth,innerHeight/scene.naturalHeight),w=scene.naturalWidth*scale,h=scene.naturalHeight*scale,ox=(innerWidth-w)/2,oy=(innerHeight-h)/2;
    const x=ox+w*.80,y=oy+h*.49;
    const bookRect=bookElement.getBoundingClientRect();
    const fallback=innerWidth<700||x<0||x>innerWidth-48||(x<bookRect.right&&x+46>bookRect.left);
    pencil.style.left=`${fallback?innerWidth-58:x}px`;pencil.style.top=`${fallback?18:Math.max(12,y-48)}px`;
    hit.hidden=fallback||editing||Boolean(config.background && config.background!=='assets/backgrounds/desk.png');hit.style.left=`${x}px`;hit.style.top=`${y}px`;hit.style.width=`${w*.18}px`;hit.style.height=`${h*.28}px`;
  }
  window.addEventListener('resize',positionPencil);
  pageFlip.on('flip',positionPencil);
  function selectedNote(){return draft.find(n=>n.id===selected);}
  function controls(){
    const n=selectedNote();
    bar.querySelectorAll('[data-action]').forEach(b=>b.disabled=saving||(['smaller','larger','delete','straight'].includes(b.dataset.action)&&!n));
    bar.querySelectorAll('input').forEach(i=>i.disabled=saving||!n);
    bar.querySelector('input[type=color]').value=n?.color||'#3e493d';
    bar.querySelector('input[type=range]').value=n?.rotation||0;
    bar.querySelector('output').textContent=`${n?.rotation||0}°`;
  }
  bar.addEventListener('input',e=>{
    const n=selectedNote();if(!n||saving)return;
    if(e.target.type==='color')n.color=e.target.value;
    if(e.target.type==='range')n.rotation=Number(e.target.value);
    const el=bookElement.querySelector(`[data-note-id="${n.id}"]`);
    el.style.color=n.color||'#3e493d';el.style.transform=`rotate(${n.rotation||0}deg)`;
    fit(el,n);bar.querySelector('output').textContent=`${n.rotation||0}°`;
  });
  function render(){
    pages.forEach(p=>p.querySelectorAll('.memory-note').forEach(n=>n.remove()));
    for(const n of editing?draft:stored.notes){
      const page=pages[n.page];if(!page)continue;
      const el=document.createElement('div');el.className='memory-note'+(selected===n.id?' selected':'');el.dataset.noteId=n.id;
      Object.assign(el.style,{left:`${n.x*100}%`,top:`${n.y*100}%`,width:`${n.width*100}%`,fontSize:`${n.font}cqw`,color:n.color||'#3e493d',transform:`rotate(${n.rotation||0}deg)`});
      const text=document.createElement('div');text.className='memory-text';text.textContent=n.text;text.contentEditable=editing?'plaintext-only':'false';if(editing){text.setAttribute('role','textbox');text.setAttribute('aria-label','回忆文字');text.setAttribute('aria-multiline','true');}
      text.addEventListener('pointerdown',e=>{if(editing){e.stopPropagation();select(n.id);}});
      text.addEventListener('input',()=>{n.text=text.innerText;fit(el,n);});
      text.addEventListener('paste',e=>{e.preventDefault();const value=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,value.slice(0,2000));});
      el.append(text);
      for(const kind of ['grip','resize']){
        const b=document.createElement('button');b.className=`note-${kind}`;b.textContent=kind==='grip'?'✥':'↔';b.setAttribute('aria-label',kind==='grip'?'拖动文字':'调整文字框宽度');
        b.addEventListener('pointerdown',e=>{
          if(!editing||saving)return;e.preventDefault();e.stopPropagation();select(n.id);b.setPointerCapture(e.pointerId);
          const start={x:e.clientX,y:e.clientY,nx:n.x,ny:n.y,width:n.width},r=page.getBoundingClientRect();
          const move=v=>{const dx=(v.clientX-start.x)/r.width,dy=(v.clientY-start.y)/r.height;
            if(kind==='grip'){n.x=Math.max(.01,Math.min(1-n.width-.01,start.nx+dx));n.y=Math.max(.045,Math.min(.90,start.ny+dy));}
            else n.width=Math.max(.15,Math.min(.99-n.x,start.width+dx*Math.cos((n.rotation||0)*Math.PI/180)+dy*r.height/r.width*Math.sin((n.rotation||0)*Math.PI/180)));
            Object.assign(el.style,{left:`${n.x*100}%`,top:`${n.y*100}%`,width:`${n.width*100}%`});fit(el,n);
          };
          const end=()=>{b.removeEventListener('pointermove',move);b.removeEventListener('pointerup',end);b.removeEventListener('pointercancel',end);};
          b.addEventListener('pointermove',move);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
        });el.append(b);
      }
      page.append(el);
    }controls();
  }
  function fit(el,n){
    const p=pages[n.page].getBoundingClientRect();if(!p.height)return;
    const r=el.getBoundingClientRect(),margin=4;
    // Clamp the rotated bounding box, not just the unrotated text height.
    let dx=r.left<p.left+margin?p.left+margin-r.left:r.right>p.right-margin?p.right-margin-r.right:0;
    let dy=r.top<p.top+margin?p.top+margin-r.top:r.bottom>p.bottom-margin?p.bottom-margin-r.bottom:0;
    n.x=Math.max(0,Math.min(1-n.width,n.x+dx/p.width));
    n.y=Math.max(0,Math.min(.98,n.y+dy/p.height));
    el.style.left=`${n.x*100}%`;el.style.top=`${n.y*100}%`;
  }
  function select(id){selected=id;bookElement.querySelectorAll('.memory-note').forEach(el=>el.classList.toggle('selected',el.dataset.noteId===id));controls();hint.textContent='直接输入 · ✥ 拖动位置 · ↔ 调整框宽 · A 调整字号';}
  async function start(){if(editing||isTurning)return;if(!ready){await load();if(!ready)return;}editing=true;draft=structuredClone(stored.notes);selected=null;bookElement.dataset.editing='true';bar.hidden=false;pencil.hidden=true;hit.hidden=true;hint.textContent='点击页面空白处写字，点击已有文字修改';render();}
  function finish(){editing=false;selected=null;bookElement.dataset.editing='false';bar.hidden=true;pencil.hidden=false;render();positionPencil();}
  pencil.addEventListener('click',start);hit.addEventListener('click',start);
  // Stop the engine's mouse/touch handlers, while retaining native text selection.
  for(const name of ['mousedown','mousemove','mouseup','touchstart','touchmove','touchend'])bookElement.addEventListener(name,e=>{if(editing)e.stopPropagation();},true);
  pages.forEach((page,index)=>page.addEventListener('pointerdown',e=>{
    if(!editing||saving||e.target.closest('.memory-note'))return;
    const r=page.getBoundingClientRect();const n={id:crypto.randomUUID(),page:index,x:Math.min(.35,Math.max(.04,(e.clientX-r.left)/r.width)),y:Math.min(.8,Math.max(.06,(e.clientY-r.top)/r.height)),width:.60,font:4,text:'',color:'#3e493d',rotation:0};
    draft.push(n);selected=n.id;render();select(n.id);page.querySelector(`[data-note-id="${n.id}"] .memory-text`).focus();
  }));
  bar.addEventListener('click',async e=>{
    const action=e.target.closest('button')?.dataset.action;if(!action||saving)return;
    const n=selectedNote();
    if(action==='cancel'){finish();return;}
    if(action==='straight'&&n){n.rotation=0;render();return;}
    if(action==='delete'&&n){draft=draft.filter(x=>x.id!==n.id);selected=null;render();return;}
    if((action==='smaller'||action==='larger')&&n){n.font=Math.min(8,Math.max(2,n.font+(action==='larger'?.4:-.4)));render();const el=bookElement.querySelector(`[data-note-id="${n.id}"]`);fit(el,n);return;}
    if(action==='save'){
      const notes=draft.filter(n=>n.text.trim());
      if(notes.some(n=>n.text.length>2000)){message('每段最多 2000 字，请分成几段。');return;}
      if([...bookElement.querySelectorAll('.memory-note')].some(el=>{const p=el.parentElement.getBoundingClientRect(),r=el.getBoundingClientRect();return p.height&&(r.bottom>p.bottom-2||r.top<p.top||r.left<p.left||r.right>p.right);})){message('文字超出页面，请缩小字号或分成几段。');return;}
      saving=true;controls();bookElement.querySelectorAll('.memory-text').forEach(t=>t.contentEditable='false');
      try{const r=await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:stored.revision,notes})});const data=await r.json();if(!r.ok)throw Error(data.error||'保存失败');stored=data;finish();message('已保存到这本书，下次打开仍在。');}
      catch(err){message(err instanceof TypeError?'连接已断开，文字还在。请恢复启动服务后再保存。':err.message||'保存失败，请重试');bookElement.querySelectorAll('.memory-text').forEach(t=>t.contentEditable='plaintext-only');}
      finally{saving=false;controls();}
    }
  });
  window.addEventListener('beforeunload',e=>{if(editing&&JSON.stringify(draft)!==JSON.stringify(stored.notes)){e.preventDefault();e.returnValue='';}});
  load();
})();
