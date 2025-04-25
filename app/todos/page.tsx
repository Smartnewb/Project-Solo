'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  // 할 일 추가
  const addTodo = () => {
    if (newTodo.trim() === '') return;

    const newTodoItem: Todo = {
      id: Date.now(),
      text: newTodo,
      completed: false
    };

    setTodos([...todos, newTodoItem]);
    setNewTodo('');
  };

  // 할 일 완료 상태 토글
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // 할 일 삭제
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/home')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-all"
            aria-label="뒤로 가기"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">할 일 목록</h1>
        </div>

        {/* 할 일 입력 폼 */}
        <div className="flex mb-4">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="할 일을 입력하세요"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors"
            onClick={addTodo}
          >
            추가
          </button>
        </div>

        {/* 할 일 목록 */}
        <ul className="divide-y divide-gray-200">
          {todos.length === 0 ? (
            <li className="py-4 text-center text-gray-500">할 일이 없습니다. 새로운 할 일을 추가해보세요!</li>
          ) : (
            todos.map(todo => (
              <li key={todo.id} className="py-4 flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-5 w-5 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className={`ml-3 flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}