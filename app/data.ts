export type Person={id:string;name:string;color:string};
export type Habit={id:string;userId:string;name:string;identity:string;target:string;category:string;time:string;created:string};
export type Checkin={habitId:string;day:string;created:string};
export type Note={id:string;userId:string;recipient?:string|null;kind:string;message:string;created:string};
export type State={user:Person;team:{id:string;name:string};members:Person[];habits:Habit[];checkins:Checkin[];notes:Note[]};
export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function shiftDay(day:string,n:number){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d);}
export function streak(habitId:string,checks:Checkin[],today:string){const days=new Set(checks.filter(c=>c.habitId===habitId).map(c=>c.day));let day=days.has(today)?today:shiftDay(today,-1);let n=0;while(days.has(day)){n++;day=shiftDay(day,-1);}return n;}
export function longestStreak(habitId:string,checks:Checkin[]){const days=[...new Set(checks.filter(c=>c.habitId===habitId).map(c=>c.day))].sort();let best=0,current=0,last='';for(const day of days){current=last&&shiftDay(last,1)===day?current+1:1;best=Math.max(best,current);last=day;}return best;}
export function demoState():State{
 const today=dateKey();const created=new Date().toISOString();
 const members=[{id:'you',name:'Aadarsh',color:'peach'},{id:'maya',name:'Maya',color:'lavender'},{id:'arjun',name:'Arjun',color:'sage'},{id:'zoe',name:'Zoë',color:'sand'}];
 const habits:Habit[]=[
 {id:'read',userId:'you',name:'Read a few pages',identity:'a lifelong learner',target:'10 pages',category:'mind',time:'Morning',created},
 {id:'move',userId:'you',name:'Move your body',identity:'someone who shows up',target:'30 minutes',category:'body',time:'Morning',created},
 {id:'write',userId:'you',name:'Make space to reflect',identity:'a more mindful person',target:'5 minutes of journaling',category:'calm',time:'Evening',created},
 {id:'learn',userId:'you',name:'Learn something new',identity:'a curious creator',target:'20 minutes',category:'growth',time:'Evening',created},
 {id:'maya-read',userId:'maya',name:'Read 10 pages',identity:'a lifelong learner',target:'10 pages',category:'mind',time:'Morning',created},
 {id:'maya-walk',userId:'maya',name:'Go for a walk',identity:'an active person',target:'20 minutes',category:'body',time:'Morning',created},
 {id:'maya-write',userId:'maya',name:'Journal',identity:'a mindful person',target:'5 minutes',category:'calm',time:'Evening',created},
 {id:'arjun-code',userId:'arjun',name:'Practice coding',identity:'a thoughtful builder',target:'30 minutes',category:'growth',time:'Afternoon',created},
 {id:'arjun-move',userId:'arjun',name:'Move my body',identity:'an active person',target:'30 minutes',category:'body',time:'Evening',created},
 {id:'arjun-read',userId:'arjun',name:'Read a chapter',identity:'a lifelong learner',target:'10 pages',category:'mind',time:'Evening',created},
 {id:'zoe-calm',userId:'zoe',name:'Morning meditation',identity:'a calmer person',target:'10 minutes',category:'calm',time:'Morning',created},
 {id:'zoe-write',userId:'zoe',name:'Gratitude journal',identity:'a grateful person',target:'3 good things',category:'mind',time:'Evening',created}
 ];
 const checkins:Checkin[]=[];
 habits.forEach((h,i)=>{const count=[12,7,4,3,21,9,7,14,5,3,10,5][i];for(let n=1;n<=count;n++)checkins.push({habitId:h.id,day:shiftDay(today,-n),created:shiftDay(today,-n)+'T09:00:00'});});
 ['read','move','maya-read','maya-walk','maya-write','arjun-code','zoe-calm'].forEach(id=>checkins.push({habitId:id,day:today,created}));
 return {user:members[0],team:{id:'demo',name:'The Growth Circle'},members,habits,checkins,notes:[{id:'n1',userId:'maya',kind:'reflect',message:'Finished my first book this month. Ten pages a day really add up!',created},{id:'n2',userId:'zoe',recipient:'arjun',kind:'encourage',message:'One small step is enough today. You’ve got this!',created}]};
}
