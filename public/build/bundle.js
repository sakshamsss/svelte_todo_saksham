
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Navbar.svelte generated by Svelte v3.44.1 */

    const file$4 = "src\\Navbar.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div2;
    	let h3;
    	let t1;
    	let div1;
    	let label0;
    	let input0;
    	let t2;
    	let span1;
    	let a0;
    	let div0;
    	let t3;
    	let span0;
    	let t5;
    	let br0;
    	let t6;
    	let label1;
    	let input1;
    	let t7;
    	let span4;
    	let a1;
    	let span2;
    	let t8;
    	let span3;
    	let t10;
    	let br1;
    	let t11;
    	let label2;
    	let input2;
    	let t12;
    	let span7;
    	let a2;
    	let span5;
    	let t13;
    	let span6;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			h3 = element("h3");
    			h3.textContent = ".Brit";
    			t1 = space();
    			div1 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t2 = space();
    			span1 = element("span");
    			a0 = element("a");
    			div0 = element("div");
    			t3 = space();
    			span0 = element("span");
    			span0.textContent = "Home";
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t7 = space();
    			span4 = element("span");
    			a1 = element("a");
    			span2 = element("span");
    			t8 = space();
    			span3 = element("span");
    			span3.textContent = "About Us";
    			t10 = space();
    			br1 = element("br");
    			t11 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t12 = space();
    			span7 = element("span");
    			a2 = element("a");
    			span5 = element("span");
    			t13 = space();
    			span6 = element("span");
    			span6.textContent = "More";
    			attr_dev(h3, "class", "brand_logo svelte-9098qp");
    			add_location(h3, file$4, 6, 8, 71);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "id", "input-1");
    			attr_dev(input0, "name", "group");
    			attr_dev(input0, "class", "svelte-9098qp");
    			add_location(input0, file$4, 9, 16, 185);
    			attr_dev(div0, "class", "dot svelte-9098qp");
    			add_location(div0, file$4, 16, 24, 414);
    			attr_dev(a0, "href", "#home");
    			attr_dev(a0, "class", "svelte-9098qp");
    			add_location(a0, file$4, 15, 20, 372);
    			attr_dev(span0, "class", "btn-text svelte-9098qp");
    			add_location(span0, file$4, 21, 20, 593);
    			attr_dev(span1, "class", "btn svelte-9098qp");
    			add_location(span1, file$4, 14, 16, 332);
    			attr_dev(label0, "for", "input-1");
    			add_location(label0, file$4, 8, 12, 146);
    			add_location(br0, file$4, 24, 12, 688);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "id", "input-2");
    			attr_dev(input1, "name", "group");
    			attr_dev(input1, "class", "svelte-9098qp");
    			add_location(input1, file$4, 26, 16, 745);
    			attr_dev(span2, "class", "dot svelte-9098qp");
    			add_location(span2, file$4, 33, 24, 977);
    			attr_dev(a1, "href", "#aboutUs");
    			attr_dev(a1, "class", "svelte-9098qp");
    			add_location(a1, file$4, 32, 20, 932);
    			attr_dev(span3, "class", "btn-text svelte-9098qp");
    			add_location(span3, file$4, 37, 20, 1102);
    			attr_dev(span4, "class", "btn svelte-9098qp");
    			add_location(span4, file$4, 31, 16, 892);
    			attr_dev(label1, "for", "input-2");
    			add_location(label1, file$4, 25, 12, 706);
    			add_location(br1, file$4, 40, 12, 1201);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "id", "input-3");
    			attr_dev(input2, "name", "group");
    			attr_dev(input2, "class", "svelte-9098qp");
    			add_location(input2, file$4, 42, 16, 1258);
    			attr_dev(span5, "class", "dot svelte-9098qp");
    			add_location(span5, file$4, 49, 24, 1487);
    			attr_dev(a2, "href", "#more");
    			attr_dev(a2, "class", "svelte-9098qp");
    			add_location(a2, file$4, 48, 20, 1445);
    			attr_dev(span6, "class", "btn-text svelte-9098qp");
    			add_location(span6, file$4, 53, 20, 1612);
    			attr_dev(span7, "class", "btn svelte-9098qp");
    			add_location(span7, file$4, 47, 16, 1405);
    			attr_dev(label2, "for", "input-3");
    			add_location(label2, file$4, 41, 12, 1219);
    			attr_dev(div1, "class", "list svelte-9098qp");
    			add_location(div1, file$4, 7, 8, 114);
    			attr_dev(div2, "class", "navbar svelte-9098qp");
    			add_location(div2, file$4, 5, 4, 41);
    			attr_dev(main, "class", "svelte-9098qp");
    			add_location(main, file$4, 4, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, h3);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, label0);
    			append_dev(label0, input0);
    			append_dev(label0, t2);
    			append_dev(label0, span1);
    			append_dev(span1, a0);
    			append_dev(a0, div0);
    			append_dev(span1, t3);
    			append_dev(span1, span0);
    			append_dev(div1, t5);
    			append_dev(div1, br0);
    			append_dev(div1, t6);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			append_dev(label1, t7);
    			append_dev(label1, span4);
    			append_dev(span4, a1);
    			append_dev(a1, span2);
    			append_dev(span4, t8);
    			append_dev(span4, span3);
    			append_dev(div1, t10);
    			append_dev(div1, br1);
    			append_dev(div1, t11);
    			append_dev(div1, label2);
    			append_dev(label2, input2);
    			append_dev(label2, t12);
    			append_dev(label2, span7);
    			append_dev(span7, a2);
    			append_dev(a2, span5);
    			append_dev(span7, t13);
    			append_dev(span7, span6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Homepage.svelte generated by Svelte v3.44.1 */

    const file$3 = "src\\Homepage.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Lorem ipsum lorem ipsum";
    			attr_dev(h1, "class", "title-home svelte-iypt0g");
    			add_location(h1, file$3, 13, 4, 353);
    			attr_dev(main, "class", "svelte-iypt0g");
    			add_location(main, file$3, 12, 0, 341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const checkpoint = 30;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Homepage', slots, []);
    	var title = document.querySelector('h1');

    	window.addEventListener('scroll', () => {
    		const scroll = window.pageYOffset;

    		if (scroll <= checkpoint) {
    			var opacity = 1 - scroll / 10;
    		}

    		title.style.setProperty('--opacity', opacity);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Homepage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ checkpoint, title });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) title = $$props.title;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Homepage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Homepage",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\AboutUs.svelte generated by Svelte v3.44.1 */

    const file$2 = "src\\AboutUs.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Lorem ipsum lorem ipsum";
    			attr_dev(h1, "class", "title svelte-q6fpx2");
    			add_location(h1, file$2, 5, 4, 37);
    			attr_dev(main, "class", "svelte-q6fpx2");
    			add_location(main, file$2, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AboutUs', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AboutUs> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class AboutUs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutUs",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\More.svelte generated by Svelte v3.44.1 */

    const file$1 = "src\\More.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Lorem ipsum lorem ipsum";
    			attr_dev(h1, "class", "title svelte-q6fpx2");
    			add_location(h1, file$1, 3, 4, 33);
    			attr_dev(main, "class", "svelte-q6fpx2");
    			add_location(main, file$1, 2, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('More', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<More> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class More extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "More",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let div0;
    	let homepage;
    	let t1;
    	let div1;
    	let aboutus;
    	let t2;
    	let div2;
    	let more;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	homepage = new Homepage({ $$inline: true });
    	aboutus = new AboutUs({ $$inline: true });
    	more = new More({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(homepage.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(aboutus.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(more.$$.fragment);
    			attr_dev(div0, "class", "app_bg svelte-11iplqq");
    			attr_dev(div0, "id", "home");
    			add_location(div0, file, 9, 1, 198);
    			attr_dev(div1, "class", "lower_bg svelte-11iplqq");
    			attr_dev(div1, "id", "aboutUs");
    			add_location(div1, file, 12, 1, 253);
    			attr_dev(div2, "class", "more_bg svelte-11iplqq");
    			attr_dev(div2, "id", "more");
    			add_location(div2, file, 15, 1, 312);
    			add_location(main, file, 7, 0, 178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			append_dev(main, div0);
    			mount_component(homepage, div0, null);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			mount_component(aboutus, div1, null);
    			append_dev(main, t2);
    			append_dev(main, div2);
    			mount_component(more, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(homepage.$$.fragment, local);
    			transition_in(aboutus.$$.fragment, local);
    			transition_in(more.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(homepage.$$.fragment, local);
    			transition_out(aboutus.$$.fragment, local);
    			transition_out(more.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(homepage);
    			destroy_component(aboutus);
    			destroy_component(more);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Homepage, AboutUs, More });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
