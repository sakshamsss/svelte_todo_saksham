<script>
    
</script>

<main>
    <div class="navbar">
        <h3 class="brand_logo">.Brit</h3>
        <div class="list">
            <label for="input-1">
                <input 
                    type="radio"
                    id="input-1"
                    name="group"
                />
                <span class="btn">
                    <a href="#home">
                        <div class="dot" />
                        <!-- <span 
                            class="dot"  
                        /> -->
                    </a>
                    <span class="btn-text">Home</span>
                </span>
            </label>
            <br>
            <label for="input-2">
                <input 
                    type="radio"
                    id="input-2"
                    name="group"
                />
                <span class="btn">
                    <a href="#aboutUs">
                        <span 
                            class="dot"  
                        />
                    </a>
                    <span class="btn-text">About Us</span>
                </span>
            </label>
            <br>
            <label for="input-3">
                <input 
                    type="radio"
                    id="input-3"
                    name="group"
                />
                <span class="btn">
                    <a href="#more">
                        <span 
                            class="dot"  
                        />
                    </a>
                    <span class="btn-text">More</span>
                </span>
            </label>
        </div>
    </div>
</main>

<style>
    main{
        box-sizing: border-box;
    }
    .navbar{
        position: absolute;
        background-color: grey;
        width: 100%;
        height: 10vh;
    }
    h3{
        position: relative;
        padding-left: 15px;
        font-size: 30px;
    }

    .list{
        position: fixed;
        padding-top: 200px;
        padding-left: 20px;
    }
    
    .btn{
        position: relative;
        display: block;
        align-items: center;
        font-size: 2rem;
        color: white;
        height: 3rem;
        padding: 0;
        border-radius: 2rem;
    }

    input{
        position: absolute;
        transform: scale(0);
    }
    
    .dot{
        height: 15px;
        width: 15px;
        background-color: white;
        border-radius: 50%;
        display: inline-block;
    }

    .dot:hover  {
        width:10px;
        height:10px;
        border-radius:50%;
        background-color:transparent;
        padding: 2px;
        background-clip:content-box;
        border:2px solid white;
        transition: all 0.5s;
    }

    

    /* .dot::after{
        width:10px;
        border-radius:50%;
        height:10px;
        background-color:transparent;
        padding: 3px;
        background-clip:content-box;
        border:2.5px solid white;
    } */

    .btn-text{
        font-size: 23px;
        opacity: 0.5;
    }

    span:hover{
        transition: all 0.5s;
        opacity: 1;
    }

    a:active .dot {
        transform: translate3D(2rem);
        background-color: white;
        transition: all 0.35s;
    }

    
    
</style>
<!-- /* 
    input:checked ~ .btn{
        background: #867c48;
    }

    input:checked ~ .btn  {
        visibility: visible;
        opacity: 1;
        transform: 
            translateY(-50%)
            translateX(2.5rem);
    }

    input:checked ~ .btn .dot{
        transform: translateX(-1.5rem);
    } */ -->