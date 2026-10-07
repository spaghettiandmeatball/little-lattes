import * as T from 'three';

// Coffee coordinates remain XY; Z is up in the café.
export function createScene(host: HTMLElement) {
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.append(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#b8c4b2');scene.fog=new T.Fog('#b8c4b2',13,32);
 const camera=new T.PerspectiveCamera(39,1,.1,45);camera.up.set(0,0,1);const focus=new T.Vector3(0,.5,0);camera.position.set(0,-4.6,7.5);camera.lookAt(focus);
 scene.add(new T.HemisphereLight(0xffedcf,0x5d5445,2));const sun=new T.DirectionalLight(0xffe0aa,4);sun.position.set(-5,2,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
 const mat=(color:T.ColorRepresentation,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const cream=mat('#f2e7cf',.3),green=mat('#657b66'),dark=mat('#344338'),brass=mat('#ba9051',.3,.65),steel=mat('#b6c7c8',.23,.8);
 function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
 function box(w:number,d:number,h:number,m:T.Material,x:number,y:number,z:number){return mesh(new T.BoxGeometry(w,d,h),m,x,y,z);}
 function cyl(a:number,b:number,h:number,m:T.Material,x:number,y:number,z:number){const o=mesh(new T.CylinderGeometry(a,b,h,64),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
 const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=512;const ctx=textureCanvas.getContext('2d')!;ctx.fillStyle='#ae7b4c';ctx.fillRect(0,0,512,512);
 for(let i=0;i<700;i++){const y=i*512/700;ctx.strokeStyle=`rgba(65,34,13,${.03+(Math.sin(i*19)+1)*.045})`;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=512;x+=8)ctx.lineTo(x,y+Math.sin(x*.018+i)*2);ctx.stroke();}
 const texture=new T.CanvasTexture(textureCanvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,3);const wood=new T.MeshStandardMaterial({map:texture,roughness:.57});
 box(22,13,.28,wood,0,1,-.93);box(24,.25,8,mat('#d9d2b8'),0,7,2.7);box(24,.2,1.8,green,0,6.83,-.2);
 for(let x=-11;x<12;x+=.55)box(.025,.04,1.8,dark,x,6.68,-.2);
 box(7,.12,4.2,mat('#e5ece0'),-5,6.68,3.2);for(const x of [-8.5,-5,-1.5])box(.11,.2,4.4,cream,x,6.5,3.2);for(const z of [1.05,3.2,5.35])box(7.2,.2,.11,cream,-5,6.5,z);
 box(7,.7,.1,wood,4.5,6.4,2.5);box(7,.7,.1,wood,4.5,6.4,4.2);
 for(let i=0;i<7;i++){cyl(.22,.2,.4,i%2?cream:green,1.7+i*.8,6.35,2.75);cyl(.16,.16,.55,mat(i%2?'#ab7450':'#ddd2ab'),1.7+i*.8,6.35,4.5);}
 box(4,1.5,1.1,green,4.5,4.6,-.3);box(2,.9,.8,steel,4.5,4.6,.65);box(2.1,1,.12,dark,4.5,4.6,1.1);for(const x of [4.05,4.95]){cyl(.13,.13,.18,brass,x,4.05,.62);box(.1,.45,.1,dark,x,3.9,.5);}
 box(1.7,1.8,.025,mat('#cebea0'),-2.6,.7,-.77).rotation.z=-.14;cyl(.45,.39,.58,green,-2.8,2.6,-.48);cyl(.39,.39,.025,mat('#453724'),-2.8,2.6,-.17);
 for(let i=0;i<11;i++){const angle=i*2.4;const leaf=mesh(new T.SphereGeometry(1,12,8),mat(i%2?'#68874c':'#476f46'),-2.8+Math.cos(angle)*.3,2.6+Math.sin(angle)*.3,.2+(i%3)*.2);leaf.scale.set(.12,.35,.08);leaf.rotation.set(.5,.7,angle);}
 cyl(.33,.33,.6,cream,2.6,1.6,-.47);cyl(.35,.35,.06,wood,2.6,1.6,-.13);const spoon=mesh(new T.SphereGeometry(.12,24,16),brass,2,-.1,-.74);spoon.scale.set(1,1.5,.22);box(.07,.65,.025,brass,2,-.5,-.74);
 cyl(1.36,1.3,.09,cream,0,0,-.72);cyl(1.035,.75,.58,cream,0,0,-.34);mesh(new T.TorusGeometry(1.035,.065,24,96),cream,0,0,0);const handle=mesh(new T.TorusGeometry(.27,.075,20,48),cream,1.15,0,-.3);handle.rotation.x=Math.PI/2;
 const coffeeMaterial=new T.ShaderMaterial({uniforms:{field:{value:null}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D field;void main(){float m=texture2D(field,vUv).b;float edge=smoothstep(.39,.5,length(vUv-.5));vec3 coffee=mix(vec3(.19,.075,.024),vec3(.46,.23,.08),edge);vec3 color=mix(coffee,vec3(.98,.91,.76),smoothstep(.01,.85,m));float glint=exp(-pow((vUv.x+vUv.y*.3-.25)*18.,2.))*.04;gl_FragColor=vec4(color+glint,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});mesh(new T.CircleGeometry(1,96),coffeeMaterial,0,0,.005).castShadow=false;
 const marker=mesh(new T.RingGeometry(.025,.036,32),new T.MeshBasicMaterial({color:'#ffe0a2',transparent:true,opacity:.7}),0,0,.025);marker.castShadow=false;
 const pitcher=new T.Group();scene.add(pitcher);const body=new T.Mesh(new T.CylinderGeometry(.22,.16,.48,48,1,true),steel);body.rotation.x=Math.PI/2;body.castShadow=true;pitcher.add(body);const base=new T.Mesh(new T.CircleGeometry(.16,32),steel);base.position.z=-.24;pitcher.add(base);const lip=new T.Mesh(new T.TorusGeometry(.22,.015,12,48),steel);lip.position.z=.24;pitcher.add(lip);const grip=new T.Mesh(new T.TorusGeometry(.14,.025,12,32),steel);grip.rotation.x=Math.PI/2;grip.position.y=.25;pitcher.add(grip);const spout=new T.Mesh(new T.ConeGeometry(.08,.19,4,1,true),steel);spout.rotation.x=Math.PI;spout.position.set(0,-.22,.19);pitcher.add(spout);
 const stream=mesh(new T.CylinderGeometry(.013,.018,1,16),new T.MeshBasicMaterial({color:'#fff2da'}),0,0,0);stream.castShadow=false;stream.visible=false;
 const steam=Array.from({length:9},()=>{const p=mesh(new T.SphereGeometry(.08,12,8),new T.MeshBasicMaterial({color:'#fff1dc',transparent:true,opacity:.03,depthWrite:false}),0,0,0);p.castShadow=false;return p;});
 const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),0);
 const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.fov=camera.aspect<.7?48:39;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();let presentation=0;
 return {renderer,coffeeMaterial,render(point:T.Vector2,pouring:boolean,flow:number,high:boolean,finished=false){presentation=finished?T.MathUtils.lerp(presentation,1,.035):0;camera.position.set(0,-4.6-presentation*1.7,7.5-presentation*1.5);camera.lookAt(focus);marker.position.set(point.x,point.y,.025);marker.visible=!finished;pitcher.visible=!finished;pitcher.position.set(point.x,point.y+.35,high?1.1:.7);pitcher.rotation.x=-.3-(pouring?flow*.45:0);const a=new T.Vector3(point.x,point.y,.01),b=new T.Vector3(point.x,point.y+.13,high?.98:.57);stream.position.copy(a).add(b).multiplyScalar(.5);stream.scale.set(.7+flow,a.distanceTo(b),.7+flow);stream.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());stream.visible=pouring;const time=performance.now()*.00015;steam.forEach((p,i)=>{const phase=(time+i/steam.length)%1;p.position.set(Math.sin(i*5+phase*3)*.35,Math.cos(i*4)*.25,.12+phase*1.2);p.scale.setScalar(.4+phase*2);(p.material as T.MeshBasicMaterial).opacity=Math.sin(phase*Math.PI)*.035;});renderer.render(scene,camera);},point(clientX:number,clientY:number){const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),camera);const hit=new T.Vector3();ray.ray.intersectPlane(plane,hit);return new T.Vector2(hit.x,hit.y);}};
}



