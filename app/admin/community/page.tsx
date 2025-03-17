'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Post = {
  userid?: string;
  title?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  author_id?: string;
};

export default function CommunityAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        
        // 1. 게시글 데이터만 가져오기
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (postsError) {
          throw postsError;
        }

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        
        console.log('게시글 데이터:', postsData);
        
        // 2. 모든 게시글의 작성자 ID 수집 (userid 또는 author_id 사용)
        const userIds = [...new Set(postsData.map(post => post.userid || post.author_id).filter(Boolean))];
        
        // 3. 프로필 데이터 가져오기
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);
        
        if (profilesError) {
          console.warn('프로필 데이터 조회 중 오류:', profilesError);
          // 프로필 조회에 실패해도 게시글은 표시
        }
        
        // 4. 게시글 데이터와 프로필 데이터 합치기
        const postsWithUserNames = postsData.map(post => {
          const userId = post.userid || post.author_id;
          const userProfile = userId ? profilesData?.find(profile => profile.user_id === userId) : null;
          return {
            ...post,
            user_name: userProfile?.name || '알 수 없음'
          };
        });
        
        setPosts(postsWithUserNames);
      } catch (err: any) {
        console.error('게시글 불러오기 오류:', err);
        setError(err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [supabase]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // userid 또는 author_id로 삭제 시도
      let error;
      
      // 먼저 userid로 시도
      const result = await supabase
        .from('posts')
        .delete()
        .eq('userid', postId);
        
      error = result.error;
      
      // userid로 실패하면 author_id로 시도
      if (error) {
        const result2 = await supabase
          .from('posts')
          .delete()
          .eq('author_id', postId);
          
        error = result2.error;
      }
      
      if (error) {
        throw error;
      }
      
      // 삭제 후 목록 업데이트
      setPosts(posts.filter(post => (post.userid !== postId && post.author_id !== postId)));
      
    } catch (err: any) {
      console.error('게시글 삭제 오류:', err);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSamplePost = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      const newPost = {
        title: `샘플 게시글 ${new Date().toLocaleTimeString()}`,
        content: '이것은 관리자가 생성한 샘플 게시글입니다.',
        author_id: user.id
      };
      
      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select();
        
      if (error) {
        throw error;
      }
      
      // 새 게시글 추가 후 목록 새로고침
      if (data && data.length > 0) {
        setPosts([
          {
            ...data[0],
            user_name: '관리자'
          },
          ...posts
        ]);
      }
      
    } catch (err: any) {
      console.error('게시글 생성 오류:', err);
      alert('게시글 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">커뮤니티 관리</h1>
        <button 
          onClick={handleCreateSamplePost}
          className="bg-primary-DEFAULT hover:bg-primary-dark text-white py-2 px-4 rounded"
          disabled={loading}
        >
          샘플 게시글 생성
        </button>
      </div>
      
      {posts.length === 0 ? (
        <p className="text-center text-gray-500 py-8">게시글이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">제목</th>
                <th className="py-2 px-4 border">작성자</th>
                <th className="py-2 px-4 border">작성일</th>
                <th className="py-2 px-4 border">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, index) => {
                const postId = post.userid || post.author_id || `unknown-${index}`;
                return (
                  <tr key={postId} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border">
                      {postId && typeof postId === 'string' ? postId.slice(0, 8) + '...' : '알 수 없음'}
                    </td>
                    <td className="py-2 px-4 border">{post.title || '제목 없음'}</td>
                    <td className="py-2 px-4 border">{post.user_name || '알 수 없음'}</td>
                    <td className="py-2 px-4 border">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                    </td>
                    <td className="py-2 px-4 border">
                      <button
                        onClick={() => handleDeletePost(postId)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading || !postId || postId.startsWith('unknown-')}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 