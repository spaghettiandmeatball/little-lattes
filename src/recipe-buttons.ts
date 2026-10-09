/** Focus artwork belongs to each control, including controls created by studios. */
export function installRecipeButtons(){
 const decorate=()=>document.querySelectorAll<HTMLElement>('button:not(#pour),summary').forEach(button=>{
  if(!button.querySelector(':scope > .recipe-focus')){const focus=document.createElement('span');focus.className='recipe-focus';focus.setAttribute('aria-hidden','true');button.append(focus);}
 });
 decorate();
 // Only inspect changed subtrees; animation readouts and canvas frames need no decoration.
 new MutationObserver(records=>{for(const record of records){const roots=[record.target,...Array.from(record.addedNodes)];for(const node of roots){if(!(node instanceof HTMLElement)||node.classList.contains('recipe-focus'))continue;const buttons=node.matches('button:not(#pour),summary')?[node]:Array.from(node.querySelectorAll<HTMLElement>('button:not(#pour),summary'));for(const button of buttons){if(button.querySelector(':scope > .recipe-focus'))continue;const focus=document.createElement('span');focus.className='recipe-focus';focus.setAttribute('aria-hidden','true');button.append(focus);}}}}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',event=>{if((event.target as HTMLElement).closest('button[aria-busy=true]')){event.preventDefault();event.stopImmediatePropagation();}},true);
}

