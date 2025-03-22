// Node.js script to test the database schema and operations
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
const envFile = fs.existsSync('.env') ? '.env' : '.env.local';
dotenv.config({ path: envFile });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test tables
const tables = [
  'profiles',
  'posts',
  'comments',
  'post_votes',
  'comment_votes',
  'notifications'
];

async function testDbConnection() {
  try {
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth Service:', authError ? 'Error' : 'Working');
    console.log('Session Present:', authData?.session ? 'Yes' : 'No');
    
    // Check tables
    console.log('\nTable Status:');
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`- ${table}: ${error ? 'Error' : 'OK'} ${!error ? `(${count} rows)` : ''}`);
        if (error) {
          console.log(`  Error: ${error.message}`);
        }
      } catch (err) {
        console.log(`- ${table}: Exception`, err.message);
      }
    }
    
    // Test creating a post if user is logged in
    if (authData?.session?.user) {
      console.log('\nUser is authenticated, performing post creation test...');
      
      // Generate test post
      const now = new Date().toISOString();
      const userId = authData.session.user.id;
      
      // Get user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('nickname, profile_image')
        .eq('id', userId)
        .single();
      
      if (!userData) {
        console.log('- User profile not found, skipping post test');
        return;
      }
      
      // Create test post
      const postData = {
        title: `Test post (${now.substring(0, 19)})`,
        content: `This is a test post created by the test-db.mjs script at ${now}`,
        category: 'questions',
        user_id: userId,
        nickname: userData.nickname || 'Anonymous',
        profile_image: userData.profile_image || null,
        created_at: now,
        updated_at: now,
        isEdited: false,
        isdeleted: false,
        isBlinded: false,
        likes: [],
        comments: [],
        reports: []
      };
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();
      
      if (postError) {
        console.log('- Post creation failed:', postError.message);
        return;
      }
      
      console.log(`- Post created successfully, ID: ${post.id}`);
      
      // Create test comment
      const commentData = {
        post_id: post.id,
        user_id: userId,
        content: 'This is a test comment from test-db.mjs',
        is_anonymous: false,
        created_at: now,
        updated_at: now,
        likes_count: 0
      };
      
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert([commentData])
        .select()
        .single();
      
      if (commentError) {
        console.log('- Comment creation failed:', commentError.message);
        return;
      }
      
      console.log(`- Comment created successfully, ID: ${comment.id}`);
      
      // Add comment to post's comments array
      const newComment = {
        id: comment.id,
        user_id: userId,
        content: comment.content,
        nickname: userData.nickname || 'Anonymous',
        profile_image: userData.profile_image || null,
        created_at: now,
        is_anonymous: false
      };
      
      const updatedComments = [...(post.comments || []), newComment];
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          comments: updatedComments
        })
        .eq('id', post.id);
      
      if (updateError) {
        console.log('- Post update failed:', updateError.message);
      } else {
        console.log('- Post updated with comment successfully');
      }
    } else {
      console.log('\nUser not authenticated, skipping post creation test');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDbConnection(); 