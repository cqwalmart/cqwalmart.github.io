import json, math
from pathlib import Path

base = Path('/home/cqclaw/.openclaw/workspace/shanghai-quiz')
with open(base/'v4-matrix-data.json','r',encoding='utf-8') as f:
    data = json.load(f)

schools = data['schoolOrder']
qs = data['questions']
N = len(schools)

means = [0.0]*N
vars_ = [0.0]*N
max_pool = [0.0]*N
for q in qs:
    w = q['weight']
    opts = [q['options'][k] for k in ['A','B','C','D']]
    for s in range(N):
        vals = [w*opt[s] for opt in opts]
        m = sum(vals)/4.0
        means[s] += m
        vars_[s] += sum((v-m)**2 for v in vals)/4.0
        max_pool[s] += max(vals)
sds = [math.sqrt(v) for v in vars_]

profiles = {
    '理解内化型': ['A','B','D','A','A','A','A','A','A','B','A','A','A','A','C','B'],
    '硬度做事型': ['B','B','A','B','B','B','B','B','B','A','B','B','B','B','A','D'],
    '顺感状态型': ['C','A','D','C','C','C','C','D','C','C','C','C','C','C','A','A'],
    '非模板探索型': ['D','D','C','D','D','D','A','A','A','D','D','D','D','D','D','C'],
    '现实路径型': ['B','B','C','B','D','B','B','B','B','A','B','B','D','B','B','D']
}

def score_profile(ans):
    raw = [0.0]*N
    for q,choice in zip(qs, ans):
        vec = q['options'][choice]
        w = q['weight']
        for s in range(N):
            raw[s] += w*vec[s]
    z = [(raw[s]-means[s])/sds[s] if sds[s] > 1e-9 else 0.0 for s in range(N)]
    rc = [(raw[s]-means[s])/max_pool[s] if max_pool[s] > 1e-9 else 0.0 for s in range(N)]
    mix = [0.75*z[s] + 0.25*rc[s] for s in range(N)]
    return raw, z, rc, mix

def corr(a,b):
    ma = sum(a)/len(a); mb = sum(b)/len(b)
    va = sum((x-ma)**2 for x in a); vb = sum((y-mb)**2 for y in b)
    if va <= 1e-12 or vb <= 1e-12:
        return 0.0
    cov = sum((x-ma)*(y-mb) for x,y in zip(a,b))
    return cov / math.sqrt(va*vb)

lines = []
lines.append('# v4 跑分结果（工作版）')
lines.append('')
lines.append('## 学校常数（基于 v4 粗矩阵随机等概率）')
for i,s in enumerate(schools):
    lines.append(f'- {s}: max_pool={max_pool[i]:.3f}, mean_random={means[i]:.3f}, sd_random={sds[i]:.3f}')
lines.append('')

for name, ans in profiles.items():
    raw,z,rc,mix = score_profile(ans)
    order = sorted(range(N), key=lambda i: mix[i], reverse=True)
    top = order[:5]
    second_gap = mix[order[0]] - mix[order[1]]
    lines.append(f'## 档案：{name}')
    lines.append(f'- 答案串: {"".join(ans)}')
    lines.append(f'- z/raw_centered 相关度: {corr(z, rc):.3f}')
    lines.append(f'- 第一名与第二名差距（mix）: {second_gap:.3f}')
    lines.append('- mix 排行前五:')
    for idx in top:
        lines.append(f'  - {schools[idx]} | raw={raw[idx]:.3f} | z={z[idx]:.3f} | rc={rc[idx]:.3f} | mix={mix[idx]:.3f}')
    lines.append('')

with open(base/'v4-scoring-results.md','w',encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(base/'v4-scoring-results.md')
