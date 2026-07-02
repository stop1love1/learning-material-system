'use client';
import React from 'react';
import { Icon } from '@/app/components/ui';

export type TreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  count?: number;
};

/**
 * Generic collapsible folder/topic tree sidebar. Builds the hierarchy from a flat
 * list of `{ id, name, parentId }` nodes (the backend tree schemas — Folder / Topic /
 * ExerciseFolder — all expose parentId). Used by the library, question-bank and
 * exercise screens so the four content areas are browsed as a tree.
 *
 * `selectedId === null` means the synthetic "all" root is selected.
 */
export function FolderTree({
  nodes,
  selectedId,
  onSelect,
  p,
  allLabel = 'Tất cả',
  allCount,
  entityLabel = 'thư mục',
  onAddRoot,
  onAddChild,
  onRename,
  onDelete,
}: {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  p: any;
  allLabel?: string;
  allCount?: number;
  entityLabel?: string;
  onAddRoot?: () => void;
  onAddChild?: (parentId: string) => void;
  onRename?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
}) {
  const childrenOf = React.useMemo(() => {
    const map: Record<string, TreeNode[]> = {};
    for (const n of nodes) {
      const key = n.parentId ? String(n.parentId) : 'root';
      (map[key] ||= []).push(n);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return map;
  }, [nodes]);

  // Số hiển thị cạnh mỗi chủ đề = số của chính nó + tổng của mọi chủ đề con (đệ quy).
  // `null` khi không node nào có `count` (các cây không truyền số thì không hiện gì).
  const subtreeCount = React.useMemo(() => {
    let anyCount = false;
    const own: Record<string, number> = {};
    for (const n of nodes) { if (n.count != null) anyCount = true; own[String(n.id)] = n.count || 0; }
    if (!anyCount) return null;
    const memo: Record<string, number> = {};
    const calc = (id: string, seen: Set<string>): number => {
      if (memo[id] != null) return memo[id];
      if (seen.has(id)) return own[id] || 0; // chống chu trình dữ liệu xấu
      seen.add(id);
      let sum = own[id] || 0;
      for (const c of childrenOf[id] || []) sum += calc(String(c.id), seen);
      memo[id] = sum;
      return sum;
    };
    for (const n of nodes) calc(String(n.id), new Set());
    return memo;
  }, [nodes, childrenOf]);

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  const hasActions = !!(onAddChild || onRename || onDelete);

  const rowBase =
    'lms-nav-item group/treenode flex cursor-pointer items-center gap-1.5 rounded-[9px] py-2 pr-2 text-[13px]';

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const kids = childrenOf[String(node.id)] || [];
    const isOpen = !collapsed[node.id];
    const on = selectedId === node.id;
    return (
      <div key={node.id}>
        <div
          className={`${rowBase} ${on ? 'bg-lms-active-bg font-semibold text-lms-ink' : 'bg-transparent font-[450] text-lms-sub'}`}
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (kids.length) toggle(node.id); }}
            className="flex h-4 w-4 shrink-0 items-center justify-center"
            aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
          >
            {kids.length > 0 && (
              <Icon name="chevronDown" size={13} stroke={p.faint} style={{ transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }} />
            )}
          </button>
          <div onClick={() => onSelect(node.id)} className="flex min-w-0 flex-1 items-center gap-[7px]">
            <Icon name="folder" size={15} stroke={on ? p.accent : p.faint} />
            <span className="truncate">{node.name}</span>
            {subtreeCount && (
              <span className="ml-auto font-mono text-[10.5px] text-lms-faint">{subtreeCount[String(node.id)] ?? 0}</span>
            )}
          </div>
          {hasActions && (
            <div className="hidden shrink-0 items-center gap-0.5 group-hover/treenode:flex">
              {onAddChild && (
                <button type="button" title={`Thêm ${entityLabel} con`} onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }} className="flex h-5 w-5 items-center justify-center rounded hover:bg-lms-sink">
                  <Icon name="plus" size={13} stroke={p.faint} />
                </button>
              )}
              {onRename && (
                <button type="button" title="Đổi tên" onClick={(e) => { e.stopPropagation(); onRename(node); }} className="flex h-5 w-5 items-center justify-center rounded hover:bg-lms-sink">
                  <Icon name="pen" size={13} stroke={p.faint} />
                </button>
              )}
              {onDelete && (
                <button type="button" title="Xoá" onClick={(e) => { e.stopPropagation(); onDelete(node); }} className="flex h-5 w-5 items-center justify-center rounded hover:bg-lms-sink">
                  <Icon name="trash" size={13} stroke={p.faint} />
                </button>
              )}
            </div>
          )}
        </div>
        {isOpen && kids.length > 0 && <div>{kids.map((k) => renderNode(k, depth + 1))}</div>}
      </div>
    );
  };

  const roots = childrenOf['root'] || [];

  return (
    <div className="flex flex-col gap-0.5">
      <div
        onClick={() => onSelect(null)}
        className={`${rowBase} ${selectedId === null ? 'bg-lms-active-bg font-semibold text-lms-ink' : 'bg-transparent font-[450] text-lms-sub'}`}
        style={{ paddingLeft: 8 }}
      >
        <Icon name="cloud" size={15} stroke={selectedId === null ? p.accent : p.faint} />
        <span className="flex-1">{allLabel}</span>
        {allCount != null && <span className="font-mono text-[10.5px] text-lms-faint">{allCount}</span>}
      </div>
      {roots.map((r) => renderNode(r, 0))}
      {onAddRoot && (
        <button
          type="button"
          onClick={onAddRoot}
          className="mt-1 flex items-center gap-1.5 rounded-[9px] px-2 py-2 text-[12.5px] font-medium text-lms-sub hover:bg-lms-sink"
        >
          <Icon name="plus" size={14} stroke={p.faint} />
          <span>Thêm {entityLabel}</span>
        </button>
      )}
    </div>
  );
}
