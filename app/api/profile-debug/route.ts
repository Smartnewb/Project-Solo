import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a debug endpoint to check the profiles table schema
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
    
    // Get profiles schema info
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profilesError) {
      return NextResponse.json({
        error: 'Failed to fetch profiles',
        message: profilesError.message,
        hint: profilesError.hint,
        details: profilesError.details
      }, { status: 500 });
    }
    
    // Get available columns info
    let columns: Record<string, {value: any, type: string}> = {};
    
    if (profiles && profiles.length > 0) {
      columns = Object.keys(profiles[0]).reduce((acc, key) => {
        acc[key] = {
          value: profiles[0][key],
          type: typeof profiles[0][key]
        };
        return acc;
      }, {} as Record<string, {value: any, type: string}>);
    }
    
    return NextResponse.json({
      success: true,
      profiles,
      columns,
      hasStudentId: profiles && profiles.length > 0 && 'student_id' in profiles[0],
      hasNickname: profiles && profiles.length > 0 && 'nickname' in profiles[0],
      hasProfileImage: profiles && profiles.length > 0 && 'profile_image' in profiles[0]
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 