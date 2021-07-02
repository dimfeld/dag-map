/**
 * A topologically ordered map of key/value pairs with a simple API for adding constraints.
 *
 * Edges can forward reference keys that have not been added yet (the forward reference will
 * map the key to undefined).
 */
export default class DAG {
    constructor() {
        this._vertices = new Vertices();
    }
    /**
     * Adds a key/value pair with dependencies on other key/value pairs.
     *
     * @public
     * @param key    The key of the vertex to be added.
     * @param value  The value of that vertex.
     * @param before A key or array of keys of the vertices that must
     *               be visited before this vertex.
     * @param after  An string or array of strings with the keys of the
     *               vertices that must be after this vertex is visited.
     */
    add(key, value, before, after) {
        if (!key)
            throw new Error("argument `key` is required");
        let vertices = this._vertices;
        let v = vertices.add(key);
        v.val = value;
        if (before) {
            if (typeof before === "string") {
                vertices.addEdge(v, vertices.add(before));
            }
            else {
                for (let i = 0; i < before.length; i++) {
                    vertices.addEdge(v, vertices.add(before[i]));
                }
            }
        }
        if (after) {
            if (typeof after === "string") {
                vertices.addEdge(vertices.add(after), v);
            }
            else {
                for (let i = 0; i < after.length; i++) {
                    vertices.addEdge(vertices.add(after[i]), v);
                }
            }
        }
    }
    /**
     * Visits key/value pairs in topological order.
     *
     * @public
     * @param callback The function to be invoked with each key/value.
     */
    each(callback) {
        this._vertices.walk(callback);
    }
}
/** @private */
class Vertices {
    constructor() {
        this.length = 0;
        this.stack = new IntStack();
        this.path = new IntStack();
        this.result = new IntStack();
    }
    add(key) {
        if (!key)
            throw new Error("missing key");
        let l = this.length | 0;
        let vertex;
        for (let i = 0; i < l; i++) {
            vertex = this[i];
            if (vertex.key === key)
                return vertex;
        }
        this.length = l + 1;
        return (this[l] = {
            idx: l,
            key: key,
            val: undefined,
            out: false,
            flag: false,
            length: 0
        });
    }
    addEdge(v, w) {
        this.check(v, w.key);
        let l = w.length | 0;
        for (let i = 0; i < l; i++) {
            if (w[i] === v.idx)
                return;
        }
        w.length = l + 1;
        w[l] = v.idx;
        v.out = true;
    }
    walk(cb) {
        this.reset();
        for (let i = 0; i < this.length; i++) {
            let vertex = this[i];
            if (vertex.out)
                continue;
            this.visit(vertex, "");
        }
        this.each(this.result, cb);
    }
    check(v, w) {
        if (v.key === w) {
            throw new Error("cycle detected: " + w + " <- " + w);
        }
        // quick check
        if (v.length === 0)
            return;
        // shallow check
        for (let i = 0; i < v.length; i++) {
            let key = this[v[i]].key;
            if (key === w) {
                throw new Error("cycle detected: " + w + " <- " + v.key + " <- " + w);
            }
        }
        // deep check
        this.reset();
        this.visit(v, w);
        if (this.path.length > 0) {
            let msg = "cycle detected: " + w;
            this.each(this.path, key => {
                msg += " <- " + key;
            });
            throw new Error(msg);
        }
    }
    reset() {
        this.stack.length = 0;
        this.path.length = 0;
        this.result.length = 0;
        for (let i = 0, l = this.length; i < l; i++) {
            this[i].flag = false;
        }
    }
    visit(start, search) {
        let { stack, path, result } = this;
        stack.push(start.idx);
        while (stack.length) {
            let index = stack.pop() | 0;
            if (index >= 0) {
                // enter
                let vertex = this[index];
                if (vertex.flag)
                    continue;
                vertex.flag = true;
                path.push(index);
                if (search === vertex.key)
                    break;
                // push exit
                stack.push(~index);
                this.pushIncoming(vertex);
            }
            else {
                // exit
                path.pop();
                result.push(~index);
            }
        }
    }
    pushIncoming(incomming) {
        let { stack } = this;
        for (let i = incomming.length - 1; i >= 0; i--) {
            let index = incomming[i];
            if (!this[index].flag) {
                stack.push(index);
            }
        }
    }
    each(indices, cb) {
        for (let i = 0, l = indices.length; i < l; i++) {
            let vertex = this[indices[i]];
            cb(vertex.key, vertex.val);
        }
    }
}
/** @private */
class IntStack {
    constructor() {
        this.length = 0;
    }
    push(n) {
        this[this.length++] = n | 0;
    }
    pop() {
        return this[--this.length] | 0;
    }
}
//# sourceMappingURL=dag-map.js.map