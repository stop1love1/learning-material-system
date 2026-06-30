'use client';
import { DB } from '@/app/store/store';
import { filesApi, foldersApi, getToken } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

function driveId(url: string): string | null {
  const m = (url || '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || (url || '').match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}
// lh3.googleusercontent.com — Drive thumbnail redirect target.
function driveThumb(url: string, size = 480): string | null {
  const id = driveId(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${size}` : null;
}

/**
 * Map one /files record into the screen's Doc shape. Used by both the (legacy)
 * loader and the paged list hook so mapping stays identical. The backend now
 * populates `folderName`, so the name-based `folder` label is resolved from that
 * (or the file's tag/subject), without needing a separate folder lookup.
 */
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
    updated: formatRelativeVi(f.updatedAt),
    by: (f.userId && typeof f.userId === 'object' ? f.userId.name : undefined) ?? '—',
    downloads: f.downloadCount ?? 0,
    views: f.viewCount ?? 0,
    url: f.url ?? '',
    desc: f.description ?? '',
    thumb: f.thumbnailUrl || driveThumb(f.url),
  };
}

export async function loadLibrary(): Promise<void> {
  try {
    // Fetch folders FIRST so files can be grouped by their real folder name
    // (file.folderId → folder.name), matching the sidebar/chip labels that the
    // screens group by (d.folder === <folderName>).
    const foldersRes: any = await foldersApi.list();
    const folders: any[] = Array.isArray(foldersRes) ? foldersRes : (foldersRes?.records ?? []);
    const folderMap: Record<string, string> = {};
    folders.forEach((x: Record<string, any>) => { folderMap[String(x._id)] = x.name; });
    DB.DOC_FOLDERS = ['Tất cả', ...folders.map((x: Record<string, any>) => x.name)];
    // Real hierarchical tree for the sidebar (FolderTree consumes flat {id,name,parentId}).
    DB.DOC_FOLDER_TREE = folders.map((f: Record<string, any>) => ({
      id: String(f._id),
      name: f.name,
      parentId: f.parentId ? String(f.parentId?._id ?? f.parentId) : null,
    }));

    // The files list itself is now hook-driven on the library screens, but other
    // screens (home, public kho tài liệu, reader, overview, the task material
    // lookup) still read DB.DOCS, so keep populating it here. Reuse mapFile, then
    // overlay the folder name resolved from the (already fetched) folder list.
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
    // API off / error → clear so no stale data lingers (no fallback).
    DB.DOCS = [];
    DB.DOC_FOLDERS = ['Tất cả'];
    DB.DOC_FOLDER_TREE = [];
    DB.DOWNLOADS = [];
  }
}
