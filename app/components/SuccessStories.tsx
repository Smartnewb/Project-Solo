'use client';

import { useState } from 'react';
import { HeartIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Story {
  id: string;
  content: string;
  date: string;
  likes: number;
}

const successStories: Story[] = [
  {
    id: '1',
    content: '어제 소개팅 너무 좋았어요! 대화도 잘 통하고 다음에 또 만나기로 했어요 😊',
    date: '2024.03.20',
    likes: 42
  },
  {
    id: '2',
    content: '취미가 똑같아서 이야기가 끊이지 않았어요. 정말 잘 맞는 것 같아요 💕',
    date: '2024.03.19',
    likes: 38
  }
];

export default function SuccessStories() {
  const router = useRouter();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const currentStory = successStories[currentStoryIndex];

  const handleNextStory = () => {
    setCurrentStoryIndex((prev) => 
      (prev + 1) % successStories.length
    );
  };

  return (
    <div className="card bg-white p-4 space-y-3">
      <h2 className="text-h2 flex items-center gap-2">
        <span className="text-xl">🎉</span>
        소개팅 성공 후기
      </h2>
      <div className="space-y-3">
        <p className="text-gray-800 text-lg leading-relaxed">
          {currentStory.content}
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <span>{currentStory.date}</span>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => router.push('/community/success-stories')}
          className="flex items-center text-primary-DEFAULT text-sm font-medium hover:text-primary-dark transition-colors"
        >
          <HeartIcon className="w-4 h-4 mr-1" />
          공감 {currentStory.likes}
        </button>
        <button
          onClick={handleNextStory}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4 pt-3 border-t">
        <button
          onClick={() => router.push('/community/write-story')}
          className="w-full py-2 text-center text-primary-DEFAULT font-medium hover:bg-primary-50 rounded-lg transition-colors"
        >
          💌 나의 성공 후기 남기기
        </button>
      </div>
    </div>
  );
} 