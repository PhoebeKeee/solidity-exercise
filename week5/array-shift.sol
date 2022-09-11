// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract ArrayShift {
    uint[] public  arr;

    function deleteArray() public {
        arr = [1, 2, 3];
        delete  arr[1]; // [1, 0, 3]
    }

    function deleteArrayWithShifting(uint _index) public {
        require(_index < arr.length, "index out of bound");
        for (uint i = _index; i < arr.length - 1; i++) {
            arr[i] = arr[i + 1];
        }
        arr.pop();
    }

    function test() external {
        arr = [1, 2, 3, 4, 5];
        deleteArrayWithShifting(2);
        // remove index 2 and shift it => [1, 2, 4, 5]
        assert(arr[0] == 1);
        assert(arr[1] == 2);
        assert(arr[2] == 4);
        assert(arr[3] == 5);

        arr = [1];
        deleteArrayWithShifting(0);
        // remove index 0 and shift it => []
        assert(arr.length == 0);
    }
}

contract ArrayReplaceLast {
    uint[] public arr;

    function remove(uint _index) public  {
        arr[_index] = arr[arr.length - 1];
        arr.pop();
    }
    function test() external {
        arr = [1, 2, 3, 4];
        remove(1);
        // [1, 4, 3]
        assert(arr.length == 3);
        assert(arr[0] == 1);
        assert(arr[1] == 4);
        assert(arr[2] == 3);

        remove(2);
        // [1, 4]
        assert(arr.length == 2);
        assert(arr[0] == 1);
        assert(arr[1] == 4);
    }
}
