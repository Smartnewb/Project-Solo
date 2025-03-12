'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PostForm {
  category: string;
  title: string;
  content: string;
}

export default function WritePost() {
  const router = useRouter();
  const [formData, setFormData] = useState<PostForm>({
    category: '',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);

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

    try {
      // TODO: API 연동 후 실제 데이터 저장 로직 구현
      await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이
      router.push('/community');
    } catch (error) {
      console.error('게시글 작성 중 오류 발생:', error);
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