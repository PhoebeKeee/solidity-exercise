// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract S {
    string public name;
    constructor(string memory _name) {
        name = _name;
    }
}

contract T {
    string public text;
    constructor(string memory _text) {
        text = _text;
    }
}

contract U is S("s"), T("t") {}

contract V is S, T {
    constructor(string memory _name, string memory _text) S(_name) T(_text) {}
}

contract VV is S("s"), T {
    constructor(string memory _text)T(_text) {}
}

// Order of V0 execution: S -> T -> V0
contract V0 is S, T {
    constructor(string memory _name, string memory _text) S(_name) T(_text) {}
}

// Order of V1 execution: S -> T -> V0
contract V1 is S, T {
    constructor(string memory _name, string memory _text) T(_text) S(_name) {}
}

// Order of V2 execution: T -> S -> V0, constructor sequence does not matter.
contract V2 is T, S {
    constructor(string memory _name, string memory _text) T(_text) S(_name) {}
}
