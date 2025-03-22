'use client';

import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';

export default function TestCommentPage() {
  const [postId, setPostId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  const supabase = createClientSupabaseClient();
  
  // 게시글 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('게시글 목록 조회 오류:', error);
          return;
        }
        
        setPosts(data || []);
      } catch (err) {
        console.error('게시글 목록 조회 예외:', err);
      }
    };
    
    fetchPosts();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postId) {
      setError('댓글을 작성할 게시글을 선택해주세요.');
      return;
    }
    
    if (!content) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResult(null);
    
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }
      
      // 게시글 정보 가져오기
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('id, comments')
        .eq('id', postId)
        .single();
      
      if (postError) {
        setError('게시글을 찾을 수 없습니다: ' + postError.message);
        return;
      }
      
      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        setError('사용자 정보를 가져올 수 없습니다: ' + userError.message);
        return;
      }
      
      // 현재 시간
      const now = new Date().toISOString();
      
      // 댓글 생성
      const commentData = {
        post_id: postId,
        user_id: session.user.id,
        content,
        is_anonymous: false,
        created_at: now,
        updated_at: now,
        likes_count: 0
      };
      
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert([commentData])
        .select()
        .single();
      
      if (commentError) {
        setError('댓글을 저장하는 데 실패했습니다: ' + commentError.message);
        return;
      }
      
      // 게시글에 댓글 추가
      const newComment = {
        id: comment.id,
        user_id: session.user.id,
        content: comment.content,
        nickname: userData?.nickname || userData?.name || '익명',
        profile_image: userData?.profile_image || userData?.avatar_url || null,
        created_at: now,
        is_anonymous: false
      };
      
      const updatedComments = [...(postData.comments || []), newComment];
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);
      
      if (updateError) {
        setError('게시글 업데이트에 실패했습니다: ' + updateError.message);
        return;
      }
      
      console.log('댓글 저장 성공:', comment);
      setSuccess(true);
      setResult(comment);
      
      // Reset form
      setContent('');
    } catch (err: any) {
      console.error('댓글 저장 중 예외 발생:', err);
      setError('예외가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">테스트 댓글 작성</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
          댓글이 성공적으로 등록되었습니다!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">게시글 선택</label>
          <select
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">게시글을 선택하세요</option>
            {posts.map(post => (
              <option key={post.id} value={post.id}>
                {post.title} ({new Date(post.created_at).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">댓글 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-20"
            placeholder="댓글 내용을 입력하세요"
          ></textarea>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? '저장 중...' : '댓글 작성'}
          </button>
        </div>
      </form>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">결과</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 