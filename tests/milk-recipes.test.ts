import test from 'node:test';
import assert from 'node:assert/strict';
import {milkRecipes,milkRecipeQuality} from '../src/milk-recipes.ts';
test('practice milk choices are distinct and prepared milk preserves steaming quality',()=>{
 assert.equal(milkRecipeQuality('prepared',.62),.62);
 assert.equal(milkRecipeQuality('silky',.2),1);
 assert.ok(milkRecipes.silky.quality>milkRecipes.light.quality);
 assert.ok(milkRecipes.light.quality>milkRecipes.thick.quality);
});
test('invalid recipe selections cannot introduce nonfinite milk quality',()=>{
 for(const id of ['unknown','constructor','__proto__'])for(const value of [NaN,Infinity,-1,2,.7]){const quality=milkRecipeQuality(id,value);assert.ok(Number.isFinite(quality)&&quality>=.15&&quality<=1);}
});
