var i=document.getElementById('jason');
var minW=i.width;
var maxW="715px";
minW = minW.toString() + "px";
console.log("hi");
console.log(i.width);
console.log(minW.toString());
console.log(maxW.toString());
var jasonIsBig = false;
console.log(document.documentElement.clientWidth);

if (document.documentElement.clientWidth<480){
    var textarea = document.getElementById("date");
    tex= textarea.innerHTML;
    var dd= tex.split('-')[0];
    var mm= tex.split('-')[1];
    var yyyy=tex.split('-')[2];
    textarea.innerHTML = `${dd}-${mm}-${yyyy.substring(2,4)}`;
}
/*window.addEventListener("resize", function(){
  console.log('resize!');
  if (jasonIsBig){
  maxW=i.width;
  minW=maxW*0.2;
  }else{
  minW=i.width;
  maxW=minW*5;
  }
  minW = minW.toString() + "px";
  maxW = maxW.toString() + "px";
  console.log(minW);
  console.log(maxW);
  }, true);
  */
i.addEventListener('click', function() {
    if (jasonIsBig ) {
        console.log("true");
        i.style.width=minW;
        console.log(i.width);
        jasonIsBig=false;
    }
    else {
        console.log("false");
        i.style.width=maxW;
        console.log(i.width);
        jasonIsBig=true;
    }
});

