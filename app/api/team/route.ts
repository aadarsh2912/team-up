import {supabase} from '../../../lib/supabase';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
 try{const db=await supabase();const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)return json({user:null,team:null});
 const {data,error}=await db.rpc('team_action',{payload:{action:'state'}});if(error){console.error(error.code);return json({error:'Could not load your circle. Please try again.'},500);}return json(data);
 }catch{return json({error:'Could not connect to your circle.'},503);}
}
export async function POST(req:Request){
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid request origin.'},403);
 try{const raw=await req.text();if(raw.length>10000)return json({error:'Request too large.'},413);let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Invalid request.'},400);
 const db=await supabase();const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)return json({error:'Sign in to continue.'},401);
 const {data,error}=await db.rpc('team_action',{payload:body});if(error){const safe=error.code==='P0001'||error.code==='42501';return json({error:safe?error.message:'Check the details and try again.'},error.code==='42501'?403:400);}return json(data);
 }catch{return json({error:'Could not save your change. Try again.'},500);}
}

