'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClientSupabaseClient } from '@/utils/supabase';

interface PostForm {
  category: string;
  title: string;
  content: string;
}

export default function WritePost() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();
  const [formData, setFormData] = useState<PostForm>({
    category: '',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인증된 사용자만 접근 가능하도록 체크
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, router, loading]);

  const categories = [
    { value: 'questions', label: '질문하기' },
    { value: 'dating_reviews', label: '소개팅 후기' },
    { value: 'matching_reviews', label: '매칭 후기' }
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // UUID 형식 확인 (간단한 검증)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.id)) {
        console.error('유효하지 않은 사용자 ID 형식:', user.id);
        setError('사용자 인증에 문제가 있습니다. 로그아웃 후 다시 로그인해주세요.');
        return;
      }

      if (!formData.title || !formData.content || !formData.category) {
        setError('제목, 내용, 카테고리를 모두 입력해주세요.');
        return;
      }

      // 사용자 정보 가져오기 시도 (오류 처리 강화)
      console.log('사용자 정보 요청 - 사용자 ID:', user.id);
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', userError);
        
        // 프로필이 없는 경우, 기본 프로필 생성 시도
        if (userError.code === 'PGRST116') {
          console.log('프로필이 존재하지 않아 기본 프로필을 생성합니다.');
          const defaultProfile = {
            id: user.id,
            nickname: user.user_metadata?.nickname || '익명 사용자',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert([defaultProfile]);
            
          if (createError) {
            console.error('기본 프로필 생성 실패:', createError);
            setError('사용자 프로필을 생성할 수 없습니다. 관리자에게 문의하세요.');
            return;
          }
        } else {
          setError('사용자 정보를 가져올 수 없습니다: ' + userError.message);
          return;
        }
      }

      // 현재 시간
      const now = new Date().toISOString();

      // 게시글 데이터 생성 (userData가 없을 경우 대체값 사용)
      const postData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        user_id: user.id,
        author_id: user.id, // user_id와 동일하게 설정
        nickname: userData?.nickname || user.user_metadata?.nickname || '익명',
        profile_image: userData?.profile_image || userData?.avatar_url || user.user_metadata?.avatar_url || null,
        created_at: now,
        updated_at: now,
        isEdited: false,
        isdeleted: false,
        likes: [],
        comments: [],
        reports: []
      };

      console.log('게시글 저장 시도:', postData);
      // Supabase에 게시글 저장
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();

      if (error) {
        console.error('게시글 저장 중 오류 발생:', error);
        setError('게시글을 저장하는 데 실패했습니다: ' + error.message);
        return;
      }

      console.log('게시글 저장 성공:', data);
      alert('게시글이 성공적으로 등록되었습니다.');
      
      // 커뮤니티 페이지로 이동
      router.push('/community');
    } catch (error: any) {
      console.error('게시글 작성 중 오류 발생:', error);
      setError('게시글 작성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/community" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-h2 ml-2">글쓰기</h1>
            </div>
            <button
              type="submit"
              form="post-form"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 글쓰기 폼 */}
      <div className="max-w-lg mx-auto p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form id="post-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            {/* 카테고리 선택 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">카테고리를 선택해주세요</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                제목
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="제목을 입력해주세요"
                required
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                내용
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="input-field min-h-[200px]"
                placeholder="내용을 입력해주세요"
                required
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 