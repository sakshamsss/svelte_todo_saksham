<script>
    const checkpoint = 30;
    var title = document.querySelector('h1');
    window.addEventListener('scroll', () => {
        const scroll = window.pageYOffset;
        if(scroll <= checkpoint){
            var opacity = 1- scroll/10
        }
        title.style.setProperty('--opacity', opacity) ;
    });
</script>

<main>
    <h1 class="title-home">Lorem ipsum lorem ipsum</h1>
</main>

<style>
    *{
        position: relative;
        border: 0;
        margin: 0;
    }
    .title-home{
        opacity: var(--opacity);
        color: white;
        text-align: center;
        padding-top: 100px;
        overflow: hidden;
    }
</style>