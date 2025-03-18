'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { ADMIN_EMAIL } from '@/utils/config';

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

export default function AdminCommunity() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 권한 확인 - 단순화된 버전
  const checkAdminStatus = async () => {
    if (!user?.email) return false;
    return user.email === ADMIN_EMAIL;
  };

  // 게시글 불러오기
  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, comments(*)')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      if (!postsData) {
        setPosts([]);
        return;
      }

      setPosts(postsData);
    } catch (error) {
      console.error('게시글을 불러오는 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글을 불러오는 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ isdeleted: true })
        .eq('id', postId);

      if (error) throw error;
      
      fetchPosts();
    } catch (error) {
      console.error('게시글 삭제 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ isdeleted: true })
        .eq('id', commentId);

      if (error) throw error;
      
      fetchPosts();
    } catch (error) {
      console.error('댓글 삭제 중 오류가 발생했습니다:', error);
      setErrorMessage('댓글 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 신고된 게시글/댓글 복구
  const handleRestoreContent = async (type: 'post' | 'comment', id: string) => {
    if (!confirm('이 컨텐츠를 복구하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from(type === 'post' ? 'posts' : 'comments')
        .update({ 
          isdeleted: false,
          reports: []
        })
        .eq('id', id);

      if (error) throw error;
      
      fetchPosts();
    } catch (error) {
      console.error('컨텐츠 복구 중 오류가 발생했습니다:', error);
      setErrorMessage('컨텐츠 복구 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      const isAdminUser = await checkAdminStatus();
      setIsAdmin(isAdminUser);
      
      if (!isAdminUser) {
        router.push('/home');
      }
    };

    initializeAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">권한을 확인하는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-h2 text-center">커뮤니티 관리</h1>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{post.emoji}</span>
                  <div>
                    <p className="font-medium">{post.nickname}</p>
                    <p className="text-sm text-gray-500">{post.studentid}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                  {post.isEdited && (
                    <span className="text-sm text-gray-500">(수정됨)</span>
                  )}
                  <div className="flex gap-2">
                    {post.isdeleted ? (
                      <button
                        onClick={() => handleRestoreContent('post', post.id)}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        복구
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {post.isdeleted ? (
                <p className="text-gray-500 text-center mb-2">삭제된 게시물입니다.</p>
              ) : (
                <>
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">{post.content}</p>
                  {post.reports && post.reports.length > 0 && (
                    <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-2">
                      <p className="font-medium">신고 {post.reports.length}건</p>
                    </div>
                  )}
                </>
              )}

              {/* 댓글 목록 */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-gray-900">댓글</h3>
                  {post.comments.map((comment: Comment) => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm">{comment.nickname}</p>
                            <p className="text-xs text-gray-500">{comment.studentid}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          {comment.isEdited && (
                            <span className="text-xs text-gray-500">(수정됨)</span>
                          )}
                          <div className="flex gap-2">
                            {comment.isdeleted ? (
                              <button
                                onClick={() => handleRestoreContent('comment', comment.id)}
                                className="text-xs text-blue-500 hover:text-blue-600"
                              >
                                복구
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {comment.isdeleted ? (
                        <p className="text-gray-500 text-center">삭제된 댓글입니다.</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          {comment.reports && comment.reports.length > 0 && (
                            <div className="bg-red-50 text-red-700 px-3 py-1 rounded-lg mt-2 text-sm">
                              <p className="font-medium">신고 {comment.reports.length}건</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2">
        <div className="max-w-lg mx-auto px-4 flex justify-around items-center">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center text-gray-400"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-sm mt-1">홈</span>
          </button>
          <button
            onClick={() => router.push('/community')}
            className="flex flex-col items-center text-gray-400"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-sm mt-1">커뮤니티</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center text-gray-400"
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-sm mt-1">설정</span>
          </button>
        </div>
      </div>

      {/* 에러 모달 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <p className="text-gray-700">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-4 w-full bg-primary-DEFAULT text-white py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 