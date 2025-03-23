'use client';

import { useState, useEffect, useMemo } from 'react';
import React from 'react';
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
  name?: string;
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
  name?: string;
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
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);
  
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
        .select('*, comments(*), profiles!posts_author_id_fkey(name)')
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filterType === 'reported') {
        try {
          // 단순히 reports 필드 확인
          const { data, error } = await supabase
            .from('posts')
            .select('*, comments(*), profiles!posts_author_id_fkey(name)')
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
          
          // 게시글 데이터 변환 - 작성자 이름 포함
          const processedPosts = filteredPosts.map(post => {
            // 댓글 작성자 정보 가져오기 대신 이 시점에 작성자 이름 설정
            return {
              ...post,
              name: post.profiles?.name || post.nickname || '이름 없음'
            };
          });
          
          setPosts(processedPosts);
          
          // 댓글 작성자 정보 가져오기
          await fetchCommentAuthors(processedPosts);
          
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
      
      // 게시글 데이터 변환 - 작성자 이름 포함
      const processedPosts = data?.map(post => {
        return {
          ...post,
          name: post.profiles?.name || post.nickname || '이름 없음'
        };
      }) || [];
      
      setPosts(processedPosts);
      
      // 댓글 작성자 정보 가져오기
      await fetchCommentAuthors(processedPosts);
      
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

  // 댓글 작성자 정보 가져오기 함수 추가
  const fetchCommentAuthors = async (posts: Post[]) => {
    try {
      // 모든 댓글 작성자 ID 수집
      const commentAuthorIds = new Set<string>();
      posts.forEach(post => {
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(comment => {
            if (comment.author_id) commentAuthorIds.add(comment.author_id);
          });
        }
      });
      
      if (commentAuthorIds.size === 0) return;
      
      // 작성자 정보 가져오기
      const { data: authorProfiles, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', Array.from(commentAuthorIds));
        
      if (error) {
        console.error('댓글 작성자 정보 조회 에러:', error);
        return;
      }
      
      // 작성자 정보 매핑
      const authorMap = new Map<string, string>();
      authorProfiles?.forEach(profile => {
        authorMap.set(profile.user_id, profile.name);
      });
      
      // 댓글에 작성자 이름 추가
      const updatedPosts = posts.map(post => {
        if (post.comments && post.comments.length > 0) {
          const updatedComments = post.comments.map(comment => {
            return {
              ...comment,
              name: authorMap.get(comment.author_id) || comment.nickname || '이름 없음'
            };
          });
          return { ...post, comments: updatedComments };
        }
        return post;
      });
      
      setPosts(updatedPosts);
    } catch (error) {
      console.error('댓글 작성자 정보 가져오기 오류:', error);
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

  // 댓글 토글 함수 수정 - index를 함께 저장하여 더 정확한 식별
  const toggleComments = (postId: string, index: number) => {
    const uniqueId = `${postId}-${index}`;
    setExpandedPosts(prev => 
      prev.includes(uniqueId) 
        ? prev.filter(id => id !== uniqueId)
        : [...prev, uniqueId]
    );
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

  // 게시글 삭제 함수 개선
  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      console.log('게시글 삭제 시작:', postId);
      
      // 테이블 구조 확인을 위한 로그
      console.log('게시글 삭제 대상 ID 필드:', postId);
      
      // 기본 키 필드 검증 - userId 사용
      const { data: postCheck, error: checkError } = await supabase
        .from('posts')
        .select('userId, id')
        .eq('userId', postId)
        .single();
      
      if (checkError) {
        console.error('게시글 확인 에러:', checkError);
        
        // userId로 안되면 id로 재시도
        const { data: idCheck, error: idCheckError } = await supabase
          .from('posts')
          .select('userId, id')
          .eq('id', postId)
          .single();
        
        if (idCheckError) {
          console.error('게시글 id로 확인 에러:', idCheckError);
          throw new Error('게시글을 찾을 수 없습니다. 관리자에게 문의하세요.');
        }
        
        // id로 실행
        const { data, error } = await supabase
          .from('posts')
          .update({ isdeleted: true })
          .eq('id', postId)
          .select();
        
        if (error) {
          console.error('id로 게시글 삭제 에러:', error);
          throw error;
        }
        
        console.log('id로 게시글 삭제 성공:', data);
      } else {
        // userId로 실행
        const { data, error } = await supabase
          .from('posts')
          .update({ isdeleted: true })
          .eq('userId', postId)
          .select();
        
        if (error) {
          console.error('userId로 게시글 삭제 에러:', error);
          throw error;
        }
        
        console.log('userId로 게시글 삭제 성공:', data);
      }
      
      fetchPosts();
    } catch (error) {
      console.error('게시글 삭제 중 오류가 발생했습니다:', error);
      setErrorMessage(error instanceof Error ? error.message : '게시글 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 게시글 블라인드 처리 함수 개선
  const handleBlindPost = async (postId: string) => {
    try {
      console.log('블라인드 처리 시작:', postId);
      
      // 테이블 구조 확인을 위한 로그
      console.log('게시글 블라인드 대상 ID 필드:', postId);
      
      // 기본 키 필드 검증 - userId 사용
      const { data: postCheck, error: checkError } = await supabase
        .from('posts')
        .select('userId, id')
        .eq('userId', postId)
        .single();
      
      if (checkError) {
        console.error('게시글 확인 에러:', checkError);
        
        // userId로 안되면 id로 재시도
        const { data: idCheck, error: idCheckError } = await supabase
          .from('posts')
          .select('userId, id')
          .eq('id', postId)
          .single();
        
        if (idCheckError) {
          console.error('게시글 id로 확인 에러:', idCheckError);
          throw new Error('게시글을 찾을 수 없습니다. 관리자에게 문의하세요.');
        }
        
        // id로 실행
        try {
          const { data, error } = await supabase
            .from('posts')
            .update({ isBlinded: true })
            .eq('id', postId)
            .select();
        
          if (error) {
            console.error('id로 블라인드 처리 에러:', error);
            
            // isBlinded 필드가 없는 경우 isdeleted로 대체
            console.log('isdeleted로 대체 시도');
            const { error: fallbackError } = await supabase
              .from('posts')
              .update({ isdeleted: true })
              .eq('id', postId);
    
            if (fallbackError) {
              console.error('대체 처리 에러:', fallbackError);
              throw fallbackError;
            }
            
            setErrorMessage('isBlinded 필드를 사용할 수 없어 isdeleted로 처리되었습니다.');
            setShowErrorModal(true);
          } else {
            console.log('id로 블라인드 처리 성공:', data);
          }
        } catch (processError) {
          console.error('id 처리 중 오류:', processError);
          throw processError;
        }
      } else {
        // userId로 실행
        try {
          const { data, error } = await supabase
            .from('posts')
            .update({ isBlinded: true })
            .eq('userId', postId)
            .select();
        
          if (error) {
            console.error('userId로 블라인드 처리 에러:', error);
            
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
            console.log('userId로 블라인드 처리 성공:', data);
          }
        } catch (processError) {
          console.error('userId 처리 중 오류:', processError);
          throw processError;
        }
      }
      
      fetchPosts();
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류가 발생했습니다:', error);
      setErrorMessage(error instanceof Error ? error.message : '게시글 블라인드 처리 중 오류가 발생했습니다.');
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
      
      console.log('컨텐츠 복구 시작:', {type, id, table, idField});
      
      // 기본 복구 데이터 설정
      const updateData: any = { 
        isdeleted: false,
        reports: []
      };
      
      // 테이블 구조 확인을 위한 체크
      if (type === 'post') {
        // 기본 키 필드 검증 - userId 사용
        const { data: postCheck, error: checkError } = await supabase
          .from('posts')
          .select('userId, id')
          .eq('userId', id)
          .single();
        
        if (checkError) {
          console.error('게시글 확인 에러:', checkError);
          
          // userId로 안되면 id로 재시도
          const { data: idCheck, error: idCheckError } = await supabase
            .from('posts')
            .select('userId, id')
            .eq('id', id)
            .single();
          
          if (idCheckError) {
            console.error('게시글 id로 확인 에러:', idCheckError);
            throw new Error('게시글을 찾을 수 없습니다. 관리자에게 문의하세요.');
          }
          
          // id로 실행
          const { data, error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)
            .select();
          
          if (error) {
            console.error('id로 컨텐츠 복구 에러:', error);
            throw error;
          }
          
          console.log('id로 기본 데이터 복구 성공:', data);
          
          // isBlinded 필드에 대한 별도 업데이트 시도
          try {
            const { data: blindUpdateData, error: blindUpdateError } = await supabase
              .from(table)
              .update({ isBlinded: false })
              .eq('id', id)
              .select();
            
            if (blindUpdateError) {
              console.log('id로 isBlinded 필드 업데이트 실패 (무시됨):', blindUpdateError);
            } else {
              console.log('id로 isBlinded 필드 업데이트 성공:', blindUpdateData);
            }
          } catch (e) {
            console.log('id로 isBlinded 필드 처리 중 오류 (무시됨):', e);
          }
        } else {
          // userId로 실행
          const { data, error } = await supabase
            .from(table)
            .update(updateData)
            .eq(idField, id)
            .select();
          
          if (error) {
            console.error('userId로 컨텐츠 복구 에러:', error);
            throw error;
          }
          
          console.log('userId로 기본 데이터 복구 성공:', data);
          
          // isBlinded 필드에 대한 별도 업데이트 시도
          try {
            const { data: blindUpdateData, error: blindUpdateError } = await supabase
              .from(table)
              .update({ isBlinded: false })
              .eq(idField, id)
              .select();
            
            if (blindUpdateError) {
              console.log('userId로 isBlinded 필드 업데이트 실패 (무시됨):', blindUpdateError);
            } else {
              console.log('userId로 isBlinded 필드 업데이트 성공:', blindUpdateData);
            }
          } catch (e) {
            console.log('userId로 isBlinded 필드 처리 중 오류 (무시됨):', e);
          }
        }
      } else {
        // 댓글은 id 필드 사용
        const { data, error } = await supabase
          .from(table)
          .update(updateData)
          .eq(idField, id)
          .select();
        
        if (error) {
          console.error('댓글 복구 에러:', error);
          throw error;
        }
        
        console.log('댓글 기본 데이터 복구 성공:', data);
        
        // isBlinded 필드에 대한 별도 업데이트 시도
        try {
          const { data: blindUpdateData, error: blindUpdateError } = await supabase
            .from(table)
            .update({ isBlinded: false })
            .eq(idField, id)
            .select();
          
          if (blindUpdateError) {
            console.log('댓글 isBlinded 필드 업데이트 실패 (무시됨):', blindUpdateError);
          } else {
            console.log('댓글 isBlinded 필드 업데이트 성공:', blindUpdateData);
          }
        } catch (e) {
          console.log('댓글 isBlinded 필드 처리 중 오류 (무시됨):', e);
        }
      }
      
      fetchPosts();
    } catch (error) {
      console.error('컨텐츠 복구 중 오류가 발생했습니다:', error);
      setErrorMessage(error instanceof Error ? error.message : '컨텐츠 복구 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 신고 횟수가 적절하게 표시되도록 유틸리티 함수 추가
  const getReportCount = (reports: any) => {
    if (!reports) return 0;
    if (Array.isArray(reports)) return reports.length;
    if (typeof reports === 'object' && Object.keys(reports).length > 0) return Object.keys(reports).length;
    return 0;
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
    <div className="min-h-screen bg-gray-50 pb-8">
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
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순번
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자/닉네임
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    내용
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일시
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post, index) => {
                  // 각 게시글마다 고유 ID 생성
                  const uniqueId = `${post.userId}-${index}`;
                  const reportCount = getReportCount(post.reports);
                  
                  return (
                    <React.Fragment key={uniqueId}>
                      <tr className={post.isBlinded || post.isdeleted ? "bg-gray-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-0">
                              <div className="text-sm font-medium text-gray-900">{post.name || post.nickname}</div>
                              <div className="text-sm text-gray-500">{post.nickname} ({post.studentid})</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md break-words">{post.content}</div>
                          {post.comments && post.comments.length > 0 && (
                            <button 
                              onClick={() => toggleComments(post.userId, index)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg 
                                className={`w-4 h-4 mr-1 transition-transform ${expandedPosts.includes(uniqueId) ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                              댓글 {post.comments.length}개 {expandedPosts.includes(uniqueId) ? '숨기기' : '보기'}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {post.isBlinded && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                블라인드
                              </span>
                            )}
                            {post.isdeleted && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                삭제됨
                              </span>
                            )}
                            {post.isEdited && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                수정됨
                              </span>
                            )}
                            {reportCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                신고 {reportCount}회
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            {post.isdeleted || post.isBlinded ? (
                              <button
                                onClick={() => handleRestoreContent('post', post.userId)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs flex items-center justify-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                복구
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleBlindPost(post.userId)}
                                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-xs flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                  블라인드
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.userId)}
                                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 text-xs flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  삭제
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => toggleComments(post.userId, index)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              댓글 {post.comments ? post.comments.length : 0}개
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* 댓글 섹션 */}
                      {expandedPosts.includes(uniqueId) && post.comments && post.comments.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <h3 className="font-medium text-gray-700">댓글 목록 ({post.comments.length}개)</h3>
                              {post.comments.map((comment) => {
                                const commentReportCount = getReportCount(comment.reports);
                                return (
                                  <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex justify-between">
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-900 text-sm">{comment.nickname}</span>
                                        <span className="ml-2 text-gray-600 text-xs">({comment.name || '이름 없음'})</span>
                                        <span className="ml-2 text-gray-500 text-xs">{comment.studentid}</span>
                                        {comment.isEdited && <span className="ml-2 text-xs text-gray-500">(수정됨)</span>}
                                      </div>
                                      <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="mt-1 text-gray-700 text-sm">{comment.content}</p>
                                    
                                    <div className="mt-2 flex justify-between items-center">
                                      <div className="flex space-x-1">
                                        {comment.isBlinded && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            블라인드
                                          </span>
                                        )}
                                        {comment.isdeleted && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            삭제됨
                                          </span>
                                        )}
                                        {commentReportCount > 0 && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                            신고 {commentReportCount}회
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex space-x-2">
                                        {comment.isdeleted || comment.isBlinded ? (
                                          <button
                                            onClick={() => handleRestoreContent('comment', comment.id)}
                                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                          >
                                            복구
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => handleBlindComment(comment.id)}
                                              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
                                            >
                                              블라인드
                                            </button>
                                            <button
                                              onClick={() => handleDeleteComment(comment.id)}
                                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                            >
                                              삭제
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : !message.type && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      )}

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