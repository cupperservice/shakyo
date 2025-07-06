"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  id: string;
  name: string;
  type: 'folder' | 'group';
  children?: MenuItem[];
  isOpen?: boolean;
}

interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview?: string; // プレビュー画像のURL
  strokeCount: number;
  groupId: string; // グループIDを追加
}

type ViewMode = 'tile' | 'list';
type SortField = 'title' | 'createdAt' | 'updatedAt' | 'strokeCount';
type SortOrder = 'asc' | 'desc';

export default function Home() {
  const { isLoggedIn, userEmail, logout } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'プロジェクト',
      type: 'folder',
      isOpen: true,
      children: [
        { id: '1-1', name: '設計・開発', type: 'group' },
        { id: '1-2', name: '会議・ミーティング', type: 'group' },
        { id: '1-3', name: 'アイデア・スケッチ', type: 'group' },
        { id: '1-4', name: '学習・研究', type: 'group' }
      ]
    },
    {
      id: '2',
      name: 'ドキュメント',
      type: 'folder',
      isOpen: false,
      children: [
        { id: '2-1', name: '技術文書', type: 'group' },
        { id: '2-2', name: 'マニュアル', type: 'group' },
        { id: '2-3', name: 'レポート', type: 'group' }
      ]
    },
    {
      id: '3',
      name: 'アーカイブ',
      type: 'folder',
      isOpen: false,
      children: [
        { id: '3-1', name: '完了プロジェクト', type: 'group' },
        { id: '3-2', name: '古いドキュメント', type: 'group' }
      ]
    }
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: '会議メモ - 2024年1月15日',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:45:00Z',
      strokeCount: 156,
      groupId: '1-2'
    },
    {
      id: '2',
      title: 'アイデアスケッチ',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T16:10:00Z',
      strokeCount: 89,
      groupId: '1-3'
    },
    {
      id: '3',
      title: '設計図面',
      createdAt: '2024-01-13T09:15:00Z',
      updatedAt: '2024-01-13T12:30:00Z',
      strokeCount: 234,
      groupId: '1-1'
    },
    {
      id: '4',
      title: '学習ノート - React基礎',
      createdAt: '2024-01-12T16:45:00Z',
      updatedAt: '2024-01-12T18:20:00Z',
      strokeCount: 67,
      groupId: '1-4'
    },
    {
      id: '5',
      title: 'API設計書',
      createdAt: '2024-01-11T13:30:00Z',
      updatedAt: '2024-01-11T15:20:00Z',
      strokeCount: 123,
      groupId: '2-1'
    },
    {
      id: '6',
      title: 'ユーザーマニュアル',
      createdAt: '2024-01-10T11:15:00Z',
      updatedAt: '2024-01-10T14:45:00Z',
      strokeCount: 98,
      groupId: '2-2'
    }
  ]);

  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    itemId: string;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // localStorageからドキュメントと選択されたグループIDを読み込み
  useEffect(() => {
    const savedDocuments = localStorage.getItem('documents');
    const savedSelectedGroupId = localStorage.getItem('selectedGroupId');
    
    if (savedDocuments) {
      const parsedDocuments = JSON.parse(savedDocuments);
      // 既存のドキュメントとlocalStorageのドキュメントをマージ
      setDocuments(prev => {
        const existingIds = new Set(prev.map(doc => doc.id));
        const newDocuments = parsedDocuments.filter((doc: any) => !existingIds.has(doc.id));
        return [...prev, ...newDocuments];
      });
    }
    
    if (savedSelectedGroupId) {
      setSelectedGroupId(savedSelectedGroupId);
      // 保存されたグループIDをクリア
      localStorage.removeItem('selectedGroupId');
    }
  }, []);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const findItemById = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const findParentById = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.children) {
        if (item.children.some(child => child.id === id)) {
          return item;
        }
        const found = findParentById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const removeItemById = (items: MenuItem[], id: string): MenuItem[] => {
    return items.map(item => {
      if (item.children) {
        return {
          ...item,
          children: removeItemById(item.children, id)
        };
      }
      return item;
    }).filter(item => item.id !== id);
  };

  const addItemToParent = (items: MenuItem[], parentId: string, newItem: MenuItem): MenuItem[] => {
    return items.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          children: [...(item.children || []), newItem]
        };
      }
      if (item.children) {
        return {
          ...item,
          children: addItemToParent(item.children, parentId, newItem)
        };
      }
      return item;
    });
  };

  const toggleFolder = (itemId: string) => {
    const updateItems = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    setMenuItems(updateItems(menuItems));
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      itemId
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const addFolder = (parentId?: string) => {
    const newFolder: MenuItem = {
      id: generateId(),
      name: '新しいフォルダ',
      type: 'folder',
      isOpen: false,
      children: []
    };

    if (parentId) {
      setMenuItems(addItemToParent(menuItems, parentId, newFolder));
    } else {
      setMenuItems([...menuItems, newFolder]);
    }
    closeContextMenu();
  };

  const addGroup = (parentId?: string) => {
    const newGroup: MenuItem = {
      id: generateId(),
      name: '新しいグループ',
      type: 'group'
    };

    if (parentId) {
      setMenuItems(addItemToParent(menuItems, parentId, newGroup));
    } else {
      setMenuItems([...menuItems, newGroup]);
    }
    closeContextMenu();
  };

  const deleteItem = (itemId: string) => {
    setMenuItems(removeItemById(menuItems, itemId));
    closeContextMenu();
  };

  const startEditing = (itemId: string, currentName: string) => {
    setEditingItem({ id: itemId, name: currentName });
    closeContextMenu();
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const updateItems = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === editingItem.id) {
          return { ...item, name: editingItem.name };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };

    setMenuItems(updateItems(menuItems));
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedItemData = findItemById(menuItems, draggedItem);
    if (!draggedItemData) return;

    // ドラッグしたアイテムを削除
    let newItems = removeItemById(menuItems, draggedItem);
    
    // ターゲットに追加
    newItems = addItemToParent(newItems, targetId, draggedItemData);
    
    setMenuItems(newItems);
    setDraggedItem(null);
  };

  // ソート機能
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同じフィールドの場合は順序を切り替え
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 新しいフィールドの場合は昇順で開始
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // ソートアイコンを取得
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const paddingLeft = level * 16;
    const isEditing = editingItem?.id === item.id;
    const isSelected = selectedGroupId === item.id;
    
    if (item.type === 'folder') {
      return (
        <div key={item.id}>
          <div
            className="flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer text-sm"
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => toggleFolder(item.id)}
            onDoubleClick={() => startEditing(item.id, item.name)}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDragDrop(e, item.id)}
          >
            <span className="mr-2 text-gray-500">
              {item.isOpen ? '📂' : '📁'}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="flex-1 bg-white border border-gray-300 rounded px-1 py-0.5 text-sm text-gray-900"
                autoFocus
              />
            ) : (
              <span className="text-gray-700">{item.name}</span>
            )}
          </div>
          {item.isOpen && item.children && (
            <div>
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={item.id}
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer text-sm ${
            isSelected ? 'bg-indigo-100 text-indigo-700' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
          onClick={() => handleGroupClick(item.id)}
          onDoubleClick={() => startEditing(item.id, item.name)}
          onContextMenu={(e) => handleContextMenu(e, item.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDragDrop(e, item.id)}
        >
          <span className="mr-2 text-gray-500">📋</span>
          {isEditing ? (
            <input
              type="text"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="flex-1 bg-white border border-gray-300 rounded px-1 py-0.5 text-sm text-gray-900"
              autoFocus
            />
          ) : (
            <span className={isSelected ? 'text-indigo-700' : 'text-gray-700'}>{item.name}</span>
          )}
        </div>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 選択されたグループのドキュメントをフィルタリング
  const filteredDocuments = selectedGroupId 
    ? documents.filter(doc => doc.groupId === selectedGroupId)
    : documents;

  // ソートを適用
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case 'strokeCount':
        aValue = a.strokeCount;
        bValue = b.strokeCount;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const selectedGroupName = selectedGroupId 
    ? findItemById(menuItems, selectedGroupId)?.name 
    : null;

  const renderTileView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedDocuments.map((doc) => (
        <div
          key={doc.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          {/* プレビューエリア */}
          <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
          </div>
          
          {/* ドキュメント情報 */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-2 truncate">
              {doc.title}
            </h3>
            <div className="text-sm text-gray-500 space-y-1">
              <div>作成: {formatDate(doc.createdAt)}</div>
              <div>更新: {formatDate(doc.updatedAt)}</div>
              <div>ストローク数: {doc.strokeCount}</div>
            </div>
            
            {/* アクションボタン */}
            <div className="mt-4 flex gap-2">
              <Link
                href={`/canvas?groupId=${doc.groupId}&editId=${doc.id}`}
                className="flex-1 bg-indigo-500 text-white py-2 px-3 rounded text-sm hover:bg-indigo-600 transition-colors text-center"
              >
                編集
              </Link>
              <button className="bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300 transition-colors">
                削除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-4">
            <button
              onClick={() => handleSort('title')}
              className="flex items-center hover:text-gray-900 transition-colors"
            >
              タイトル {getSortIcon('title')}
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => handleSort('createdAt')}
              className="flex items-center hover:text-gray-900 transition-colors"
            >
              作成日 {getSortIcon('createdAt')}
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => handleSort('updatedAt')}
              className="flex items-center hover:text-gray-900 transition-colors"
            >
              更新日 {getSortIcon('updatedAt')}
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => handleSort('strokeCount')}
              className="flex items-center hover:text-gray-900 transition-colors"
            >
              ストローク数 {getSortIcon('strokeCount')}
            </button>
          </div>
          <div className="col-span-2">アクション</div>
        </div>
      </div>
      
      {/* リストアイテム */}
      {sortedDocuments.map((doc) => (
        <div
          key={doc.id}
          className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <div className="flex items-center">
                <span className="font-medium text-gray-800 truncate">{doc.title}</span>
              </div>
            </div>
            <div className="col-span-2 text-sm text-gray-600">
              {formatDate(doc.createdAt)}
            </div>
            <div className="col-span-2 text-sm text-gray-600">
              {formatDate(doc.updatedAt)}
            </div>
            <div className="col-span-2 text-sm text-gray-600">
              {doc.strokeCount}
            </div>
            <div className="col-span-2 flex gap-2">
              <Link
                href={`/canvas?groupId=${doc.groupId}&editId=${doc.id}`}
                className="bg-indigo-500 text-white py-1 px-3 rounded text-sm hover:bg-indigo-600 transition-colors">
                編集
              </Link>
              <button className="bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-300 transition-colors">
                削除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        {/* 左サイドバー - ツリーメニュー */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">ファイル</h2>
            <button
              onClick={() => addFolder()}
              className="text-indigo-600 hover:text-indigo-800 text-lg font-bold w-6 h-6 flex items-center justify-center"
              title="フォルダを追加"
            >
              +
            </button>
          </div>
          <div className="space-y-1">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 relative bg-gray-50">
          {/* ヘッダー - ユーザー情報とログアウト */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                ようこそ、{userEmail}さん
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
          
          {/* 中央 - ドキュメントリスト */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedGroupName ? `${selectedGroupName} - Shakyo` : 'Shakyo'}
                </h1>
                {selectedGroupName && (
                  <p className="text-sm text-gray-600 mt-1">
                    グループ: {selectedGroupName} ({sortedDocuments.length}件)
                  </p>
                )}
              </div>
              
              {/* 右側のボタン群 */}
              <div className="flex items-center gap-4">
                {/* 表示モード切り替えボタン */}
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode('tile')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'tile'
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📱 タイル
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📋 リスト
                  </button>
                </div>
                
                {/* 新規ボタン */}
                <Link
                  href={`/canvas?groupId=${selectedGroupId || ''}`}
                  className="rounded-full border border-solid border-indigo-500 text-indigo-600 bg-white hover:bg-indigo-50 transition-colors flex items-center justify-center font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 shadow"
                >
                  新規
                </Link>
              </div>
            </div>
            
            {sortedDocuments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">
                  {selectedGroupName ? `${selectedGroupName}にはまだドキュメントがありません` : 'まだドキュメントがありません'}
                </p>
                <p className="text-gray-400">「新規」ボタンから新しいドキュメントを作成してください</p>
              </div>
            ) : (
              viewMode === 'tile' ? renderTileView() : renderListView()
            )}
          </div>
        </div>

        {/* コンテキストメニュー */}
        {contextMenu && (
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const item = findItemById(menuItems, contextMenu.itemId);
                if (item?.type === 'folder') {
                  addFolder(contextMenu.itemId);
                } else {
                  const parent = findParentById(menuItems, contextMenu.itemId);
                  addGroup(parent?.id);
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📁 フォルダを追加
            </button>
            <button
              onClick={() => {
                const item = findItemById(menuItems, contextMenu.itemId);
                if (item?.type === 'folder') {
                  addGroup(contextMenu.itemId);
                } else {
                  const parent = findParentById(menuItems, contextMenu.itemId);
                  addGroup(parent?.id);
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📋 グループを追加
            </button>
            <button
              onClick={() => startEditing(contextMenu.itemId, findItemById(menuItems, contextMenu.itemId)?.name || '')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              ✏️ 名前を変更
            </button>
            <button
              onClick={() => deleteItem(contextMenu.itemId)}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              🗑️ 削除
            </button>
          </div>
        )}

        {/* コンテキストメニューを閉じるためのオーバーレイ */}
        {contextMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
