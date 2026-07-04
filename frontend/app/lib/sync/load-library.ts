'use client';
import { DB } from '@/app/store/store';
import { filesApi, foldersApi, getToken } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

function driveId(url: string): string | null {
  const m = (url || '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || (url || '').match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}
function driveThumb(url: string, size = 480): string | null {
  const id = driveId(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${size}` : null;
}
// Fallback preview for any external web link (no stored thumbnailUrl, not a Drive
// file): a screenshot of the page via WordPress mShots. Best-effort — the card's
// onError hides a broken image and falls back to the file icon.
function linkThumb(url: string): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (driveId(url)) return null;
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=480&h=300`;
}

/** Map /files record → Doc shape (shared by loader + paged hook). */
export function mapFile(f: Record<string, any>): Record<string, any> {
  return {
    id: f._id,
    name: f.name,
    type: f.fileType,
    size: f.sizeLabel ?? '',
    folderId: f.folderId != null ? String(f.folderId?._id ?? f.folderId) : null,
    folder:
      f.folderName ??
      (f.folderId != null && typeof f.folderId === 'object' ? f.folderId.name : undefined) ??
      (Array.isArray(f.tags) ? f.tags[0] : undefined) ??
      f.subject ??
      'Tư liệu',
    tags: Array.isArray(f.tags) ? f.tags : [],
    updated: formatRelativeVi(f.updatedAt),
    by: (f.userId && typeof f.userId === 'object' ? f.userId.name : undefined) ?? '—',
    downloads: f.downloadCount ?? 0,
    views: f.viewCount ?? 0,
    url: f.url ?? '',
    desc: f.description ?? '',
    thumb: f.thumbnailUrl || driveThumb(f.url) || linkThumb(f.url),
  };
}

export async function loadLibrary(): Promise<void> {
  try {
    // Fetch every visible folder (not just root) so sub-folders enter the tree
    // and 'Thêm thư mục con' works; auth is sent when logged in (owner's own folders).
    const foldersRes: any = await foldersApi.listAll();
    const folders: any[] = Array.isArray(foldersRes) ? foldersRes : (foldersRes?.records ?? []);
    const folderMap: Record<string, string> = {};
    folders.forEach((x: Record<string, any>) => { folderMap[String(x._id)] = x.name; });
    DB.DOC_FOLDERS = ['Tất cả', ...folders.map((x: Record<string, any>) => x.name)];
    DB.DOC_FOLDER_TREE = folders.map((f: Record<string, any>) => ({
      id: String(f._id),
      name: f.name,
      parentId: f.parentId ? String(f.parentId?._id ?? f.parentId) : null,
    }));

    // NOTE: this snapshot only feeds the per-folder count badges (resources.tsx reads
    // the paginated list separately). filesApi.list is a @Public read that omits auth,
    // so counts reflect only guest-visible files (capped at 200) — an owner's private
    // files are not counted here. Making counts auth/owner-aware needs a dedicated
    // count endpoint; left as-is for now.
    const filesRes: any = await filesApi.list({ pageSize: 200 });
    const files: any[] = filesRes?.records ?? [];
    DB.DOCS = files.map((f: Record<string, any>) => {
      const doc = mapFile(f);
      const resolved = doc.folderId ? folderMap[String(doc.folderId)] : undefined;
      if (resolved) doc.folder = resolved;
      return doc;
    });

    if (getToken()) {
      const mine: any[] = (await filesApi.myDownloads()) ?? [];
      DB.DOWNLOADS = mine.map((f: Record<string, any>) => f._id);
    } else {
      DB.DOWNLOADS = [];
    }
  } catch {
    DB.DOCS = [];
    DB.DOC_FOLDERS = ['Tất cả'];
    DB.DOC_FOLDER_TREE = [];
    DB.DOWNLOADS = [];
  }
}

/**
 * Fetch a single file by id (GET /files/:id — also $inc's viewCount) and upsert it
 * into DB.DOCS by id. This is what makes the "lượt xem" counter go up when a document
 * is opened, and guarantees the reader shows the exact requested file fresh from the
 * API rather than a stale list snapshot. Best-effort: leaves DB untouched on error.
 */
export async function loadDoc(id: string): Promise<void> {
  if (!id) return;
  try {
    const rec: any = await filesApi.get(id);
    if (!rec?._id) return;
    const doc = mapFile(rec);
    const tree: any[] = (DB as any).DOC_FOLDER_TREE || [];
    const resolved = doc.folderId ? tree.find((x: any) => String(x.id) === String(doc.folderId))?.name : undefined;
    if (resolved) doc.folder = resolved;
    const i = DB.DOCS.findIndex((x: any) => x.id === doc.id);
    if (i >= 0) DB.DOCS[i] = doc;
    else DB.DOCS = [...DB.DOCS, doc];
  } catch {
    /* best-effort */
  }
}
