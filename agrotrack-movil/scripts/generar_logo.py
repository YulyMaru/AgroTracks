"""Logo de AgroTrack: un brote (tallo y dos hojas) saliendo de la tierra, sobre verde.

Genera el icono adaptable vectorial (Android 8+), los PNG de respaldo para cada densidad y un PNG
grande para documentos. Las mismas figuras se usan en el vector y en los PNG.

Uso (desde agrotrack-movil, requiere Pillow: pip install pillow):
    python scripts/generar_logo.py
"""
import os

from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(AQUI, '..', 'android', 'app', 'src', 'main', 'res') + os.sep
DOCS = os.path.join(AQUI, '..', '..', 'docs') + os.sep

VERDE = '#2E7D32'
TIERRA = '#A5D6A7'
HOJA_1 = '#FFFFFF'
HOJA_2 = '#E8F5E9'
ESCALA = 0.9  # deja el dibujo dentro de la zona segura del icono adaptable

# Figuras en el lienzo de 108 x 108 del icono adaptable.
TIERRA_PATH = 'M28,82 Q54,64 80,82 Z'
TALLO_PATH = 'M54,77 Q53,62 54,48'
HOJA_IZQ_PATH = 'M54,56 C44,57 35,50 33,38 C45,37 53,45 54,56 Z'
HOJA_DER_PATH = 'M54,50 C55,38 63,30 76,29 C76,42 67,50 54,50 Z'

VECTOR = f'''<?xml version="1.0" encoding="utf-8"?>
<!-- Logo de AgroTrack: brote saliendo de la tierra. Generado por scripts/generar_logo.py. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group android:pivotX="54" android:pivotY="54" android:scaleX="{ESCALA}" android:scaleY="{ESCALA}">
        <path android:fillColor="{TIERRA}" android:pathData="{TIERRA_PATH}" />
        <path android:strokeColor="{HOJA_1}" android:strokeWidth="5" android:strokeLineCap="round"
            android:pathData="{TALLO_PATH}" />
        <path android:fillColor="{HOJA_1}" android:pathData="{HOJA_IZQ_PATH}" />
        <path android:fillColor="{HOJA_2}" android:pathData="{HOJA_DER_PATH}" />
    </group>
</vector>
'''

ADAPTABLE = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icono_fondo" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
'''

COLORES = f'''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Fondo del icono de la app (el mismo verde de la app). -->
    <color name="icono_fondo">{VERDE}</color>
</resources>
'''


def escribir(ruta, texto):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8', newline='\n') as f:
        f.write(texto)


# --- Dibujo en PNG con las mismas figuras -------------------------------------------------------
def bezier(p0, p1, p2, p3, n=40):
    return [(((1 - t) ** 3) * p0[0] + 3 * ((1 - t) ** 2) * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0],
             ((1 - t) ** 3) * p0[1] + 3 * ((1 - t) ** 2) * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1])
            for t in (i / n for i in range(n + 1))]


def cuadratica(p0, p1, p2, n=40):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
            for t in (i / n for i in range(n + 1))]


def dibujar(tamano, forma):
    """Icono de `tamano` px. forma: 'cuadrado' (redondeado), 'circulo' o 'completo' (sin recorte)."""
    k = 8  # se dibuja grande y se reduce para que los bordes queden suaves
    lado = 108 * k
    img = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def t(p):  # escala alrededor del centro como el <group> del vector
        return ((54 + (p[0] - 54) * ESCALA) * k, (54 + (p[1] - 54) * ESCALA) * k)

    d.rectangle([0, 0, lado, lado], fill=VERDE)
    d.polygon([t(p) for p in cuadratica((28, 82), (54, 64), (80, 82))], fill=TIERRA)
    # Tallo con punta redonda: circulos muy seguidos a lo largo de la curva (sin uniones visibles).
    radio = 5 * ESCALA * k / 2
    for x, y in (t(p) for p in cuadratica((54, 77), (53, 62), (54, 48), n=400)):
        d.ellipse([x - radio, y - radio, x + radio, y + radio], fill=HOJA_1)
    d.polygon([t(p) for p in bezier((54, 56), (44, 57), (35, 50), (33, 38)) + bezier((33, 38), (45, 37), (53, 45), (54, 56))],
              fill=HOJA_1)
    d.polygon([t(p) for p in bezier((54, 50), (55, 38), (63, 30), (76, 29)) + bezier((76, 29), (76, 42), (67, 50), (54, 50))],
              fill=HOJA_2)

    if forma != 'completo':
        # Los iconos de antes de Android 8 muestran la zona visible del adaptable (18..90).
        img = img.crop((18 * k, 18 * k, 90 * k, 90 * k))
        mascara = Image.new('L', img.size, 0)
        m = ImageDraw.Draw(mascara)
        if forma == 'circulo':
            m.ellipse([0, 0, img.size[0], img.size[1]], fill=255)
        else:
            m.rounded_rectangle([0, 0, img.size[0], img.size[1]], radius=int(img.size[0] * 0.2), fill=255)
        img.putalpha(mascara)
    return img.resize((tamano, tamano), Image.LANCZOS)


DENSIDADES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

escribir(RES + 'drawable/ic_launcher_foreground.xml', VECTOR)
escribir(RES + 'mipmap-anydpi-v26/ic_launcher.xml', ADAPTABLE)
escribir(RES + 'mipmap-anydpi-v26/ic_launcher_round.xml', ADAPTABLE)
escribir(RES + 'values/colors.xml', COLORES)
for densidad, tamano in DENSIDADES.items():
    dibujar(tamano, 'cuadrado').save(RES + f'mipmap-{densidad}/ic_launcher.png')
    dibujar(tamano, 'circulo').save(RES + f'mipmap-{densidad}/ic_launcher_round.png')
dibujar(1024, 'cuadrado').save(DOCS + 'logo-agrotrack.png')
print('logo listo')
