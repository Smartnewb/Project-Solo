'use client';

import { useState, useEffect, useMemo } from 'react';
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
  isBlinded: boolean;
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
  isBlinded: boolean;
  reports: string[];
}

export default function AdminCommunity() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClientSupabaseClient(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'reported' | 'blinded'>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showReportDetails, setShowReportDetails] = useState<string | null>(null);
  
  // 상태와 설정 관련 로그 추가
  console.log('현재 환경 변수:', {
    DEFAULT_ADMIN_EMAIL: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL,
    ADMIN_EMAIL: ADMIN_EMAIL,
  });
  
  useEffect(() => {
    if (loading) {
      console.log('로딩 중...');
      return;
    }

    if (!user) {
      console.log('사용자 인증 정보 없음, 3초 후 리다이렉트');
      const timer = setTimeout(() => {
        console.log('리다이렉트 실행');
        router.push('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }

    // 로그인 사용자 정보 로깅
    console.log('로그인 사용자 정보:', {
      id: user.id,
      email: user.email,
      defaultAdminEmail: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL,
      matchesDefault: user.email === process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL,
      adminEmail: ADMIN_EMAIL,
      matchesAdmin: user.email === ADMIN_EMAIL,
    });

    // 관리자 메일 주소인지 확인
    const isAdminUser = user.email === process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL || 
                         user.email === ADMIN_EMAIL;
                         
    if (!isAdminUser) {
      console.log('관리자 아님, 홈으로 리다이렉트');
      router.push('/');
      return;
    }

    console.log('관리자 확인됨:', user.email);
    // 이미 관리자임이 확인되었으므로 게시글 로드
    fetchPosts();
  }, [user, loading, router]);

  // 필터 변경 시에만 게시글 다시 불러오기
  useEffect(() => {
    if (user && (user.email === process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL || 
                 user.email === ADMIN_EMAIL)) {
      console.log('필터 변경으로 게시글 다시 로드:', filterType);
      fetchPosts();
    }
  }, [filterType]);

  // 게시글 불러오기
  const fetchPosts = async () => {
    try {
      // 기본 쿼리 설정
      let query = supabase
        .from('posts')
        .select('*, comments(*)')
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filterType === 'reported') {
        try {
          // 단순히 reports 필드 확인
          const { data, error } = await supabase
            .from('posts')
            .select('*, comments(*)')
            .not('reports', 'is', null)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('신고된 게시글 조회 에러:', error);
            throw error;
          }
          
          // 실제로 내용이 있는 reports 필드만 필터링
          const filteredPosts = data?.filter(post => 
            post.reports && 
            Array.isArray(post.reports) && 
            post.reports.length > 0
          ) || [];
          
          console.log('신고된 게시글 수:', filteredPosts.length);
          setPosts(filteredPosts);
          return;
        } catch (reportedError) {
          console.error('신고된 게시글 조회 에러:', reportedError);
          // 에러 발생 시 모든 게시글 불러옴
          const { data: allPosts, error: postsError } = await query;
          if (postsError) throw postsError;
          setPosts(allPosts || []);
          return;
        }
      } else if (filterType === 'blinded') {
        try {
          // isBlinded 필드로 필터링 시도
          const { data, error } = await supabase
            .from('posts')
            .select('*, comments(*)')
            .eq('isBlinded', true)
            .order('created_at', { ascending: false });
            
          if (error) {
            // 필드가 없는 경우나 다른 에러
            console.error('블라인드 게시글 조회 에러:', error);
            
            // 빈 배열 반환 (필드가 없는 경우 블라인드 게시글은 없음)
            setPosts([]);
            return;
          }
          
          console.log('블라인드 게시글 수:', data?.length || 0);
          setPosts(data || []);
          return;
        } catch (blindedError) {
          console.error('블라인드 필드가 없거나 필터링 에러:', blindedError);
          // 에러 발생 시 빈 배열 반환 (일반적으로 블라인드 필드가 없는 경우)
          setPosts([]);
          return;
        }
      }

      // 모든 게시글 조회
      const { data: postsData, error: postsError } = await query;
      if (postsError) {
        console.error('전체 게시글 조회 에러:', postsError);
        throw postsError;
      }
      
      console.log('로드된 게시글 수:', postsData?.length || 0);
      setPosts(postsData || []);
    } catch (error) {
      console.error('게시글을 불러오는 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글을 불러오는 중 오류가 발생했습니다. 모든 게시글을 불러옵니다.');
      setShowErrorModal(true);
      
      try {
        // 안전한 쿼리로 모든 게시글 불러오기
        const { data } = await supabase
          .from('posts')
          .select('*, comments(*)')
          .order('created_at', { ascending: false });
        setPosts(data || []);
      } catch (fallbackError) {
        console.error('최종 게시글 불러오기 실패:', fallbackError);
        setPosts([]);
      }
    }
  };

  // 이메일 정보 가져오기
  const fetchUsers = async (userIds: string[]) => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')  // auth.users 대신 profiles 테이블 사용
        .select('user_id, email')
        .in('user_id', userIds);

      if (error) {
        console.error('이메일 정보를 가져오는 중 오류가 발생했습니다:', error);
        return {};
      }

      return users.reduce((acc: { [key: string]: string }, user) => {
        acc[user.user_id] = user.email || '';
        return acc;
      }, {});
    } catch (error) {
      console.error('이메일 정보를 가져오는 중 오류가 발생했습니다:', error);
      return {};
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">로그인이 필요합니다.</p>
          <p className="text-gray-400 text-sm">3초 후 메인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  // 관리자 권한 확인
  const isAdmin = user.email === process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL || 
                  user.email === ADMIN_EMAIL;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">접근 권한이 없습니다.</p>
      </div>
    );
  }

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

  // 게시글 블라인드 처리
  const handleBlindPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ isBlinded: true })
        .eq('id', postId);

      if (error) throw error;
      
      fetchPosts();
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글 블라인드 처리 중 오류가 발생했습니다.');
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

  // 댓글 블라인드 처리
  const handleBlindComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ isBlinded: true })
        .eq('id', commentId);

      if (error) throw error;
      
      fetchPosts();
    } catch (error) {
      console.error('댓글 블라인드 처리 중 오류가 발생했습니다:', error);
      setErrorMessage('댓글 블라인드 처리 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 컨텐츠 복구
  const handleRestoreContent = async (type: 'post' | 'comment', id: string) => {
    if (!confirm('이 컨텐츠를 복구하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from(type === 'post' ? 'posts' : 'comments')
        .update({ 
          isdeleted: false,
          isBlinded: false,
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

  // 선택된 게시글 일괄 처리
  const handleBulkAction = async (action: 'delete' | 'blind' | 'restore') => {
    if (!selectedPosts.length) return;
    
    if (!confirm(`선택한 ${selectedPosts.length}개의 게시글을 ${
      action === 'delete' ? '삭제' : 
      action === 'blind' ? '블라인드' : '복구'
    }하시겠습니까?`)) return;

    try {
      console.log('Bulk action on posts:', selectedPosts);
      const updates = {
        delete: { isdeleted: true },
        blind: { isBlinded: true },
        restore: { isdeleted: false, isBlinded: false, reports: [] }
      }[action];

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .in('id', selectedPosts);

      if (error) {
        console.error('Bulk action error:', error);
        throw error;
      }
      
      setSelectedPosts([]);
      fetchPosts();
    } catch (error) {
      console.error('일괄 처리 중 오류가 발생했습니다:', error);
      setErrorMessage('일괄 처리 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">커뮤니티 관리</h1>
            <div className="flex items-center gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'reported' | 'blinded')}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">전체 게시글</option>
                <option value="reported">신고된 게시글</option>
                <option value="blinded">블라인드 게시글</option>
              </select>
              {selectedPosts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedPosts.length}개 선택됨
                  </span>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    일괄 삭제
                  </button>
                  <button
                    onClick={() => handleBulkAction('blind')}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    일괄 블라인드
                  </button>
                  <button
                    onClick={() => handleBulkAction('restore')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    일괄 복구
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => {
                        const newSelectedPosts = e.target.checked
                          ? [...selectedPosts, post.id]
                          : selectedPosts.filter(id => id !== post.id);
                        console.log('Selected post:', post.id);
                        console.log('New selected posts:', newSelectedPosts);
                        setSelectedPosts(newSelectedPosts);
                      }}
                      className="w-4 h-4"
                    />
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
                      {post.isdeleted || post.isBlinded ? (
                        <button
                          onClick={() => handleRestoreContent('post', post.id)}
                          className="text-sm text-blue-500 hover:text-blue-600"
                        >
                          복구
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleBlindPost(post.id)}
                            className="text-sm text-yellow-500 hover:text-yellow-600"
                          >
                            블라인드
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {post.isdeleted ? (
                  <p className="text-gray-500 text-center mb-2">삭제된 게시물입니다.</p>
                ) : post.isBlinded ? (
                  <p className="text-gray-500 text-center mb-2">블라인드 처리된 게시물입니다.</p>
                ) : (
                  <>
                    <p className="text-gray-700 whitespace-pre-wrap mb-2">{post.content}</p>
                    {post.reports && post.reports.length > 0 && (
                      <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">신고 {post.reports.length}건</p>
                          <button
                            onClick={() => setShowReportDetails(showReportDetails === post.id ? null : post.id)}
                            className="text-sm underline"
                          >
                            {showReportDetails === post.id ? '접기' : '자세히 보기'}
                          </button>
                        </div>
                        {showReportDetails === post.id && (
                          <div className="mt-2 space-y-1">
                            {post.reports.map((report, index) => (
                              <p key={index} className="text-sm">
                                신고자: {report}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 댓글 목록 */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-gray-900">댓글 ({post.comments.length})</h3>
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
                              {comment.isdeleted || comment.isBlinded ? (
                                <button
                                  onClick={() => handleRestoreContent('comment', comment.id)}
                                  className="text-xs text-blue-500 hover:text-blue-600"
                                >
                                  복구
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleBlindComment(comment.id)}
                                    className="text-xs text-yellow-500 hover:text-yellow-600"
                                  >
                                    블라인드
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {comment.isdeleted ? (
                          <p className="text-gray-500 text-center">삭제된 댓글입니다.</p>
                        ) : comment.isBlinded ? (
                          <p className="text-gray-500 text-center">블라인드 처리된 댓글입니다.</p>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            {comment.reports && comment.reports.length > 0 && (
                              <div className="bg-red-50 text-red-700 px-3 py-1 rounded-lg mt-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">신고 {comment.reports.length}건</p>
                                  <button
                                    onClick={() => setShowReportDetails(showReportDetails === comment.id ? null : comment.id)}
                                    className="text-xs underline"
                                  >
                                    {showReportDetails === comment.id ? '접기' : '자세히 보기'}
                                  </button>
                                </div>
                                {showReportDetails === comment.id && (
                                  <div className="mt-1 space-y-1">
                                    {comment.reports.map((report, index) => (
                                      <p key={index} className="text-xs">
                                        신고자: {report}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              {filterType === 'all' ? (
                <p className="text-gray-700 text-lg">게시글이 없습니다.</p>
              ) : filterType === 'reported' ? (
                <p className="text-gray-700 text-lg">신고된 게시글이 없습니다.</p>
              ) : (
                <p className="text-gray-700 text-lg">블라인드 처리된 게시글이 없습니다.</p>
              )}
            </div>
          )}
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