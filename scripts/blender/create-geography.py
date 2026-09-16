"""Render a georeferenced Yandex-map camera flight for slide 11.
Blender 5.2 background factory-startup --python create-geography.py -- OUTPUT [--preview]
Input: OUTPUT/maps/map-z{8,11,14,17}.png; capture center 37.434686,55.771473.
Zoning is a marketing diagram, not an administrative boundary or measured reach.
"""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];out=Path(args[0]);(out/'frames').mkdir(exist_ok=True)
s=bpy.context.scene
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s.render.engine='BLENDER_EEVEE';s.render.resolution_x=1000;s.render.resolution_y=760;s.render.resolution_percentage=100;s.render.fps=24;s.frame_start=1;s.frame_end=480
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.view_settings.view_transform='Standard';s.world.color=(.005,.012,.018)
s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs[0].default_value=(.005,.013,.019,1)
s.eevee.taa_render_samples=16
lon0,lat0=37.434686,55.771473
unit=math.cos(math.radians(lat0))*40075.016686
width=lambda z:1116*unit/(256*2**z)
height=lambda z:1024*unit/(256*2**z)
def xy(lon,lat):return ((lon-lon0)/360*unit,(math.asinh(math.tan(math.radians(lat)))-math.asinh(math.tan(math.radians(lat0))))/(2*math.pi)*unit)
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def mat(name,color,alpha=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();e=n.new('ShaderNodeEmission');e.inputs[0].default_value=(*color,1);t=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=alpha;o=n.new('ShaderNodeOutputMaterial');l=m.node_tree.links;l.new(t.outputs[0],mix.inputs[1]);l.new(e.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],o.inputs[0]);m.surface_render_method='BLENDED';return m,mix.inputs[0]
def mesh(name,verts,faces,m):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.data.materials.append(m);return o
# Four registered map scales share one physical surface. Shader-space mapping avoids sliding crossfades.
m=bpy.data.materials.new('Yandex hybrid / registered multiscale');m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links
geo=n.new('ShaderNodeNewGeometry');base=n.new('ShaderNodeRGB');base.outputs[0].default_value=(.006,.021,.025,1);color=base.outputs[0];mixes={}
for z in [8,11,14,17]:
 v=n.new('ShaderNodeVectorMath');v.operation='MULTIPLY';v.inputs[1].default_value=(1/width(z),1/height(z),0);l.new(geo.outputs['Position'],v.inputs[0]);a=n.new('ShaderNodeVectorMath');a.operation='ADD';a.inputs[1].default_value=(.5,.5,0);l.new(v.outputs[0],a.inputs[0]);tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(out/'maps'/f'map-z{z}.png'));tex.extension='CLIP';l.new(a.outputs[0],tex.inputs[0]);alpha=n.new('ShaderNodeMath');alpha.operation='MULTIPLY';alpha.inputs[1].default_value=1;l.new(tex.outputs['Alpha'],alpha.inputs[0]);blend=n.new('ShaderNodeMixRGB');l.new(alpha.outputs[0],blend.inputs[0]);l.new(color,blend.inputs[1]);l.new(tex.outputs['Color'],blend.inputs[2]);color=blend.outputs[0];mixes[z]=alpha.inputs[1]
em=n.new('ShaderNodeEmission');l.new(color,em.inputs[0]);em.inputs[1].default_value=.75;o=n.new('ShaderNodeOutputMaterial');l.new(em.outputs[0],o.inputs[0])
W,H=width(8),height(8)
mesh('GEO Registered Yandex surface',[(-W/2,-H/2,0),(W/2,-H/2,0),(W/2,H/2,0),(-W/2,H/2,0)],[(0,1,2,3)],m)
# A shallow cartographic slab makes the oblique perspective visible at regional scale.
dark,_=mat('Map edge',(0.008,.033,.042));bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,-2.5));slab=bpy.context.object;slab.name='GEO Map slab';slab.dimensions=(W,H,4);slab.data.materials.append(dark)
camd=bpy.data.cameras.new('CAM Park to Moscow region');cam=bpy.data.objects.new('CAM Park to Moscow region',camd);s.collection.objects.link(cam);camd.lens=42;camd.clip_start=.0001;camd.clip_end=3000;s.camera=cam
# Slight defocus during the pullback; crisp park and final zoning frame.
g=bpy.data.node_groups.new('Geo flight compositor','CompositorNodeTree');s.compositing_node_group=g
rl=g.nodes.new('CompositorNodeRLayers');blur=g.nodes.new('CompositorNodeBlur');g.links.new(rl.outputs['Image'],blur.inputs['Image']);g.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');output=g.nodes.new('NodeGroupOutput');g.links.new(blur.outputs['Image'],output.inputs[0])
# Helper for raised paths and translucent sectors (explicit schematic marketing zones).
def path(name,pts,col,r=.25):
 mm,alpha=mat(name,col);c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,v in zip(sp.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.data.materials.append(mm);return o,alpha
zones=[];cx,cy=xy(37.6173,55.7558)
def sector(name,r0,r1,a0,a1,color,start):
 angles=[math.radians(a0+(a1-a0)*i/80) for i in range(81)];outer=lambda a:r1-(40*max(0,-math.cos(a))*max(0,-math.sin(a)) if start==306 else 0);pts=[(cx+outer(a)*math.cos(a),cy+outer(a)*math.sin(a),.6) for a in angles]+[(cx+r0*math.cos(a),cy+r0*math.sin(a),.6) for a in reversed(angles)]
 mm,al=mat(name+' fill',color,.15);ob=mesh(name+' fill',pts,[tuple(range(len(pts)))],mm);outline=pts[:81] if r0==0 else pts+[pts[0]];line,la=path(name+' perimeter',outline,color,.25);zones.append((start,[al,la],ob,line))
sector('01 Moscow',0,20,0,360,(.02,.72,1),214)
sector('02 Western settlements',23,74,135,220,(.59,1,.04),258)
sector('03 Other directions',32,103,-135,135,(.51,.29,1),306)
# Park beacon stays spatially fixed while retaining a readable screen size.
cyan,_=mat('Skazka beacon',(.01,.84,1));bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1);beacon=bpy.context.object;beacon.name='GEO Skazka georeferenced beacon';beacon.data.materials.append(cyan)
for p in beacon.data.polygons:p.use_smooth=True
stem,stemalpha=path('Park beacon stem',[(0,0,0),(0,0,1)],(.01,.84,1),.08)
# Explicit mapping evidence for independent coordinate checks.
meta={'center':[lon0,lat0],'mapPixels':[1116,1024],'widthKm':{str(z):width(z) for z in [8,11,14,17]},'zones':'Schematic marketing priorities; not measured catchment or administrative boundaries','frames':480,'fps':24}
(out/'scene-metadata.json').write_text(json.dumps(meta,indent=2))
labels=[]
for txt,x,y,start in [('01',cx+4,cy+2,214),('02',cx-47,cy-4,258),('03',cx+53,cy+40,306)]:
 mm,al=mat('Zone label '+txt,(.94,.99,1));c=bpy.data.curves.new('Label '+txt,'FONT');c.body=txt;c.font=bpy.data.fonts.load('C:/Windows/Fonts/arialbd.ttf');c.align_x='CENTER';c.align_y='CENTER';c.size=13
 ob=bpy.data.objects.new('Zone '+txt,c);s.collection.objects.link(ob);c.materials.append(mm);ob.location=(x,y,3);labels.append((ob,al,start))
for f in range(1,482):
 # 0–1.5 s park, 1.5–4 s tilt, 4–9 s pullback, 9–17 s zones, 17–20 s return.
 if f<=216:q=smooth((f-84)/132);dist=.70*math.exp(math.log(360/.70)*q);tilt=math.radians(34)*smooth((f-36)/70)
 elif f<=420:dist=360;tilt=math.radians(34)
 else:q=smooth((f-420)/60);dist=360*math.exp(math.log(.70/360)*q);tilt=math.radians(34)*(1-q)
 camd.clip_start=dist*.01;camd.keyframe_insert('clip_start',frame=f)
 target=Vector((0,0,0));cam.location=(dist*.055*math.sin(tilt),-dist*math.sin(tilt),dist*math.cos(tilt));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f)
 for z in [11,14,17]:
  # Detail is replaced before the edge enters view; adjacent captures use identical coordinates.
  value=1-smooth((math.log2(dist/width(z))-.1)/.85);mixes[z].default_value=value;mixes[z].keyframe_insert('default_value',frame=f)
 # Blender 5.2 Blur Size is in pixels (vector input).
 amount=3.2*math.sin(math.pi*smooth((f-84)/132)) if f<=216 else (7*math.sin(math.pi*smooth((f-420)/60)) if f>420 else 0)
 blur.inputs['Size'].default_value=(amount,amount);blur.inputs['Size'].keyframe_insert('default_value',frame=f)
 scale=max(.005,dist*.012);beacon.scale=(scale*.48,)*3;beacon.location=(0,0,scale*2);beacon.keyframe_insert('scale',frame=f);beacon.keyframe_insert('location',frame=f);stem.scale=(scale,scale,scale*2);stem.keyframe_insert('scale',frame=f)
 for ob,al,start in labels:
  ob.rotation_euler=cam.rotation_euler;ob.keyframe_insert('rotation_euler',frame=f);al.default_value=smooth((f-start)/24)*(1-smooth((f-404)/16));al.keyframe_insert('default_value',frame=f)
 for start,alphas,fill,line in zones:
  fade=smooth((f-start)/24)*(1-smooth((f-404)/16));alphas[0].default_value=.18*fade;alphas[1].default_value=.85*fade
  for a in alphas:a.keyframe_insert('default_value',frame=f)
  fill.location.z=1.7*fade;line.location.z=1.7*fade;fill.keyframe_insert('location',frame=f);line.keyframe_insert('location',frame=f)
# Baked per-frame transforms use linear segments without Bezier overshoot.
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   if hasattr(strip,'channelbags'):
    for cb in strip.channelbags:
     for fc in cb.fcurves:
      for k in fc.keyframe_points:k.interpolation='LINEAR'
bpy.ops.file.pack_all()
s.frame_set(360);bpy.ops.wm.save_as_mainfile(filepath=str(out/'geography-flight.blend'))
if '--preview' in args:
 for f in [1,65,130,180,245,290,360,450]:
  s.frame_set(f);s.render.filepath=str(out/f'preview-{f:04d}.png');bpy.ops.render.render(write_still=True)
else:
 import shutil
 for f in range(1,481):
  hold=1 if f<=36 else 238 if 239<=f<=258 else 282 if 283<=f<=306 else 330 if 331<=f<=404 else 420 if f==420 else None
  dest=out/'frames'/f'{f:04d}.png'
  if hold and hold!=f:shutil.copyfile(out/'frames'/f'{hold:04d}.png',dest);continue
  s.frame_set(f);s.render.filepath=str(dest);bpy.ops.render.render(write_still=True)

