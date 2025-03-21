'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { ADMIN_EMAIL } from '@/utils/config';

interface Post {
  userId: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes: string[];
  isEdited: boolean;
  isdeleted: boolean;
  isBlinded?: boolean;
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
  const [message, setMessage] = useState({ type: '', content: '' });
  
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
      console.log('게시글 조회 시작');
      
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
          
          // 게시글이 없는 경우 메시지 표시
          if (filteredPosts.length === 0) {
            setMessage({
              type: 'info',
              content: '신고된 게시글이 없습니다.'
            });
          }
          return;
        } catch (reportedError) {
          console.error('신고된 게시글 조회 에러:', reportedError);
          setMessage({
            type: 'error',
            content: '신고된 게시글을 불러오는 중 오류가 발생했습니다.'
          });
          // 에러 발생 시 모든 게시글 불러옴
          const { data: allPosts, error: postsError } = await query;
          if (postsError) throw postsError;
          setPosts(allPosts || []);
          return;
        }
      } else if (filterType === 'blinded') {
        query = query.eq('isBlinded', true);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('게시글 조회 에러:', error);
        throw error;
      }
      
      console.log('조회된 게시글 수:', data?.length || 0);
      setPosts(data || []);
      
      // 게시글이 없는 경우 메시지 표시
      if (!data || data.length === 0) {
        setMessage({
          type: 'info',
          content: filterType === 'all' 
            ? '등록된 게시글이 없습니다.' 
            : filterType === 'blinded' 
              ? '블라인드 처리된 게시글이 없습니다.'
              : '게시글이 없습니다.'
        });
      } else {
        // 게시글이 있는 경우 메시지 초기화
        setMessage({ type: '', content: '' });
      }
    } catch (error) {
      console.error('게시글 조회 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: '게시글을 불러오는 중 오류가 발생했습니다.'
      });
      setPosts([]);
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
        .eq('userId', postId);

      if (error) {
        console.error('게시글 삭제 에러:', error);
        throw error;
      }
      
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
      console.log('블라인드 처리 시작:', postId);
      
      // 직접 isBlinded 컬럼 업데이트 시도 (RPC 함수 의존성 제거)
      const { data, error } = await supabase
        .from('posts')
        .update({ isBlinded: true })
        .eq('userId', postId)
        .select();

      if (error) {
        console.error('블라인드 처리 에러 (direct update):', error);
        
        // isBlinded 필드가 없는 경우 isdeleted로 대체
        console.log('isdeleted로 대체 시도');
        const { error: fallbackError } = await supabase
          .from('posts')
          .update({ isdeleted: true })
          .eq('userId', postId);

        if (fallbackError) {
          console.error('대체 처리 에러:', fallbackError);
          throw fallbackError;
        }
        
        setErrorMessage('isBlinded 필드를 사용할 수 없어 isdeleted로 처리되었습니다.');
        setShowErrorModal(true);
      } else {
        console.log('블라인드 처리 성공:', data);
      }
      
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
      console.log('댓글 블라인드 처리 시작:', commentId);
      
      // 직접 isBlinded 컬럼 업데이트 시도 (RPC 함수 의존성 제거)
      const { data, error } = await supabase
        .from('comments')
        .update({ isBlinded: true })
        .eq('id', commentId)
        .select();

      if (error) {
        console.error('댓글 블라인드 처리 에러 (direct update):', error);
        
        // isBlinded 필드가 없는 경우 isdeleted로 대체
        console.log('isdeleted로 대체 시도');
        const { error: fallbackError } = await supabase
          .from('comments')
          .update({ isdeleted: true })
          .eq('id', commentId);

        if (fallbackError) {
          console.error('대체 처리 에러:', fallbackError);
          throw fallbackError;
        }
        
        setErrorMessage('isBlinded 필드를 사용할 수 없어 isdeleted로 처리되었습니다.');
        setShowErrorModal(true);
      } else {
        console.log('댓글 블라인드 처리 성공:', data);
      }
      
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
      const table = type === 'post' ? 'posts' : 'comments';
      const idField = type === 'post' ? 'userId' : 'id';
      
      console.log('컨텐츠 복구 시작:', {type, id});
      
      // 기본 복구 데이터 설정
      const updateData: any = { 
        isdeleted: false,
        reports: []
      };
      
      // 테이블에 따른 업데이트 실행
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq(idField, id)
        .select();

      if (error) {
        console.error('컨텐츠 복구 에러:', error);
        throw error;
      }
      
      console.log('기본 데이터 복구 성공:', data);
      
      // isBlinded 필드에 대한 별도 업데이트 시도 (있으면 설정, 없으면 에러 무시)
      try {
        const { data: blindUpdateData, error: blindUpdateError } = await supabase
          .from(table)
          .update({ isBlinded: false })
          .eq(idField, id)
          .select();
        
        if (blindUpdateError) {
          console.log('isBlinded 필드 업데이트 실패 (무시됨):', blindUpdateError);
        } else {
          console.log('isBlinded 필드 업데이트 성공:', blindUpdateData);
        }
      } catch (e) {
        console.log('isBlinded 필드 처리 중 오류 (무시됨):', e);
      }
      
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
      
      let updates: any = {};
      
      if (action === 'delete') {
        updates = { isdeleted: true };
      } else if (action === 'blind') {
        // 먼저 isBlinded로 시도
        updates = { isBlinded: true };
      } else if (action === 'restore') {
        updates = { 
          isdeleted: false,
          reports: []
        };
        
        // restore에서는 isBlinded 도 시도 (있으면 false로 설정, 없으면 오류 무시)
        try {
          const { error } = await supabase
            .from('posts')
            .update({ isBlinded: false })
            .in('userId', selectedPosts);
          
          if (error) {
            console.log('isBlinded 필드 업데이트 실패 (무시됨):', error);
          }
        } catch (e) {
          console.log('isBlinded 필드 처리 중 오류 (무시됨):', e);
        }
      }

      console.log('업데이트 적용:', updates);
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .in('userId', selectedPosts)
        .select();

      if (error) {
        console.error('일괄 처리 에러:', error);
        
        // blind 작업이 실패한 경우 isdeleted로 대체 시도
        if (action === 'blind') {
          console.log('isdeleted로 대체 시도');
          const { error: fallbackError } = await supabase
            .from('posts')
            .update({ isdeleted: true })
            .in('userId', selectedPosts);

          if (fallbackError) {
            console.error('대체 처리 에러:', fallbackError);
            throw fallbackError;
          }
          
          setErrorMessage('isBlinded 필드를 사용할 수 없어 isdeleted로 처리되었습니다.');
          setShowErrorModal(true);
        } else {
          throw error;
        }
      } else {
        console.log('일괄 처리 성공:', data);
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

      {/* 메시지 표시 영역 */}
      {message.content && (
        <div className={`max-w-6xl mx-auto px-4 py-4 mt-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.content}
        </div>
      )}

      {/* 게시글 목록 */}
      {posts.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.userId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full" src={post.emoji} alt={post.nickname} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{post.nickname}</div>
                          <div className="text-sm text-gray-500">{post.studentid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{post.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {post.isEdited && (
                        <span className="text-gray-500">수정됨</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {post.isdeleted || post.isBlinded ? (
                        <span className="text-gray-500">삭제됨</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleBlindPost(post.userId)}
                            className="text-sm text-yellow-500 hover:text-yellow-600"
                          >
                            블라인드
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.userId)}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !message.type && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      )}

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