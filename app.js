const URL_='https://stducvaawmqtjcmsfreg.supabase.co',KEY='sb_publishable_dYTYc11zN3l9dsbRpccBQw_g28UCjTZ';
const sb=supabase.createClient(URL_,KEY);
const $=s=>document.querySelector(s);
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const st={session:null,admin:false,tenants:[],tid:null,tab:'home',mode:'login'};
const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;setTimeout(()=>t.hidden=true,3500)};
const LS={new:'جديد',contacted:'تم التواصل',visit:'معاينة',won:'تم البيع',lost:'خسرناه'},LI={draft:'مسودة',active:'متاح',sold:'اتباع'},AS={draft:'مسودة',ready:'جاهز',paused:'موقوف'},TS={pending:'بانتظار التفعيل',active:'مفعّلة',suspended:'موقوفة'},CS={sent:'اتبعت',seen:'اتشاف',done:'تم'};
const opts=(m,v)=>Object.entries(m).map(([k,l])=>`<option value="${k}" ${k===v?'selected':''}>${l}</option>`).join('');
const fmt=d=>new Date(d).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});
const tenant=()=>st.tenants.find(t=>t.id===st.tid);
function authView(){
 const su=st.mode==='signup';
 $('#app').innerHTML=`<div class="auth card"><h1>منصة المستشار العقاري</h1><p class="note">${su?'سجّل شركتك العقارية':'سجّل دخولك'}</p>
 <label>الإيميل</label><input id="em" type="email" autocomplete="email" dir="ltr">
 <label>كلمة المرور (٨ حروف على الأقل)</label><input id="pw" type="password" autocomplete="${su?'new-password':'current-password'}" dir="ltr">
 <div class="btns"><button class="btn gold" id="go">${su?'إنشاء حساب':'دخول'}</button><button class="btn" id="sw">${su?'عندي حساب':'حساب جديد'}</button></div>
 ${su?'<p class="note">بعد التسجيل هيوصلك إيميل تأكيد. لازم تدوس على اللينك قبل ما تدخل.</p>':''}</div>`;
 $('#sw').onclick=()=>{st.mode=su?'login':'signup';authView()};
 $('#go').onclick=async()=>{const email=$('#em').value.trim(),password=$('#pw').value;if(!email||password.length<8){toast('اكتب إيميل وكلمة مرور ٨ حروف على الأقل');return}
  $('#go').disabled=true;
  if(su){const{error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.href.split('#')[0]}});$('#go').disabled=false;if(error)toast('مشكلة: '+error.message);else toast('اتبعت إيميل التأكيد. افتحه وبعدين سجّل دخول.')}
  else{const{error}=await sb.auth.signInWithPassword({email,password});$('#go').disabled=false;if(error)toast('الإيميل أو كلمة المرور غلط، أو الإيميل لسه متأكدش')}};
}
async function ctx(){
 const a=await sb.rpc('is_admin');st.admin=a.data===true;
 const t=await sb.from('tenants').select('*').order('created_at');st.tenants=t.data||[];
 if(!st.admin)st.tid=st.tenants[0]?st.tenants[0].id:null;
 render();
}
function shell(body){
 const tn=tenant();
 const tabs=[['home','نظرة عامة'],['leads','العملاء المحتملين'],['listings','العقارات'],['assistant','المساعد'],['cmds','الطلبات']];
 return `<div class="wrap"><div class="top"><div><div class="brand">منصة المستشار العقاري</div><div class="note">${tn?E(tn.name)+' · '+TS[tn.status]:''}</div></div><div class="btns" style="margin:0">${st.admin&&st.tid?'<button class="btn" id="back">كل الشركات</button>':''}<button class="btn" id="out">خروج</button></div></div>
 ${st.admin?'<div class="admin">وضع فريق الإدارة: أنت شايف بيانات الشركات كلها.</div>':''}
 <div class="tabs">${tabs.map(([k,l])=>`<a data-t="${k}" class="${st.tab===k?'on':''}">${l}</a>`).join('')}</div>${body}</div>`;
}
function bindShell(){
 $('#out').onclick=async()=>{await sb.auth.signOut()};
 const b=$('#back');if(b)b.onclick=()=>{st.tid=null;render()};
 document.querySelectorAll('[data-t]').forEach(a=>a.onclick=()=>{st.tab=a.dataset.t;render()});
}
async function render(){
 if(!st.session){authView();return}
 if(!st.tid){
  if(st.admin){return adminList()}
  return createCompany();
 }
 const tid=st.tid;let body='';
 if(st.tab==='home')body=await homeV(tid);
 else if(st.tab==='leads')body=await leadsV(tid);
 else if(st.tab==='listings')body=await listV(tid);
 else if(st.tab==='assistant')body=await asstV(tid);
 else body=await cmdsV(tid);
 $('#app').innerHTML=shell(body);bindShell();bindTab(tid);
}
function createCompany(){
 $('#app').innerHTML=`<div class="auth card"><h1>اسم شركتك</h1><p class="note">هننشئ مساحة خاصة بشركتك العقارية. محدش غيرك وفريقنا يشوف بياناتها.</p>
 <label>اسم الشركة</label><input id="cn" maxlength="80"><div class="btns"><button class="btn gold" id="cc">إنشاء</button><button class="btn" id="out">خروج</button></div></div>`;
 $('#out').onclick=()=>sb.auth.signOut();
 $('#cc').onclick=async()=>{const n=$('#cn').value.trim();if(n.length<2){toast('اكتب اسم الشركة');return}$('#cc').disabled=true;const{error}=await sb.rpc('create_tenant',{p_name:n});if(error){toast('مشكلة: '+error.message);$('#cc').disabled=false}else ctx()};
}
async function adminList(){
 const rows=await Promise.all(st.tenants.map(async t=>{const[l,c]=await Promise.all([sb.from('leads').select('id',{count:'exact',head:true}).eq('tenant_id',t.id),sb.from('commands').select('id',{count:'exact',head:true}).eq('tenant_id',t.id).eq('status','sent')]);return `<div class="card"><div class="row"><h4>${E(t.name)}</h4><span class="badge ${t.status==='active'?'b-ok':'b-wait'}">${TS[t.status]}</span></div><div class="note">اتسجلت ${fmt(t.created_at)} · عملاء ${l.count||0} · طلبات جديدة ${c.count||0}</div><div class="btns"><button class="btn gold" data-open="${t.id}">افتح</button><select data-ts="${t.id}">${opts(TS,t.status)}</select></div></div>`}));
 $('#app').innerHTML=`<div class="wrap"><div class="top"><div class="brand">الشركات المسجلة</div><button class="btn" id="out">خروج</button></div><div class="admin">وضع فريق الإدارة</div>${rows.join('')||'<div class="card note">مفيش شركات لسه.</div>'}</div>`;
 $('#out').onclick=()=>sb.auth.signOut();
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{st.tid=b.dataset.open;st.tab='home';render()});
 document.querySelectorAll('[data-ts]').forEach(s=>s.onchange=async()=>{const{error}=await sb.from('tenants').update({status:s.value}).eq('id',s.dataset.ts);toast(error?'مشكلة: '+error.message:'اتحفظ');ctx()});
}
async function homeV(tid){
 const q=(t,f)=>sb.from(t).select('id',{count:'exact',head:true}).eq('tenant_id',tid).match(f||{});
 const[l,n,li,c]=await Promise.all([q('leads'),q('leads',{status:'new'}),q('listings',{status:'active'}),q('commands',{status:'sent'})]);
 const tn=tenant();
 return `${tn.status==='pending'?'<div class="card warn">شركتك بانتظار التفعيل من فريقنا. تقدر تضيف بياناتك من دلوقتي.</div>':''}
 <div class="grid"><div class="card stat"><b>${l.count||0}</b>عملاء محتملين</div><div class="card stat"><b>${n.count||0}</b>عملاء جداد</div><div class="card stat"><b>${li.count||0}</b>عقارات متاحة</div><div class="card stat"><b>${c.count||0}</b>طلبات مستنية رد</div></div>
 <div class="card"><h4>الربط بواتساب</h4><p class="note">غير متاح حاليًا. لسه بنجهزه ومفيش موعد مؤكد.</p></div>`;
}
async function leadsV(tid){
 const{data}=await sb.from('leads').select('*').eq('tenant_id',tid).order('created_at',{ascending:false});
 return `<div class="card"><h4>عميل جديد</h4><div class="grid"><div><label>الاسم</label><input id="ln"></div><div><label>الموبايل</label><input id="lp" dir="ltr" inputmode="tel"></div><div><label>مهتم بإيه</label><input id="li"></div></div><div class="btns"><button class="btn gold" id="ladd">إضافة</button></div></div>
 ${(data||[]).map(x=>`<div class="card"><div class="row"><h4>${E(x.name)}</h4><select data-ls="${x.id}">${opts(LS,x.status)}</select></div><div class="note">${E(x.phone||'')} ${x.interest?'· '+E(x.interest):''} · ${fmt(x.created_at)}</div><div class="btns"><button class="btn red" data-ld="${x.id}">حذف</button></div></div>`).join('')||'<div class="card note">مفيش عملاء لسه.</div>'}`;
}
async function listV(tid){
 const{data}=await sb.from('listings').select('*').eq('tenant_id',tid).order('created_at',{ascending:false});
 return `<div class="card"><h4>عقار جديد</h4><div class="grid"><div><label>العنوان</label><input id="tn"></div><div><label>المنطقة</label><input id="ta"></div><div><label>السعر (جنيه)</label><input id="tp" inputmode="numeric" dir="ltr"></div></div><label>تفاصيل</label><textarea id="td"></textarea><div class="btns"><button class="btn gold" id="tadd">إضافة</button></div></div>
 ${(data||[]).map(x=>`<div class="card"><div class="row"><h4>${E(x.title)}</h4><select data-lis="${x.id}">${opts(LI,x.status)}</select></div><div class="note">${E(x.area||'')} ${x.price?'· '+Number(x.price).toLocaleString('ar-EG')+' جنيه':''}</div>${x.details?`<p>${E(x.details)}</p>`:''}<div class="btns"><button class="btn red" data-lid="${x.id}">حذف</button></div></div>`).join('')||'<div class="card note">مفيش عقارات لسه.</div>'}`;
}
async function asstV(tid){
 const{data}=await sb.from('assistants').select('*').eq('tenant_id',tid).maybeSingle();const a=data||{persona:{}},p=a.persona||{};
 return `<div class="card"><h4>إعدادات المستشار الرقمي</h4><p class="note">دي إعدادات الشخصية والمعلومات اللي المستشار هيعتمد عليها. فريقنا بيراجعها ويشغّلها معاك. ممنوع تكتب هنا أي كلمات مرور أو بيانات بنكية.</p>
 <label>اسم المستشار</label><input id="an" value="${E(a.name||'')}" maxlength="60">
 <label>أسلوب الكلام</label><input id="at" value="${E(p.tone||'')}" placeholder="مثال: مهذب ومختصر بالمصري">
 <label>المناطق اللي بتشتغل فيها</label><input id="aa" value="${E(p.areas||'')}">
 <label>نطاق الأسعار</label><input id="ap" value="${E(p.prices||'')}">
 <label>رسالة الترحيب</label><textarea id="ag">${E(p.greeting||'')}</textarea>
 <label>أسئلة شائعة وإجاباتها</label><textarea id="af" style="min-height:140px">${E(p.faq||'')}</textarea>
 <label>الحالة</label><select id="as">${opts(AS,a.status||'draft')}</select>
 <div class="btns"><button class="btn gold" id="asave">حفظ</button></div>
 <p class="note">الربط بواتساب غير متاح حاليًا.</p></div>`;
}
async function cmdsV(tid){
 const{data}=await sb.from('commands').select('*').eq('tenant_id',tid).order('created_at',{ascending:false}).limit(50);
 return `<div class="card"><h4>ابعت طلب لفريقنا</h4><textarea id="cb" maxlength="2000" placeholder="اكتب طلبك"></textarea><div class="btns"><button class="btn gold" id="csend">ابعت</button></div></div>
 ${(data||[]).map(c=>`<div class="card"><div class="row"><h4>${st.admin&&c.created_by?'طلب العميل':'طلبك'}</h4><span class="badge ${c.status==='done'?'b-ok':'b-wait'}">${CS[c.status]}</span></div><p>${E(c.body)}</p><div class="note">${fmt(c.created_at)}</div>${c.reply?`<div class="card" style="margin-top:8px"><b>رد الفريق:</b> ${E(c.reply)}</div>`:''}${st.admin&&c.status!=='done'?`<div class="btns"><input id="r${c.id}" placeholder="الرد"><button class="btn gold" data-reply="${c.id}">رد وإنهاء</button></div>`:''}</div>`).join('')||'<div class="card note">مفيش طلبات.</div>'}`;
}
function bindTab(tid){
 const on=(sel,fn)=>document.querySelectorAll(sel).forEach(fn);
 const done=(e,m)=>{toast(e?'مشكلة: '+e.message:m||'اتحفظ');render()};
 const la=$('#ladd');if(la)la.onclick=async()=>{const n=$('#ln').value.trim();if(!n){toast('اكتب الاسم');return}const{error}=await sb.from('leads').insert({tenant_id:tid,name:n,phone:$('#lp').value.trim()||null,interest:$('#li').value.trim()||null});done(error,'اتضاف')};
 on('[data-ls]',s=>s.onchange=async()=>{const{error}=await sb.from('leads').update({status:s.value}).eq('id',s.dataset.ls).eq('tenant_id',tid);done(error)});
 on('[data-ld]',b=>b.onclick=async()=>{if(!confirm('حذف العميل؟'))return;const{error}=await sb.from('leads').delete().eq('id',b.dataset.ld).eq('tenant_id',tid);done(error,'اتحذف')});
 const ta=$('#tadd');if(ta)ta.onclick=async()=>{const n=$('#tn').value.trim();if(!n){toast('اكتب العنوان');return}const pr=$('#tp').value.replace(/[^0-9.]/g,'');const{error}=await sb.from('listings').insert({tenant_id:tid,title:n,area:$('#ta').value.trim()||null,price:pr?Number(pr):null,details:$('#td').value.trim()||null});done(error,'اتضاف')};
 on('[data-lis]',s=>s.onchange=async()=>{const{error}=await sb.from('listings').update({status:s.value}).eq('id',s.dataset.lis).eq('tenant_id',tid);done(error)});
 on('[data-lid]',b=>b.onclick=async()=>{if(!confirm('حذف العقار؟'))return;const{error}=await sb.from('listings').delete().eq('id',b.dataset.lid).eq('tenant_id',tid);done(error,'اتحذف')});
 const as=$('#asave');if(as)as.onclick=async()=>{const persona={tone:$('#at').value,areas:$('#aa').value,prices:$('#ap').value,greeting:$('#ag').value,faq:$('#af').value};const{error}=await sb.from('assistants').update({name:$('#an').value.trim()||'المستشار العقاري',persona,status:$('#as').value}).eq('tenant_id',tid);done(error)};
 const cs=$('#csend');if(cs)cs.onclick=async()=>{const b=$('#cb').value.trim();if(!b){toast('اكتب الطلب');return}const{error}=await sb.from('commands').insert({tenant_id:tid,body:b,kind:'request'});done(error,'اتبعت لفريقنا')};
 on('[data-reply]',b=>b.onclick=async()=>{const r=$('#r'+b.dataset.reply).value.trim();if(!r){toast('اكتب الرد');return}const{error}=await sb.from('commands').update({reply:r,status:'done'}).eq('id',b.dataset.reply);done(error,'اترد')});
}
sb.auth.onAuthStateChange((ev,s)=>{st.session=s;if(s){ctx()}else{st.tid=null;st.tenants=[];authView()}});
sb.auth.getSession().then(({data})=>{if(!data.session)authView()});
