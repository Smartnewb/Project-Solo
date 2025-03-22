'use client';

import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';
import Link from 'next/link';

export default function TestListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const supabase = createClientSupabaseClient();
  
  // 게시글 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('게시글 목록 조회 오류:', error);
          setError('게시글 목록을 불러오는 데 실패했습니다: ' + error.message);
          return;
        }
        
        setPosts(data || []);
      } catch (err: any) {
        console.error('게시글 목록 조회 예외:', err);
        setError('예외가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">테스트 게시글 목록</h1>
        <div>
          <Link href="/community/test-write" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">
            글쓰기
          </Link>
          <Link href="/community/test-comment" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            댓글달기
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.map(post => (
            <div 
              key={post.id} 
              className="border rounded-lg bg-white shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between">
                  <h2 
                    className="text-xl font-bold cursor-pointer hover:text-blue-500" 
                    onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                  >
                    {post.title}
                  </h2>
                  <span className="text-gray-500 text-sm">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                  <span>작성자: {post.nickname || '익명'}</span>
                  <span className="mx-2">•</span>
                  <span>카테고리: {post.category}</span>
                  <span className="mx-2">•</span>
                  <span>댓글: {post.comments?.length || 0}개</span>
                </div>
                
                {selectedPost?.id === post.id && (
                  <div className="mt-4">
                    <div className="border-t pt-4 mb-4">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-bold mb-2">댓글 {post.comments?.length || 0}개</h3>
                      {post.comments?.length > 0 ? (
                        <div className="space-y-3">
                          {post.comments.map((comment: any, index: number) => (
                            <div key={index} className="border-t py-3 first:border-t-0">
                              <div className="flex justify-between">
                                <span className="font-medium">{comment.nickname || '익명'}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">댓글이 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 