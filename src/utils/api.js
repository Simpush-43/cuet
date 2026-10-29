// VITE_API_URL is optional: leave empty when the site and API are served by the same server.
export const BASE = import.meta.env.VITE_API_URL || '';
export const apiUrl = (path) => `${BASE}${path}`;

export function getToken() {
  try { return window.sessionStorage.getItem('sb:token') || ''; } catch { return ''; }
}
export function setToken(t) {
  try {
    if (t) window.sessionStorage.setItem('sb:token', t);
    else window.sessionStorage.removeItem('sb:token');
  } catch { /* storage unavailable */ }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

// XHR instead of fetch so we can show upload progress.
export function upload(path, formData, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl(path));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(Object.assign(new Error(data.error || `Upload failed (${xhr.status})`), { status: xhr.status }));
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });
}
