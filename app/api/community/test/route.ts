import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }
    
    // Admin client to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check tables
    const tables = [
      'profiles',
      'posts',
      'comments',
      'post_votes',
      'comment_votes'
    ];
    
    const tableResults = [];
    
    for (const table of tables) {
      try {
        const { count, error } = await adminClient
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tableResults.push({
          table,
          exists: !error,
          count: count || 0,
          error: error ? error.message : null
        });
      } catch (err: any) {
        tableResults.push({
          table,
          exists: false,
          error: err.message
        });
      }
    }
    
    // Create test post if tables exist
    let post = null;
    let comment = null;
    
    if (tableResults.every(t => t.exists)) {
      try {
        // Get first user
        const { data: users } = await adminClient
          .from('profiles')
          .select('id, nickname, profile_image')
          .limit(1);
        
        if (users && users.length > 0) {
          const user = users[0];
          const now = new Date().toISOString();
          
          // Create test post
          const { data: newPost, error: postError } = await adminClient
            .from('posts')
            .insert([{
              title: `API Test Post ${now.substring(0, 19)}`,
              content: `This is a test post created by the API test at ${now}`,
              category: 'questions',
              user_id: user.id,
              nickname: user.nickname || 'Anonymous',
              profile_image: user.profile_image,
              created_at: now,
              updated_at: now,
              isEdited: false,
              isdeleted: false,
              isBlinded: false,
              likes: [],
              comments: [],
              reports: []
            }])
            .select()
            .single();
          
          if (!postError && newPost) {
            post = newPost;
            
            // Create test comment
            const { data: newComment, error: commentError } = await adminClient
              .from('comments')
              .insert([{
                post_id: newPost.id,
                user_id: user.id,
                content: 'Test comment from API test',
                is_anonymous: false,
                created_at: now,
                updated_at: now,
                likes_count: 0
              }])
              .select()
              .single();
            
            if (!commentError && newComment) {
              comment = newComment;
              
              // Update post with comment
              const commentObj = {
                id: newComment.id,
                user_id: user.id,
                content: newComment.content,
                nickname: user.nickname || 'Anonymous',
                profile_image: user.profile_image,
                created_at: now,
                is_anonymous: false
              };
              
              await adminClient
                .from('posts')
                .update({ 
                  comments: [commentObj] 
                })
                .eq('id', newPost.id);
            }
          }
        }
      } catch (err: any) {
        // Continue even if post creation fails
        console.error('Post creation failed:', err.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      tables: tableResults,
      post,
      comment,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 