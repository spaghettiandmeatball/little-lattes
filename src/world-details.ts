import * as T from 'three';

/** Z-up café furnishings, built once and shared by live and captured scenes. */
export function addWorldDetails(scene:T.Scene){
 const root=new T.Group();root.name='cafe-details';scene.add(root);
 const mat=(color:string,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const oak=mat('#896344'),dark=mat('#334b40'),brass=mat('#bd9456',.32,.65),ceramic=mat('#ece0c7',.3),coffee=mat('#563823'),cloth=mat('#a6a28b');
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const box=(w:number,d:number,h:number,m:T.Material,x:number,y:number,z:number)=>add(new T.BoxGeometry(w,d,h),m,x,y,z);
 const cyl=(r:number,h:number,m:T.Material,x:number,y:number,z:number)=>{const o=add(new T.CylinderGeometry(r,r,h,32),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
 // Counter fascia, framed joinery, drawers and small brass pulls.
 box(22,.16,1.7,oak,0,-3.58,-1.9);
 for(let x=-9;x<=9;x+=3){box(2.7,.07,1.38,dark,x,-3.69,-1.92);box(2.4,.03,.08,oak,x,-3.74,-1.36);box(.45,.08,.055,brass,x,-3.81,-1.53);}
 box(22,.09,.075,brass,0,-3.68,-1.11);
 // A proper floor and a woven runner make moving away from the counter useful.
 box(24,12,.18,mat('#b3a088'),0,-3,-2.95);
 for(let x=-12;x<12;x+=.8)box(.018,12,.008,mat('#93836f'),x,-3,-2.85);
 box(7,2.8,.025,cloth,-1,-5.2,-2.84);
 for(let y=-6.5;y<-3.9;y+=.12)box(6.85,.023,.003,mat('#c9bea1'),-1,y,-2.823);
 for(const x of [-5.3,5.3]){
  cyl(.65,.13,oak,x,-4.5,-1.6);
  for(const dx of [-.38,.38])for(const dy of [-.38,.38]){box(.1,.1,1.2,dark,x+dx,-4.5+dy,-2.24);}
  const rail=add(new T.TorusGeometry(.42,.025,8,48),brass,x,-4.5,-2.3);rail.castShadow=false;
 }
 // Espresso station: drip tray slats, gauge, switches and articulated steam wand.
 box(1.7,.54,.035,brass,3.6,.12,-.04);
 for(let x=2.85;x<4.4;x+=.1)box(.025,.47,.013,dark,x,.12,-.012);
 const gauge=cyl(.16,.035,ceramic,3.6,.208,.55);gauge.rotation.x=0;
 const needle=box(.016,.025,.19,brass,3.63,.179,.55);needle.rotation.y=-.45;
 for(const x of [3.03,4.17]){const knob=cyl(.065,.065,dark,x,.2,.62);knob.rotation.x=0;}
 const wand=new T.CatmullRomCurve3([new T.Vector3(4.26,.36,.44),new T.Vector3(4.52,.24,.38),new T.Vector3(4.51,.02,.02)]);
 add(new T.TubeGeometry(wand,20,.024,8,false),brass,0,0,0);
 // Glass bean jar: visible beans, lid and a paper label.
 const glass=new T.MeshPhysicalMaterial({color:'#e5ede0',transparent:true,opacity:.22,roughness:.12,clearcoat:1,depthWrite:false});
 cyl(.25,.62,glass,4.9,1,-.43);cyl(.27,.065,oak,4.9,1,-.08);
 for(let i=0;i<48;i++){const a=i*2.39996,r=.18*Math.sqrt((i%13)/13);const bean=add(new T.SphereGeometry(.045,8,6),coffee,4.9+Math.cos(a)*r,1+Math.sin(a)*r,-.7+Math.floor(i/12)*.08);bean.scale.set(1,.65,.65);bean.rotation.z=a;}
 box(.25,.016,.2,ceramic,4.9,.756,-.38);
 // Framed café print, shelf brackets and book spines.
 box(1.35,.09,1.65,oak,6.1,1.7,3.3);box(1.17,.03,1.46,ceramic,6.1,1.642,3.3);
 const art=add(new T.CircleGeometry(.35,48),mat('#b7835c'),6.1,1.618,3.45);art.rotation.x=Math.PI/2;
 box(.78,.012,.035,dark,6.1,1.61,2.9);box(.48,.012,.022,dark,6.1,1.61,2.81);
 for(const z of [2.46,3.96])for(const x of [1.1,3.9]){box(.065,.45,.07,brass,x,1.48,z-.08);box(.065,.06,.35,brass,x,1.72,z-.2);}
 for(let i=0;i<5;i++){const book=box(.13,.38,.5+i*.045,mat(['#a27759','#617b70','#d0bc90','#394f49','#c4a080'][i]),.9+i*.14,1.42,4.37);book.rotation.y=i===4?-.12:0;box(.08,.014,.018,ceramic,.9+i*.14,1.223,4.44);}
 // Folded towels, cups and subtle cup-foot rings on the secondary work surface.
 for(let i=0;i<3;i++)box(.6,.46,.035,cloth,5.5,.15,-.76+i*.04);
 for(const x of [-5.1,-5.75]){cyl(.34,.035,ceramic,x,.4,-.77);const cup=add(new T.LatheGeometry([new T.Vector2(.19,0),new T.Vector2(.25,.05),new T.Vector2(.29,.4),new T.Vector2(.26,.4),new T.Vector2(.22,.08),new T.Vector2(0,.08)],40),ceramic,x,.4,-.75);cup.rotation.x=Math.PI/2;const handle=add(new T.TorusGeometry(.13,.028,12,32),ceramic,x+.29,.4,-.5);handle.rotation.x=Math.PI/2;}
}
