content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
lines = content.split('\n')
for i in range(93, 103):
    print(f'{i}: {repr(lines[i])}')
