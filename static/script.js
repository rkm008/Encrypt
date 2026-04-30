function popup(msg,err=false){
let p=document.createElement("div")
p.className="popup "+(err?"error":"success")
p.innerText=msg
document.body.appendChild(p)
setTimeout(()=>p.remove(),2500)
}

/* Tabs */
encBtn.onclick=()=>{
encBox.classList.add("active")
decBox.classList.remove("active")
encBtn.classList.add("active")
decBtn.classList.remove("active")
}

decBtn.onclick=()=>{
decBox.classList.add("active")
encBox.classList.remove("active")
decBtn.classList.add("active")
encBtn.classList.remove("active")
}

/* File pick */
encDrop.onclick=()=>encFile.click()
decDrop.onclick=()=>decFile.click()

encFile.onchange=()=>{
if(encFile.files[0]){
encInfo.innerHTML=`📄 ${encFile.files[0].name} | 📦 ${(encFile.files[0].size/1024/1024).toFixed(2)} MB`
}
}

/* ✅ FIX: decrypt file handler (THIS WAS MISSING) */
decFile.onchange=()=>{
if(decFile.files[0]){
decInfo.innerHTML=`📄 ${decFile.files[0].name} | 📦 ${(decFile.files[0].size/1024/1024).toFixed(2)} MB`
}
}

/* Upload function */
function upload(url,fd,bar,percent,cb){
let xhr=new XMLHttpRequest()
xhr.open("POST",url)
xhr.responseType="blob"

xhr.upload.onprogress=e=>{
if(e.lengthComputable){
let p=Math.round((e.loaded/e.total)*100)
bar.style.width=p+"%"
percent.innerText=p+"%"
}
}

xhr.onload=()=>cb(xhr)
xhr.onerror=()=>popup("Network error ❌",true)

xhr.send(fd)
}

/* Encrypt */
function encryptFile(){
let f=encFile.files[0]
let k=encKey.value
if(!f||!k) return popup("Fill all fields",true)

encPercent.innerText="0%"
encBar.style.width="0%"

let fd=new FormData()
fd.append("file",f)
fd.append("key",k)

upload("/encrypt",fd,encBar,encPercent,(res)=>{
let url=URL.createObjectURL(res.response)

encDownload.href=url
encDownload.download="encrypted.bin"
encDownload.style.display="block"
encDownload.innerText="⬇ Download Encrypted File"

popup("Encryption Complete ✅")
})
}

/* Decrypt */
function decryptFile(){
let f=decFile.files[0]
let k=decKey.value
if(!f||!k) return popup("Fill all fields",true)

/* safety fix */
if(!decFile.files[0]) return popup("Select file first ❌",true)

decPercent.innerText="0%"
decBar.style.width="0%"

let fd=new FormData()
fd.append("file",f)
fd.append("key",k)

upload("/decrypt",fd,decBar,decPercent,(res)=>{
if(res.status!==200){
popup("Wrong key ❌",true)
return
}

let url=URL.createObjectURL(res.response)

decDownload.href=url
decDownload.download=""
decDownload.style.display="block"
decDownload.innerText="⬇ Download File"

popup("Decryption Complete 🔓")
})
}