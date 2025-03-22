'use client';

import { useState } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';

export default function TestWritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const supabase = createClientSupabaseClient();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, nickname, profile_image')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        console.error('사용자 정보 조회 오류:', userError);
        setError('사용자 정보를 가져올 수 없습니다: ' + userError.message);
        return;
      }
      
      // Create post
      const now = new Date().toISOString();
      const postData = {
        title: title || '테스트 제목',
        content: content || '테스트 내용',
        category: 'questions',
        user_id: session.user.id,
        nickname: userData?.nickname || session.user.user_metadata?.nickname || '익명',
        profile_image: userData?.profile_image || session.user.user_metadata?.avatar_url || null,
        created_at: now,
        updated_at: now,
        isEdited: false,
        isdeleted: false,
        isBlinded: false,
        likes: [],
        comments: [],
        reports: []
      };
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select();
      
      if (postError) {
        console.error('게시글 저장 중 오류 발생:', postError);
        setError('게시글을 저장하는 데 실패했습니다: ' + postError.message);
        return;
      }
      
      console.log('게시글 저장 성공:', post);
      setSuccess(true);
      setResult(post);
      
      // Reset form
      setTitle('');
      setContent('');
    } catch (err: any) {
      console.error('게시글 저장 중 예외 발생:', err);
      setError('예외가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">테스트 글쓰기</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
          게시글이 성공적으로 등록되었습니다!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="제목을 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-40"
            placeholder="내용을 입력하세요"
          ></textarea>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? '저장 중...' : '게시글 작성'}
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