// 이 파일은 개발 중에만 사용하는 테스트 파일입니다.
// 게시글 생성과 댓글 작성 기능을 테스트합니다.
'use client';

import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Post } from '@/types/community';

interface UserInfo {
  id: string;
  nickname?: string;
  profile_image?: string;
  [key: string]: any;
}

export default function TestCommunityPost() {
  const { user, profile } = useAuth();
  const supabase = createClientSupabaseClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  // 사용자 정보 가져오기
  useEffect(() => {
    if (user) {
      fetchUserInfo();
      fetchPosts();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('사용자 정보 조회 오류:', error);
        setError('사용자 정보를 가져오지 못했습니다.');
      } else {
        setUserInfo(data);
        console.log('사용자 정보:', data);
      }
    } catch (err) {
      console.error('사용자 정보 조회 예외:', err);
      setError('사용자 정보 조회 중 오류가 발생했습니다.');
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('게시글 조회 오류:', error);
      } else {
        setPosts(data || []);
        console.log('게시글 목록:', data);
      }
    } catch (err) {
      console.error('게시글 조회 예외:', err);
    }
  };

  const createTestPost = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      if (!user) {
        setError('로그인이 필요합니다.');
        return;
      }

      // 현재 시간
      const now = new Date().toISOString();

      // 게시글 데이터 생성
      const postData = {
        title: '테스트 게시글 - ' + now.substring(0, 19),
        content: '이것은 테스트 게시글입니다. 작성 시간: ' + now,
        category: 'questions',
        user_id: user.id,
        nickname: userInfo?.nickname || user.user_metadata?.nickname || '익명',
        profile_image: userInfo?.profile_image || user.user_metadata?.avatar_url || null,
        created_at: now,
        updated_at: now,
        isEdited: false,
        isdeleted: false,
        isBlinded: false,
        likes: [],
        comments: [],
        reports: []
      };

      // Supabase에 게시글 저장
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();

      if (error) {
        console.error('게시글 저장 중 오류 발생:', error);
        setError('게시글을 저장하는 데 실패했습니다: ' + error.message);
      } else {
        console.log('게시글 저장 성공:', data);
        setSuccess(true);
        fetchPosts(); // 게시글 목록 새로고침
      }
    } catch (error: any) {
      console.error('게시글 작성 중 오류 발생:', error);
      setError('게시글 작성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  const createTestComment = async (postId: string) => {
    if (!postId || !user) return;
    
    try {
      // 게시물 정보 가져오기
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', postId)
        .single();
      
      if (postError) {
        console.error('게시글 조회 오류:', postError);
        return;
      }
      
      // 현재 시간
      const now = new Date().toISOString();
      
      // 댓글 생성
      const commentData = {
        post_id: postId,
        user_id: user.id,
        content: '테스트 댓글입니다. 작성 시간: ' + now.substring(0, 19),
        is_anonymous: false,
        created_at: now,
        updated_at: now,
        likes_count: 0
      };
      
      const { data: comment, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();
        
      if (error) {
        console.error('댓글 생성 오류:', error);
        return;
      }
      
      console.log('댓글 생성 성공:', comment);
      
      // 게시물의 comments 배열에 새 댓글 추가
      const newComment = {
        id: comment.id,
        user_id: user.id,
        content: comment.content,
        nickname: userInfo?.nickname || user.user_metadata?.nickname || '익명',
        profile_image: userInfo?.profile_image || user.user_metadata?.avatar_url || null,
        created_at: now,
        is_anonymous: false
      };
      
      const updatedComments = [...(postData.comments || []), newComment];
      
      // 게시물 업데이트
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);
        
      if (updateError) {
        console.error('게시물 업데이트 오류:', updateError);
      } else {
        fetchPosts(); // 게시글 목록 새로고침
      }
      
    } catch (err) {
      console.error('댓글 생성 중 예외 발생:', err);
    }
  };

  // 로그인 상태가 아니면 안내 메시지 표시
  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">커뮤니티 테스트</h1>
        <div className="bg-yellow-100 p-4 rounded">
          테스트를 위해 로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">커뮤니티 테스트</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
          게시글이 성공적으로 생성되었습니다!
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">사용자 정보</h2>
        <div className="bg-gray-100 p-4 rounded mb-4 whitespace-pre-wrap">
          {userInfo ? JSON.stringify(userInfo, null, 2) : '사용자 정보 로딩 중...'}
        </div>
        
        <button
          onClick={createTestPost}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mr-2"
        >
          {loading ? '저장 중...' : '테스트 게시글 생성'}
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">최근 게시글 (최대 5개)</h2>
        {posts.length === 0 ? (
          <div className="bg-gray-100 p-4 rounded">게시글이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="border p-4 rounded">
                <h3 className="font-bold">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  작성자: {post.nickname} | 
                  작성일: {new Date(post.created_at).toLocaleString()}
                </p>
                <p className="my-2">{post.content}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      댓글 {post.comments?.length || 0}개
                    </span>
                    <button
                      onClick={() => createTestComment(post.id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded"
                    >
                      테스트 댓글 추가
                    </button>
                  </div>
                  
                  {post.comments && post.comments.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded space-y-2 mt-2">
                      <h4 className="font-medium text-sm">댓글 목록</h4>
                      {post.comments.map((comment: any, idx: number) => (
                        <div key={idx} className="border-t pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
                          <p className="text-sm">
                            <span className="font-medium">{comment.nickname || '익명'}</span>: 
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 