<script>
	import Navbar from "./Navbar.svelte";
	import Homepage from "./Homepage.svelte";
	import AboutUs from "./AboutUs.svelte";
	import More from "./More.svelte";
</script>

<main>
	<Navbar />
	<div class="app_bg" id="home">
		<Homepage />
	</div>
	<div class="lower_bg" id="aboutUs">
		<AboutUs />
	</div>
	<div  class="more_bg" id="more">
		<More />
	</div>
</main>

<style>
	.app_bg{
		background-color: black;
		height: 100vh;
		width: 100%;
	}
	.lower_bg{
		/* position: relative; */
		background-color: black;
		height: 100vh;
		width: 100%;
	}
	.more_bg{
		background-color: black;
		height: 100vh;
		width: 100%;
	}
</style>