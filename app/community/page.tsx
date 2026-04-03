"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import React from "react";
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
import axiosServer from "@/utils/axios";
import axios from "axios";

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  postId: string;
  content: string;
  anonymous: boolean;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

interface Post {
    id: string;
    content: string;
  anonymous: boolean;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  likeCount: number;
  isLiked: boolean;
  comments: Comment[];
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
}

// 오늘의 기분등 표현하고 싶은 이모지
const emojis = [
  "😊",
  "🥰",
  "😎",
  "🤗",
  "😇",
  "🥱",
  "🤒",
  "😡",
  "😍",
  "🤣",
  "😥",
  "😤",
  "🥳",
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
];

export default function Community() {
  const router = useRouter();
  const { user, refreshAccessToken } = useAuth();
  const [Checkuser, setCheckuser] = useState<User | null>(null);
  const sliderRef = useRef<Slider>(null);

  // 게시글 관련 상태
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const postsPerPage = 5;

  // 댓글 관련 상태
  const [showAllComments, setShowAllComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{
    postId: string;
    commentId: string;
  } | null>(null);
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(true);
  const [selectedCommentEmoji, setSelectedCommentEmoji] = useState("😊");
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);

  // 모달 관련 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [selectedReportType, setSelectedReportType] = useState<
    "post" | "comment"
  >("post");
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [selectedCommentId, setSelectedCommentId] = useState<string>("");

  // 디바운싱을 위한 타이머 참조 저장
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const filterProfanity = (text: string) => {
  };

  // 컴포넌트 마운트 시 게시글과 사용자 정보 불러오기
  useEffect(() => {
    fetchPosts(1);
    fetchCheckuser();
  }, []);

  // 스크롤 이벤트를 감지하여 무한 스크롤 구현
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 페이지 하단에서 200px 이내인 경우 추가 데이터 로드
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200 &&
        hasMore &&
        !isLoadingMore
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPage, hasMore, isLoadingMore]);

  // 추가 게시글 로드
  const loadMorePosts = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    await fetchPosts(currentPage + 1);
    setIsLoadingMore(false);
  };

  // 게시글 목록이 변경될 때마다 각 게시글의 댓글을 불러오기
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

    if (Array.isArray(posts) && posts.length > 0) {
      loadComments();
    }
  }, [posts.length]);

  // 인기 게시글 불러오기
  const fetchPopularPosts = async () => { };

  // 게시글 불러오기
  const fetchPosts = async (page: number = 1, limit: number = postsPerPage) => {
    const token = localStorage.getItem("accessToken");
    try {
      setIsLoadingMore(page > 1);

      const response = await axiosServer.get("/articles", {
        params: {
          page,
          limit,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newPosts = Array.isArray(response.data?.items)
        ? response.data.items
        : [];

      // 첫 페이지면 기존 데이터 교체, 아니면 추가
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      }

      // 새 페이지 설정
      setCurrentPage(page);

      // 가져온 게시글 수가 limit보다 적으면 더 이상 불러올 게시글이 없다는 의미
      setHasMore(newPosts.length === limit);
    } catch (error) {
      console.error("게시글 조회 중 오류가 발생했습니다:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 게시물 작성
  const handleAddPost = async (
    content: string,
    anonymous: boolean,
    emoji: string
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await axiosServer.post(
        "/articles",
        {
          content: filterProfanity(content),
          anonymous: anonymous,
          emoji: emoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchPosts();
      setNewPostContent("");
      setIsAnonymous(true);
    } catch (error) {
      console.error("게시글 작성 중 오류가 발생했습니다:", error);
      setErrorMessage("게시글 작성에 실패했습니다.");
      setShowErrorModal(true);
    }
  };

  // 댓글 작성
  const handleAddComment = async (
    post_id: string,
    annonymous: boolean,
    emoji: string
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (!newComment.trim()) {
      setErrorMessage("댓글 내용을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    try {
      await axiosServer.post(
        `/articles/${post_id}/comments`,
        {
          content: filterProfanity(newComment),
          anonymous: annonymous,
          emoji: emoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 댓글 목록 새로고침
      await fetchComments(post_id);

      // 입력 상태 초기화
      setNewComment("");
      setIsCommentAnonymous(true);
      setShowCommentInput(null);
    } catch (error) {
      console.error("댓글 작성 중 오류가 발생했습니다:", error);
    }
  };

  // 게시글 수정
  const handleEditPost = async (
    post: Post,
    anonymous: boolean,
    emoji: string
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const response = await axiosServer.patch(
        `/articles/${post.id}`,
        {
          content: filterProfanity(editContent),
          anonymous: anonymous,
          emoji: emoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 로컬 상태 업데이트
      setPosts(
        posts.map((p) => {
          if (p.id === post.id) {
            return {
              ...p,
              content: response.data.content,
              updatedAt: response.data.updatedAt,
            };
          }
          return p;
        })
      );

    setEditingPost(null);
      setEditContent("");
    } catch (error) {
      console.error("게시글 수정 중 오류가 발생했습니다:", error);
      setErrorMessage("게시글 수정에 실패했습니다.");
      setShowErrorModal(true);
    }
  };

  const handleEditComment = async (
    postId: string,
    commentId: string,
    anonymous: boolean,
    emoji: string
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      await axiosServer.patch(
        `/articles/${postId}/comments/${commentId}`,
        {
          content: filterProfanity(editCommentContent),
          anonymous: anonymous,
          emoji: emoji,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditingComment(null);
      setEditCommentContent("");

      // 댓글 목록 새로고침
      await fetchComments(postId);
    } catch (error) {
      console.error("댓글 수정 중 오류가 발생했습니다:", error);
      setErrorMessage("댓글 수정에 실패했습니다.");
      setShowErrorModal(true);
    }
  };
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

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      await axiosServer.delete(`/articles/${postId}/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 댓글 목록 새로고침
      await fetchComments(postId);
    } catch (error) {
      console.error("댓글 삭제 중 오류가 발생했습니다:", error);
      setErrorMessage("댓글 삭제에 실패했습니다.");
      setShowErrorModal(true);
    }
  };

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // 현재 게시물 찾기
    const currentPost = posts.find((post) => post.id === postId);
    if (!currentPost) return;

    try {
      // 좋아요 상태 토글
      const newLikeStatus = !currentPost.isLiked;

      await axiosServer.patch(
        `/articles/${postId}/like`,
        {
          isLiked: newLikeStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 로컬 상태 업데이트 (즉각적인 UI 반응을 위해)
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
      if (post.id === postId) {
            return {
              ...post,
              isLiked: newLikeStatus,
              likeCount: newLikeStatus
                ? post.likeCount + 1
                : post.likeCount - 1,
            };
      }
      return post;
        })
      );
    } catch (error) {
      console.error("좋아요 처리 중 오류가 발생했습니다:", error);
      setErrorMessage("좋아요 처리에 실패했습니다.");
      setShowErrorModal(true);
    }
  };

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
      const specialCases: Record<string, string> = {
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
                <span className="text-xl">{comment.emoji}</span>
            <div>
                  <p className="font-medium text-sm">
                    {comment.author.name || "익명"}
                  </p>
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
                {comment.author?.id === Checkuser?.id ? (
              <div className="flex gap-2">
                    {editingComment?.postId === post.id &&
                      editingComment?.commentId === comment.id ? (
                      <>
                <button
                          onClick={() => setEditingComment(null)}
                          className="text-xs text-gray-500 hover:text-gray-600"
                        >
                          취소
                        </button>
                        <button
                          onClick={() =>
                            handleEditComment(
                              post.id,
                              comment.id,
                              comment.anonymous,
                              comment.emoji
                            )
                          }
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          저장
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingComment({
                            postId: post.id,
                            commentId: comment.id,
                          });
                          setEditCommentContent(comment.content);
                        }}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  수정
                </button>
                    )}
                <button
                  onClick={() => handleDeleteComment(post.id, comment.id)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
                ) : (
                  <button
                    onClick={() =>
                      handleOpenReport("comment", post.id, comment.id)
                    }
                    className="text-xs text-gray-500 hover:text-gray-600"
                  >
                    🚨신고
                  </button>
            )}
          </div>
        </div>
        
        {editingComment?.postId === post.id && 
         editingComment?.commentId === comment.id ? (
            <input
              type="text"
              value={editCommentContent}
              onChange={(e) => setEditCommentContent(e.target.value)}
                className="w-full p-2 border rounded"
              />
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
    setSelectedReportType(type);
    setSelectedPostId(postId);
    if (commentId) setSelectedCommentId(commentId);
    setShowReportModal(true);
  };

  // 신고 제출
  const handleSubmitReport = async () => {
    if (!reportReason) {
      setErrorMessage("신고 사유를 선택해주세요.");
      setShowErrorModal(true);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      if (selectedReportType === "post") {
        await axiosServer.post(
          `/articles/${selectedPostId}/reports`,
          { reason: reportReason },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axiosServer.post(
          `/articles/${selectedPostId}/comments/${selectedCommentId}/reports`,
          { reason: reportReason },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setShowReportModal(false);
      setReportReason("");
      setSuccessMessage("신고가 성공적으로 접수되었습니다.");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("신고 접수 중 오류가 발생했습니다:", error);
      setErrorMessage("신고 접수에 실패했습니다.");
      setShowErrorModal(true);
    }
  };

  // 네비게이션 핸들러 추가
  const handleGoToHome = () => {
    router.push("/home");
  };

  const handleGoToSettings = () => {
    router.push("/settings");
  };

  const fetchComments = async (postId: string) => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await axiosServer.get(`/articles/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const comments = Array.isArray(response.data) ? response.data : [];
      // 댓글 목록을 받아온 후 바로 상태 업데이트
      setPosts((prevPosts) => {
        const updatedPosts = prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments,
            };
      }
      return post;
        });
        return updatedPosts;
      });

      return comments;
    } catch (error) {
      console.error("댓글 조회 중 오류가 발생했습니다:", error);
      return [];
    }
  };

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
        console.error(err);
      });
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
                  <div key={post.id} className="px-2">
                    <button
                      onClick={() => scrollToPost(post.id)}
                      className="w-full text-left bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{post.emoji}</span>
                        <span className="font-medium">
                          {post.author.name || "익명"}
                        </span>
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
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-11 h-11 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#5849BE] text-white flex items-center justify-center text-xl hover:opacity-90 transition-all duration-200 shadow-md"
                >
                  {selectedEmoji}
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-10 mt-2 bg-white rounded-xl shadow-lg p-4 border border-gray-100 backdrop-blur-sm bg-white/80">
                    <div className="grid grid-cols-5 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setSelectedEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-lg text-lg transition-all duration-200"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <div className="space-y-3">
          <textarea
            placeholder="무슨 생각을 하고 계신가요?"
                    className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent min-h-[120px] text-gray-700 placeholder-gray-400 bg-gray-50/50"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-lg hover:bg-gray-100/80 transition-colors">
                        <div className="relative inline-block w-9 h-5">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6C5CE7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#6C5CE7] peer-checked:to-[#5849BE]"></div>
                        </div>
                        익명
                      </label>
                      <span className="text-sm text-gray-500 bg-gray-50/80 px-3 py-1.5 rounded-lg">
                        {newPostContent.length}/500
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleAddPost(
                          newPostContent,
                          isAnonymous,
                          selectedEmoji
                        )
                      }
                      disabled={!newPostContent.trim()}
                      className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 ${!newPostContent.trim()
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#6C5CE7] to-[#5849BE] text-white hover:opacity-90 shadow-md"
                        }`}
                    >
                      작성하기
          </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            <>
          {posts.map((post) => (
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
                        <h3 className="font-medium">
                          {post.author.name || "익명"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatTime(post.createdAt)}
                        </p>
                      </div>
                </div>
                <div className="flex items-center gap-2">
                      {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-sm text-gray-500">(수정됨)</span>
                      )}
                      {post.author?.id === Checkuser?.id && !post.deletedAt ? (
                    <div className="flex gap-2">
                          {editingPost === post.id ? (
                            <>
                      <button 
                                onClick={() => setEditingPost(null)}
                                className="text-sm text-gray-500 hover:text-gray-600"
                              >
                                취소
                              </button>
                              <button
                                onClick={() =>
                                  handleEditPost(
                                    post,
                                    post.anonymous,
                                    post.emoji
                                  )
                                }
                                className="text-sm text-blue-500 hover:text-blue-600"
                              >
                                저장
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPost(post.id);
                                setEditContent(post.content);
                              }}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        수정
                      </button>
                          )}
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
                        post.author?.id !== Checkuser?.id && (
                    <button
                            onClick={() => handleOpenReport("post", post.id)}
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
              {editingPost === post.id ? (
                  <textarea
                        className="w-full border rounded p-2"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 ${post.isLiked ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      <HeartIcon className="w-5 h-5" />
                        <span>{post.likeCount}</span>
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
                          {post.comments?.filter(
                            (comment) => !comment.deletedAt
                          ).length || 0}
                        </span>
                    </button>
                  </div>
                  </div>

              {/* 댓글 입력창 */}
                  {!post.deletedAt && showCommentInput === post.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setShowCommentEmojiPicker(!showCommentEmojiPicker)
                            }
                            className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold hover:bg-[#5849BE] transition-colors mt-1"
                          >
                            {selectedCommentEmoji}
                          </button>
                          <div className="flex-1">
                    <input
                      type="text"
                      value={newComment}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setNewComment(newValue);
                              }}
                      placeholder="댓글을 입력하세요"
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
                              maxLength={200}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-lg hover:bg-gray-100/80 transition-colors">
                              <div className="relative inline-block w-9 h-5">
                                <input
                                  type="checkbox"
                                  checked={isCommentAnonymous}
                                  onChange={(e) =>
                                    setIsCommentAnonymous(e.target.checked)
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6C5CE7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#6C5CE7] peer-checked:to-[#5849BE]"></div>
                              </div>
                              익명
                            </label>
                            <span className="text-sm text-gray-500 bg-gray-50/80 px-3 py-1.5 rounded-lg">
                              {newComment.length}/200
                            </span>
                          </div>
                    <button
                            onClick={() =>
                              handleAddComment(
                                post.id,
                                isCommentAnonymous,
                                selectedCommentEmoji
                              )
                            }
                            disabled={!newComment.trim()}
                            className={`px-4 py-2 rounded-lg transition-all duration-200 ${newComment.trim()
                              ? "bg-gradient-to-r from-[#6C5CE7] to-[#5849BE] text-white hover:opacity-90 shadow-md"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                    >
                      작성
                    </button>
                        </div>
                        {showCommentEmojiPicker && (
                          <div className="absolute z-10 mt-10 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-5 gap-2">
                              {emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setSelectedCommentEmoji(emoji);
                                    setShowCommentEmojiPicker(false);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
              ))}

              {/* 로딩 인디케이터 */}
              {isLoadingMore && (
                <div className="text-center py-4">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6C5CE7] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-gray-500">
                    게시글을 더 불러오는 중...
                  </p>
                </div>
              )}

              {/* 더 이상 불러올 게시글이 없는 경우 */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">모든 게시글을 불러왔습니다.</p>
                </div>
              )}
            </>
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
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">신고하기</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-6">신고 사유를 선택해주세요.</p>
            <div className="space-y-3 mb-6">
                  {reportReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${reportReason === reason
                    ? "border-[#6C5CE7] bg-[#6C5CE7] bg-opacity-5"
                    : "border-gray-200 hover:border-[#6C5CE7]"
                    }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="hidden"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${reportReason === reason
                      ? "border-[#6C5CE7] bg-[#6C5CE7]"
                      : "border-gray-300"
                      }`}
                  >
                    {reportReason === reason && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-700">{reason}</span>
                </label>
              ))}
              </div>
            <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                  setReportReason("");
                  }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                onClick={handleSubmitReport}
                className={`px-4 py-2 rounded-lg transition-colors ${reportReason
                  ? "bg-[#6C5CE7] text-white hover:bg-[#5849BE]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!reportReason}
                >
                  신고하기
                </button>
              </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">알림</h3>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 mb-4">{successMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-[#6C5CE7] text-white rounded-lg hover:bg-[#5849BE] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

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
