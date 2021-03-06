var ReloadableModule = require('./../dist/reloadable-module');
var asserts = require('./asserts');
var assertTrue = asserts.assertTrue;
var assertEquals = asserts.assertEquals;

function Person(name) {
    this.name = name;
}


Person.prototype.getName = function () {
    return this.name;
};


var reloadableModule = new ReloadableModule(Person);

var ProxiedPerson = reloadableModule.getProxied();

var p = new ProxiedPerson('a');

assertEquals('a', p.getName());


/* UPDATING CONSTRUCTOR AND METHODS */
function Person2(age, name) {
    this.age = age;
    this.name = name;
}

Person2.prototype.getName = function () {
    return this.name + '2';
};

Person2.prototype.getAge = function () {
    return this.age;
};

reloadableModule.update(Person2);
assertEquals('a2', p.getName());
assertEquals('b2', new ProxiedPerson(12, 'b').getName());
assertEquals(12, new ProxiedPerson(12, 'b').getAge());


/*  REMOVING FIELDS */
reloadableModule.update(function () {
});
assertEquals(void 0, p.getName);


/* INSTANCEOF */
assertTrue(p instanceof ProxiedPerson);
assertTrue(new ProxiedPerson(12, 'b') instanceof ProxiedPerson);


/* RECURSION */
function Person3() {
}

Person3.Person3 = Person3;

reloadableModule.update(Person3);
assertTrue(typeof ProxiedPerson.Person3 === 'function');
assertEquals(ProxiedPerson.Person3, ProxiedPerson);


/* EMPTY OBJECTS */
reloadableModule.update(null);


/* INHERITANCE */
function Base() {
    this.x = 1;
}
Base.prototype.baseMethod = function () {
    return 2;
};
function Person4() {
    Base.apply(this);
}

function Tmp() {
}
Tmp.prototype = Base.prototype;
Person4.prototype = new Tmp();


Person4.prototype.method = function () {
    return 3;
};

var reloadableModule2 = new ReloadableModule(Person4);
var ProxiedPerson2 = reloadableModule2.getProxied();
var p2 = new ProxiedPerson2();
assertEquals(p2.x, 1);
assertEquals(p2.method(), 3);
assertEquals(p2.baseMethod(), 2);


/* REMOVE PARENT */
reloadableModule2.update(function () {
});

assertEquals(void 0, p2.method);
assertEquals(void 0, p2.baseMethod);
assertEquals(void 0, ProxiedPerson2.prototype.method);
assertEquals(void 0, ProxiedPerson2.prototype.baseMethod);


/* ADD PARENT*/
reloadableModule2.update(Person4);
assertEquals(p2.method(), 3);
assertEquals(p2.baseMethod(), 2);


/* INSTANCEOF ORIGINAL */
//console.log(p2.__proto__);
assertTrue(p2 instanceof Person4);
assertTrue(p2 instanceof Base);


/* REPLACE ORIGINAL INSTANCEOF */
reloadableModule2.update(function () {
});
assertTrue(!(p2 instanceof Person4));


/* 3 LEVEL INHERITANCE */
function inherits(d, b) {
    function Tmp() {
    }

    Tmp.prototype = b.prototype;

    d.prototype = new Tmp();
    //noinspection JSUnusedGlobalSymbols
    d.prototype.constructor = d;
}

function X() {
}

function A() {
}
inherits(A, X);


function B() {
}
inherits(B, A);

reloadableModule.update(B);

/* OBJECTS AND PRIMITIVES */
var objectModule = new ReloadableModule({
    x: 1,
    sub: {
        a: 2
    }
});
var obj = objectModule.getProxied();
var subObj = obj.sub;

assertEquals(1, obj.x);
assertEquals(2, subObj.a);

objectModule.update({
    x: 2,
    sub: {
        a: 3
    }
});

assertEquals(2, obj.x);
assertEquals(3, obj.sub.a);
assertEquals(3, subObj.a);


/* UPDATE AFTER NULL */
reloadableModule.update(null);

function Person5() {
}
Person5.prototype.method5 = function () {
    return 1;
};

reloadableModule.update(Person5);

assertEquals(1, p.method5());


/* OVERLOAD */
function A1() {
}

A1.prototype.method = function () {
    return 1;
};

function B1() {
}
inherits(B1, A1);

reloadableModule = new ReloadableModule(B1);
p = new (reloadableModule.getProxied())();
assertEquals(1, p.method());

function A2() {
}

A2.prototype.method = function () {
    return 1;
};

function B2() {
}
inherits(B2, A2);
B2.prototype.method = function () {
    return 2;
};
reloadableModule.update(B2);
assertEquals(2, p.method());


/* DUPLICATED REFERENCES */
function x() {
    return 1;
}


reloadableModule.update({
    a: x,
    b: x
});

var objProxied = reloadableModule.getProxied();

var proxiedB = objProxied.b;

assertTrue(proxiedB !== objProxied.a);

assertEquals(1, objProxied.a());
assertEquals(1, objProxied.b());

reloadableModule.update({
    b: function () {
        return 2;
    }
});

assertEquals(2, proxiedB());


/* ARRAYS */
reloadableModule = new ReloadableModule([{
    a: 1
}, {
    a: 2
}, {
    a: 3
}]);
objProxied = reloadableModule.getProxied();

assertEquals(3, objProxied.length);
assertEquals(1, objProxied[0].a);
assertEquals(2, objProxied[1].a);

objProxied.push(12);
assertEquals(12, objProxied[3]);


/* ACCESS PROXIED INSIDE MODULE */
var exp = {
    Holder:Holder
};

function Holder(value){
    this.value = value;
}

Holder.create=function(){
    return new exp.Holder(42);
};

reloadableModule = new ReloadableModule(exp);
objProxied = reloadableModule.getProxied();

var holder = objProxied.Holder.create();

function Holder2() {
}
Holder2.prototype.increment=function(){
    this.value++;
};

reloadableModule.update({
    Holder:Holder2
});

holder.increment();
assertEquals(43,holder.value);