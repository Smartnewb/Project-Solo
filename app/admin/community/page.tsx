'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Post = {
  id?: string;
  title?: string;
  content?: string;
  author_id?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  student_id?: string;
  nickname?: string;
  emoji?: string;
  reports?: string[];
  isDeleted?: boolean;
};

export default function CommunityAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'reported', 'deleted'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  // 사용자 ID를 기반으로 학번 생성 (17학번~25학번 사이)
  const generateStudentId = (userId: string | undefined) => {
    if (!userId) return '학번 없음';
    
    try {
      // userId에서 숫자 값 추출
      const numericValue = parseInt(userId.replace(/[^0-9]/g, '').substring(0, 4));
      
      // 17~25 사이의 학번 년도 생성
      const year = (numericValue % 9) + 17;
      
      // 0001~9999 사이의 학번 생성
      const number = (numericValue % 9999) + 1;
      
      return `${year}${number.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('학번 생성 오류:', error);
      return '학번 오류';
    }
  };

  async function fetchPosts() {
    try {
      setLoading(true);
      
      // 1. 게시글 데이터 가져오기
      let query = supabase
        .from('posts')
        .select('*, profiles(name, student_id)')
        .order('created_at', { ascending: false });
      
      // 필터 적용
      if (filter === 'reported') {
        query = query.not('reports', 'is', null).not('reports', 'eq', '{}');
      } else if (filter === 'deleted') {
        query = query.eq('isDeleted', true);
      }
      
      const { data: postsData, error: postsError } = await query;
          
      if (postsError) {
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      console.log('게시글 데이터:', postsData);
      
      // 게시글 데이터 변환
      const processedPosts = postsData.map(post => {
        // @ts-ignore
        const profile = post.profiles;
        const studentId = profile?.student_id || generateStudentId(post.author_id);
        
        return {
          ...post,
          user_name: profile?.name || post.nickname || '알 수 없음',
          student_id: studentId,
          profiles: undefined // 중첩된 profiles 데이터 제거
        };
      });
      
      setPosts(processedPosts);
    } catch (err: any) {
      console.error('게시글 불러오기 오류:', err);
      setError(err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 소프트 삭제 - isDeleted 플래그만 설정
      const { error } = await supabase
        .from('posts')
        .update({ isDeleted: true })
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isDeleted: true } : post
      ));
      
      alert('게시글이 삭제되었습니다.');
      
    } catch (err: any) {
      console.error('게시글 삭제 오류:', err);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePost = async (postId: string) => {
    if (!confirm('이 게시글을 복구하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('posts')
        .update({ isDeleted: false })
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isDeleted: false } : post
      ));
      
      alert('게시글이 복구되었습니다.');
      
    } catch (err: any) {
      console.error('게시글 복구 오류:', err);
      alert('게시글 복구 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearReports = async (postId: string) => {
    if (!confirm('이 게시글의 신고 내역을 모두 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('posts')
        .update({ reports: [] })
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, reports: [] } : post
      ));
      
      alert('신고 내역이 삭제되었습니다.');
      
    } catch (err: any) {
      console.error('신고 내역 삭제 오류:', err);
      alert('신고 내역 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색어로 필터링된 게시글 목록
  const filteredPosts = searchTerm 
    ? posts.filter(post => 
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : posts;

  if (loading && posts.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
        <p className="mt-4 text-gray-600">게시글 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">커뮤니티 관리</h1>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            >
              <option value="all">모든 게시글</option>
              <option value="reported">신고된 게시글</option>
              <option value="deleted">삭제된 게시글</option>
            </select>
            
            <div className="relative">
              <input
                type="text"
                placeholder="게시글 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          <button 
            onClick={fetchPosts}
            className="bg-primary-DEFAULT hover:bg-primary-dark text-white py-2 px-4 rounded"
            disabled={loading}
          >
            새로고침
          </button>
        </div>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-gray-500">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-3 px-4 text-left">이름</th>
                  <th className="py-3 px-4 text-left">학번</th>
                  <th className="py-3 px-4 text-left">제목</th>
                  <th className="py-3 px-4 text-left">내용</th>
                  <th className="py-3 px-4 text-left">작성일</th>
                  <th className="py-3 px-4 text-left">상태</th>
                  <th className="py-3 px-4 text-left">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPosts.map((post) => {
                  const postId = post.id || '';
                  const isReported = post.reports && post.reports.length > 0;
                  const isDeleted = post.isDeleted;
                  
                  return (
                    <tr key={postId} className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50' : isReported ? 'bg-yellow-50' : ''}`}>
                      <td className="py-3 px-4">
                        {post.user_name || '알 수 없음'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {post.student_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {post.emoji && <span className="mr-2">{post.emoji}</span>}
                          <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                            {post.title || '제목 없음'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate">
                          {post.content || '내용 없음'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                      </td>
                      <td className="py-3 px-4">
                        {isDeleted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            삭제됨
                          </span>
                        ) : isReported ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            신고 {post.reports?.length}건
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            정상
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestorePost(postId)}
                              className="text-blue-500 hover:text-blue-700"
                              disabled={loading}
                            >
                              복구
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeletePost(postId)}
                              className="text-red-500 hover:text-red-700"
                              disabled={loading}
                            >
                              삭제
                            </button>
                          )}
                          
                          {isReported && (
                            <button
                              onClick={() => handleClearReports(postId)}
                              className="text-yellow-500 hover:text-yellow-700"
                              disabled={loading}
                            >
                              신고해제
                            </button>
                          )}
                          
                          <button
                            onClick={() => window.open(`/community/post/${postId}`, '_blank')}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 