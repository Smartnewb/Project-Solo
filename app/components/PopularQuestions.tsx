'use client';

import { useState } from 'react';
import { ChatBubbleOvalLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  title: string;
  answers: string[];
  commentCount: number;
}

const popularQuestions: Question[] = [
  {
    id: '1',
    title: '첫 만남에서 꼭 물어봐야 하는 질문은?',
    answers: ['여행 좋아하세요?', 'MBTI가 뭐예요?'],
    commentCount: 28
  },
  {
    id: '2',
    title: '첫 만남에서 분위기를 좋게 만드는 법은?',
    answers: ['가벼운 농담으로 시작하기', '공통 관심사 찾기'],
    commentCount: 35
  }
];

export default function PopularQuestions() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = popularQuestions[currentQuestionIndex];

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => 
      (prev + 1) % popularQuestions.length
    );
  };

  return (
    <div className="card bg-white p-4 space-y-3">
      <h2 className="text-h2 flex items-center gap-2">
        <span className="text-xl">🗣</span>
        실시간 인기 질문
      </h2>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-800">
          ❓ {currentQuestion.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {currentQuestion.answers.map((answer, index) => (
            <span
              key={index}
              className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {answer}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => router.push(`/community/question/${currentQuestion.id}`)}
          className="flex items-center text-primary-DEFAULT text-sm font-medium hover:text-primary-dark transition-colors"
        >
          <ChatBubbleOvalLeftIcon className="w-4 h-4 mr-1" />
          댓글 {currentQuestion.commentCount}개
        </button>
        <button
          onClick={handleNextQuestion}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 