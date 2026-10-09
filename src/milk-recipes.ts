export const milkRecipes={
 silky:{label:'Silky · latte art',quality:1,tip:'Best for clear patterns. Pour low and steady to draw; lift and ease the flow for the final cut.'},
 light:{label:'Light · gentle foam',quality:.75,tip:'A softer drawing response. Stay low, grow a pool, and move slowly.'},
 thick:{label:'Thick · foam practice',quality:.35,tip:'Coarser foam makes less precise patterns. Try the spoon, or steam a fresh jug for silky milk.'},
} as const;
export type MilkRecipe=keyof typeof milkRecipes;
export function milkRecipeQuality(id:string,prepared:number){return Object.hasOwn(milkRecipes,id)?milkRecipes[id as MilkRecipe].quality:Math.max(.15,Math.min(1,Number.isFinite(prepared)?prepared:1));}
export const milkGuide='For latte art, stop steaming at 5–9 seconds on the game gauge: silky microfoam, not thick bubbles. Swirl the jug, pour low to draw, then lift and reduce flow to cut.';
