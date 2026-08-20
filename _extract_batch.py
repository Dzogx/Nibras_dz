data = open('.manus-logs/networkRequests.log').read()
lines = data.splitlines()
for line in lines:
    if 'lessons.list,situations.listPending' not in line:
        continue
    idx = line.find('"result":')
    if idx == -1:
        continue
    after = line[idx + len('"result":'): idx + len('"result":') + 120]
    print('AFTER:', repr(after))
    break
