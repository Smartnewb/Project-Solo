'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes: string[];
  isEdited: boolean;
  isdeleted: boolean;
  reports: string[];
  nickname: string;
  studentid: string;
  emoji: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  nickname: string;
  studentid: string;
  isEdited: boolean;
  isdeleted: boolean;
  reports: string[];
}

export default function CommunityManagement() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author_id: 'user1',
      content: '첫 만남에서 절대 하면 안 되는 행동들을 정리해보았습니다...',
      created_at: '2024-03-11',
      updated_at: '2024-03-11',
      likes: [],
      isEdited: false,
      isdeleted: false,
      reports: [],
      nickname: '김철수',
      studentid: '20240001',
      emoji: '😊',
      comments: []
    },
    {
      id: '2',
      author_id: 'user2',
      content: '매칭 후 대화가 잘 안 이어질 때 시도해볼 만한 주제들...',
      created_at: '2024-03-10',
      updated_at: '2024-03-10',
      likes: [],
      isEdited: false,
      isdeleted: false,
      reports: ['user3', 'user4', 'user5'],
      nickname: '이영희',
      studentid: '20240002',
      emoji: '🤗',
      comments: []
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      post_id: '1',
      author_id: 'user3',
      content: '정말 도움이 되는 글이네요!',
      created_at: '2024-03-11',
      updated_at: '2024-03-11',
      nickname: '박민수',
      studentid: '20240003',
      isEdited: false,
      isdeleted: false,
      reports: []
    },
    {
      id: '2',
      post_id: '2',
      author_id: 'user4',
      content: '부적절한 내용의 댓글입니다.',
      created_at: '2024-03-10',
      updated_at: '2024-03-10',
      nickname: '정다희',
      studentid: '20240004',
      isEdited: false,
      isdeleted: false,
      reports: ['user1', 'user2', 'user3', 'user4', 'user5']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const handleDelete = (type: 'post' | 'comment', id: string) => {
    if (type === 'post') {
      setPosts(posts.map(post => 
        post.id === id ? { ...post, isdeleted: true } : post
      ));
    } else {
      setComments(comments.map(comment =>
        comment.id === id ? { ...comment, isdeleted: true } : comment
      ));
    }
  };

  const handleRestore = (type: 'post' | 'comment', id: string) => {
    if (type === 'post') {
      setPosts(posts.map(post =>
        post.id === id ? { ...post, isdeleted: false } : post
      ));
    } else {
      setComments(comments.map(comment =>
        comment.id === id ? { ...comment, isdeleted: false } : comment
      ));
    }
  };

  const isPost = (item: Post | Comment): item is Post => {
    return 'nickname' in item;
  };

  const filterItems = (items: Post[] | Comment[], filter: string) => {
    return items.filter(item => {
      const searchMatch = 
        isPost(item)
          ? item.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content.toLowerCase().includes(searchTerm.toLowerCase())
          : item.content.toLowerCase().includes(searchTerm.toLowerCase());

      if (filter === 'all') return searchMatch;
      if (filter === 'reported') return item.reports.length > 0 && searchMatch;
      if (filter === 'deleted') return item.isdeleted && searchMatch;
      return false;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">커뮤니티 관리</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-50 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? 'bg-white text-primary-DEFAULT shadow'
                  : 'text-gray-700 hover:bg-white/[0.12]'
              }`
            }
          >
            게시글 관리
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? 'bg-white text-primary-DEFAULT shadow'
                  : 'text-gray-700 hover:bg-white/[0.12]'
              }`
            }
          >
            댓글 관리
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* 게시글 관리 패널 */}
          <Tab.Panel>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTab(0)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTab === 0
                      ? 'bg-primary-DEFAULT text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setSelectedTab(1)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTab === 1
                      ? 'bg-primary-DEFAULT text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  신고됨
                </button>
                <button
                  onClick={() => setSelectedTab(2)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTab === 2
                      ? 'bg-primary-DEFAULT text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  삭제됨
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        댓글
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신고
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filterItems(posts, ['all', 'reported', 'deleted'][selectedTab]).map((post) => (
                      <tr key={post.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.nickname}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{(post as any).nickname}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {post.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.created_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {'comments' in post && post.comments.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.reports.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {post.reports.length}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              !post.isdeleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {post.isdeleted ? '삭제됨' : '정상'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {post.isdeleted ? (
                            <button
                              onClick={() => handleRestore('post', post.id)}
                              className="text-primary-DEFAULT hover:text-primary-dark"
                            >
                              복구
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete('post', post.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>

          {/* 댓글 관리 패널 */}
          <Tab.Panel>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTab(0)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTab === 0
                      ? 'bg-primary-DEFAULT text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setSelectedTab(1)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTab === 1
                      ? 'bg-primary-DEFAULT text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  신고됨
                </button>
                <button
                  onClick={() => setSelectedTab(2)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedTab === 2
                      ? 'bg-primary-DEFAULT text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  삭제됨
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        내용
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        게시글
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신고
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filterItems(comments, ['all', 'reported', 'deleted'][selectedTab]).map((comment) => (
                      <tr key={comment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {comment.nickname}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-xs">
                            {comment.content}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {!isPost(comment) && comment.post_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {comment.created_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {comment.reports.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {comment.reports.length}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              !comment.isdeleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {comment.isdeleted ? '삭제됨' : '정상'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {comment.isdeleted ? (
                            <button
                              onClick={() => handleRestore('comment', comment.id)}
                              className="text-primary-DEFAULT hover:text-primary-dark"
                            >
                              복구
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete('comment', comment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 