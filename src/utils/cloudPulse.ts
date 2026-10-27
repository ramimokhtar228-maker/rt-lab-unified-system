// نبضة السحابة: فحص خفيف جداً (طلب شرطي) لمعرفة هل يوجد تحديث جديد قبل تنزيل البيانات كاملة
export interface PulseCreds {
  owner?: string;
  repo?: string;
  repoOwner?: string;
  repoName?: string;
  token?: string;
  branch?: string;
}

let lastEtag = '';
let lastSha = '';
let pulseTarget = '';

function targetKey(owner: string, repo: string, branch: string) {
  return `${owner}/${repo}/${branch}`;
}

export async function cloudVersionChanged(cfg: PulseCreds): Promise<boolean> {
  const token = cfg?.token;
  const owner = cfg?.owner || cfg?.repoOwner || 'ramimokhtar228-maker';
  const repo = cfg?.repo || cfg?.repoName || 'rt-lab-unified-system';
  const branch = cfg?.branch || 'main';

  if (!token || !owner || !repo) return true;
  const key = targetKey(owner, repo, branch);
  if (key !== pulseTarget) {
    pulseTarget = key;
    lastEtag = '';
    lastSha = '';
  }
  const url = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'rt-lab-sync',
  };
  if (lastEtag) headers['If-None-Match'] = lastEtag;
  try {
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (res.status === 304) return false;
    if (!res.ok) return true;
    const etag = res.headers.get('etag') || '';
    const body = await res.json();
    const sha = body && body.object ? (body.object.sha as string) : '';
    const changed = !lastSha || (!!sha && sha !== lastSha);
    if (etag) lastEtag = etag;
    if (sha) lastSha = sha;
    return changed;
  } catch {
    return true;
  }
}

export function resetCloudPulse() {
  lastEtag = '';
  lastSha = '';
  pulseTarget = '';
}
