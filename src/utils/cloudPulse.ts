// نبضة السحابة: فحص خفيف جداً (طلب شرطي ETag) لمعرفة هل يوجد تحديث جديد قبل تنزيل البيانات كاملة
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
let rateLimitRemaining = 5000;

function targetKey(owner: string, repo: string, branch: string) {
  return `${owner}/${repo}/${branch}`;
}

export async function cloudVersionChanged(cfg: PulseCreds): Promise<boolean> {
  const token = cfg?.token;
  const owner = cfg?.owner || cfg?.repoOwner || 'ramimokhtar228-maker';
  const repo = cfg?.repo || cfg?.repoName || 'rt-lab-unified-system';
  const branch = cfg?.branch || 'main';

  if (!token || !owner || !repo) return true;

  // Protect against rate limit exhaustion
  if (rateLimitRemaining < 15) {
    return false;
  }

  const key = targetKey(owner, repo, branch);
  if (key !== pulseTarget) {
    pulseTarget = key;
    lastEtag = '';
    lastSha = '';
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;
  const headers: Record<string, string> = {
    Authorization: `token ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'rt-lab-sync',
  };

  if (lastEtag) headers['If-None-Match'] = lastEtag;

  try {
    const res = await fetch(url, { headers, cache: 'no-store' });

    // Update remaining rate limit if available
    const rlRem = res.headers.get('x-ratelimit-remaining');
    if (rlRem) {
      rateLimitRemaining = parseInt(rlRem, 10);
    }

    if (res.status === 304) {
      return false; // لا توجد أي تغييرات جديدة على المستودع
    }

    if (res.status === 403 || res.status === 429) {
      // تم بلوغ حد الطلبات، لا نكرر الطلب لتفادي الحظر
      return false;
    }

    if (!res.ok) {
      return false;
    }

    const etag = res.headers.get('etag') || '';
    const body = await res.json();
    const sha = body && body.object ? (body.object.sha as string) : '';

    // If local storage has the exact same commit sha, it means this device just pushed it!
    const storedSha = typeof window !== 'undefined' ? localStorage.getItem('rt_head_commit_sha') : null;
    if (sha && storedSha && sha === storedSha) {
      lastSha = sha;
      if (etag) lastEtag = etag;
      return false;
    }

    const changed = !lastSha || (!!sha && sha !== lastSha);
    if (etag) lastEtag = etag;
    if (sha) lastSha = sha;
    return changed;
  } catch {
    return false;
  }
}

export function resetCloudPulse() {
  lastEtag = '';
  lastSha = '';
  pulseTarget = '';
}
