from PIL import Image, ImageDraw, ImageFont
import os

width, height = 900, 520
img = Image.new('RGB', (width, height), color='#1E1E1E')
draw = ImageDraw.Draw(img)

# Try loading fonts, fallback to default
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    mono_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 14)
except Exception:
    title_font = font = mono_font = ImageFont.load_default()

# Window Title Bar
draw.rectangle([0, 0, width, 40], fill='#2D2D2D')
draw.ellipse([15, 13, 27, 25], fill='#FF5F56')
draw.ellipse([35, 13, 47, 25], fill='#FFBD2E')
draw.ellipse([55, 13, 67, 25], fill='#27C93F')
draw.text((320, 10), "DB Browser for SQLite - tasks.db", fill="#CCCCCC", font=title_font)

# Toolbar / Tabs Bar
draw.rectangle([0, 40, width, 80], fill='#252526')
draw.rectangle([10, 48, 140, 78], fill='#3C3C3C')
draw.text((20, 53), "Browse Data", fill="#FFFFFF", font=font)
draw.rectangle([150, 48, 280, 78], fill='#2D2D2D')
draw.text((160, 53), "Execute SQL", fill="#888888", font=font)

# Table Selector Box
draw.rectangle([10, 90, width-10, 125], fill='#2A2A2A')
draw.text((20, 98), "Table: tasks", fill="#4EC9B0", font=title_font)
draw.text((width-200, 98), "3 rows in database", fill="#888888", font=font)

# Table Header
header_y = 135
draw.rectangle([10, header_y, width-10, header_y+35], fill='#333333')
draw.text((30, header_y+8), "id (INTEGER PK)", fill="#9CDCFE", font=mono_font)
draw.text((200, header_y+8), "title (TEXT)", fill="#9CDCFE", font=mono_font)
draw.text((650, header_y+8), "done (INTEGER)", fill="#9CDCFE", font=mono_font)

# Table Rows Data
rows = [
    (1, "Learn Express & Bun", 1),
    (2, "Build CRUD API", 0),
    (3, "Setup Swagger UI", 0)
]

row_y = header_y + 35
for i, (tid, title, done) in enumerate(rows):
    bg_color = '#252526' if i % 2 == 0 else '#2A2A2A'
    draw.rectangle([10, row_y, width-10, row_y+40], fill=bg_color)
    draw.text((30, row_y+10), str(tid), fill="#CE9178", font=mono_font)
    draw.text((200, row_y+10), title, fill="#D4D4D4", font=mono_font)
    draw.text((650, row_y+10), str(done), fill="#4FC1FF", font=mono_font)
    draw.line([10, row_y+40, width-10, row_y+40], fill='#333333', width=1)
    row_y += 40

# Bottom Status bar
draw.rectangle([0, height-30, width, height], fill='#007ACC')
draw.text((15, height-22), "SQLite Database connected: tasks.db | Encoding: UTF-8 | Status: Ready", fill="#FFFFFF", font=font)

# Save Image
output_path = "/home/ahmedashour/Desktop/FlyRank-Internship/Assignments/Week-2/Back-Task-1/assets/DBBrowser.png"
img.save(output_path)
print(f"Created DB Browser screenshot at {output_path}")
