"""Render static HTML from page-template.html and measured image metadata.

Edit the commentary in page-template.html and the gallery titles below,
then run python3 tools/build_page.py. No JS or build service is needed to read
index.html; JS only enhances the method switch and comparison slider.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'assets/results.json').read_text())
TITLES = {'cathedral': 'Cathedral', 'church': 'Church', 'emir': 'Emir', 'harvesters': 'Harvesters', 'icon': 'Icon', 'ilemselga': 'Ilemselga', 'melons': 'Melons', 'monastery': 'Monastery', 'religous_painting': 'Religious Painting', 'self_portrait': 'Self Portrait', 'siren': 'Siren', 'three_generations': 'Three Generations', 'tobolsk': 'Tobolsk', 'wharf': 'Wharf'}

def xy(values):
 return '(' + ', '.join(str(v) for v in values) + ')'

def offsets(item, method):
 d=item[method]
 return f"G {xy(d['green_xy'])} · R {xy(d['red_xy'])}"

def card(item, gallery=False):
 name=item['id']; title=TITLES[name]; w,h=item['display_dimensions']
 attributes=(f' data-image="{name}" data-title="{title}" data-raw-offsets="{offsets(item,"raw")}" data-edges-offsets="{offsets(item,"edges")}"') if gallery else ''
 kind='TIFF · Pyramid' if item['mode']=='pyramid' else 'JPEG · Single scale'
 return f'''<figure class="result-card"{attributes}>
  <a href="assets/{name}-raw.jpg" aria-label="Open {title} reconstruction"><img src="assets/{name}-raw.jpg" alt="{title}, reconstructed with raw-pixel L2 alignment" width="{w}" height="{h}" loading="lazy" decoding="async"></a>
  <figcaption><div class="card-heading"><h3>{title}</h3><span>{kind}</span></div><div class="offset-caption">{offsets(item,'raw')}</div></figcaption>
</figure>'''

lowres='\n'.join(card(i) for i in DATA['images'] if i['mode']=='single-scale')
gallery='\n'.join(card(i, True) for i in DATA['images'])
rows='\n'.join(f'<tr><th scope="row">{TITLES[i["id"]]}</th><td>{i["mode"]}</td>'+''.join(f'<td>{xy(i[m][c])}</td>' for m in ('raw','edges') for c in ('green_xy','red_xy'))+'</tr>' for i in DATA['images'])
page=(ROOT/'tools/page-template.html').read_text()
for key,value in {'LOWRES':lowres, 'GALLERY':gallery, 'OFFSETS':rows}.items():
 page=page.replace('{{'+key+'}}',value)
assert '{{' not in page
(ROOT/'index.html').write_text(page)
print(f'Built {ROOT / "index.html"} with {len(DATA["images"])} gallery images.')
