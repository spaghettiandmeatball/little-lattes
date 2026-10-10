/** Reserve the sculpted artwork for primary actions; secondary controls stay quiet. */
export function installRecipeButtons(){
 const decorateButton=(button:HTMLElement)=>{
  const primary=button.matches('#nextCup,#saveShot,#applyRoom,#worldCapture');
  button.classList.toggle('quiet-button',!primary);
  button.classList.toggle('sculpted-cta',primary);
  if(!button.querySelector(':scope > .recipe-focus')){const focus=document.createElement('span');focus.className='recipe-focus';focus.setAttribute('aria-hidden','true');button.append(focus);}
 };
 document.querySelectorAll<HTMLElement>('button:not(#pour),summary').forEach(decorateButton);
 // Dynamic studios and world actions use the same hierarchy as the initial dock.
 new MutationObserver(records=>{for(const record of records){for(const node of [record.target,...Array.from(record.addedNodes)]){if(!(node instanceof HTMLElement)||node.classList.contains('recipe-focus'))continue;const buttons=node.matches('button:not(#pour),summary')?[node]:Array.from(node.querySelectorAll<HTMLElement>('button:not(#pour),summary'));buttons.forEach(decorateButton);}}}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',event=>{if((event.target as HTMLElement).closest('button[aria-busy=true]')){event.preventDefault();event.stopImmediatePropagation();}},true);
}
