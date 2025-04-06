"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import Filter from "badwords-ko";
import axiosServer from "@/utils/axios";
import axios from "axios";

interface Comment {
  id: string;
  authorId: string;
  postId: string;
  content: string;
  anonymous: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

interface Post {
  id: string;
  content: string;
  anonymous: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  likeCount: number;
  comments: Comment[];
  authorId: string;
}

interface User {
  id: string;
}
// 랜덤 닉네임 생성을 위한 데이터
const adjectives = [
  "귀여운",
  "즐거운",
  "행복한",
  "신나는",
  "따뜻한",
  "달콤한",
  "상큼한",
  "활발한",
  "차분한",
  "깔끔한",
  "멋진",
  "예쁜",
  "친절한",
  "똑똑한",
  "재미있는",
];

const nouns = [
  "사과",
  "딸기",
  "오렌지",
  "포도",
  "레몬",
  "토끼",
  "강아지",
  "고양이",
  "판다",
  "코알라",
  "학생",
  "친구",
  "여행자",
  "예술가",
  "과학자",
];

// 랜덤 이모지 생성을 위한 데이터
const emojis = [
  "😊",
  "🥰",
  "😎",
  "🤗",
  "😇",
  "🦊",
  "🐰",
  "🐻",
  "🐼",
  "🐨",
  "🦁",
  "🐯",
  "🦒",
  "🦮",
  "🐶",
];

// 신고 사유 목록
const reportReasons = [
  "음란물/성적 콘텐츠",
  "폭력적/폭력 위협 콘텐츠",
  "증오/혐오 발언",
  "스팸/광고",
  "개인정보 노출",
  "가짜 정보",
  "저작권 침해",
  "기타 사유",
];

function generateRandomNickname(): string {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

function generateRandomEmoji(): string {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export default function Community() {
  const router = useRouter();
  const { user, refreshAccessToken } = useAuth();
  const [Checkuser, setCheckuser] = useState<User | null>(null);
  const sliderRef = useRef<Slider>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);

  const fetchCheckuser = async () => {
    const token = localStorage.getItem("accessToken");
    await axiosServer
      .get("/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCheckuser(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // 디바운싱을 위한 타이머 참조 저장
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 디바운시 처리를 위한 함수
  const debounce = <T extends (...args: any[]) => void>(
    callback: T,
    delay: number = 500
  ) => {
    return function (...args: Parameters<T>) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  };
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAllComments, setShowAllComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{
    postId: string;
    commentId: string;
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 새 게시글 작성 상태 추가
  const [newPostContent, setNewPostContent] = useState("");
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  // 토큰 가져오기
  const [randomNickname, setRandomNickname] = useState(() =>
    generateRandomNickname()
  );
  const [randomEmoji, setRandomEmoji] = useState(() => generateRandomEmoji());

  // 게시글 불러오기는 별도의 useEffect로 분리
  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    console.log("RandomNickname:", randomNickname);
    console.log("RandomEmoji:", randomEmoji);
  }, [randomNickname, randomEmoji]);

  // 게시글 불러오기
  const fetchPosts = async (page: number = 1, limit: number = 10) => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await axiosServer.get("/articles", {
        params: {
          page,
          limit,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPosts(response.data.items);
    } catch (error) {
      console.error("게시글 조회 중 오류가 발생했습니다:", error);
    }
  };

  useEffect(() => {
    const loadComments = async () => {
      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          const comments = await fetchComments(post.id);
          return {
            ...post,
            comments: comments || [],
          };
        })
      );
      setPosts(postsWithComments);
    };

    if (posts.length > 0) {
      loadComments();
    }
  }, [posts.length]);

  // 게시물 작성
  const handleAddPost = async (content: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    console.log("user:", user);

    try {
      await axiosServer.post(
        "/articles",
        {
          content,
          anonymous: randomNickname,
          emoji: randomEmoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPosts();
    } catch (error) {
      console.error("게시글 작성 중 오류가 발생했습니다:", error);
      setErrorMessage("게시글 작성에 실패했습니다.");
      setShowErrorModal(true);
    }
  };
  // 컴포넌트 마운트 시 게시글 불러오기

  // 댓글 작성
  const handleAddComment = async (post_id: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      await axiosServer.post(
        `/articles/${post_id}/comments`,
        {
          content: newComment,
          anonymous: randomNickname,
          emoji: randomEmoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNewComment(""); // 댓글 입력창 초기화
      fetchPosts(); // 게시글 목록 새로고침
    } catch (error) {
      console.error("댓글 작성 중 오류가 발생했습니다:", error);
    }
  };

  useEffect(() => {
    if (newComment === "") {
      fetchPosts();
    }
  }, [newComment]);

  // 게시글 수정
  const handleSaveEdit = async (postId: string) => {};
  const handleEditPost = (post: Post) => {};
  const handleSaveCommentEdit = async (postId: string, commentId: string) => {};
  const handleEditComment = (postId: string) => {};
  // 게시글 삭제
  const handlePostDelete = async (postId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      await axiosServer.delete(`/articles/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPosts();
    } catch (error) {
      console.error("게시글 삭제 중 오류가 발생했습니다:", error);
      setErrorMessage("게시글 삭제에 실패했습니다.");
      setShowErrorModal(true);
    }
  };

  const handleDeleteComment = async (
    postId: string,
    commentId: string,
    authorId: string
  ) => {};

  const handleLike = async (postId: string) => {};
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 시간 단위별 밀리초 정의
    const TIME_UNITS = [
      { max: 30 * 1000, text: "지금" },
      { max: 60 * 1000, text: "방금 전" },
      { max: 60 * 60 * 1000, division: 60 * 1000, unit: "분 전" },
      { max: 24 * 60 * 60 * 1000, division: 60 * 60 * 1000, unit: "시간 전" },
      {
        max: 7 * 24 * 60 * 60 * 1000,
        division: 24 * 60 * 60 * 1000,
        unit: "일 전",
      },
      {
        max: 30 * 24 * 60 * 60 * 1000,
        division: 7 * 24 * 60 * 60 * 1000,
        unit: "주 전",
      },
      {
        max: 12 * 30 * 24 * 60 * 60 * 1000,
        division: 30 * 24 * 60 * 60 * 1000,
        unit: "개월 전",
      },
      { max: Infinity, division: 12 * 30 * 24 * 60 * 60 * 1000, unit: "년 전" },
    ];

    const timeUnit = TIME_UNITS.find((unit) => diff < unit.max);
    if (!timeUnit) return "오래 전";

    if (!timeUnit.division) return timeUnit.text;

    const value = Math.floor(diff / timeUnit.division);
    if (value === 1) {
      // 1단위 일 때 특별한 처리
      const specialCases = {
        "일 전": "어제",
        "주 전": "지난주",
        "개월 전": "지난달",
        "년 전": "작년",
      };
      return specialCases[timeUnit.unit] || `1${timeUnit.unit}`;
    }

    return `${value}${timeUnit.unit}`;
  };

  const renderComments = (post: Post, showAll: boolean) => {
    if (!post.comments || post.comments.length === 0) return null;

    const commentsToShow = showAll ? post.comments : post.comments.slice(0, 3);

    return (
      <div className="space-y-4">
        {commentsToShow.map((comment) => (
          <div
            key={`comment-${comment.id}`}
            className="bg-gray-50 p-3 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{post.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{comment.anonymous}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatTime(comment.createdAt)}
                </span>
                {comment.updatedAt &&
                  comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-gray-500">(수정됨)</span>
                  )}
                {comment.authorId === Checkuser?.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      수정
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteComment(
                          post.authorId,
                          comment.id,
                          comment.authorId
                        )
                      }
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleOpenReport("comment", post.authorId, comment.id)
                    }
                    className="text-xs text-gray-500 hover:text-gray-600"
                  >
                    🚨신고
                  </button>
                )}
              </div>
            </div>

            {editingComment?.postId === post.authorId &&
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
                  onClick={() =>
                    handleSaveCommentEdit(post.authorId, comment.id)
                  }
                  className="btn-primary px-3"
                >
                  저장
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{comment.content}</p>
            )}
          </div>
        ))}
        {!showAll && post.comments?.length > 3 && (
          <button
            onClick={() => setShowAllComments(post.id)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            댓글 {post.comments.length - 3}개 더 보기
          </button>
        )}
        {showAll && post.comments?.length > 3 && (
          <button
            onClick={() => setShowAllComments(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            댓글 접기
          </button>
        )}
      </div>
    );
  };

  // 게시물로 스크롤하는 함수
  const scrollToPost = (postId: string) => {
    setSelectedPost(postId);
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: "smooth" });
      // 스크롤 후 잠시 하이라이트 효과를 주기 위해
      postElement.classList.add("highlight-post");
      setTimeout(() => {
        postElement.classList.remove("highlight-post");
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
  const handleOpenReport = (
    type: "post" | "comment",
    postId: string,
    commentId?: string
  ) => {
    // 로그인한 사용자 확인
    if (!user) {
      setErrorMessage("신고하려면 로그인이 필요합니다.");
      setShowErrorModal(true);
      return;
    }

    // 본인 게시글/댓글 신고 방지
    if (type === "post") {
      // 게시글 작성자 확인
      const post = posts.find((p) => p.authorId === postId);
      if (post && post.authorId === user.id) {
        setErrorMessage("본인이 작성한 게시글은 신고할 수 없습니다.");
        setShowErrorModal(true);
        return;
      }
    } else if (type === "comment" && commentId) {
      // 댓글 작성자 확인
      const post = posts.find((p) => p.authorId === postId);
      if (post) {
        const comment = post.comments?.find((c: any) => c.id === commentId);
        // any를 사용하여 타입 오류 피하기
        if (comment && (comment as any).author_id === user.id) {
          setErrorMessage("본인이 작성한 댓글은 신고할 수 없습니다.");
          setShowErrorModal(true);
          return;
        }
      }
    }

    setShowReportModal(true);
  };

  // 신고 제출 처리
  const handleSubmitReport = async () => {};

  // 새 게시글 작성 함수
  const handleCreatePost = async () => {};

  // 신고 처리
  const handleReport = () => {};

  // 네비게이션 핸들러 추가
  const handleGoToHome = () => {
    router.push("/home");
  };

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  const handleGoToSettings = () => {
    router.push("/settings");
  };

  const fetchComments = async (postId: string) => {
    const token = localStorage.getItem("accessToken");
    console.log("postId:", postId);
    const response = await axiosServer.get(`/articles/${postId}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("response:", response);
    return response.data;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="뒤로 가기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
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
            <h2 className="text-lg font-bold mb-4">이번주의 인기 게시물</h2>
            <div className="mb-6">
              <Slider {...sliderSettings} ref={sliderRef}>
                {popularPosts.map((post, index) => (
                  <div key={post.authorId} className="px-2">
                    <button
                      onClick={() => scrollToPost(post.id)}
                      className="w-full text-left bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{post.emoji}</span>
                        <span className="font-medium">{post.anonymous}</span>
                      </div>
                      <p className="text-gray-700 line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center gap-1">
                          <HeartIcon className="w-4 h-4" />
                          <span>{post.likeCount || 0}</span>
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

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-lg mx-auto p-4">
        {/* 게시글 작성 폼 - 트위터 스타일 */}
        {user && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-md">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold">
                  {randomEmoji || "😊"}
                </div>
              </div>
              <div className="flex-grow">
                <div className="mb-2">
                  <textarea
                    placeholder="무슨 생각을 하고 계신가요?"
                    className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] min-h-[100px]"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-500">
                      {newPostContent.length}/500
                    </div>
                    <button
                      onClick={() => handleAddPost(newPostContent)}
                      disabled={!newPostContent.trim()}
                      className={`px-4 py-2 rounded-full ${
                        !newPostContent.trim()
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#6C5CE7] text-white hover:bg-[#5849BE] transition-colors"
                      }`}
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className={`bg-white rounded-lg shadow-md p-5 mb-4 `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full mr-3">
                      <span className="text-xl">{post.emoji}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{post.anonymous}</h3>
                      <p className="text-xs text-gray-500">
                        {formatTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                      <span className="text-sm text-gray-500">(수정됨)</span>
                    )}
                    {post.authorId === Checkuser?.id && !post.deletedAt ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-sm text-blue-500 hover:text-blue-600"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handlePostDelete(post.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    ) : (
                      !post.deletedAt &&
                      user &&
                      post.authorId !== Checkuser?.id && (
                        <button
                          onClick={() =>
                            handleOpenReport("post", post.authorId)
                          }
                          className="text-sm text-gray-500 hover:text-gray-600"
                        >
                          🚨신고
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 게시물 내용 */}
                <div className="mb-4">
                  {post.updatedAt !== post.createdAt ? (
                    <>
                      {editingPost === post.authorId ? (
                        <textarea
                          className="w-full border rounded p-2"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.authorId)}
                      className={`flex items-center gap-1 ${
                        post.likeCount > 0 ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      <HeartIcon className="w-5 h-5" />
                      <span>{post.likeCount || 0}</span>
                    </button>
                    <button
                      onClick={() =>
                        setShowCommentInput(
                          showCommentInput === post.id ? null : post.id
                        )
                      }
                      className="flex items-center gap-1 text-gray-500"
                    >
                      <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                      <span>
                        {post.comments?.filter((comment) => !comment.deletedAt)
                          .length || 0}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 댓글 입력창 */}
                {!post.deletedAt && showCommentInput === post.id && (
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
                            console.log(
                              "디바운스된 댓글 입력:",
                              newValue.length,
                              "글자"
                            );
                          }, 300);
                        }}
                        placeholder="댓글을 입력하세요"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="btn-primary px-4"
                      >
                        작성
                      </button>
                    </div>
                  </div>
                )}

                {/* 댓글 목록 */}
                {!post.deletedAt && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {renderComments(post, showAllComments === post.id)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-500 text-lg mb-4">
                아직 게시글이 없습니다.
              </p>
              <p className="text-gray-400">첫 번째 게시글을 작성해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 에러 모달 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              오류가 발생했습니다
            </h3>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}

      {/* 하단 네비게이션 */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t py-3 shadow-lg transition-all duration-200 ease-in-out"
        role="navigation"
        aria-label="메인 네비게이션"
      >
        <div className="max-w-lg mx-auto px-6 flex justify-around items-center">
          <button
            onClick={handleGoToHome}
            className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
            type="button"
            aria-label="홈으로 이동"
          >
            <HomeIcon className="w-7 h-7" aria-hidden="true" />
            <span className="text-sm font-medium mt-1">홈</span>
          </button>
          <button
            onClick={() => router.push("/community")}
            className="flex flex-col items-center text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
            type="button"
            aria-label="커뮤니티로 이동"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <span className="text-sm font-medium mt-1">커뮤니티</span>
          </button>
          <button
            onClick={handleGoToSettings}
            className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
            type="button"
            aria-label="설정으로 이동"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm font-medium mt-1">설정</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
