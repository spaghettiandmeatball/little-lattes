/** Reorganize the existing controls without replacing their handlers or artwork. */
export function mountSceneFirstUI(stopPour:()=>void){
 const main=document.querySelector('main')!;
 const byId=(id:string)=>document.getElementById(id)!;
 const controls=document.querySelector<HTMLElement>('.controls')!;
 // An explicit button avoids native details hit-testing quirks on narrow touch layouts.
 const oldMore=document.querySelector<HTMLDetailsElement>('.corner-more')!,worldMenu=oldMore.querySelector<HTMLElement>('.corner-more-menu')!;
 const moreWrapper=document.createElement('div');moreWrapper.className='corner-more';const moreToggle=document.createElement('button');moreToggle.className='more-toggle';moreToggle.textContent='More';moreToggle.setAttribute('aria-expanded','false');worldMenu.id='cafe-more-menu';moreToggle.setAttribute('aria-controls',worldMenu.id);worldMenu.hidden=true;moreWrapper.append(moreToggle,worldMenu);oldMore.replaceWith(moreWrapper);
 moreToggle.onclick=()=>{const opening=worldMenu.hidden;stopPour();closeMenus();worldMenu.hidden=!opening;moreToggle.setAttribute('aria-expanded',String(opening));};worldMenu.addEventListener('click',closeMenus);
 main.classList.add('scene-first');
 function tabs(root:HTMLElement,items:{label:string;panel:HTMLElement}[],prefix:string){
  const nav=document.createElement('div');nav.className='compact-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',prefix);
  const buttons=items.map((item,i)=>{const button=document.createElement('button');button.type='button';button.id=prefix+'-tab-'+i;button.textContent=item.label;button.setAttribute('role','tab');button.setAttribute('aria-controls',prefix+'-panel-'+i);item.panel.id=prefix+'-panel-'+i;item.panel.setAttribute('role','tabpanel');item.panel.setAttribute('aria-labelledby',button.id);nav.append(button);return button;});
  function select(index:number){items.forEach((item,i)=>{item.panel.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});}
  buttons.forEach((button,i)=>{button.onclick=()=>select(i);button.onkeydown=e=>{let index=i;if(e.key==='ArrowRight')index=(i+1)%items.length;else if(e.key==='ArrowLeft')index=(i+items.length-1)%items.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=items.length-1;else return;e.preventDefault();select(index);buttons[index].focus();};});
  root.prepend(nav);select(0);
 }
 // These are the original buttons: keep their reset/keep-cup semantics intact.
 const quick=document.createElement('div');quick.className='cup-quick-actions';quick.setAttribute('aria-label','Quick cup actions');
 byId('reset').textContent='Reset cup';byId('reset').setAttribute('aria-label','Reset current cup and refill milk');byId('reset').title='Clears this cup and refills milk. Keeps your pouring settings.';
 quick.append(byId('nextCup'),byId('reset'),byId('showPour'));
 byId('autoPourStyle').title='Choose the pattern for Auto pour';controls.append(quick);
 byId('nextCup').title='Keeps this finished cup on the counter and starts another. Remaining milk carries over.';
 const status=document.createElement('p');status.className='cup-feedback';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;main.append(status);
 let feedbackTimer:ReturnType<typeof setTimeout>;
 new MutationObserver(()=>{const text=byId('status').textContent||'';if(status.textContent===text||text.startsWith('Maintaining pitcher clearance'))return;status.textContent=text;status.hidden=!text;clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{status.hidden=true;},6500);}).observe(byId('status'),{childList:true,subtree:true,characterData:true});
 const adjust=document.createElement('div');adjust.className='adjust-workspace';
 const pouring=document.createElement('section');pouring.className='adjust-page';pouring.append(document.querySelector('.intentions')!,document.querySelector('.adjustments')!);
 const tools=document.createElement('section');tools.className='adjust-page';tools.append(document.querySelector('.surface-tools')!);
 const milk=document.createElement('section');milk.className='adjust-page';const recipes=document.querySelector<HTMLDetailsElement>('.milk-recipes')!;recipes.open=true;milk.append(recipes,byId('refill'));
 adjust.append(pouring,tools,milk);controls.insertBefore(adjust,byId('pourControls'));tabs(adjust,[{label:'Pour',panel:pouring},{label:'Tools',panel:tools},{label:'Milk',panel:milk}],'pour-adjust');
 // The pour pad stays reachable below the selected adjustment section.
 byId('dockAdjust').setAttribute('aria-controls',adjust.id='adjust-workspace');
 byId('dockCup').textContent='More';byId('dockCup').setAttribute('aria-controls','cup-more-actions');document.querySelector('.actions')!.id='cup-more-actions';
 const more=document.querySelector<HTMLElement>('.actions')!;const gallery=document.createElement('button');gallery.textContent='My pours';gallery.onclick=()=>byId('myPours').click();more.append(gallery);const decorate=document.createElement('button');decorate.textContent='Decorate';decorate.onclick=()=>byId('decorate').click();more.append(decorate);
 // Radio belongs to the one-at-a-time dock rather than a nested submenu.
 document.querySelector('.dock-toolbar')!.append(byId('dockRadio'));byId('dockRadio').textContent='Radio';
 byId('dockRadio').setAttribute('aria-controls','cafeRadio');
 const title=document.createElement('div');title.className='pour-dock-heading';title.innerHTML='<span>YOUR POUR</span><span class="milk-readout"></span>';controls.prepend(title);
 const toolSelect=byId('surfaceTool') as HTMLSelectElement;
 const quickTools=document.createElement('div');quickTools.className='quick-tools';quickTools.setAttribute('role','group');quickTools.setAttribute('aria-label','Surface tool');
 const toolButtons=[['pour','Milk','Milk pour'],['pick','Pick','Foam pick'],['spoon','Spoon','Foam spoon']].map(([value,label,name])=>{const button=document.createElement('button');button.type='button';button.id='quick-tool-'+value;button.textContent=label;button.setAttribute('aria-label',name);button.title=name+(value==='pour'?' · use the pour pad':' · drag directly on the coffee');button.onclick=()=>{toolSelect.value=value;toolSelect.dispatchEvent(new Event('change'));syncTools();};quickTools.append(button);return button;});
 quickTools.append(byId('toolPrecision'));
 function syncTools(){byId('toolPrecision').hidden=toolSelect.value==='pour';toolButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(toolSelect.value===['pour','pick','spoon'][i])));}
 toolSelect.addEventListener('change',syncTools);byId('mode').addEventListener('change',syncTools);title.firstElementChild!.replaceWith(quickTools);syncTools();
 const milkReadout=title.querySelector<HTMLElement>('.milk-readout')!;milkReadout.textContent=byId('milk').textContent;
 new MutationObserver(()=>{milkReadout.textContent=byId('milk').textContent;}).observe(byId('milk'),{childList:true,characterData:true,subtree:true});
 const settings=document.querySelector<HTMLElement>('.settings')!,details=settings.parentElement as HTMLDetailsElement;details.classList.add('player-settings');details.querySelector('summary')!.textContent='Settings';
 const heading=document.createElement('div');heading.className='settings-heading';heading.innerHTML='<strong>Make yourself comfortable</strong>';const close=document.createElement('button');close.textContent='Close';close.setAttribute('aria-label','Close settings');close.onclick=()=>{details.open=false;details.querySelector<HTMLElement>('summary')!.focus();};heading.append(close);settings.prepend(heading);
 const cornerSettings=document.createElement('button');cornerSettings.textContent='Settings';cornerSettings.onclick=()=>{details.open=true;};document.querySelector('.corner-more-menu')!.append(cornerSettings);
 const groups=[{label:'Play',ids:['unlimited','stopAtRim','rimAccess','sound']},{label:'Controls',ids:['scheme','padMode','left','offset','fine']},{label:'Display',ids:['quality']},{label:'Dev',ids:['modeControls','developer','field','mixIntent','tuning','save','restore','export','import','replay','runReplay','liquidDemo','runLiquidDemo','exportLiquidMetrics','record','playRecording','exportRecording','importRecording','recordingCopy','comparisonCopy','exportComparison','performance','diagnostics']}];
 const pages=groups.map(group=>{const panel=document.createElement('section');panel.className='settings-page';settings.append(panel);for(const id of group.ids){const element=byId(id);const parent=element.parentElement!;const node=parent.tagName==='LABEL'||parent.classList.contains('row')?parent:element;if(!panel.contains(node))panel.append(node);}settings.append(panel);return {label:group.label,panel};});
 settings.querySelectorAll(':scope > small').forEach(node=>node.remove());tabs(settings,pages,'studio-settings');
 details.addEventListener('toggle',()=>{main.classList.toggle('settings-open',details.open);if(details.open){stopPour();closeMenus();}});
 function closeMenus(){for(const [id,name] of [['dockAdjust','dock-adjusting'],['dockCup','dock-cup'],['dockRadio','radio-open']]){main.classList.remove(name);byId(id).setAttribute('aria-expanded','false');}worldMenu.hidden=true;moreToggle.setAttribute('aria-expanded','false');}
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||document.querySelector('dialog[open]'))return;const objectPanel=document.querySelector<HTMLElement>('.world-piece-panel:not([hidden])');const submenu=document.querySelector<HTMLElement>('.corner-more-menu:not([hidden])');if(details.open){e.preventDefault();e.stopImmediatePropagation();details.open=false;details.querySelector<HTMLElement>('summary')!.focus();}else if(objectPanel){e.preventDefault();e.stopImmediatePropagation();objectPanel.querySelector<HTMLButtonElement>('.piece-heading button')?.click();}else if(main.matches('.dock-adjusting,.dock-cup,.radio-open')||submenu){e.preventDefault();e.stopImmediatePropagation();closeMenus();}},true);
 byId('showPour').addEventListener('click',closeMenus);
 byId('stage').addEventListener('pointerdown',()=>{details.open=false;closeMenus();},true);
 for(const id of ['dockAdjust','dockCup','dockRadio','cupView','cornerView'])byId(id).addEventListener('click',()=>{details.open=false;});
 // Keep long photo controls on focused pages; callbacks still find the same elements.
 function organizePhoto(){const photoTools=document.querySelector<HTMLElement>('.corner-studio .photo-tools');if(!photoTools||photoTools.dataset.organized||!photoTools.querySelector('#saveShot'))return;photoTools.dataset.organized='true';const composition=document.createElement('section'),save=document.createElement('section');composition.className=save.className='photo-control-page';for(const node of Array.from(photoTools.children)){if(node.querySelector('#photoTitle')||node.id==='saveShot'||node.id==='downloadShot'||node.tagName==='SMALL'&&node.textContent?.startsWith('Saved on'))save.append(node);else composition.append(node);}photoTools.append(composition,save);tabs(photoTools,[{label:'Compose',panel:composition},{label:'Save',panel:save}],'photo-options');}
 new MutationObserver(organizePhoto).observe(document.querySelector('.corner-studio')!,{childList:true,subtree:true});
 organizePhoto();
}


