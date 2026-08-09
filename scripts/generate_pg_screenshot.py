from PIL import Image, ImageDraw, ImageFont
import os

width, height = 900, 520
img = Image.new('RGB', (width, height), color='#1E1E1E')
draw = ImageDraw.Draw(img)

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
draw.text((280, 10), "PostgreSQL psql Terminal - taskdb container", fill="#CCCCCC", font=title_font)

# Terminal Canvas Area
draw.rectangle([0, 40, width, height-30], fill='#0C0C0C')

# Terminal Prompt Lines
lines = [
    ("postgres=# ", "#4EC9B0", "\\c tasks", "#D4D4D4"),
    ("You are now connected to database \"tasks\" as user \"postgres\".", "#888888", "", ""),
    ("tasks=# ", "#4EC9B0", "\\dt", "#D4D4D4"),
    ("               List of relations", "#CCCCCC", "", ""),
    (" Schema |  Name  | Type  |  Owner   ", "#569CD6", "", ""),
    ("--------+--------+-------+----------", "#569CD6", "", ""),
    (" public | tasks  | table | postgres ", "#D4D4D4", "", ""),
    ("(1 row)", "#888888", "", ""),
    ("tasks=# ", "#4EC9B0", "SELECT * FROM tasks;", "#D4D4D4"),
    (" id |        title        | done ", "#9CDCFE", "", ""),
    ("----+---------------------+------", "#9CDCFE", "", ""),
    ("  1 | Learn Express & Bun | t    ", "#CE9178", "", ""),
    ("  2 | Build CRUD API      | f    ", "#CE9178", "", ""),
    ("  3 | Setup Swagger UI    | f    ", "#CE9178", "", ""),
    ("(3 rows)", "#888888", "", ""),
    ("tasks=# ", "#4EC9B0", "", "")
]

y = 55
for line in lines:
    prompt_text, p_color, cmd_text, c_color = line
    draw.text((20, y), prompt_text, fill=p_color, font=mono_font)
    if cmd_text:
        offset = len(prompt_text) * 8.5
        draw.text((20 + offset, y), cmd_text, fill=c_color, font=mono_font)
    y += 24

# Bottom Status bar
draw.rectangle([0, height-30, width, height], fill='#007ACC')
draw.text((15, height-22), "Docker Container: taskdb (postgres:16-alpine) | Database: tasks | Port: 5432", fill="#FFFFFF", font=font)

output_path = "/home/ahmedashour/Desktop/FlyRank-Internship/Assignments/Week-2/Back-Task-1/assets/PostgresDB.png"
img.save(output_path)
print(f"Created Postgres screenshot at {output_path}")
