// supabase-client.js
const SUPABASE_URL = 'https://wnqogashreamwhtklypd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducW9nYXNocmVhbXdodGtseXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTk2NTgsImV4cCI6MjEwNjQzNTY1OH0.iAPCl02dnyn4EevZDarOR8rzjxmlds40HRubXEzOD5A';

// Inicializa a conexão global do Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);