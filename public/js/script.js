let btn=document.querySelector(".enroll");
let video=document.querySelector(".video");

if (btn && video) {
    btn.addEventListener("click",()=>{
        // alert("Enrolled succuessfully!!!");
        btn.innerHTML = "Enrolled"
        video.style.pointerEvents = "auto";
    });
}
