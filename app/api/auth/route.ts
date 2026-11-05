import {supabase} from '../../../lib/supabase';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid request origin.'},403);
 try{
 const raw=await req.text();if(raw.length>5000)return json({error:'Request too large.'},413);
 const b=JSON.parse(raw);const db=await supabase();
 if(b.action==='signout'){const {error}=await db.auth.signOut();return error?json({error:'Could not sign out. Try again.'},400):json({ok:true});}
 const email=typeof b.email==='string'?b.email.trim():'',password=typeof b.password==='string'?b.password:'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8||password.length>128)return json({error:'Use a valid email and a password with 8–128 characters.'},400);
 if(b.action==='signup'){const {data,error}=await db.auth.signUp({email,password});if(error)return json({error:error.message},400);return json({ok:true,confirmed:!!data.session});}
 if(b.action==='signin'){const {error}=await db.auth.signInWithPassword({email,password});return error?json({error:error.message},400):json({ok:true,confirmed:true});}
 return json({error:'Unknown action.'},400);
 }catch{return json({error:'Unable to connect. Please try again.'},500);}
}

