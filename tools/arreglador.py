#!/usr/bin/env python3
import sys
import re
from bs4 import BeautifulSoup

def usage():
    print("Uso:")
    print("  python herramienta.py <archivo.html> <ruta_imagenes>")
    print("Ejemplo:")
    print("  python herramienta.py input.html https://raw.githubusercontent.com/envertex/images/refs/heads/main/writeups/flight/images/")
    sys.exit(1)

if len(sys.argv) != 3:
    usage()

input_file = sys.argv[1]
base_img_url = sys.argv[2].rstrip("/") + "/"

# Leer HTML
try:
    with open(input_file, "r", encoding="utf-8") as f:
        html = f.read()
except FileNotFoundError:
    print("[!] Archivo no encontrado")
    sys.exit(1)

# Buscar imágenes tipo Obsidian
pattern = re.compile(r'!\[\[.*?\]\]')
matches = pattern.findall(html)

img_counter = 1

for match in matches:
    img_tag = f'<img class="post-vertex-cover" src="{base_img_url}img{img_counter}.png">'
    html = html.replace(match, img_tag, 1)
    img_counter += 1

# Parsear y formatear HTML
soup = BeautifulSoup(html, "html.parser")

formatted_html = soup.prettify(formatter="html")

# Guardar salida
output_file = "output_formatted.html"
with open(output_file, "w", encoding="utf-8") as f:
    f.write(formatted_html)

print(f"[+] Listo. HTML formateado guardado como: {output_file}")
print(f"[+] Imágenes generadas: {img_counter - 1}")
