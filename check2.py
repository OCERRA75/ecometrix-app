content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'Sin alertas' in line or ('span' in line and 'brand-400' in line and 'text-lg' in line):
        print(f'{i}: {repr(line.strip())}')
