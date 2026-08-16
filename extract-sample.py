import json, sys

d = json.load(open("/home/ubuntu/nibras/nibras-sample-lesson.json"))

def pick(obj):
    if isinstance(obj, str):
        return obj
    if isinstance(obj, dict):
        for k in ("content", "markdown", "result", "output"):
            if k in obj:
                return pick(obj[k])
        return json.dumps(obj, ensure_ascii=False, indent=1)
    return str(obj)

content = pick(d)
open("/home/ubuntu/nibras-sample-lesson.md", "w").write(content)
print("saved:", len(content), "chars")
