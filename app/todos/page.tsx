import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string
}

export default async function TodosPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select('*')

  if (error) {
    console.error('Error fetching todos:', error)
    return <div>할 일 목록을 불러오는 중 오류가 발생했습니다.</div>
  }

  if (!todos) {
    return <div>할 일이 없습니다.</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">할 일 목록</h1>
      <ul className="space-y-2">
        {todos.map((todo: Todo) => (
          <li key={todo.id} className="p-2 bg-white rounded shadow">
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  )
} 