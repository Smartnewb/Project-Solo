'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ChatBubbleOvalLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '@/contexts/AuthContext';
import { createClientSupabaseClient } from '@/utils/supabase';
import { createClient } from '@supabase/supabase-js';

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

// 신고 사유 목록
const reportReasons = [
  '음란물/성적 콘텐츠',
  '폭력적/폭력 위협 콘텐츠',
  '증오/혐오 발언',
  '스팸/광고',
  '개인정보 노출',
  '가짜 정보',
  '저작권 침해',
  '기타 사유'
];

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
  const supabase = createClientSupabaseClient();
  
  const [userInfo, setUserInfo] = useState<{
    userId: string;
    profileId?: string;
    nickname?: string;
    emoji?: string;
  }>({
    userId: '',
  });
  
  // 디바운싱을 위한 타이머 참조 저장
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 디바운시 처리를 위한 함수
  const debounce = <T extends (...args: any[]) => void>(
    callback: T, 
    delay: number = 500
  ) => {
    return function(...args: Parameters<T>) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  };
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
  
      // 신고 임계값을 3으로 설정 (월드스타일)
      const reportThreshold = 3; // 월드스타일은 3회 신고시 블라인드 처리
      console.log('현재 신고 임계값:', reportThreshold);
      
      // 게시물 조회 - 오류 방지를 위해 단일 호출로 변경
      let postsData: any[] = [];
      let postsError = null;
      
      try {
        const response = await supabase
          .from('posts')
          .select('*')
          .eq('isdeleted', false)
          .order('created_at', { ascending: false });
        
        if (response.error) {
          postsError = response.error;
        } else {
          postsData = response.data || [];
        }
      } catch (error) {
        postsError = error;
        console.error('게시글 조회 중 예외 발생:', error);
      }
      
      if (postsError) {
        console.error('게시글 조회 에러:', postsError);
        setIsLoading(false);
        return;
      }
      
      console.log('게시글 조회 완료:', postsData.length, '개');
      
      // userId를 사용하는지 확인하고 로그
      console.log('게시글 데이터 구조 확인:', postsData.length > 0 ? Object.keys(postsData[0]) : '게시글 없음');
      
      // 신고 수가 임계값 미만인 게시글만 필터링
      const filteredPosts = postsData.filter(post => {
        // 신고 횟수가 없거나 임계값 미만인 경우만 포함
        return !post.reports || post.reports.length < reportThreshold;
      });
      
      console.log('filteredPosts:', filteredPosts);
      
      // 각 게시글에 댓글 추가 - 오류 방지를 위해 로직 수정
      const postsWithComments = await Promise.all(
        filteredPosts.map(async (post) => {
          try {
            console.log(`게시글 ID ${post.userId}의 댓글 조회 시작`);
            
            // 댓글 조회를 위한 별도의 함수 호출
            let commentsData: any[] = [];
            
            try {
              const commentsResponse = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', post.userId)
                .order('created_at', { ascending: true });
                
              if (commentsResponse.error) {
                console.error(`게시글 ID ${post.userId}의 댓글 조회 에러:`, commentsResponse.error);
              } else {
                commentsData = commentsResponse.data || [];
                console.log(`게시글 ID ${post.userId}의 댓글 조회 완료:`, commentsData.length, '개');
                
                // 댓글 데이터 구조 확인
                if (commentsData.length > 0) {
                  console.log('댓글 데이터 구조:', Object.keys(commentsData[0]));
                }
              }
            } catch (commentError) {
              console.error(`게시글 ID ${post.userId}의 댓글 조회 중 예외:`, commentError);
            }
            
            return { ...post, comments: commentsData };
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
      console.log('프로필 정보 가져오기 시작:', userId);
      
      // DB 구조에 맞게 수정 - id를 사용하여 프로필 검색(테이블 구조에 맞게 수정)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', userId) // user_id 대신 id 사용
        .single();

      console.log('프로필 검색 결과:', { profile, error });
        
      if (error) {
        console.log('프로필을 찾을 수 없어 새로 생성합니다:', error.message);
        
        // 프로필 생성 (DB 구조에 맞게 수정)
        const randomNickname = generateRandomNickname();
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const newProfileData = {
          id: userId,
          name: `익명_${userId.slice(0, 4)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfileData])
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
          localStorage.setItem(`userNickname_${userId}`, JSON.stringify({ nickname: randomNickname, emoji }));
          setUserInfo({ 
            userId,
            profileId: newProfile.id,
            nickname: randomNickname,
            emoji
          });
          console.log('새 프로필 생성 완료:', newProfile);
        }
      } else if (profile) {
        // 기존 프로필 정보 처리
        let userNickname = { nickname: '', emoji: '' };
        // 로컬스토리지에서 닉네임 가져오기
        const savedNickname = localStorage.getItem(`userNickname_${userId}`);
        
        if (savedNickname) {
          userNickname = JSON.parse(savedNickname);
        } else {
          // 로컬스토리지에 닉네임이 없는 경우 새로 생성
          userNickname = {
            nickname: profile.name || generateRandomNickname(),
            emoji: emojis[Math.floor(Math.random() * emojis.length)]
          };
          localStorage.setItem(`userNickname_${userId}`, JSON.stringify(userNickname));
        }
        
        setUserInfo({
          userId,
          profileId: profile.id,
          nickname: userNickname.nickname,
          emoji: userNickname.emoji
        });
        console.log('기존 프로필 정보 가져오기 성공:', profile);
      }
      
      console.log('프로필 정보 가져오기 완료');
      return true;
    } catch (error) {
      console.error('프로필 정보 가져오기 중 오류 발생:', error);
      setErrorMessage('프로필 정보를 가져올 수 없습니다.');
      setShowErrorModal(true);
      return false;
    }
  };

  // 컴포넌트 마운트 시 게시글 불러오기
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 사용자 인증 확인
        if (user) {
          console.log('커뮤니티 페이지 로드: 사용자 인증됨', user.id);
          
          // 세션 새로고침 시도
          const { data: { session } } = await supabase.auth.getSession();
          console.log('현재 세션 상태:', session ? '유효한 세션 있음' : '세션 없음');
          
          // 프로필 정보 가져오기
          await fetchProfileInfo(user.id);
          
          // 게시글 가져오기
          await fetchPosts();
        } else {
          console.log('커뮤니티 페이지 로드: 사용자 인증 대기 중');
          // 사용자 인증 대기 중 - 리다이렉트하지 않음
        }
      } catch (error) {
        console.error('커뮤니티 페이지 초기화 오류:', error);
      }
    };
    
    initializeData();
  }, [user]);

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

  // 좋아요 처리
  const handleLike = async (PostUerId: string) => {
    try {
      const post = posts.find(p => p.userId === PostUerId);
      if (!post) return;

      const likes = post.likes || [];
      const hasLiked = likes.includes(userInfo.userId);
      
      const updatedLikes = hasLiked
        ? likes.filter(id => id !== userInfo.userId)
        : [...likes, userInfo.userId];

      const { error } = await supabase
        .from('posts')
        .update({ likes: updatedLikes })
        .eq('userId', PostUerId);

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
    if (!newComment.trim() || !user) {
      console.log('댓글 작성 실패: 내용 또는 사용자 정보 누락', {
        hasContent: !!newComment.trim(),
        hasUser: !!user
      });
      setErrorMessage('댓글을 작성할 수 없습니다. 로그인이 필요합니다.');
      setShowErrorModal(true);
      return;
    }

    try {
      // 사용자 프로필 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', user.id);
      
      if (profileError || !profile[0]) {
        console.error('프로필을 불러오는 중 오류가 발생했습니다:', profileError);
        setErrorMessage('댓글을 작성할 수 없습니다. 프로필 정보를 확인해주세요.');
        setShowErrorModal(true);
        return;
      }
      
      // 프로필 ID 가져오기
      const profileId = profile[0].id;
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

      // UUID 생성 함수
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const commentData = {
        id: generateUUID(), // 고유 ID 생성
        post_id: postId,
        author_id: profileId, // 위에서 가져온 프로필 ID 사용
        content: newComment,
        nickname: userInfo.nickname || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isEdited: false,
        isdeleted: false
      };

      console.log('댓글 작성:', commentData);  // 요청 데이터 로깅

      const { error } = await supabase
        .from('comments')
        .insert([commentData]);

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
            {user && comment.author_id !== user.id && (
              <button
                onClick={() => handleOpenReport('comment', post.userId, comment.id)}
                className="text-xs text-gray-500 hover:text-gray-600"
              >
                신고
              </button>
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
    // 로그인한 사용자 확인
    if (!user) {
      setErrorMessage('신고하려면 로그인이 필요합니다.');
      setShowErrorModal(true);
      return;
    }
    
    // 본인 게시글/댓글 신고 방지
    if (type === 'post') {
      // 게시글 작성자 확인
      const post = posts.find(p => p.userId === postId);
      if (post && post.userId === user.id) {
        setErrorMessage('본인이 작성한 게시글은 신고할 수 없습니다.');
        setShowErrorModal(true);
        return;
      }
    } else if (type === 'comment' && commentId) {
      // 댓글 작성자 확인
      const post = posts.find(p => p.userId === postId);
      if (post) {
        const comment = post.comments?.find((c: any) => c.id === commentId);
        // any를 사용하여 타입 오류 피하기
        if (comment && (comment as any).user_id === user.id) {
          setErrorMessage('본인이 작성한 댓글은 신고할 수 없습니다.');
          setShowErrorModal(true);
          return;
        }
      }
    }    
    setReportTarget({ type, postId, commentId });
    setShowReportModal(true);
  };

  // 신고 제출 처리
  const handleSubmitReport = async () => {
    if (!reportTarget || !reportReason || !user) {
      setErrorMessage('신고 정보가 올바르지 않습니다.');
      setShowErrorModal(true);
      return;
    }

    try {
      const { type, postId, commentId } = reportTarget;
      const reporterId = user.id;
      const timestamp = new Date().toISOString();
      const reportData = {
        reporter_id: reporterId,
        reason: reportReason,
        timestamp: timestamp
      };

      if (type === 'post') {
        // 게시글 신고 처리
        const { data: postData, error: fetchError } = await supabase
          .from('posts')
          .select('reports')
          .eq('userId', postId)
          .single();

        if (fetchError) throw fetchError;

        const reports = postData.reports || [];
        // 이미 신고한 사용자인지 확인
        const alreadyReported = reports.some((report: any) => report.reporter_id === reporterId);
        
        if (alreadyReported) {
          setErrorMessage('이미 신고한 게시글입니다.');
          setShowErrorModal(true);
          setShowReportModal(false);
          setReportReason('');
          return;
        }

        const updatedReports = [...reports, reportData];
        
        // 신고 횟수가 1회 이상이면 블라인드 처리 (테스트용으로 임시 변경)
        const shouldBlind = updatedReports.length >= 1;
        const updateData = { reports: updatedReports };
        
        if (shouldBlind) {
          // 어드민에게 알림 전송 (실제 구현 시 여기에 알림 API 호출 추가)
          try {
            // 어드민 알림 테이블에 신고 데이터 추가
            await supabase.from('admin_notifications').insert([{
              type: 'report',
              content_type: 'post',
              content_id: postId,
              reporter_id: reporterId,
              reason: reportReason,
              created_at: new Date().toISOString(),
              is_read: false
            }]);
          } catch (notificationError) {
            console.error('어드민 알림 전송 중 오류:', notificationError);
          }
        }
        
        const { error: updateError } = await supabase
          .from('posts')
          .update(updateData)
          .eq('userId', postId);

        if (updateError) throw updateError;
      } else if (type === 'comment' && commentId) {
        // 댓글 신고 처리
        const { data: commentData, error: fetchError } = await supabase
          .from('comments')
          .select('reports')
          .eq('id', commentId)
          .single();

        if (fetchError) throw fetchError;

        const reports = commentData.reports || [];
        // 이미 신고한 사용자인지 확인
        const alreadyReported = reports.some((report: any) => report.reporter_id === reporterId);
        
        if (alreadyReported) {
          setErrorMessage('이미 신고한 댓글입니다.');
          setShowErrorModal(true);
          setShowReportModal(false);
          setReportReason('');
          return;
        }

        const updatedReports = [...reports, reportData];
        
        // 신고 횟수가 1회 이상이면 블라인드 처리 (테스트용으로 임시 변경)
        const shouldBlind = updatedReports.length >= 1;
        const updateData = { reports: updatedReports };
        
        if (shouldBlind) {
          // 어드민에게 알림 전송 (실제 구현 시 여기에 알림 API 호출 추가)
          try {
            // 어드민 알림 테이블에 신고 데이터 추가
            await supabase.from('admin_notifications').insert([{
              type: 'report',
              content_type: 'comment',
              content_id: commentId,
              post_id: postId,
              reporter_id: reporterId,
              reason: reportReason,
              created_at: new Date().toISOString(),
              is_read: false
            }]);
          } catch (notificationError) {
            console.error('어드민 알림 전송 중 오류:', notificationError);
          }
        }
        
        const { error: updateError } = await supabase
          .from('comments')
          .update(updateData)
          .eq('id', commentId);

        if (updateError) throw updateError;
      }

      // 신고 처리 후 상태 초기화
      setShowReportModal(false);
      setReportReason('');
      setReportTarget(null);
      
      // 게시글 목록 새로고침
      fetchPosts();
      
      // 성공 메시지 표시
      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    } catch (error) {
      console.error('신고 처리 중 오류가 발생했습니다:', error);
      setErrorMessage('신고 처리 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
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
          <div className="flex items-center justify-between">
            <button 
              onClick={() => window.location.href = '/home'}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="뒤로 가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-h2 text-center flex-1">커뮤니티</h1>
            <div className="w-8"></div> {/* 공간 밸런스를 위한 비운 div */}
          </div>
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

      {/* 게시글 작성 버튼 */}
      <div className="max-w-lg mx-auto p-4">
        <button 
          onClick={() => router.push('/community/write')}
          className="btn-primary w-full mb-6"
        >
          새 게시글 작성하기
        </button>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div 
                key={post.userId} 
                id={`post-${post.userId}`}
                className={`card transition-all duration-300 ${
                  selectedPost === post.userId ? 'ring-2 ring-primary-DEFAULT' : ''
                } ${
                  post.isBlinded ? 'bg-gray-100 border border-gray-300' : ''
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{post.emoji}</span>
                      <p className="font-medium text-gray-900">{post.nickname}</p>
                    </div>
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
                    ) : !post.isdeleted && user && post.userId !== user.id && (
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
                    ) : post.isBlinded ? (
                      <div className="bg-gray-100 p-3 rounded-md mb-3">
                        <p className="text-gray-500 text-center font-medium">
                          <ExclamationTriangleIcon className="w-5 h-5 inline-block mr-1" />
                          신고로 인해 블라인드 처리된 게시글입니다.
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.userId)}
                        className={`flex items-center gap-1 ${
                          post.likes?.includes(userInfo.userId)
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
                        onChange={(e) => {
                          // 디바운싱 적용: 타이핑마다 API 요청 방지
                          const newValue = e.target.value;
                          setNewComment(newValue); // 화면 업데이트는 즉시 적용
                          
                          // 기존 타이머 취소
                          if (debounceTimerRef.current) {
                            clearTimeout(debounceTimerRef.current);
                          }
                          
                          // 새 타이머 설정 (300ms 디바운스)
                          debounceTimerRef.current = setTimeout(() => {
                            // 디바운스된 작업 처리
                            console.log('디바운스된 댓글 입력:', newValue.length, '글자');
                          }, 300);
                        }}
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
                {!post.isdeleted && renderComments(post, showAllComments === post.userId)}
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
                  onClick={handleSubmitReport}
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
            onClick={() => window.location.href = '/home'}
            className="flex flex-col items-center text-gray-400"
            aria-label="홈으로 이동"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-sm mt-1">홈</span>
          </button>
          <button
            onClick={() => window.location.href = '/community'}
            className="flex flex-col items-center text-primary-DEFAULT"
            aria-label="커뮤니티로 이동"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-sm mt-1">커뮤니티</span>
          </button>
          <button
            onClick={() => window.location.href = '/settings'}
            className="flex flex-col items-center text-gray-400"
            aria-label="설정으로 이동"
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-sm mt-1">설정</span>
          </button>
        </div>
      </div>
    </div>
  );
} 