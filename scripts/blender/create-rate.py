"""Build the slide 27 coupon-rate animation in Blender 5.2.
Usage: blender --background --factory-startup --python create-rate.py -- OUTPUT_DIR [--preview]
Then encode frames with ffmpeg: -framerate 24 -i frames/%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart.
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];out=Path(args[0]);out.mkdir(parents=True,exist_ok=True);(out/'frames').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=800;s.render.resolution_y=400;s.render.resolution_percentage=100;s.render.fps=24;s.frame_start=1;s.frame_end=72
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.view_settings.view_transform='AgX';s.world.color=(0.025,0.04,0.045)
if hasattr(s.eevee,'taa_render_samples'):s.eevee.taa_render_samples=64

def material(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
lime=material('Lime enamel',(0.64,0.92,0.12),.48,.23);teal=material('Midnight teal',(0.006,0.026,0.034),.12,.52)
c=bpy.data.curves.new('Rate typography','FONT');c.body='24%';c.font=bpy.data.fonts.load('C:/Windows/Fonts/arialbd.ttf');c.align_x='CENTER';c.align_y='CENTER';c.size=2.6;c.extrude=.10;c.bevel_depth=.026;c.bevel_resolution=4;c.resolution_u=16
text=bpy.data.objects.new('Rate 24 percent',c);s.collection.objects.link(text);c.materials.append(lime);bpy.context.view_layer.update();scale=5.05/text.dimensions.x;text.scale=(scale,)*3
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.30));bpy.context.object.name='Backdrop';bpy.context.object.data.materials.append(teal)
camdata=bpy.data.cameras.new('Rate camera');cam=bpy.data.objects.new('Rate camera',camdata);s.collection.objects.link(cam);cam.location=(0,0,10);cam.rotation_euler=(0,0,0);camdata.type='ORTHO';camdata.ortho_scale=6.25;s.camera=cam

def light(name,pos,power,color,size):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler();return o
key=light('Moving softbox',(-3,3,5),650,(.80,1,.91),5);light('Cyan edge',(3,-1,3),450,(.20,.80,1),3);light('Soft fill',(0,-4,5),350,(1,.96,.83),4)
for frame in range(1,74):
 phase=2*math.pi*(frame-1)/72
 text.rotation_euler=(math.radians(3)*math.sin(phase),math.radians(5)*math.cos(phase),0);text.keyframe_insert('rotation_euler',frame=frame)
 key.location.x=-3+1.6*math.sin(phase);key.rotation_euler=(Vector((0,0,0))-key.location).to_track_quat('-Z','Y').to_euler();key.keyframe_insert('location',frame=frame);key.keyframe_insert('rotation_euler',frame=frame)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(out/'rate-24.blend'))
if '--preview' in args:
 s.render.filepath=str(out/'preview.png');bpy.ops.render.render(write_still=True)
else:
 s.render.filepath=str(out/'frames')+'/';bpy.ops.render.render(animation=True)
