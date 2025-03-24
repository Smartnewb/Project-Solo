const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('Checking database tables...');
  
  try {
    // List all tables in the database
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('Error getting tables:', error);
      return;
    }
    
    const tables = data.map(t => t.table_name);
    console.log('Tables in database:', tables);
    
    // If system_settings exists, check its contents
    if (tables.includes('system_settings')) {
      console.log('system_settings table exists! Checking contents...');
      
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');
      
      if (settingsError) {
        console.error('Error getting settings:', settingsError);
        return;
      }
      
      console.log('system_settings data:', settings);
    } else {
      console.log('system_settings table does not exist!');
      
      // Check if create_system_settings_table function exists
      const { data: functions, error: functionsError } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .eq('routine_name', 'create_system_settings_table');
      
      if (functionsError) {
        console.error('Error checking for function:', functionsError);
        return;
      }
      
      if (functions && functions.length > 0) {
        console.log('create_system_settings_table function exists, calling it...');
        
        // Call the function to create the table
        const { error: createError } = await supabase
          .rpc('create_system_settings_table');
        
        if (createError) {
          console.error('Error creating table:', createError);
        } else {
          console.log('Table created successfully!');
        }
      } else {
        console.log('create_system_settings_table function does not exist');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTables(); 