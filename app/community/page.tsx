'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '@/contexts/AuthContext';
import { createClientSupabaseClient } from '@/utils/supabase';

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
  reports: string[];
}

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
}

// 랜덤 닉네임 생성을 위한 데이터
const adjectives = [
  '귀여운', '즐거운', '행복한', '신나는', '따뜻한', 
  '달콤한', '상큼한', '활발한', '차분한', '깔끔한',
  '멋진', '예쁜', '친절한', '똑똑한', '재미있는'
];

const nouns = [
  '사과', '딸기', '오렌지', '포도', '레몬',
  '토끼', '강아지', '고양이', '판다', '코알라',
  '학생', '친구', '여행자', '예술가', '과학자'
];

// 랜덤 이모지 생성을 위한 데이터
const emojis = ['😊', '🥰', '😎', '🤗', '😇', '🦊', '🐰', '🐻', '🐼', '🐨', '🦁', '🐯', '🦒', '🦮', '🐶'];

function generateRandomNickname(): string {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

function generateRandomEmoji(): string {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export default function Community() {
  const router = useRouter();
  const { user } = useAuth();
  const sliderRef = useRef<Slider>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const supabase = createClientSupabaseClient();
  const [userInfo, setUserInfo] = useState<{ 
    userId: string;
    studentId: string;
    nickname?: string;
    emoji?: string;
    profileId?: string;
  }>({ userId: '', studentId: '' });
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAllComments, setShowAllComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{postId: string, commentId: string} | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    postId: string;
    commentId?: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 신고 사유 목록
  const reportReasons = [
    '부적절한 내용',
    '스팸/광고',
    '욕설/비하',
    '허위정보',
    '기타'
  ];

  // 게시글 불러오기
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      console.log('게시글 조회 시작');
      
      // 게시물 조회
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('isdeleted', false)
        .order('created_at', { ascending: false });
      
      if (postsError) {
        console.error('게시글 조회 에러:', postsError);
        setIsLoading(false);
        return;
      }
      
      console.log('게시글 조회 완료:', postsData.length, '개');
      
      // userId를 사용하는지 확인하고 로그
      console.log('게시글 데이터 구조 확인:', postsData.length > 0 ? Object.keys(postsData[0]) : '게시글 없음');
      
      // 신고 수가 3회 미만인 게시글만 필터링
      const filteredPosts = postsData.filter(post => {
        // 신고 횟수가 없거나 3회 미만인 경우만 포함
        return !post.reports || post.reports.length < 3;
      });
      
      console.log('filteredPosts:', filteredPosts);
      
      // 각 게시글에 댓글 추가
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          try {
            console.log(`게시글 ID ${post.userId}의 댓글 조회 시작`);
            
            const { data: commentsData, error: commentsError } = await supabase
              .from('comments')
              .select('*')
              .eq('post_id', post.userId)
              .order('created_at', { ascending: true });
              
            if (commentsError) {
              console.error(`게시글 ID ${post.userId}의 댓글 조회 에러:`, commentsError);
              return { ...post, comments: [] };
            }
            
            console.log(`게시글 ID ${post.userId}의 댓글 조회 완료:`, commentsData?.length || 0, '개');
            
            return { ...post, comments: commentsData || [] };
          } catch (error) {
            console.error(`게시글 ID ${post.userId}의 댓글 처리 중 오류:`, error);
            return { ...post, comments: [] };
          }
        })
      );
      
      setPosts(postsWithComments);
      
      // 인기 게시글 (좋아요 3개 이상) 계산
      const popular = postsWithComments
        .filter(post => post.likes && post.likes.length >= 3)
        .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
        .slice(0, 5);
        
      setPopularPosts(popular);
      setIsLoading(false);
    } catch (error) {
      console.error('게시글 조회 중 오류가 발생했습니다:', error);
      setIsLoading(false);
    }
  };

  // 프로필 정보 가져오기
  const fetchProfileInfo = async (userId: string) => {
    try {
      // 프로필 정보 조회
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, student_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {  // 데이터가 없는 경우
          // 프로필 생성
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: userId,
                student_id: 'temp_' + userId.slice(0, 8),  // 임시 학번
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('프로필 생성 중 오류가 발생했습니다:', createError);
            setErrorMessage('프로필을 생성할 수 없습니다.');
            setShowErrorModal(true);
            return;
          }

          if (newProfile) {
            // 새로 생성된 프로필로 userInfo 설정
            const nickname = generateRandomNickname();
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            localStorage.setItem(`userNickname_${userId}`, JSON.stringify({ nickname, emoji }));
            setUserInfo({ 
              userId, 
              studentId: newProfile.student_id, 
              nickname, 
              emoji,
              profileId: newProfile.id
            });
          }
        } else {
          console.error('프로필 정보를 가져오는 중 오류가 발생했습니다:', error);
          setErrorMessage('프로필 정보를 가져오는 중 오류가 발생했습니다.');
          setShowErrorModal(true);
        }
        return;
      }
      
      if (profile) {
        // 저장된 사용자 닉네임 정보 가져오기
        const userNickname = localStorage.getItem(`userNickname_${userId}`);
        if (userNickname) {
          const { nickname, emoji } = JSON.parse(userNickname);
          setUserInfo({ 
            userId, 
            studentId: profile.student_id, 
            nickname, 
            emoji,
            profileId: profile.id
          });
        } else {
          // 새로운 닉네임 생성 및 저장
          const nickname = generateRandomNickname();
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          localStorage.setItem(`userNickname_${userId}`, JSON.stringify({ nickname, emoji }));
          setUserInfo({ 
            userId, 
            studentId: profile.student_id, 
            nickname, 
            emoji,
            profileId: profile.id
          });
        }
      }
    } catch (error) {
      console.error('프로필 정보를 가져오는 중 오류가 발생했습니다:', error);
      setErrorMessage('프로필 정보를 가져오는 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 컴포넌트 마운트 시 게시글 불러오기
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    fetchPosts();
    fetchProfileInfo(user.id);  // 프로필 정보 가져오기
  }, [user, router]);

  // 게시물이 변경될 때마다 인기 게시물 업데이트
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const popularPosts = posts
      .filter(post => !post.isdeleted && new Date(post.created_at) >= today)
      .sort((a, b) => {
        const aScore = (a.likes?.length || 0) + (a.comments?.length || 0);
        const bScore = (b.likes?.length || 0) + (b.comments?.length || 0);
        return bScore - aScore;
      })
      .slice(0, 5);

    setPopularPosts(popularPosts);
  }, [posts]);

  // 게시글 작성 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user || !userInfo.profileId) {
      console.log('게시글 작성 실패: 필수 정보 누락', {
        hasContent: !!newPost.trim(),
        hasUser: !!user,
        profileId: userInfo.profileId
      });
      setErrorMessage('게시글을 작성할 수 없습니다. 필수 정보가 누락되었습니다.');
      setShowErrorModal(true);
      return;
    }

    try {
      // 먼저 올바른 프로필 ID가 있는지 다시 한번 확인
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, student_id')
        .eq('id', userInfo.profileId)
        .single();
        
      if (profileError || !profileCheck) {
        console.error('프로필 정보를 확인할 수 없습니다:', {
          error: profileError,
          profileId: userInfo.profileId
        });
        // 프로필이 없는 경우 다시 생성 시도
        await fetchProfileInfo(user.id);
        setErrorMessage('프로필 정보를 다시 확인 중입니다. 잠시 후 다시 시도해주세요.');
        setShowErrorModal(true);
        return;
      }

      const post = {
        userId: profileCheck.id,  // 확인된 프로필 ID 사용
        author_id: profileCheck.id,
        content: newPost,
        nickname: userInfo.nickname || '',
        studentid: profileCheck.student_id,  // 확인된 학번 사용
        emoji: userInfo.emoji || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };

      console.log('게시글 작성 시도:', post);  // 요청 데이터 로깅

      const { error } = await supabase
        .from('posts')
        .insert([post]);

      if (error) {
        console.error('게시글 작성 중 오류가 발생했습니다:', error);
        setErrorMessage(`게시글 작성 중 오류가 발생했습니다: ${error.message}`);
        setShowErrorModal(true);
        return;
      }

      console.log('게시글 작성 성공');
      setNewPost('');
      fetchPosts(); // 게시글 목록 새로고침
    } catch (error) {
      console.error('게시글 작성 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글 작성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setShowErrorModal(true);
    }
  };

  // 좋아요 처리
  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.userId === postId);
      if (!post) return;

      const likes = post.likes || [];
      const hasLiked = likes.includes(userInfo.studentId);
      
      const updatedLikes = hasLiked
        ? likes.filter(id => id !== userInfo.studentId)
        : [...likes, userInfo.studentId];

      const { error } = await supabase
        .from('posts')
        .update({ likes: updatedLikes })
        .eq('userId', postId);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('좋아요 처리 중 오류가 발생했습니다:', error);
      setErrorMessage('좋아요 처리 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 게시글 수정
  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editContent,
          isEdited: true
        })
        .eq('userId', postId);

      if (error) throw error;

      setEditingPost(null);
      setEditContent('');
      fetchPosts();
    } catch (error) {
      console.error('게시글 수정 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글 수정 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 게시글 삭제
  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ isdeleted: true })
        .eq('userId', postId);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('게시글 삭제 중 오류가 발생했습니다:', error);
      setErrorMessage('게시글 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 댓글 작성
  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !userInfo.profileId) return;

    try {
      // 먼저 올바른 프로필 ID가 있는지 다시 한번 확인
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userInfo.profileId)
        .single();
        
      if (profileError || !profileCheck) {
        console.error('프로필 정보를 확인할 수 없습니다:', profileError);
        setErrorMessage('댓글을 작성할 수 없습니다. 프로필 정보를 확인해주세요.');
        setShowErrorModal(true);
        return;
      }
      
      // 게시글이 존재하는지 확인
      const { data: postCheck, error: postError } = await supabase
        .from('posts')
        .select('userId')
        .eq('userId', postId)
        .single();
        
      if (postError || !postCheck) {
        console.error('게시글을 확인할 수 없습니다:', postError);
        setErrorMessage('댓글을 작성할 수 없습니다. 게시글이 존재하지 않습니다.');
        setShowErrorModal(true);
        return;
      }

      const comment = {
        post_id: postId,
        author_id: userInfo.profileId,
        content: newComment,
        nickname: userInfo.nickname || '',
        studentid: userInfo.studentId,
        emoji: userInfo.emoji || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('댓글 작성:', comment);  // 요청 데이터 로깅

      const { error } = await supabase
        .from('comments')
        .insert([comment]);

      if (error) {
        console.error('댓글 작성 중 오류가 발생했습니다:', error);
        setErrorMessage(`댓글 작성 중 오류가 발생했습니다: ${error.message}`);
        setShowErrorModal(true);
        return;
      }

      setNewComment('');
      fetchPosts();
    } catch (error) {
      console.error('댓글 작성 중 오류가 발생했습니다:', error);
      setErrorMessage('댓글 작성 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post.userId);
    setEditContent(post.content);
  };

  const handleEditComment = (postId: string, commentId: string, content: string) => {
    setEditingComment({ postId, commentId });
    setEditCommentContent(content);
  };

  const handleSaveCommentEdit = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editCommentContent,
          isEdited: true
        })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      setEditCommentContent('');
      fetchPosts();
    } catch (error) {
      console.error('댓글 수정 중 오류가 발생했습니다:', error);
      setErrorMessage('댓글 수정 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.userId === postId) {
        const updatedComments = post.comments.map(comment =>
          comment.id === commentId ? { ...comment, isdeleted: true } : comment
        );
        return { ...post, comments: updatedComments };
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return date.toLocaleDateString();
  };

  const renderComments = (post: Post, showAll: boolean) => {
    const comments = post.comments || [];
    const displayComments = showAll ? comments : comments.slice(0, 2);
    const hasMoreComments = comments.length > 2;

    return displayComments.map((comment) => !comment.isdeleted ? (
      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{post.emoji}</span>
            <div>
              <p className="font-medium text-sm">{comment.nickname}</p>
              <p className="text-xs text-gray-500">{comment.studentid}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleString()}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-500">(수정됨)</span>
            )}
            {comment.author_id === userInfo.userId && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditComment(post.userId, comment.id, comment.content)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteComment(post.userId, comment.id)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
        
        {editingComment?.postId === post.userId && 
         editingComment?.commentId === comment.id ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editCommentContent}
              onChange={(e) => setEditCommentContent(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={() => setEditingComment(null)}
              className="btn-secondary px-3"
            >
              취소
            </button>
            <button
              onClick={() => handleSaveCommentEdit(post.userId, comment.id)}
              className="btn-primary px-3"
            >
              저장
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{comment.content}</p>
        )}
      </div>
    ) : (
      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-500 text-center">삭제된 댓글입니다.</p>
      </div>
    ));
  };

  // 게시물로 스크롤하는 함수
  const scrollToPost = (postId: string) => {
    setSelectedPost(postId);
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth' });
      // 스크롤 후 잠시 하이라이트 효과를 주기 위해
      postElement.classList.add('highlight-post');
      setTimeout(() => {
        postElement.classList.remove('highlight-post');
      }, 2000);
    }
  };

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  // 신고 모달 열기
  const handleOpenReport = (type: 'post' | 'comment', postId: string, commentId?: string) => {
    setReportTarget({ type, postId, commentId });
    setShowReportModal(true);
  };

  // 신고 처리
  const handleReport = () => {
    if (!reportTarget || !reportReason) return;

    const updatedPosts = posts.map(post => {
      if (post.userId === reportTarget.postId) {
        if (reportTarget.type === 'post') {
          // 게시글 신고
          const reports = post.reports || [];
          if (!reports.includes(userInfo.studentId)) {
            return {
              ...post,
              reports: [...reports, userInfo.studentId]
            };
          }
        } else if (reportTarget.type === 'comment') {
          // 댓글 신고
          const updatedComments = post.comments.map(comment => {
            if (comment.id === reportTarget.commentId) {
              const reports = comment.reports || [];
              if (!reports.includes(userInfo.studentId)) {
                return {
                  ...comment,
                  reports: [...reports, userInfo.studentId]
                };
              }
            }
            return comment;
          });
          return { ...post, comments: updatedComments };
        }
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
    setShowReportModal(false);
    setReportTarget(null);
    setReportReason('');
    alert('신고가 접수되었습니다.');
  };

  useEffect(() => {
    // 실시간 구독 설정
    const postsSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts' 
      }, () => {
        fetchPosts();
      })
      .subscribe();

    const commentsSubscription = supabase
      .channel('public:comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments' 
      }, () => {
        fetchPosts();
      })
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      postsSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-h2 text-center">커뮤니티</h1>
        </div>
      </div>

      {/* 인기 게시물 슬라이더 */}
      {popularPosts.length > 0 && (
        <div className="bg-gray-50 border-b mb-4">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h2 className="text-lg font-bold mb-4">오늘의 인기 게시물</h2>
            <div className="mb-6">
              <Slider {...sliderSettings} ref={sliderRef}>
                {popularPosts.map((post, index) => (
                  <div key={post.userId} className="px-2">
                    <button
                      onClick={() => scrollToPost(post.userId)}
                      className="w-full text-left bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{post.emoji}</span>
                        <span className="font-medium">{post.nickname}</span>
                      </div>
                      <p className="text-gray-700 line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center gap-1">
                          <HeartIcon className="w-4 h-4" />
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 작성 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="card mb-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="무슨 생각을 하고 계신가요?"
            className="input-field mb-4"
            rows={4}
          />
          <button type="submit" className="btn-primary w-full">
            게시하기
          </button>
        </form>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div 
                key={post.userId} 
                id={`post-${post.userId}`}
                className={`card transition-all duration-300 ${
                  selectedPost === post.userId ? 'ring-2 ring-primary-DEFAULT' : ''
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{post.emoji}</span>
                      <p className="font-medium text-gray-900">{post.nickname}</p>
                    </div>
                    <p className="text-sm text-gray-500">{post.studentid}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                    {post.isEdited && <span className="text-sm text-gray-500">(수정됨)</span>}
                    {post.author_id === userInfo.userId && !post.isdeleted ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(post)}
                          className="text-sm text-blue-500 hover:text-blue-600"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleDelete(post.userId)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    ) : !post.isdeleted && (
                      <button
                        onClick={() => handleOpenReport('post', post.userId)}
                        className="text-sm text-gray-500 hover:text-gray-600"
                      >
                        신고
                      </button>
                    )}
                  </div>
                </div>
                
                {editingPost === post.userId ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input-field"
                      rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingPost(null)}
                        className="btn-secondary"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveEdit(post.userId)}
                        className="btn-primary"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {post.isdeleted ? (
                      <p className="text-gray-500 text-center mb-3">삭제된 게시물입니다.</p>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.userId)}
                        className={`flex items-center gap-1 ${
                          post.likes?.includes(userInfo.studentId)
                            ? 'text-red-500'
                            : 'text-gray-500'
                        }`}
                      >
                        <HeartIcon className="w-5 h-5" />
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <button 
                        onClick={() => setShowCommentInput(showCommentInput === post.userId ? null : post.userId)}
                        className="flex items-center gap-1 text-gray-500"
                      >
                        <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                    </div>
                  </>
                )}

                {/* 댓글 입력창 */}
                {!post.isdeleted && showCommentInput === post.userId && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => handleAddComment(post.userId)}
                        className="btn-primary px-4"
                      >
                        작성
                      </button>
                    </div>
                  </div>
                )}

                {/* 댓글 목록 */}
                {!post.isdeleted && renderComments(post, showAllComments === post.userId).map((comment: any) => (
                  <div className="flex items-center gap-2">
                    {(comment as any).author_id === userInfo.userId ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(post.userId, (comment as any).id, (comment as any).content)}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteComment(post.userId, (comment as any).id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenReport('comment', post.userId, (comment as any).id)}
                        className="text-xs text-gray-500 hover:text-gray-600"
                      >
                        신고
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-500 text-lg mb-4">아직 게시글이 없습니다.</p>
              <p className="text-gray-400">첫 번째 게시글을 작성해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">신고하기</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신고 사유
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">신고 사유를 선택해주세요</option>
                  {reportReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportTarget(null);
                    setReportReason('');
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason}
                  className="btn-primary"
                >
                  신고하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2">
        <div className="max-w-lg mx-auto px-4 flex justify-around items-center">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center text-gray-400"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-sm mt-1">홈</span>
          </button>
          <button
            onClick={() => router.push('/community')}
            className="flex flex-col items-center text-primary-DEFAULT"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-sm mt-1">커뮤니티</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center text-gray-400"
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-sm mt-1">설정</span>
          </button>
        </div>
      </div>
    </div>
  );
} 