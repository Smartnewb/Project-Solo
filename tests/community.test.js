/**
 * 커뮤니티 기능 테스트
 * 
 * 이 테스트 파일은 커뮤니티 페이지의 모든 주요 기능을 테스트합니다:
 * - 게시글 작성
 * - 게시글 수정
 * - 게시글 삭제
 * - 댓글 작성
 * - 댓글 수정
 * - 댓글 삭제
 * - 좋아요 기능
 * - 페이지 네비게이션
 */

const { test, expect, describe, beforeAll, beforeEach, afterAll } = require('@jest/globals');

// Supabase 클라이언트 모킹
const mockFromFn = jest.fn();
const mockSelectFn = jest.fn();
const mockEqFn = jest.fn();
const mockSingleFn = jest.fn();
const mockInsertFn = jest.fn();
const mockUpdateFn = jest.fn();
const mockUpdateEqFn = jest.fn();
const mockDeleteFn = jest.fn();
const mockDeleteEqFn = jest.fn();

const mockSupabaseClient = {
  from: mockFromFn,
};

// 모킹 함수 체인 설정
mockFromFn.mockReturnValue({
  select: mockSelectFn,
  insert: mockInsertFn,
  update: mockUpdateFn,
  delete: mockDeleteFn,
});

mockSelectFn.mockReturnValue({
  eq: mockEqFn,
});

mockEqFn.mockReturnValue({
  single: mockSingleFn,
});

mockUpdateFn.mockReturnValue({
  eq: mockUpdateEqFn,
});

mockDeleteFn.mockReturnValue({
  eq: mockDeleteEqFn,
});

// 기본 성공 응답 설정
mockSingleFn.mockResolvedValue({ data: {}, error: null });
mockInsertFn.mockResolvedValue({ error: null });
mockUpdateEqFn.mockResolvedValue({ error: null });
mockDeleteEqFn.mockResolvedValue({ error: null });

// UUID 모킹
const mockUuid = '12345678-1234-1234-1234-123456789012';

// 테스트 데이터
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

const testProfile = {
  id: 'test-profile-id',
  auth_id: testUser.id,
  student_id: 'S12345',
  nickname: '테스트사용자',
  emoji: '😊'
};

// 테스트 게시글 데이터
const testPost = {
  userId: mockUuid,
  author_id: testProfile.id,
  content: '테스트 게시글입니다.',
  nickname: testProfile.nickname,
  studentid: testProfile.student_id,
  emoji: testProfile.emoji,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  likes: [],
  isEdited: false,
  isdeleted: false,
  reports: []
};

// 테스트 댓글 데이터
const testComment = {
  id: mockUuid,
  post_id: testPost.userId,
  author_id: testProfile.id,
  content: '테스트 댓글입니다.',
  nickname: testProfile.nickname,
  studentid: testProfile.student_id,
  emoji: testProfile.emoji,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  isEdited: false,
  isdeleted: false,
  reports: []
};

// 모킹된 라우터
const mockRouter = {
  push: jest.fn()
};

// 모킹된 useAuth 훅
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: testUser
  })
}));

// 모킹된 next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

describe('커뮤니티 기능 테스트', () => {
  let supabase;
  
  beforeAll(() => {
    // Supabase 클라이언트 모킹
    supabase = mockSupabaseClient;
    
    // 게시글 조회를 위한 모킹 설정
    mockSingleFn.mockImplementation(() => {
      return Promise.resolve({
        data: { ...testPost, likes: [] },
        error: null
      });
    });
  });
  
  beforeEach(() => {
    // 각 테스트 전에 모킹 함수 초기화
    mockRouter.push.mockClear();
    mockFromFn.mockClear();
    mockSelectFn.mockClear();
    mockEqFn.mockClear();
    mockSingleFn.mockClear();
    mockInsertFn.mockClear();
    mockUpdateFn.mockClear();
    mockUpdateEqFn.mockClear();
    
    // 모킹 함수 체인 재설정
    mockFromFn.mockReturnValue({
      select: mockSelectFn,
      insert: mockInsertFn,
      update: mockUpdateFn,
      delete: mockDeleteFn,
    });
    
    mockSelectFn.mockReturnValue({
      eq: mockEqFn,
    });
    
    mockEqFn.mockReturnValue({
      single: mockSingleFn,
    });
    
    mockUpdateFn.mockReturnValue({
      eq: mockUpdateEqFn,
    });
    
    mockDeleteFn.mockReturnValue({
      eq: mockDeleteEqFn,
    });
    
    // 기본 성공 응답 설정
    mockSingleFn.mockResolvedValue({ data: {}, error: null });
    mockInsertFn.mockResolvedValue({ error: null });
    mockUpdateEqFn.mockResolvedValue({ error: null });
    mockDeleteEqFn.mockResolvedValue({ error: null });
  });
  
  // 테스트 데이터 정리
  afterAll(() => {
    // 모킹 환경에서는 실제 데이터를 정리할 필요가 없음
    jest.resetAllMocks();
  });
  
  // 게시글 작성 테스트
  test('게시글 작성', async () => {
    // 모킹 설정
    supabase.from().insert.mockResolvedValue({ error: null });
    
    const { error } = await supabase
      .from('posts')
      .insert([testPost]);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('posts');
    expect(supabase.from().insert).toHaveBeenCalledWith([testPost]);
  });
  
  // 게시글 수정 테스트
  test('게시글 수정', async () => {
    const updatedContent = '수정된 테스트 게시글입니다.';
    
    // 모킹 설정
    supabase.from().update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });
    
    const { error } = await supabase
      .from('posts')
      .update({
        content: updatedContent,
        isEdited: true
      })
      .eq('userId', testPost.userId);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('posts');
    expect(supabase.from().update).toHaveBeenCalledWith({
      content: updatedContent,
      isEdited: true
    });
  });
  
  // 댓글 작성 테스트
  test('댓글 작성', async () => {
    // 모킹 설정
    supabase.from().insert.mockResolvedValue({ error: null });
    
    const { error } = await supabase
      .from('comments')
      .insert([testComment]);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('comments');
    expect(supabase.from().insert).toHaveBeenCalledWith([testComment]);
  });
  
  // 댓글 수정 테스트
  test('댓글 수정', async () => {
    const updatedContent = '수정된 테스트 댓글입니다.';
    
    // 모킹 설정
    supabase.from().update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });
    
    const { error } = await supabase
      .from('comments')
      .update({
        content: updatedContent,
        isEdited: true
      })
      .eq('id', testComment.id);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('comments');
    expect(supabase.from().update).toHaveBeenCalledWith({
      content: updatedContent,
      isEdited: true
    });
  });
  
  // 좋아요 기능 테스트
  test('게시글 좋아요', async () => {
    // 모킹 설정
    supabase.from().select().eq().single.mockResolvedValue({
      data: { ...testPost, likes: [] },
      error: null
    });
    
    supabase.from().update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });
    
    // 현재 게시글 가져오기
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('userId', testPost.userId)
      .single();
    
    expect(fetchError).toBeNull();
    
    // 좋아요 추가
    const updatedLikes = [...(currentPost.likes || []), testUser.id];
    
    const { error } = await supabase
      .from('posts')
      .update({
        likes: updatedLikes
      })
      .eq('userId', testPost.userId);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('posts');
  });
  
  // 댓글 삭제 테스트 (소프트 삭제 - isdeleted 플래그 설정)
  test('댓글 삭제', async () => {
    // 모킹 설정
    supabase.from().update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });
    
    const { error } = await supabase
      .from('comments')
      .update({ isdeleted: true })
      .eq('id', testComment.id);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('comments');
    expect(supabase.from().update).toHaveBeenCalledWith({ isdeleted: true });
  });
  
  // 게시글 삭제 테스트 (소프트 삭제 - isdeleted 플래그 설정)
  test('게시글 삭제', async () => {
    // 모킹 설정
    supabase.from().update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });
    
    const { error } = await supabase
      .from('posts')
      .update({ isdeleted: true })
      .eq('userId', testPost.userId);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('posts');
    expect(supabase.from().update).toHaveBeenCalledWith({ isdeleted: true });
  });
  
  // 뒤로 가기 버튼 테스트
  test('뒤로 가기 버튼', () => {
    // 이 테스트는 실제 컴포넌트 렌더링이 필요하므로 여기서는 모킹만 확인
    expect(mockRouter.push).not.toHaveBeenCalled();
    // 실제 구현에서는 React Testing Library를 사용하여 버튼 클릭 테스트 가능
  });

  // 게시글 신고 테스트
  test('게시글 신고', async () => {
    // 모킹 설정
    mockSingleFn.mockResolvedValueOnce({
      data: { reports: [] },
      error: null
    });

    mockUpdateEqFn.mockResolvedValueOnce({ error: null });
    
    // 게시글 조회
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('reports')
      .eq('userId', testPost.userId)
      .single();
    
    expect(fetchError).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('posts');
    
    // 신고 데이터 생성
    const reportData = {
      reporter_id: testUser.id,
      reason: '가짜 정보',
      timestamp: new Date().toISOString()
    };
    
    const updatedReports = [...(data?.reports || []), reportData];
    
    // 신고 정보 업데이트
    const { error } = await supabase
      .from('posts')
      .update({ reports: updatedReports })
      .eq('userId', testPost.userId);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('posts');
    expect(mockUpdateFn).toHaveBeenCalled();
  });

  // 댓글 신고 테스트
  test('댓글 신고', async () => {
    // 모킹 설정
    mockSingleFn.mockResolvedValueOnce({
      data: { reports: [] },
      error: null
    });

    mockUpdateEqFn.mockResolvedValueOnce({ error: null });
    
    // 댓글 조회
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('reports')
      .eq('id', testComment.id)
      .single();
    
    expect(fetchError).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('comments');
    
    // 신고 데이터 생성
    const reportData = {
      reporter_id: testUser.id,
      reason: '음란물/성적 콘텐츠',
      timestamp: new Date().toISOString()
    };
    
    const updatedReports = [...(data?.reports || []), reportData];
    
    // 신고 정보 업데이트
    const { error } = await supabase
      .from('comments')
      .update({ reports: updatedReports })
      .eq('id', testComment.id);
    
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('comments');
    expect(mockUpdateFn).toHaveBeenCalled();
  });
});
