// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/*
calling parent functions
- direct
- super

   E
  / \
 F   G
  \ /
   H
*/

contract E {
    event Log(string message);
    function foo() public virtual  {
        emit Log("E.foo");
    }
    function bar() public virtual  {
        emit Log("E.bar");
    }
}

contract F is E {
    function foo() public virtual override  {
        emit Log("F.foo");
        E.foo();
    }
    function bar() public virtual override {
        emit Log("F.bar");
        super.bar();
    }
}

contract G is E {
    function foo() public virtual override  {
        emit Log("G.foo");
        E.foo();
    }
    function bar() public virtual override {
        emit Log("G.bar");
        super.bar();
    }
}

contract H is F, G {
    function foo() public virtual override(F, G)  {
        /*
          directly call parent F contract
          F.foo => E.foo
        */
        F.foo(); 
        
    }
    function bar() public virtual override(F, G) {
        /*
          using keyword "super" will call all parents (F, G) contract
          G.bar => F.bar => E.bar
        */
        super.bar();
    }
}
