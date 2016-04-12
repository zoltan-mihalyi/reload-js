'use strict';
var ReloadableModule = require('./../dist/reloadable-module');
var asserts = require('./asserts');
var assertTrue = asserts.assertTrue;
var assertEquals = asserts.assertEquals;

class Person {
    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }
}

var reloadableModule = new ReloadableModule(Person);

var ProxiedPerson = reloadableModule.getProxied();

var p = new ProxiedPerson('a');

assertEquals('a', p.getName());


/* UPDATING CONSTRUCTOR AND METHODS */

class Person2 {
    constructor(age, name) {
        this.age = age;
        this.name = name;
    }

    getName() {
        return this.name + '2';
    }

    getAge() {
        return this.age;
    }
}

reloadableModule.update(Person2);
assertEquals('a2', p.getName());
assertEquals('b2', new ProxiedPerson(12, 'b').getName());
assertEquals(12, new ProxiedPerson(12, 'b').getAge());


/* INSTANCEOF */
assertTrue(p instanceof ProxiedPerson);
assertTrue(new ProxiedPerson(12, 'b') instanceof ProxiedPerson);


/* RECURSION */

class Person3 {
}

Person3.Person3 = Person3;

reloadableModule.update(Person3);
assertTrue(typeof ProxiedPerson.Person3 === 'function');
assertEquals(ProxiedPerson.Person3, ProxiedPerson);


/* INHERITANCE */
class Base {
    constructor() {
        this.x = 1;
    }

    baseMethod() {
        return 2;
    }
}

class Person4 extends Base {
    constructor() {
        super();
    }

    method() {
        return 3;
    }
}

var reloadableModule2 = new ReloadableModule(Person4);
var ProxiedPerson2 = reloadableModule2.getProxied();
var p2 = new ProxiedPerson2();
assertEquals(p2.x, 1);
assertEquals(p2.method(), 3);
assertEquals(p2.baseMethod(), 2);


/* REMOVE PARENT */
reloadableModule2.update(function() {
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
assertTrue(p2 instanceof Person4);
assertTrue(p2 instanceof Base);


/* REPLACE ORIGINAL INSTANCEOF */
reloadableModule2.update(function() {
});
assertTrue(!(p2 instanceof Person4));


/* 3 LEVEL INHERITANCE */

class X {
}

class A extends X{
}


class B extends A {
}

reloadableModule.update(B);


/* UPDATE AFTER NULL */
reloadableModule.update(null);

class Person5{
    method5() {
        return 1;
    }
}

reloadableModule.update(Person5);

assertEquals(1, p.method5());


/* OVERLOAD */
class A1 {
    method () {
        return 1;
    }
}

class B1 extends A1{
}

reloadableModule = new ReloadableModule(B1);
p = new (reloadableModule.getProxied())();
assertEquals(1, p.method());

class A2 {
    method () {
        return 1;
    }
}

class B2 extends A2{
    method() {
        return 2;
    }
}

reloadableModule.update(B2);
assertEquals(2, p.method());
