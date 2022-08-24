<script>
	import lazyload from 'vanilla-lazyload';
	import { browser } from '$app/env';

	import '$lib/styles/normalise.css';
	import '$lib/styles/index.scss';
	import BlogPost from '$lib/components/BlogPost.svelte';
	export let data;

	const { page, post, imageData } = data;

	if (browser && !document.lazyloadInstance) {
		document.lazyloadInstance = new lazyload();
	}
</script>

<BlogPost {post} {imageData} />
<svelte:component this={page} />
