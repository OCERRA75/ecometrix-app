content = open('src/pages/Dashboard360.jsx', encoding='utf-8').read()
content = content.replace("icon: '',", "icon: '\U0001F4CB',")
open('src/pages/Dashboard360.jsx', 'w', encoding='utf-8').write(content)
print('Done')
