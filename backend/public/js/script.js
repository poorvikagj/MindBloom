let btn=document.querySelector(".enroll");
let video=document.querySelector(".video");
btn.addEventListener("click",()=>{
    // alert("Enrolled succuessfully!!!");
    btn.innerHTML = "Enrolled"
    video.style.pointerEvents = "auto";
});
