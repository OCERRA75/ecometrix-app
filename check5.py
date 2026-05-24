content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
lines = content.split('\n')
for i in range(118, 128):
    print(f'{i}: {repr(lines[i])}')
