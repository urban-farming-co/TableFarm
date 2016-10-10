var pause =0.2 *1000; 

var images = document.getElementById('carrousel').getElementsByTagName('img');

function showNextImage(i){
    if (typeof(images[i]) != "undefined"){
        // Tell the user which image is being shown.
        document.getElementById('i').innerHTML = i;
        // Show the image.
        images[i].style.display = "block";
        //
        setTimeout(()=> {
            images[i].style.display = "none";
            showNextImage(i+1);
        }, pause);
    } 
}

function carrousel(){
    var i = 0;
    // images[i].style.display = 'block';

    // wait for images to load up.
    setTimeout(()=> {
        console.log(i);
    }, pause + pause);
    showNextImage(i);
}

carrousel();
