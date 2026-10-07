import * as T from 'three';
export function createScene(host: HTMLElement) {
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const scene=new T.Scene();const camera=new T.OrthographicCamera(-1.55,1.55,1.55,-1.55,.1,20);camera.position.set(0,0,8);
 scene.add(new T.AmbientLight(0xffeedc,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-3,4,6);scene.add(light);
 const ceramic=new T.MeshStandardMaterial({color:0xf5eee2,roughness:.32});
 const saucer=new T.Mesh(new T.CylinderGeometry(1.33,1.3,.07,96),ceramic);saucer.rotation.x=Math.PI/2;saucer.position.z=-.12;scene.add(saucer);
 const rim=new T.Mesh(new T.TorusGeometry(1.04,.065,24,96),ceramic);scene.add(rim);
 const handle=new T.Mesh(new T.TorusGeometry(.23,.065,16,40),ceramic);handle.scale.y=1.3;handle.position.set(1.14,.12,-.04);scene.add(handle);
 const coffeeMaterial=new T.ShaderMaterial({uniforms:{field:{value:null}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D field;void main(){float m=texture2D(field,vUv).b;float noise=sin(vUv.x*310.)*sin(vUv.y*287.)*.007;float edge=smoothstep(.36,.5,length(vUv-.5));vec3 coffee=mix(vec3(.25,.105,.044),vec3(.48,.25,.10),edge);vec3 cream=vec3(.98,.92,.78);gl_FragColor=vec4(mix(coffee,cream,smoothstep(.01,.87,m))+noise,1.);}`});
 const surface=new T.Mesh(new T.CircleGeometry(1,96),coffeeMaterial);surface.position.z=.01;scene.add(surface);
 const marker=new T.Mesh(new T.RingGeometry(.028,.038,32),new T.MeshBasicMaterial({color:0xd8af67,transparent:true,opacity:.85}));marker.position.z=.05;scene.add(marker);
 const pitcher=new T.Group();const metal=new T.MeshStandardMaterial({color:0xb4c5c2,metalness:.65,roughness:.3});
 const body=new T.Mesh(new T.CylinderGeometry(.14,.11,.29,32),metal);body.rotation.x=Math.PI/2;pitcher.add(body);
 const spout=new T.Mesh(new T.ConeGeometry(.075,.16,4),metal);spout.rotation.z=Math.PI;spout.position.y=-.17;pitcher.add(spout);pitcher.position.z=.4;scene.add(pitcher);
 const stream=new T.Mesh(new T.CylinderGeometry(.009,.018,1,12),new T.MeshBasicMaterial({color:0xfff3d8}));scene.add(stream);stream.visible=false;
 const ray=new T.Raycaster();const plane=new T.Plane(new T.Vector3(0,0,1),0);
 const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);const aspect=width/height;camera.left=-1.55*aspect;camera.right=1.55*aspect;camera.updateProjectionMatrix();};
 new ResizeObserver(resize).observe(host);resize();
 return {renderer,coffeeMaterial,render(point:T.Vector2,pouring:boolean,flow:number,high:boolean){marker.position.set(point.x,point.y,.06);pitcher.position.set(point.x+.13,point.y+.3,high?.7:.4);pitcher.rotation.z=-flow*.25;
 const a=new T.Vector3(point.x,point.y,.03),b=new T.Vector3(point.x+.03,point.y+.12,high?.7:.4);stream.position.copy(a).add(b).multiplyScalar(.5);stream.scale.set(1+flow, a.distanceTo(b),1+flow);stream.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());stream.visible=pouring;renderer.render(scene,camera);},point(clientX:number,clientY:number){const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),camera);const hit=new T.Vector3();ray.ray.intersectPlane(plane,hit);return new T.Vector2(hit.x,hit.y);}};
}
