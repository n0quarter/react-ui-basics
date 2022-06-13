var global = global || window;
export const WINDOW = global;
export const DOCUMENT = WINDOW.document;

export function classNames(...classes: Array<string | number | boolean | null | void>) {
    const filtered = [];
    const length = classes.length;
    for (let i = 0; i < length; i++) {
        let it = classes[i];
        !!it && filtered.push(it);
    }
    return filtered.join(' ');
}

export const NOOP = () => {
};

export const orNoop = <T>(f: (...a: any) => T) => f || NOOP;

export const getRandomId = (prefix) => prefix + Math.random();

export const ref = (name, component) => {
    const refKey = "__" + name;
    return component[refKey] || (component[refKey] = (it) => component[name] = it)
};

export const createRef = (initialValue?: any) => {
    let v = initialValue;
    return function (value?: any) {
        if (value != UNDEFINED)
            v = value
        return v;
    };
};

export const createAccessor = (field: string) => (o: any, value?: any) => {
    return !o ? null : value != UNDEFINED ? o[field] = value : o[field]
}

export const setOf = (list) => (list || []).reduce((map, key) => {
    map[key] = TRUE;
    return map;
}, {});

export const allPropsExcept = (obj, except) => {
    let result = {};
    for (let key in obj) {
        if (!except[key]) result[key] = obj[key];
    }
    return result;
};

export const continuousIncludes = (value, inc) => {
    const length = inc.length;
    let from = -1;
    for (let i = 0; i < length; i++) {
        from = value.indexOf(inc[i], from + 1);
        if (from === -1)
            return FALSE
    }
    return TRUE;
};

const isArrayShallowEqual = (a, b) => {
    if (a === b) return TRUE;
    if (a == null || b == null) return FALSE;
    if (a.length !== b.length) return FALSE;

    let i = a.length - 1;
    let result = TRUE;
    while (i >= 0 && (result = (a[i] === b[i]))) {
        i--;
    }
    return result;
}

export const debounce = (func, delay) => {
    let inDebounce;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => {
            func.apply(context, args);
        }, delay)
    }
};

export const memo = (func) => {
    let prevArgs
    let prevResult
    return function () {
        const context = this;
        const args = arguments;
        if (!isArrayShallowEqual(prevArgs, args)) {
            prevArgs = args
            prevResult = func.apply(context, args);
        }
        return prevResult
    }
}

export const constructorOf = (v) => v && v.constructor;
export const typeOf = (v) => typeof v;
export const isFunction = (v) => typeOf(v) === 'function';
export const isString = (v) => typeOf(v) === 'string';
export const isObject = (v) => typeOf(v) === 'object';

const FALSE = false;
const TRUE = true;

export const isDifferent = (a, b) => {
    if (a === null && b === null) return FALSE;
    if (a === null || b === null) return TRUE;
    if (a === b) return FALSE;

    const constructorA = constructorOf(a);
    const constructorB = constructorOf(b);
    if (constructorA !== constructorB) {
        return TRUE;
    }

    let i;
    if (constructorA === Array) {
        if ((i = a.length) === b.length) {
            while (i-- && !isDifferent(a[i], b[i])) {
            }
        }
    } else if (constructorA === Object) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if ((i = keysA.length) === keysB.length) {
            let key;
            while (i-- && ((key = keysA[i]) in b) && !isDifferent(a[key], b[key])) {
            }
        }
    }

    return i !== -1;
};

export const preventDefault = e => {
    e && e.preventDefault();
};
export const stopPropagation = e => {
    e && e.stopPropagation();
};

export const setTimeout = function (callback: (...args: any[]) => void, ms?: number, ...args: any[]) {
    return WINDOW.setTimeout.apply(WINDOW, arguments);
};
export const clearTimeout = (id) => {
    WINDOW.clearTimeout(id);
};
export const setInterval = function (callback: (...args: any[]) => void, ms?: number, ...args: any[]) {
    return WINDOW.setInterval.apply(WINDOW, arguments);
};
export const clearInterval = (id) => {
    WINDOW.clearInterval(id);
};
export const requestAnimationFrame = (cb) => WINDOW.requestAnimationFrame(cb);
export const addEventListener = (el, type, listener, options) => {
    el && el.addEventListener(type, listener, options);
};
export const removeEventListener = (el, type, listener, options) => {
    el && el.removeEventListener(type, listener, options);
};

export const UNDEFINED = undefined;
export const isUndefined = a => a === UNDEFINED;


export class Comparators {
    static SORT_ASC = 'ASC';
    static SORT_DESC = 'DESC';

    static of = (field, order, data) => {
        let comparator;
        if (Array.isArray(field)) {
            const isOrderArray = Array.isArray(order);
            comparator = Comparators.chain(field.map((it, i) => Comparators.of(it, (isOrderArray && order[i]) || Comparators.SORT_ASC, data)));
        } else if (isFunction(field)) {
            if (data && data[0] && isString(field(data[0]))) {
                const collator = new Intl.Collator('default', {sensitivity: 'base'});
                comparator = (a, b) => {
                    return collator.compare(field(a), field(b));
                }
            } else
                comparator = (a, b) => {
                    const A = field(a);
                    const B = field(b);
                    return (A < B ? -1 : (A > B ? 1 : 0));
                };
        } else if (isString(field))
            comparator = Comparators.of(it => it[field], Comparators.SORT_ASC, data);
        else
            comparator = Comparators.of(it => it, Comparators.SORT_ASC, data);

        if (order && order === Comparators.SORT_DESC) {
            return Comparators.inverse(comparator);
        }

        return addComparatorMethods(comparator);
    };
    static chain = (comparators) => addComparatorMethods((a, b) => {
            let result;
            for (let i = 0; i < comparators.length; i++) {
                result = comparators[i](a, b);
                if (result !== 0)
                    return result;
            }
            return result;
        }
    );

    static inverse = (comparator) => addComparatorMethods((a, b) => -comparator(a, b));
}

const addComparatorMethods = function (comparator) {
    comparator.inverse = () => Comparators.inverse(comparator);
    comparator.and = (another) => Comparators.chain([comparator, another]);
    return comparator;
};

if (window['isNotProductionEnvironment']) {
    // will be removed in production build
    // needed only to prevent bundler to remove 'unused' functions
    window['tools'] = {
        memo
    }
}