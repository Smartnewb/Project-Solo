'use client';

import { useState } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';

// Define a type for the profile data
interface ProfileData {
  id: string;
  nickname?: string;
  name?: string;
  profile_image?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow for additional properties
}

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
      
      // 사용자 ID 유효성 검사
      const userId = session.user.id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(userId)) {
        console.error('유효하지 않은 사용자 ID 형식:', userId);
        setError('사용자 인증에 문제가 있습니다. 로그아웃 후 다시 로그인해주세요.');
        return;
      }
      
      console.log('사용자 ID:', userId);
      
      try {
        // Get user profile - 오류 처리 향상
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        // 프로필 데이터를 저장할 변수 선언
        let userDataToUse: ProfileData;
        
        // 프로필이 없는 경우 기본 프로필 생성
        if (userError) {
          console.error('사용자 정보 조회 오류:', userError);
          
          if (userError.code === 'PGRST116') {
            console.log('프로필이 없어 새로 생성합니다.');
            
            const defaultProfile = {
              id: userId,
              nickname: session.user.user_metadata?.nickname || '익명 사용자',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: createError } = await supabase
              .from('profiles')
              .insert([defaultProfile]);
              
            if (createError) {
              throw new Error('프로필 생성 실패: ' + createError.message);
            }
            
            // 새로 생성된 프로필 사용
            userDataToUse = defaultProfile;
          } else {
            throw new Error('사용자 정보를 가져올 수 없습니다: ' + userError.message);
          }
        } else {
          userDataToUse = userData;
        }
        
        // Create post with direct values
        const now = new Date().toISOString();
        const postData = {
          title: title || '테스트 제목',
          content: content || '테스트 내용',
          category: 'questions',
          user_id: userId,
          author_id: userId, // Add author_id field
          nickname: userDataToUse?.nickname || session.user.user_metadata?.nickname || '익명',
          profile_image: userDataToUse?.profile_image || userDataToUse?.avatar_url || session.user.user_metadata?.avatar_url || null,
          created_at: now,
          updated_at: now,
          isEdited: false,
          isdeleted: false,
          isBlinded: false,
          likes: [],
          comments: [],
          reports: []
        };
        
        console.log('게시글 저장 시도:', postData);
        
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert([postData])
          .select();
        
        if (postError) {
          console.error('게시글 저장 중 오류 발생:', postError);
          throw new Error('게시글을 저장하는 데 실패했습니다: ' + postError.message);
        }
        
        console.log('게시글 저장 성공:', post);
        setSuccess(true);
        setResult(post);
        
        // Reset form
        setTitle('');
        setContent('');
        
      } catch (profileError: any) {
        console.error('프로필 처리 중 오류:', profileError);
        setError(profileError.message || '프로필 처리 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error('게시글 저장 중 예외 발생:', err);
      setError('예외가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
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